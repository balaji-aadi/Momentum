import crypto from 'crypto';
import { InputSpecification } from '../specs/InputSpecification.js';
import { InputSpecIR } from '../specs/InputSpecIR.js';

/**
 * ProblemPackage - Immutable, Self-Contained First-Class Executable Asset
 * Contains everything required to judge, run, render, and evaluate a problem.
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
    this.hashSignature = hashSignature || this.computeHashSignature();
  }

  /**
   * Computes cryptographic SHA-256 checksum for immutable tamper-proof locking
   */
  computeHashSignature() {
    const payload = JSON.stringify({
      packageVersion: this.packageVersion,
      schemaVersion: this.schemaVersion,
      problemId: this.problemId,
      signature: this.signature,
      inputSpecification: this.inputSpecification ? this.inputSpecification.toJSON() : null,
      resolvedPlugins: this.resolvedPlugins,
      testCases: this.testCases,
      executionProfile: this.executionProfile
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
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
