import crypto from 'crypto';
import { SeededPRNG } from './generators/prng/SeededPRNG.js';
import { GeneratorPluginRegistry } from './generators/registries/GeneratorPluginRegistry.js';
import { ConstraintValidator } from './validators/ConstraintValidator.js';
import { StressGenerators } from './generators/stress/StressGenerators.js';
import { ReferenceRunner } from './referenceRunner.js';
import { OutputNormalizers } from './normalizers/OutputNormalizers.js';

/**
 * ProblemPackageCompiler - End-to-End Problem Package Compilation Engine
 * Orchestrates PRNG, Generator Plugins, Constraint Validation, Stress Generation,
 * Reference Solution Execution, and Package Versioning into a self-contained problem package.
 */
export class ProblemPackageCompiler {
  /**
   * Compiles a complete LeetCode-grade Self-Contained Problem Package.
   * @param {Object} spec
   * @param {string} spec.problemId - Unique ID or slug
   * @param {string} spec.title - Problem title
   * @param {Object} spec.functionDefinition - Function schema { name, parameters, returnType }
   * @param {string} [spec.generatorName='UniquePairGeneratorPlugin'] - Generator or plugin name
   * @param {Object} [spec.generatorOptions={}] - Options for generator/plugin
   * @param {Object} [spec.constraints={}] - Validation constraints & invariant rules
   * @param {string} spec.referenceLanguage - 'javascript' | 'python'
   * @param {string} spec.referenceCode - Author's canonical reference code
   * @param {string} [spec.comparatorName='ExactMatch'] - Output comparator
   * @param {string} [spec.normalizerName] - Optional pre-comparison output normalizer
   * @param {number} [spec.randomCount=10] - Number of random test cases to generate
   * @param {number} [spec.stressCount=2] - Number of stress test cases to generate
   * @param {number} [spec.seed=133742] - Deterministic PRNG seed
   * @returns {Promise<Object>} Self-contained problem package JSON
   */
  static async compilePackage(spec) {
    const {
      problemId = `prob_${Date.now()}`,
      title = "Untitled Problem",
      functionDefinition,
      generatorName = 'UniquePairGeneratorPlugin',
      generatorOptions = {},
      constraints = {},
      referenceLanguage = 'javascript',
      referenceCode,
      comparatorName = 'ExactMatch',
      normalizerName,
      randomCount = 10,
      stressCount = 2,
      seed = 133742
    } = spec;

    const funcName = functionDefinition?.name || functionDefinition?.functionName;
    if (!functionDefinition || !funcName) {
      throw new Error("ProblemPackageCompiler: functionDefinition with valid name is required.");
    }
    // Normalize name property
    functionDefinition.name = funcName;
    functionDefinition.functionName = funcName;

    if (!referenceCode) {
      throw new Error("ProblemPackageCompiler: referenceCode is required.");
    }

    const prng = new SeededPRNG(seed);
    const rawCandidates = [];

    // Ensure default plugins are registered in GeneratorPluginRegistry if empty
    if (GeneratorPluginRegistry.getPlugin('UniquePairGeneratorPlugin') === null) {
      const { UniquePairGeneratorPlugin } = await import('./generators/plugins/UniquePairGeneratorPlugin.js');
      const { RandomArrayPlugin } = await import('./generators/plugins/RandomArrayPlugin.js');
      const { SortedArrayPlugin } = await import('./generators/plugins/SortedArrayPlugin.js');
      const { ArrayPrimitive } = await import('./generators/primitives/ArrayPrimitive.js');

      GeneratorPluginRegistry.registerPlugin('UniquePairGeneratorPlugin', new UniquePairGeneratorPlugin());
      GeneratorPluginRegistry.registerPlugin('RandomArrayPlugin', new RandomArrayPlugin());
      GeneratorPluginRegistry.registerPlugin('SortedArrayPlugin', new SortedArrayPlugin());
      GeneratorPluginRegistry.registerPrimitive('ArrayPrimitive', new ArrayPrimitive());
    }

    // 1. Resolve Generator or Plugin from Registry
    let generator = GeneratorPluginRegistry.getPlugin(generatorName) || GeneratorPluginRegistry.getPrimitive(generatorName);

    if (!generator) {
      const { UniquePairGeneratorPlugin } = await import('./generators/plugins/UniquePairGeneratorPlugin.js');
      generator = new UniquePairGeneratorPlugin();
    }

    // 2. Generate and Validate Random Test Cases
    if (generator) {
      for (let i = 0; i < randomCount; i++) {
        const { candidate } = ConstraintValidator.generateValidInput(
          generator,
          prng,
          generatorOptions,
          constraints
        );

        // Remap candidate input keys dynamically to match functionDefinition.parameters (e.g. cardPoints, k)
        const remappedInput = remapInputToFunctionParameters(candidate.input, functionDefinition.parameters);
        rawCandidates.push({
          ...candidate,
          input: remappedInput,
          isStress: false,
          category: 'Standard'
        });
      }
    }

    // 3. Generate Stress Test Cases (Generates EXACTLY stressCount stress test cases)
    if (stressCount > 0) {
      const maxN = Number(generatorOptions.lengthMax || generatorOptions.maxN || 1000);
      const minVal = Number(generatorOptions.valueMin || generatorOptions.minValue || -100);
      const maxVal = Number(generatorOptions.valueMax || generatorOptions.maxValue || 100);

      for (let s = 0; s < stressCount; s++) {
        let stressCandidate;
        if (generatorName === 'UniquePairGeneratorPlugin' || constraints.rule === 'twoSum') {
          stressCandidate = StressGenerators.generateWorstCaseTwoSumStress(prng, { maxN: Math.min(500, maxN) });
        } else {
          const { candidate } = ConstraintValidator.generateValidInput(
            generator,
            prng,
            {
              ...generatorOptions,
              lengthMin: maxN,
              lengthMax: maxN,
              valueMin: minVal,
              valueMax: maxVal,
              kMin: Math.max(1, Math.floor(maxN / 2)),
              kMax: maxN
            },
            constraints
          );
          stressCandidate = {
            input: candidate.input,
            isStress: true,
            category: `Stress Case #${s + 1}`
          };
        }

        const remappedStressInput = remapInputToFunctionParameters(stressCandidate.input, functionDefinition.parameters);
        rawCandidates.push({
          ...stressCandidate,
          input: remappedStressInput,
          isStress: true,
          category: `Stress Case #${s + 1}`
        });
      }
    }

    // 4. Run Sandboxed Reference Solution to compute Expected Outputs
    const refRes = await ReferenceRunner.execute({
      language: referenceLanguage,
      referenceCode,
      functionDefinition,
      testCases: rawCandidates
    });

    if (!refRes.success) {
      throw new Error(`ProblemPackageCompiler Failed: ${refRes.error}`);
    }

    // 5. Apply Output Normalizers if specified
    const compiledCases = refRes.compiledTestCases.map(tc => {
      let finalOutput = tc.expectedOutput;
      if (normalizerName) {
        finalOutput = OutputNormalizers.applyNormalizer(normalizerName, finalOutput);
      }
      return {
        ...tc,
        expectedOutput: finalOutput
      };
    });

    // 6. Compute Checksum Signature Hash over canonical inputs & outputs
    const canonicalCases = compiledCases.map(tc => ({
      testCaseIndex: tc.testCaseIndex,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isStress: tc.isStress || false
    }));

    const packagePayload = JSON.stringify({
      problemId,
      functionDefinition,
      referenceCode,
      cases: canonicalCases
    });

    const hashSignature = crypto.createHash('sha256').update(packagePayload).digest('hex');

    // 7. Construct Self-Contained Problem Package JSON
    return {
      packageVersion: 'v1.0.0',
      hashSignature,
      metadata: {
        problemId,
        title,
        compiledAt: new Date().toISOString(),
        seed,
        totalTestCases: compiledCases.length,
        randomCasesCount: randomCount,
        stressCasesCount: stressCount
      },
      functionDefinition,
      generatorConfig: {
        name: generatorName,
        options: generatorOptions
      },
      constraintsConfig: constraints,
      referenceSolution: {
        language: referenceLanguage,
        code: referenceCode
      },
      evaluationConfig: {
        comparatorName,
        normalizerName: normalizerName || null
      },
      hiddenTestCases: compiledCases,
      executionProfile: {
        timeLimitMs: 2000,
        memoryLimitMb: 256
      }
    };
  }
}

