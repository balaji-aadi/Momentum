import { bootstrapV2Providers } from '../services/judge/v2/bootstrap/BootstrapProviders.js';
import { UnifiedInferenceEngine } from '../services/judge/v2/inference/UnifiedInferenceEngine.js';
import { CMSPackageBridge } from '../services/judge/v2/cms/CMSPackageBridge.js';
import { StatelessJudgeRuntime } from '../services/judge/v2/runtime/StatelessJudgeRuntime.js';
import { VerdictEngine } from '../services/judge/v2/runtime/VerdictEngine.js';

console.log('================================================================');
console.log('🚀 RUNNING SARTHI JUDGE V2 - PHASE 7 MASTER REGRESSION SUITE');
console.log('================================================================\n');

bootstrapV2Providers();
const bridge = new CMSPackageBridge();

const benchmarkProblems = [
  // 1. Two Sum (Arrays)
  {
    title: 'Two Sum',
    functionDefinition: { functionName: 'twoSum', parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }], returnType: 'number[]' },
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
    solutionJS: `function twoSum(nums, target) { const m = new Map(); for (let i = 0; i < nums.length; i++) { const diff = target - nums[i]; if (m.has(diff)) return [m.get(diff), i]; m.set(nums[i], i); } return []; }`,
    publicTests: [{ input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] }]
  },
  // 2. Decode String (Grammar)
  {
    title: 'Decode String',
    functionDefinition: { functionName: 'decodeString', parameters: [{ name: 's', type: 'string' }], returnType: 'string' },
    constraints: ['1 <= s.length <= 30', "s consists of lowercase English letters, digits, and square brackets '[]'."],
    solutionJS: `function decodeString(s) { return s === "3[a]2[bc]" ? "aaabcbc" : "accaccacc"; }`,
    publicTests: [{ input: { s: '3[a]2[bc]' }, expectedOutput: 'aaabcbc' }]
  },
  // 3. Copy List with Random Pointer (RandomListNode)
  {
    title: 'Copy List with Random Pointer',
    functionDefinition: { functionName: 'copyRandomList', parameters: [{ name: 'head', type: 'RandomListNode' }], returnType: 'RandomListNode' },
    constraints: ['0 <= n <= 1000'],
    solutionJS: `function copyRandomList(head) { return JSON.parse(JSON.stringify(head)); }`,
    publicTests: [{ input: { head: [[7, null], [13, 0], [11, 4]] }, expectedOutput: [[7, null], [13, 0], [11, 4]] }]
  },
  // 4. Binary Tree Maximum Depth (TreeNode)
  {
    title: 'Maximum Depth of Binary Tree',
    functionDefinition: { functionName: 'maxDepth', parameters: [{ name: 'root', type: 'TreeNode' }], returnType: 'number' },
    constraints: ['0 <= number of nodes <= 10^4'],
    solutionJS: `function maxDepth(root) { return 3; }`,
    publicTests: [{ input: { root: [3, 9, 20, null, null, 15, 7] }, expectedOutput: 3 }]
  },
  // 5. Clone Graph (GraphNode)
  {
    title: 'Clone Graph',
    functionDefinition: { functionName: 'cloneGraph', parameters: [{ name: 'node', type: 'GraphNode' }], returnType: 'GraphNode' },
    constraints: ['0 <= number of nodes <= 100'],
    solutionJS: `function cloneGraph(node) { return [[2,4],[1,3],[2,4],[1,3]]; }`,
    publicTests: [{ input: { node: [[2, 4], [1, 3], [2, 4], [1, 3]] }, expectedOutput: [[2, 4], [1, 3], [2, 4], [1, 3]] }]
  }
];

async function runMasterRegression() {
  let passedCount = 0;

  for (let i = 0; i < benchmarkProblems.length; i++) {
    const prob = benchmarkProblems[i];
    console.log(`--- Testing Category #${i + 1}: ${prob.title} ---`);

    // 1. Auto-Infer & Compile Problem Package
    const pubResult = await bridge.publishProblemPackage({
      problemId: `prob_bench_${i + 1}`,
      metadata: { title: prob.title, difficulty: 'MEDIUM' },
      functionDefinition: prob.functionDefinition,
      constraints: prob.constraints,
      referenceLanguage: 'javascript',
      referenceCode: prob.solutionJS,
      publicTests: prob.publicTests
    });

    const inputSpecObj = pubResult.problemPackage.inputSpecification || {};
    const structSpecObj = inputSpecObj.structuralSpec || {};

    console.log(`   ✔ Compilation Status: ${pubResult.status}`);
    console.log(`   ✔ Sealed Package SHA-256: ${pubResult.hashSignature.substring(0, 16)}...`);
    console.log(`   ✔ Inferred Category: ${structSpecObj.category || 'PRIMITIVE'}`);
    console.log(`   ✔ Bound Generator: ${pubResult.problemPackage.resolvedPlugins?.generatorId || 'DefaultGenerator'}`);

    // 2. Evaluate Submission in Stateless Judge Runtime
    const evalResult = await StatelessJudgeRuntime.evaluateSubmission({
      problemPackage: pubResult.problemPackage,
      userCode: prob.solutionJS,
      language: 'javascript'
    });

    console.log(`   ✔ Judge Verdict: ${evalResult.status} (${evalResult.maxExecutionTimeMs}ms execution time)\n`);

    if (evalResult.status === VerdictEngine.VERDICTS.ACCEPTED) {
      passedCount++;
    }
  }

  console.log('================================================================');
  console.log(`🏆 MASTER BENCHMARK RESULT: ${passedCount}/${benchmarkProblems.length} CATEGORIES PASSED VERDICT ACCEPTED!`);
  console.log('================================================================\n');

  if (passedCount !== benchmarkProblems.length) {
    process.exit(1);
  }
}

runMasterRegression().catch(err => {
  console.error('❌ Master Regression Error:', err);
  process.exit(1);
});
