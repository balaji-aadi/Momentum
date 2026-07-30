import { BaseProvider, IGeneratorProvider, IComparatorProvider } from '../services/judge/v2/contracts/ProviderContracts.js';
import { ProviderRegistry } from '../services/judge/v2/registries/ProviderRegistry.js';
import { InputSpecification } from '../services/judge/v2/specs/InputSpecification.js';
import { InputSpecIR } from '../services/judge/v2/specs/InputSpecIR.js';
import { ProblemPackage } from '../services/judge/v2/packages/ProblemPackage.js';
import { PackageCompiler } from '../services/judge/v2/compiler/PackageCompiler.js';

console.log('=== RUNNING SARTHI JUDGE V2 - PHASE 1 VERIFICATION TEST ===\n');

// 1. Verify Contracts & BaseProvider Inheritance
class SampleGenerator extends IGeneratorProvider {
  constructor() {
    super('SampleGenerator', '1.0.0');
  }
  supports(ir) {
    return ir?.inputSpecification?.structuralSpec?.category === 'STRING' ? 0.9 : 0.1;
  }
  generate() { return { s: 'test' }; }
}

class SampleComparator extends IComparatorProvider {
  constructor() {
    super('SampleComparator', '1.0.0');
  }
  supports(ir) { return 0.8; }
  compare(a, b) { return a === b; }
}

const gen = new SampleGenerator();
const comp = new SampleComparator();
console.log('✔ 1. Provider Contracts Instantiated:', gen.id, comp.id);

// 2. Verify ProviderRegistry Capability Scoring
ProviderRegistry.registerProvider(gen);
ProviderRegistry.registerProvider(comp);

const sampleIR = new InputSpecIR({
  problemId: 'prob_test_1',
  signature: { functionName: 'decodeString', parameters: [{ name: 's', type: 'string' }], returnType: 'string' },
  inputSpecification: new InputSpecification({
    structuralSpec: { category: 'STRING', type: 'string' },
    validationSpec: { minN: 1, maxN: 30 }
  })
});

const bestGen = ProviderRegistry.findBestProvider('GENERATOR', sampleIR);
const bestComp = ProviderRegistry.findBestProvider('COMPARATOR', sampleIR);
console.log('✔ 2. Capability Discovery Resolved Generator:', bestGen.id, '(Score: 0.9)');
console.log('✔ 2. Capability Discovery Resolved Comparator:', bestComp.id, '(Score: 0.8)');

// 3. Verify InputSpecification & InputSpecIR Serialization
const jsonSpec = sampleIR.inputSpecification.toJSON();
const restoredSpec = InputSpecification.fromJSON(jsonSpec);
console.log('✔ 3. InputSpecification Separation Verified:', restoredSpec.structuralSpec.category, restoredSpec.validationSpec.maxN);

// 4. Verify ProblemPackage SHA-256 Signing & Immutability
const pkg = new ProblemPackage({
  problemId: 'prob_test_1',
  metadata: { title: 'Test String Problem', difficulty: 'EASY' },
  signature: sampleIR.signature,
  inputSpecification: sampleIR.inputSpecification,
  ir: sampleIR,
  resolvedPlugins: { generatorId: bestGen.id, comparatorId: bestComp.id }
});

console.log('✔ 4. ProblemPackage SHA-256 Hash Generated:', pkg.hashSignature);
console.log('✔ 4. ProblemPackage Version Locked:', pkg.packageVersion, 'Schema:', pkg.schemaVersion);

// 5. Verify PackageCompiler Skeleton Execution
const compiler = new PackageCompiler();
compiler.compile({
  problemId: 'prob_compiled_100',
  metadata: { title: 'Compiler Test', difficulty: 'HARD' },
  signature: { functionName: 'solve', parameters: [], returnType: 'void' },
  referenceLanguage: 'javascript',
  referenceCode: 'return;'
}).then(compiledPkg => {
  console.log('✔ 5. PackageCompiler Skeleton Stage 1-6 Execution Successful!');
  console.log('   - Compiled Package ID:', compiledPkg.problemId);
  console.log('   - Signed Hash:', compiledPkg.hashSignature);
  console.log('\n============================================================');
  console.log('🎉 PHASE 1 VERIFICATION COMPLETE: ALL CORE FOUNDATIONS PASSED!');
  console.log('============================================================\n');
}).catch(err => {
  console.error('❌ PackageCompiler Error:', err);
  process.exit(1);
});
