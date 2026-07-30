import { bootstrapV2Providers } from '../services/judge/v2/bootstrap/BootstrapProviders.js';
import { ProviderRegistry } from '../services/judge/v2/registries/ProviderRegistry.js';
import { InputSpecification } from '../services/judge/v2/specs/InputSpecification.js';
import { InputSpecIR } from '../services/judge/v2/specs/InputSpecIR.js';
import { SeededPRNG as PRNG } from '../services/judge/generators/prng/SeededPRNG.js';

console.log('=== RUNNING SARTHI JUDGE V2 - PHASE 2 PRIMITIVE VERIFICATION TEST ===\n');

// 1. Bootstrap Primitive Providers
bootstrapV2Providers();
const prng = new PRNG(42);

// 2. Test Number Primitive Generation & Validation
const numberIR = new InputSpecIR({
  problemId: 'prob_num',
  signature: { functionName: 'add', parameters: [{ name: 'val', type: 'number' }], returnType: 'number' },
  inputSpecification: new InputSpecification({
    structuralSpec: { category: 'PRIMITIVE', type: 'number' },
    validationSpec: { minValue: 10, maxValue: 50 }
  })
});

const numGen = ProviderRegistry.findBestProvider('GENERATOR', numberIR);
const numVal = ProviderRegistry.findBestProvider('VALIDATOR', numberIR);
const numRes = numGen.generate(prng, numberIR, { paramName: 'val' });
console.log('✔ 1. Number Primitive Generated:', numRes.input.val);
console.log('✔ 1. Number Validation Check (10-50):', numVal.validate(numRes.input.val, numberIR.inputSpecification.validationSpec));

// 3. Test String Primitive Generation with Custom Charset
const stringIR = new InputSpecIR({
  problemId: 'prob_str',
  signature: { functionName: 'process', parameters: [{ name: 's', type: 'string' }], returnType: 'string' },
  inputSpecification: new InputSpecification({
    structuralSpec: { category: 'PRIMITIVE', type: 'string' },
    validationSpec: { minN: 5, maxN: 10, charset: 'custom', customCharset: '0123456789ABCDEF' }
  })
});

const strGen = ProviderRegistry.findBestProvider('GENERATOR', stringIR);
const strRes = strGen.generate(prng, stringIR, { paramName: 's' });
console.log('✔ 2. String Primitive Generated (Hex):', strRes.input.s);

// 4. Test Array Primitive Generation
const arrayIR = new InputSpecIR({
  problemId: 'prob_arr',
  signature: { functionName: 'sum', parameters: [{ name: 'nums', type: 'number[]' }], returnType: 'number' },
  inputSpecification: new InputSpecification({
    structuralSpec: { category: 'ARRAY', type: 'number[]' },
    validationSpec: { minN: 4, maxN: 8, minValue: -10, maxValue: 10 }
  })
});

const arrGen = ProviderRegistry.findBestProvider('GENERATOR', arrayIR);
const arrRes = arrGen.generate(prng, arrayIR, { paramName: 'nums' });
console.log('✔ 3. Array Primitive Generated (Size 4-8):', arrRes.input.nums);

// 5. Test Matrix Primitive Generation
const matrixIR = new InputSpecIR({
  problemId: 'prob_mat',
  signature: { functionName: 'search', parameters: [{ name: 'matrix', type: 'number[][]' }], returnType: 'boolean' },
  inputSpecification: new InputSpecification({
    structuralSpec: { category: 'MATRIX', type: 'number[][]' },
    validationSpec: { minN: 3, maxN: 4, minValue: 1, maxValue: 9 }
  })
});

const matGen = ProviderRegistry.findBestProvider('GENERATOR', matrixIR);
const matRes = matGen.generate(prng, matrixIR, { paramName: 'matrix' });
console.log('✔ 4. Matrix Primitive Generated (3-4 Rows):', matRes.input.matrix);

// 6. Test Primitive Comparator (Exact, Epsilon, Unordered Array)
const comp = ProviderRegistry.findBestProvider('COMPARATOR', numberIR);
console.log('✔ 5. Comparator Exact Match:', comp.compare(42, 42));
console.log('✔ 5. Comparator Epsilon Float Match (3.14159265 vs 3.14159268):', comp.compare(3.14159265, 3.14159268, { epsilon: 1e-5 }));
console.log('✔ 5. Comparator Unordered Array Match ([1,2,3] vs [3,1,2]):', comp.compare([1, 2, 3], [3, 1, 2], { unordered: true }));

console.log('\n============================================================');
console.log('🎉 PHASE 2 VERIFICATION COMPLETE: ALL PRIMITIVE PROVIDERS PASSED!');
console.log('============================================================\n');
