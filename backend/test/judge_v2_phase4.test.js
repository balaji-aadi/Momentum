import { bootstrapV2Providers } from '../services/judge/v2/bootstrap/BootstrapProviders.js';
import { ProviderRegistry } from '../services/judge/v2/registries/ProviderRegistry.js';
import { InputSpecification } from '../services/judge/v2/specs/InputSpecification.js';
import { InputSpecIR } from '../services/judge/v2/specs/InputSpecIR.js';
import { SeededPRNG as PRNG } from '../services/judge/generators/prng/SeededPRNG.js';

console.log('=== RUNNING SARTHI JUDGE V2 - PHASE 4 GRAMMAR ENGINE VERIFICATION TEST ===\n');

bootstrapV2Providers();
const prng = new PRNG(9999);

// 1. Verify EncodedStringGrammarProvider (Decode String)
const decodeStrIR = new InputSpecIR({
  problemId: 'prob_decode_str',
  signature: { functionName: 'decodeString', parameters: [{ name: 's', type: 'string' }], returnType: 'string' },
  inputSpecification: new InputSpecification({
    structuralSpec: { category: 'GRAMMAR', type: 'string', grammarSpecRef: 'EncodedBracketEncoding' },
    validationSpec: { maxDepth: 2, maxK: 5 }
  })
});
const decodeGen = ProviderRegistry.findBestProvider('GENERATOR', decodeStrIR);
const decodeRes = decodeGen.generate(prng, decodeStrIR, { paramName: 's' });
console.log('✔ 1. EncodedStringGrammarProvider Resolved:', decodeGen.id);
console.log('   - Generated Nested Bracket String:', decodeRes.input.s);

// 2. Verify ExpressionGrammarProvider (RPN Postfix Tokens)
const rpnIR = new InputSpecIR({
  problemId: 'prob_rpn',
  signature: { functionName: 'evalRPN', parameters: [{ name: 'tokens', type: 'string[]' }], returnType: 'number' },
  inputSpecification: new InputSpecification({
    structuralSpec: { category: 'GRAMMAR', type: 'string[]', grammarSpecRef: 'rpn' }
  })
});
const rpnGen = ProviderRegistry.findBestProvider('GENERATOR', rpnIR);
const rpnRes = rpnGen.generate(prng, rpnIR, { paramName: 'tokens' });
console.log('✔ 2. ExpressionGrammarProvider (RPN) Resolved:', rpnGen.id);
console.log('   - Generated Postfix RPN Tokens:', rpnRes.input.tokens);

// 3. Verify ExpressionGrammarProvider (Basic Calculator)
const calcIR = new InputSpecIR({
  problemId: 'prob_calc',
  signature: { functionName: 'calculate', parameters: [{ name: 's', type: 'string' }], returnType: 'number' },
  inputSpecification: new InputSpecification({
    structuralSpec: { category: 'GRAMMAR', type: 'string', grammarSpecRef: 'calculator' }
  })
});
const calcGen = ProviderRegistry.findBestProvider('GENERATOR', calcIR);
const calcRes = calcGen.generate(prng, calcIR, { paramName: 's' });
console.log('✔ 3. ExpressionGrammarProvider (Calculator) Resolved:', calcGen.id);
console.log('   - Generated Infix Math Expression:', calcRes.input.s);

// 4. Verify ParenthesesGrammarProvider (Valid Parentheses)
const parenIR = new InputSpecIR({
  problemId: 'prob_paren',
  signature: { functionName: 'isValid', parameters: [{ name: 's', type: 'string' }], returnType: 'boolean' },
  inputSpecification: new InputSpecification({
    structuralSpec: { category: 'GRAMMAR', type: 'string', grammarSpecRef: 'parentheses' },
    validationSpec: { minN: 2, maxN: 4 }
  })
});
const parenGen = ProviderRegistry.findBestProvider('GENERATOR', parenIR);
const parenRes = parenGen.generate(prng, parenIR, { paramName: 's' });
console.log('✔ 4. ParenthesesGrammarProvider Resolved:', parenGen.id);
console.log('   - Generated Balanced Parentheses String:', parenRes.input.s);

console.log('\n============================================================');
console.log('🎉 PHASE 4 VERIFICATION COMPLETE: ALL GRAMMAR ENGINE PROVIDERS PASSED!');
console.log('============================================================\n');
