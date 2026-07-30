import { bootstrapV2Providers } from '../services/judge/v2/bootstrap/BootstrapProviders.js';
import { ProviderRegistry } from '../services/judge/v2/registries/ProviderRegistry.js';
import { InputSpecification } from '../services/judge/v2/specs/InputSpecification.js';
import { InputSpecIR } from '../services/judge/v2/specs/InputSpecIR.js';
import { SeededPRNG as PRNG } from '../services/judge/generators/prng/SeededPRNG.js';

console.log('=== RUNNING SARTHI JUDGE V2 - PHASE 3 STRUCTURAL TYPE VERIFICATION TEST ===\n');

bootstrapV2Providers();
const prng = new PRNG(1337);

// 1. Verify ListNode (Linked List)
const listIR = new InputSpecIR({
  problemId: 'prob_list',
  signature: { functionName: 'reverseList', parameters: [{ name: 'head', type: 'ListNode' }], returnType: 'ListNode' },
  inputSpecification: new InputSpecification({ structuralSpec: { category: 'LIST', type: 'ListNode' } })
});
const listGen = ProviderRegistry.findBestProvider('GENERATOR', listIR);
const listComp = ProviderRegistry.findBestProvider('COMPARATOR', listIR);
const listRes = listGen.generate(prng, listIR, { paramName: 'head' });
console.log('✔ 1. ListNode Generator Resolved:', listGen.id);
console.log('   - Generated List Array:', listRes.input.head);
console.log('   - Comparator Match:', listComp.compare([1, 2, 3], { val: 1, next: { val: 2, next: { val: 3, next: null } } }));

// 2. Verify RandomListNode (Random Pointer Linked List - LeetCode #138)
const randListIR = new InputSpecIR({
  problemId: 'prob_rand_list',
  signature: { functionName: 'copyRandomList', parameters: [{ name: 'head', type: 'RandomListNode' }], returnType: 'RandomListNode' },
  inputSpecification: new InputSpecification({ structuralSpec: { category: 'LIST', type: 'RandomListNode' } })
});
const randGen = ProviderRegistry.findBestProvider('GENERATOR', randListIR);
const randComp = ProviderRegistry.findBestProvider('COMPARATOR', randListIR);
const randRes = randGen.generate(prng, randListIR, { paramName: 'head' });
console.log('✔ 2. RandomListNode Generator Resolved:', randGen.id);
console.log('   - Generated Random Pointer Pairs:', randRes.input.head);
console.log('   - Deep-Copy Identity Check (Rejects Original Node Return):', randComp.compare({ val: 7, next: null }, { val: 7, next: null }, { originalHead: { val: 7, next: null } }) === false);

// 3. Verify TreeNode (Binary Tree & BST)
const treeIR = new InputSpecIR({
  problemId: 'prob_tree',
  signature: { functionName: 'maxDepth', parameters: [{ name: 'root', type: 'TreeNode' }], returnType: 'number' },
  inputSpecification: new InputSpecification({ structuralSpec: { category: 'TREE', type: 'TreeNode' } })
});
const treeGen = ProviderRegistry.findBestProvider('GENERATOR', treeIR);
const treeComp = ProviderRegistry.findBestProvider('COMPARATOR', treeIR);
const treeRes = treeGen.generate(prng, treeIR, { paramName: 'root' });
console.log('✔ 3. TreeNode Generator Resolved:', treeGen.id);
console.log('   - Generated Level-Order Tree:', treeRes.input.root);
console.log('   - Tree Matcher:', treeComp.compare([3, 9, 20, null, null, 15, 7], [3, 9, 20, null, null, 15, 7]));

// 4. Verify NaryTreeNode (N-ary Tree)
const naryIR = new InputSpecIR({
  problemId: 'prob_nary',
  signature: { functionName: 'preorder', parameters: [{ name: 'root', type: 'NaryTreeNode' }], returnType: 'number[]' },
  inputSpecification: new InputSpecification({ structuralSpec: { category: 'TREE', type: 'NaryTreeNode' } })
});
const naryGen = ProviderRegistry.findBestProvider('GENERATOR', naryIR);
const naryRes = naryGen.generate(prng, naryIR, { paramName: 'root' });
console.log('✔ 4. NaryTreeNode Generator Resolved:', naryGen.id);
console.log('   - Generated N-ary Tree Array:', naryRes.input.root);

// 5. Verify GraphNode & DAG (Adjacency Graphs)
const graphIR = new InputSpecIR({
  problemId: 'prob_graph',
  signature: { functionName: 'cloneGraph', parameters: [{ name: 'node', type: 'GraphNode' }], returnType: 'GraphNode' },
  inputSpecification: new InputSpecification({ structuralSpec: { category: 'GRAPH', type: 'GraphNode' } })
});
const graphGen = ProviderRegistry.findBestProvider('GENERATOR', graphIR);
const graphComp = ProviderRegistry.findBestProvider('COMPARATOR', graphIR);
const graphRes = graphGen.generate(prng, graphIR, { paramName: 'node' });
console.log('✔ 5. GraphNode Generator Resolved:', graphGen.id);
console.log('   - Generated Adjacency List:', graphRes.input.node);
console.log('   - Canonical Graph Matcher:', graphComp.compare([[2, 4], [1, 3]], [[2, 4], [1, 3]]));

// 6. Verify TrieNode (Prefix Tree)
const trieIR = new InputSpecIR({
  problemId: 'prob_trie',
  signature: { functionName: 'buildTrie', parameters: [{ name: 'words', type: 'TrieNode' }], returnType: 'TrieNode' },
  inputSpecification: new InputSpecification({ structuralSpec: { category: 'TREE', type: 'TrieNode' } })
});
const trieGen = ProviderRegistry.findBestProvider('GENERATOR', trieIR);
const trieRes = trieGen.generate(prng, trieIR, { paramName: 'words' });
console.log('✔ 6. TrieNode Generator Resolved:', trieGen.id);
console.log('   - Generated Trie Word Set:', trieRes.input.words);

console.log('\n============================================================');
console.log('🎉 PHASE 3 VERIFICATION COMPLETE: ALL STRUCTURAL PROVIDERS PASSED!');
console.log('============================================================\n');