/**
 * Remaps an input dictionary dynamically so that its keys 100% match 
 * the exact parameter names in functionDefinition.parameters.
 * Uses generic type alias matching & positional fallback with ZERO hardcoding!
 */
function remapInputToFunctionParameters(rawInput, parameters = []) {
  if (!parameters || parameters.length === 0) return rawInput;

  const inputDict = (typeof rawInput === 'object' && rawInput !== null && rawInput.input)
    ? rawInput.input
    : rawInput;

  if (typeof inputDict !== 'object' || inputDict === null) {
    if (parameters.length === 1) {
      return { [parameters[0].name]: inputDict };
    }
    return inputDict;
  }

  const rawVals = Object.values(inputDict);
  const remapped = {};

  parameters.forEach((param, idx) => {
    const pName = param.name;
    const pType = (param.type || 'number').toLowerCase();

    // 1. Direct exact name match
    if (inputDict[pName] !== undefined) {
      remapped[pName] = inputDict[pName];
      return;
    }

    // 2. Generic type-based alias lookup
    let matchedVal = undefined;

    if (pType.includes('array') || pType.includes('[]') || pType.includes('list')) {
      const alias = ['nums', 'arr', 'array', 'values', 'list', 'elements', 'items'].find(k => inputDict[k] !== undefined);
      if (alias) matchedVal = inputDict[alias];
    } else if (pType.includes('matrix') || pType.includes('grid')) {
      const alias = ['matrix', 'grid', 'board', 'table'].find(k => inputDict[k] !== undefined);
      if (alias) matchedVal = inputDict[alias];
    } else if (pType.includes('string')) {
      const alias = ['s', 'str', 'word', 'text', 'string'].find(k => inputDict[k] !== undefined);
      if (alias) matchedVal = inputDict[alias];
    } else if (pType.includes('tree')) {
      const alias = ['root', 'tree', 'nodes'].find(k => inputDict[k] !== undefined);
      if (alias) matchedVal = inputDict[alias];
    } else if (pType.includes('graph')) {
      const alias = ['edges', 'graph', 'adjList'].find(k => inputDict[k] !== undefined);
      if (alias) matchedVal = inputDict[alias];
    } else {
      // Primitive integer / number parameter (e.g. k, n, target)
      const alias = ['target', 'k', 'n', 'val', 'num', 'limit'].find(k => inputDict[k] !== undefined);
      if (alias) matchedVal = inputDict[alias];
    }

    // 3. Positional fallback if alias wasn't found
    if (matchedVal === undefined && idx < rawVals.length) {
      matchedVal = rawVals[idx];
    }

    remapped[pName] = matchedVal !== undefined ? matchedVal : null;
  });

  // Dynamic Array-Window Dependent Clamping (e.g. 1 <= k <= array.length)
  // Ensures integer parameters (like k) never exceed the generated array length!
  const arrayParam = parameters.find(p => {
    const t = (p.type || '').toLowerCase();
    return t.includes('array') || t.includes('[]') || t.includes('list');
  });

  if (arrayParam && remapped[arrayParam.name] && Array.isArray(remapped[arrayParam.name])) {
    const arrLength = remapped[arrayParam.name].length;
    if (arrLength > 0) {
      parameters.forEach(param => {
        const pType = (param.type || '').toLowerCase();
        const isInteger = pType === 'number' || pType === 'integer' || pType === 'int';
        const isWindowOrIndex = ['k', 'window', 'size', 'index', 'pos'].some(term => param.name.toLowerCase().includes(term));
        
        if (isInteger && isWindowOrIndex && typeof remapped[param.name] === 'number') {
          if (remapped[param.name] > arrLength || remapped[param.name] <= 0) {
            remapped[param.name] = (Math.abs(Math.floor(remapped[param.name])) % arrLength) + 1;
          }
        }
      });
    }
  }

  return remapped;
}
