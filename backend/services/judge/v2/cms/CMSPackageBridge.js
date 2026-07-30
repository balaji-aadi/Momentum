import { UnifiedInferenceEngine } from '../inference/UnifiedInferenceEngine.js';
import { PackageCompiler } from '../compiler/PackageCompiler.js';

/**
 * CMSPackageBridge - Integrates Problem Studio UI & Backend CMS with PackageCompiler
 */
export class CMSPackageBridge {
  constructor() {
    this.compiler = new PackageCompiler();
  }

  /**
   * Compiles and publishes problem payload from Problem Studio into an immutable ProblemPackage
   */
  async publishProblemPackage(formPayload) {
    const {
      problemId = `prob_${Date.now()}`,
      metadata = {},
      functionDefinition = {},
      constraints = [],
      referenceLanguage = 'javascript',
      referenceCode = '',
      executionProfile = { timeLimitMs: 2000, memoryLimitMb: 256 }
    } = formPayload;

    // 1. Auto-Infer InputSpecification and Provider Bindings
    const { inputSpec, ir } = UnifiedInferenceEngine.inferFromSignature(functionDefinition, constraints);

    // 2. Build compilation payload
    const compilationPayload = {
      problemId,
      metadata: {
        title: metadata.title || functionDefinition.functionName || 'Untitled Problem',
        difficulty: metadata.difficulty || 'MEDIUM',
        authorId: metadata.authorId || 'author_1'
      },
      signature: functionDefinition,
      inputSpecification: inputSpec,
      ir,
      referenceLanguage,
      referenceCode,
      executionProfile,
      publicTests: formPayload.publicTests || [],
      hiddenTests: formPayload.hiddenTests || []
    };

    // 3. Execute PackageCompiler (Stage 1 to Stage 6)
    const sealedPackage = await this.compiler.compile(compilationPayload);

    return {
      status: 'PUBLISHED',
      problemPackage: sealedPackage.toJSON(),
      hashSignature: sealedPackage.hashSignature,
      packageVersion: sealedPackage.packageVersion
    };
  }
}
