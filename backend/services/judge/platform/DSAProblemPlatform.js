import { IDriverHarnessProvider } from './IDriverHarnessProvider.js';
import fs from 'fs';
import path from 'path';

/**
 * DSAProblemPlatform - Extensible Declarative DSA Problem Platform
 * (Phase 15 DSA Platform Subsystem - Stage 15.3)
 * 
 * Enforces the canonical problem metadata contract.
 * Generates language-specific driver test harnesses declaratively from configuration metadata,
 * allowing new problems to be added with ZERO modifications to the frozen judge execution engine.
 */
export class DSAProblemPlatform extends IDriverHarnessProvider {
  constructor({ templateDir = null } = {}) {
    super();
    this.templateDir = templateDir || path.join(process.cwd(), 'services', 'judge', 'platform', 'templates');
    this.problemsRegistry = new Map(); // problemId -> problemConfig
  }

  /**
   * Registers a new DSA problem using configuration metadata only.
   */
  registerProblem(problemConfig) {
    const validation = this.validateProblemSchema(problemConfig);
    if (!validation.isValid) {
      throw new Error(`DSAProblemPlatform.registerProblem: Invalid problem schema for [${problemConfig?.problemId || 'unknown'}]: ${validation.errors.join('; ')}`);
    }

    this.problemsRegistry.set(problemConfig.problemId, Object.freeze(problemConfig));
    return { problemId: problemConfig.problemId, registered: true };
  }

  /**
   * Validates whether a problem metadata object strictly adheres to the canonical contract.
   */
  validateProblemSchema(config) {
    const errors = [];
    if (!config || typeof config !== 'object') {
      return { isValid: false, errors: ['Problem config must be a valid non-null object'] };
    }

    const requiredFields = [
      'problemId', 'statement', 'constraints', 'difficulty', 'languageConfig',
      'functionSignature', 'starterCode', 'harnessTemplate', 'visibleTestcases',
      'hiddenTestcases', 'expectedOutputs', 'compilerRuntimeConfig'
    ];

    for (const field of requiredFields) {
      if (config[field] === undefined || config[field] === null) {
        errors.push(`Missing required canonical field: '${field}'`);
      }
    }

    if (config.visibleTestcases && !Array.isArray(config.visibleTestcases)) {
      errors.push("'visibleTestcases' must be an Array");
    }

    if (config.hiddenTestcases && !Array.isArray(config.hiddenTestcases)) {
      errors.push("'hiddenTestcases' must be an Array");
    }

    if (config.expectedOutputs && !Array.isArray(config.expectedOutputs)) {
      errors.push("'expectedOutputs' must be an Array");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generates a language-specific driver test harness without modifying judge core.
   */
  async generateHarness(problemIdOrConfig, studentCode, language = 'python') {
    let config = problemIdOrConfig;
    if (typeof problemIdOrConfig === 'string') {
      config = this.problemsRegistry.get(problemIdOrConfig);
      if (!config) {
        throw new Error(`DSAProblemPlatform.generateHarness: Unregistered problemId [${problemIdOrConfig}]`);
      }
    }

    const validation = this.validateProblemSchema(config);
    if (!validation.isValid) {
      throw new Error(`DSAProblemPlatform.generateHarness: Invalid problem schema: ${validation.errors.join('; ')}`);
    }

    const langConfig = config.languageConfig[language] || { compiler: 'default', flags: '' };
    const runtimeConfig = config.compilerRuntimeConfig || { timeLimitMs: 2000, memoryLimitMb: 256 };

    // Resolve harness template file
    const templateFileName = `${language}_harness.tpl`;
    const templatePath = path.join(this.templateDir, templateFileName);

    let templateContent = "";
    if (fs.existsSync(templatePath)) {
      templateContent = fs.readFileSync(templatePath, 'utf8');
    } else {
      // Fallback template string
      templateContent = `// Driver Harness\n{{STUDENT_CODE}}\n{{TEST_HARNESS_BODY}}`;
    }

    const testcases = [...config.visibleTestcases, ...config.hiddenTestcases];
    const testHarnessBody = `// Running ${testcases.length} testcases for problem [${config.problemId}]`;

    const resolvedSource = templateContent
      .replace('{{STUDENT_CODE}}', studentCode || config.starterCode)
      .replace('{{TEST_HARNESS_BODY}}', testHarnessBody);

    return {
      problemId: config.problemId,
      language,
      resolvedSource,
      langConfig,
      runtimeConfig,
      testcaseCount: testcases.length
    };
  }
}
