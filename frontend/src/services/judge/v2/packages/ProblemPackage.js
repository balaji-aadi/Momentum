import { InputSpecification } from '../specs/InputSpecification.js';
import { InputSpecIR } from '../specs/InputSpecIR.js';

/**
 * ProblemPackage - Frontend Mirror for Sarthi Judge v2.0
 */
export class ProblemPackage {
  constructor({
    packageVersion = '1.0.0',
    schemaVersion = '4.1.0',
    problemId = '',
    hashSignature = '',
    metadata = {},
    signature = {},
    inputSpecification = null,
    ir = null,
    resolvedPlugins = {},
    testCases = { public: [], hidden: [] },
    executionProfile = { timeLimitMs: 2000, memoryLimitMb: 256 },
    referenceSolution = {},
    languageTemplates = {}
  } = {}) {
    this.packageVersion = packageVersion;
    this.schemaVersion = schemaVersion;
    this.problemId = problemId;
    this.hashSignature = hashSignature;
    this.metadata = {
      title: metadata.title || 'Untitled Problem',
      difficulty: metadata.difficulty || 'MEDIUM',
      authorId: metadata.authorId || 'system'
    };
    this.signature = signature;
    this.inputSpecification = inputSpecification;
    this.ir = ir;
    this.resolvedPlugins = resolvedPlugins;
    this.testCases = testCases;
    this.executionProfile = executionProfile;
    this.referenceSolution = referenceSolution;
    this.languageTemplates = languageTemplates;
  }

  toJSON() {
    return {
      packageVersion: this.packageVersion,
      schemaVersion: this.schemaVersion,
      problemId: this.problemId,
      hashSignature: this.hashSignature,
      metadata: this.metadata,
      signature: this.signature,
      inputSpecification: this.inputSpecification ? this.inputSpecification.toJSON() : null,
      ir: this.ir ? this.ir.toJSON() : null,
      resolvedPlugins: this.resolvedPlugins,
      testCases: this.testCases,
      executionProfile: this.executionProfile,
      referenceSolution: this.referenceSolution,
      languageTemplates: this.languageTemplates
    };
  }

  static fromJSON(json) {
    if (!json) return null;
    return new ProblemPackage({
      packageVersion: json.packageVersion,
      schemaVersion: json.schemaVersion,
      problemId: json.problemId,
      hashSignature: json.hashSignature,
      metadata: json.metadata,
      signature: json.signature,
      inputSpecification: json.inputSpecification ? InputSpecification.fromJSON(json.inputSpecification) : null,
      ir: json.ir ? InputSpecIR.fromJSON(json.ir) : null,
      resolvedPlugins: json.resolvedPlugins,
      testCases: json.testCases,
      executionProfile: json.executionProfile,
      referenceSolution: json.referenceSolution,
      languageTemplates: json.languageTemplates
    });
  }
}
