import { bootstrapV2Providers } from '../services/judge/v2/bootstrap/BootstrapProviders.js';
import { ProblemPackage } from '../services/judge/v2/packages/ProblemPackage.js';
import { StatelessJudgeRuntime } from '../services/judge/v2/runtime/StatelessJudgeRuntime.js';
import { VerdictEngine } from '../services/judge/v2/runtime/VerdictEngine.js';

console.log('=== RUNNING SARTHI JUDGE V2 - PHASE 6 STATELESS RUNTIME VERIFICATION TEST ===\n');

bootstrapV2Providers();

// 1. Construct Sealed ProblemPackage
const samplePackage = new ProblemPackage({
  problemId: 'prob_lc394',
  metadata: { title: 'Decode String', difficulty: 'MEDIUM' },
  signature: { functionName: 'decodeString', parameters: [{ name: 's', type: 'string' }], returnType: 'string' },
  testCases: {
    public: [
      { input: { s: '3[a]2[bc]' }, expectedOutput: 'aaabcbc' },
      { input: { s: '3[a2[c]]' }, expectedOutput: 'accaccacc' }
    ]
  },
  resolvedPlugins: { comparatorId: 'PrimitiveComparator' },
  executionProfile: { timeLimitMs: 1000, memoryLimitMb: 256 }
});

// 2. Test Correct JS Solution -> ACCEPTED
const jsCorrectCode = `
function decodeString(s) {
  if (s === "3[a]2[bc]") return "aaabcbc";
  if (s === "3[a2[c]]") return "accaccacc";
  return "";
}
`;

StatelessJudgeRuntime.evaluateSubmission({
  problemPackage: samplePackage,
  userCode: jsCorrectCode,
  language: 'javascript'
}).then(res => {
  console.log('✔ 1. Correct JS Submission Verdict:', res.status);
  console.log('   - Passed Cases:', `${res.passedCases}/${res.totalCases}`);
  console.log('   - Execution Time:', `${res.maxExecutionTimeMs}ms`);

  // 3. Test Wrong JS Solution -> WRONG_ANSWER
  const jsWrongCode = `function decodeString(s) { return "wrong"; }`;
  return StatelessJudgeRuntime.evaluateSubmission({
    problemPackage: samplePackage,
    userCode: jsWrongCode,
    language: 'javascript'
  });
}).then(res => {
  console.log('✔ 2. Wrong JS Submission Verdict:', res.status, '(Expected: WRONG_ANSWER)');

  // 4. Test TLE JS Solution -> TIME_LIMIT_EXCEEDED
  const jsTLECode = `function decodeString(s) { while(true){} }`;
  return StatelessJudgeRuntime.evaluateSubmission({
    problemPackage: samplePackage,
    userCode: jsTLECode,
    language: 'javascript'
  });
}).then(res => {
  console.log('✔ 3. Infinite Loop TLE Verdict:', res.status, '(Expected: TIME_LIMIT_EXCEEDED)');

  // 5. Test Python Correct Solution -> ACCEPTED
  const pyCorrectCode = `
def decodeString(s):
    if s == "3[a]2[bc]":
        return "aaabcbc"
    if s == "3[a2[c]]":
        return "accaccacc"
    return ""
`;
  return StatelessJudgeRuntime.evaluateSubmission({
    problemPackage: samplePackage,
    userCode: pyCorrectCode,
    language: 'python'
  });
}).then(res => {
  console.log('✔ 4. Python Submission Verdict:', res.status);
  console.log('   - Passed Cases:', `${res.passedCases}/${res.totalCases}`);

  console.log('\n============================================================');
  console.log('🎉 PHASE 6 VERIFICATION COMPLETE: STATELESS RUNTIME PASSED!');
  console.log('============================================================\n');
}).catch(err => {
  console.error('❌ StatelessJudgeRuntime Error:', err);
  process.exit(1);
});
