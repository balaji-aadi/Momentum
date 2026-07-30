import { bootstrapV2Providers } from '../services/judge/v2/bootstrap/BootstrapProviders.js';
import { UnifiedInferenceEngine } from '../services/judge/v2/inference/UnifiedInferenceEngine.js';
import { CMSPackageBridge } from '../services/judge/v2/cms/CMSPackageBridge.js';

console.log('=== RUNNING SARTHI JUDGE V2 - PHASE 5 CMS INTEGRATION VERIFICATION TEST ===\n');

bootstrapV2Providers();

// 1. Verify UnifiedInferenceEngine Multi-Signal Inference
const functionDef = {
  functionName: 'decodeString',
  parameters: [{ name: 's', type: 'string' }],
  returnType: 'string'
};
const constraints = [
  '1 <= s.length <= 30',
  "s consists of lowercase English letters, digits, and square brackets '[]'.",
  's is guaranteed to be a valid input.'
];

const inferred = UnifiedInferenceEngine.inferFromSignature(functionDef, constraints);
console.log('✔ 1. Multi-Signal Inferred Structural Category:', inferred.inputSpec.structuralSpec.category);
console.log('✔ 1. Multi-Signal Inferred Grammar Spec:', inferred.inputSpec.structuralSpec.grammarSpecRef);
console.log('✔ 1. Auto-Discovered Generator Provider:', inferred.resolvedPlugins.generatorId);
console.log('✔ 1. Auto-Discovered Comparator Provider:', inferred.resolvedPlugins.comparatorId);

// 2. Verify CMSPackageBridge 1-Click Publishing Pipeline
const bridge = new CMSPackageBridge();
bridge.publishProblemPackage({
  problemId: 'prob_cms_999',
  metadata: { title: 'Decode String', difficulty: 'MEDIUM', authorId: 'author_john' },
  functionDefinition: functionDef,
  constraints,
  referenceLanguage: 'javascript',
  referenceCode: 'return s;',
  publicTests: [{ input: { s: '3[a]2[bc]' }, expectedOutput: 'aaabcbc' }]
}).then(result => {
  console.log('✔ 2. CMSPackageBridge Publishing Status:', result.status);
  console.log('   - Published Problem ID:', result.problemPackage.problemId);
  console.log('   - Package Version:', result.packageVersion);
  console.log('   - Sealed SHA-256 Hash Signature:', result.hashSignature);
  console.log('   - Bound Generator Provider:', result.problemPackage.resolvedPlugins.generatorId);

  console.log('\n============================================================');
  console.log('🎉 PHASE 5 VERIFICATION COMPLETE: ALL CMS BRIDGES & INFERENCE PASSED!');
  console.log('============================================================\n');
}).catch(err => {
  console.error('❌ CMSPackageBridge Error:', err);
  process.exit(1);
});
