import { InputSpecification } from '../specs/InputSpecification.js';
import { InputSpecIR } from '../specs/InputSpecIR.js';
import { ProblemPackage } from '../packages/ProblemPackage.js';
import { ProviderRegistry } from '../registries/ProviderRegistry.js';

export class PackageCompilationError extends Error {
  constructor(stage, errorCode, message, details = {}) {
    super(`[PackageCompiler Stage: ${stage}] (${errorCode}): ${message}`);
    this.stage = stage;
    this.errorCode = errorCode;
    this.details = details;
  }
}

/**
 * PackageCompiler - First-Class Subsystem for Building Immutable Problem Packages
 * Enforces 6 Compiler Stages with explicit Failure Error Contracts.
 */
export class PackageCompiler {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Compiles raw problem input into a sealed, immutable ProblemPackage asset
   */
  async compile(problemPayload) {
    const {
      problemId = `prob_${Date.now()}`,
      metadata = {},
      signature = {},
      rawConstraints = [],
      referenceLanguage = 'javascript',
      referenceCode = '',
      executionProfile = { timeLimitMs: 2000, memoryLimitMb: 256 }
    } = problemPayload;

    // Stage 1: Spec Validation & InputSpecIR Construction
    const { inputSpec, ir } = this.stage1_validateSpec(problemId, signature, rawConstraints, problemPayload.inputSpecification);

    // Stage 2: Dependency Graph Resolution
    const resolvedPlugins = this.stage2_resolveDependencyGraph(ir);

    // Stage 3: Plugin Version Compatibility Check
    this.stage3_checkCompatibility(ir, resolvedPlugins);

    // Stage 4: Seeded PRNG Testcase Generation
    const generatedTestCases = await this.stage4_generateTestCases(ir, resolvedPlugins, problemPayload);

    // Stage 5: Reference Solution VM Execution
    const verifiedTestCases = await this.stage5_executeReferenceSolution(ir, referenceLanguage, referenceCode, generatedTestCases);

    // Stage 6: Package Signing & Hash Generation
    const sealedPackage = this.stage6_signPackage({
      problemId,
      metadata,
      signature,
      inputSpec,
      ir,
      resolvedPlugins,
      testCases: verifiedTestCases,
      executionProfile,
      referenceSolution: { language: referenceLanguage, code: referenceCode }
    });

    return sealedPackage;
  }

  // --- STAGE IMPLEMENTATIONS ---

  stage1_validateSpec(problemId, signature, rawConstraints, rawSpec) {
    try {
      const inputSpec = rawSpec
        ? InputSpecification.fromJSON(rawSpec)
        : new InputSpecification();

      const ir = new InputSpecIR({
        irVersion: '4.1.0',
        problemId,
        signature,
        inputSpecification: inputSpec
      });

      return { inputSpec, ir };
    } catch (err) {
      throw new PackageCompilationError(
        'STAGE_1_SPEC_VALIDATION',
        'ERR_INVALID_SCHEMA',
        `Failed to parse or validate InputSpecification schema: ${err.message}`,
        { error: err }
      );
    }
  }

  stage2_resolveDependencyGraph(ir) {
    const generator = ProviderRegistry.findBestProvider('GENERATOR', ir);
    const parser = ProviderRegistry.findBestProvider('PARSER', ir);
    const serializer = ProviderRegistry.findBestProvider('SERIALIZER', ir);
    const comparator = ProviderRegistry.findBestProvider('COMPARATOR', ir);

    return {
      generatorId: generator ? generator.id : 'DefaultGenerator',
      parserId: parser ? parser.id : 'DefaultParser',
      serializerId: serializer ? serializer.id : 'DefaultSerializer',
      comparatorId: comparator ? comparator.id : 'DefaultComparator'
    };
  }

  stage3_checkCompatibility(ir, resolvedPlugins) {
    // Stage 3 Skeleton: Verifies plugin version compatibility against IR 4.1.0
    return true;
  }

  async stage4_generateTestCases(ir, resolvedPlugins, payload) {
    // Stage 4 Skeleton: Testcase Generation Placeholder
    return {
      public: payload.publicTests || [],
      hidden: payload.hiddenTests || []
    };
  }

  async stage5_executeReferenceSolution(ir, referenceLanguage, referenceCode, testCases) {
    // Stage 5 Skeleton: Reference execution placeholder
    return testCases;
  }

  stage6_signPackage(packagePayload) {
    try {
      const pkg = new ProblemPackage(packagePayload);
      return pkg;
    } catch (err) {
      throw new PackageCompilationError(
        'STAGE_6_PACKAGE_SIGNING',
        'ERR_SIGNING_FAILURE',
        `Cryptographic signing failed: ${err.message}`,
        { error: err }
      );
    }
  }
}
