import assert from 'node:assert';
import test from 'node:test';
import { DriverGeneratorService } from '../services/judge/driverGenerator/DriverGeneratorService.js';
import { SemanticValidatorRegistry } from '../services/judge/validators/SemanticValidatorRegistry.js';
import { UnsupportedSemanticValidatorError } from '../services/judge/validators/ValidatorErrors.js';
import { SandboxOrchestrator } from '../services/judge/sandbox/SandboxOrchestrator.js';
import { GraphMatch } from '../services/judge/comparators/GraphMatch.js';

// Problem Metadatas
const P8_CopyRandomList = {
  functionName: 'copyRandomList',
  parameters: [{ name: 'head', type: 'RandomListNode' }],
  returnType: 'RandomListNode'
};
const Profile_CopyRandomList = {
  runtimeType: 'FUNCTION',
  outputSerializer: 'RandomListSerializer',
  comparator: 'ExactMatch',
  semanticValidator: 'DeepCopyValidator'
};

const P9_CloneGraph = {
  functionName: 'cloneGraph',
  parameters: [{ name: 'node', type: 'GraphNode' }],
  returnType: 'GraphNode'
};
const Profile_CloneGraph = {
  runtimeType: 'FUNCTION',
  outputSerializer: 'GraphNodeSerializer',
  comparator: 'GraphMatch',
  semanticValidator: 'DeepCopyValidator'
};

const P1_TwoSum = {
  functionName: 'twoSum',
  parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
  returnType: 'number[]'
};
const Profile_TwoSum = {
  runtimeType: 'FUNCTION',
  outputSerializer: 'ArraySerializer',
  comparator: 'UnorderedArrayMatch'
};

const TCs_RandomList = [{ input: { head: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]] } }];
const TCs_CloneGraph = [{ input: { node: [[2, 4], [1, 3], [2, 4], [1, 3]] } }];

test('SemanticValidatorRegistry rejects unknown validators', () => {
  assert.strictEqual(SemanticValidatorRegistry.isValid('DeepCopyValidator'), true);
  assert.strictEqual(SemanticValidatorRegistry.isValid('NonExistentValidator'), false);

  assert.throws(() => {
    DriverGeneratorService.generateDriverHarness('python', 'pass', P1_TwoSum, { semanticValidator: 'UnknownValidator' }, []);
  }, UnsupportedSemanticValidatorError);
});

test('JS Driver: DSA-008 return head fails with Memory Identity Violation', async () => {
  const code = `
  var copyRandomList = function(head) {
      return head;
  };
  `;
  const driverSource = DriverGeneratorService.generateDriverHarness('javascript', code, P8_CopyRandomList, Profile_CopyRandomList, TCs_RandomList);
  const result = await SandboxOrchestrator.execute({
    language: 'javascript',
    sourceCode: driverSource,
    testCasesCount: 1
  });

  assert.strictEqual(result.status, 'RUNTIME_ERROR');
  const msg = result.envelope?.message || result.error || '';
  assert(msg.includes('Memory Identity Violation'), `Expected Memory Identity Violation error but got: ${msg}`);
});

test('JS Driver: DSA-008 valid deep copy passes', async () => {
  const code = `
  var copyRandomList = function(head) {
      if (!head) return null;
      const map = new Map();
      let curr = head;
      while (curr) {
          map.set(curr, new Node(curr.val));
          curr = curr.next;
      }
      curr = head;
      while (curr) {
          if (curr.next) map.get(curr).next = map.get(curr.next);
          if (curr.random) map.get(curr).random = map.get(curr.random);
          curr = curr.next;
      }
      return map.get(head);
  };
  `;
  const driverSource = DriverGeneratorService.generateDriverHarness('javascript', code, P8_CopyRandomList, Profile_CopyRandomList, TCs_RandomList);
  const result = await SandboxOrchestrator.execute({
    language: 'javascript',
    sourceCode: driverSource,
    testCasesCount: 1
  });

  assert.strictEqual(result.status, 'SUCCESS');
  assert.deepStrictEqual(result.envelope.results[0].output, [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]]);
});

test('JS Driver: DSA-008 shallow random pointer copy fails', async () => {
  const code = `
  var copyRandomList = function(head) {
      if (!head) return null;
      const map = new Map();
      let curr = head;
      while (curr) {
          map.set(curr, new Node(curr.val));
          curr = curr.next;
      }
      curr = head;
      while (curr) {
          if (curr.next) map.get(curr).next = map.get(curr.next);
          // Shallow random copy pointing back to original input node!
          if (curr.random) map.get(curr).random = curr.random;
          curr = curr.next;
      }
      return map.get(head);
  };
  `;
  const driverSource = DriverGeneratorService.generateDriverHarness('javascript', code, P8_CopyRandomList, Profile_CopyRandomList, TCs_RandomList);
  const result = await SandboxOrchestrator.execute({
    language: 'javascript',
    sourceCode: driverSource,
    testCasesCount: 1
  });

  assert.strictEqual(result.status, 'RUNTIME_ERROR');
  const msg = result.envelope?.message || result.error || '';
  assert(msg.includes('Memory Identity Violation'), `Expected Memory Identity Violation error but got: ${msg}`);
});

test('JS Driver: DSA-009 return node fails with Memory Identity Violation', async () => {
  const code = `
  var cloneGraph = function(node) {
      return node;
  };
  `;
  const driverSource = DriverGeneratorService.generateDriverHarness('javascript', code, P9_CloneGraph, Profile_CloneGraph, TCs_CloneGraph);
  const result = await SandboxOrchestrator.execute({
    language: 'javascript',
    sourceCode: driverSource,
    testCasesCount: 1
  });

  assert.strictEqual(result.status, 'RUNTIME_ERROR');
  const msg = result.envelope?.message || result.error || '';
  assert(msg.includes('Memory Identity Violation'), `Expected Memory Identity Violation error but got: ${msg}`);
});

test('JS Driver: DSA-009 valid clone graph passes', async () => {
  const code = `
  var cloneGraph = function(node) {
      if (!node) return null;
      const visited = new Map();
      function dfs(n) {
          if (visited.has(n)) return visited.get(n);
          const copy = new Node(n.val);
          visited.set(n, copy);
          for (const neighbor of n.neighbors) {
              copy.neighbors.push(dfs(neighbor));
          }
          return copy;
      }
      return dfs(node);
  };
  `;
  const driverSource = DriverGeneratorService.generateDriverHarness('javascript', code, P9_CloneGraph, Profile_CloneGraph, TCs_CloneGraph);
  const result = await SandboxOrchestrator.execute({
    language: 'javascript',
    sourceCode: driverSource,
    testCasesCount: 1
  });

  assert.strictEqual(result.status, 'SUCCESS');
  const comp = GraphMatch.compare(result.envelope.results[0].output, [[2, 4], [1, 3], [2, 4], [1, 3]]);
  assert.strictEqual(comp.passed, true);
});

test('JS Driver: DSA-009 shallow neighbor copy fails', async () => {
  const code = `
  var cloneGraph = function(node) {
      if (!node) return null;
      // Clones root node, but pushes original input neighbor references!
      const rootCopy = new Node(node.val);
      for (const nb of node.neighbors) {
          rootCopy.neighbors.push(nb);
      }
      return rootCopy;
  };
  `;
  const driverSource = DriverGeneratorService.generateDriverHarness('javascript', code, P9_CloneGraph, Profile_CloneGraph, TCs_CloneGraph);
  const result = await SandboxOrchestrator.execute({
    language: 'javascript',
    sourceCode: driverSource,
    testCasesCount: 1
  });

  assert.strictEqual(result.status, 'RUNTIME_ERROR');
  const msg = result.envelope?.message || result.error || '';
  assert(msg.includes('Memory Identity Violation'), `Expected Memory Identity Violation error but got: ${msg}`);
});

test('Python Driver: DSA-008 return head fails', async () => {
  const code = `
class Solution:
    def copyRandomList(self, head: 'Optional[Node]') -> 'Optional[Node]':
        return head
  `;
  const driverSource = DriverGeneratorService.generateDriverHarness('python', code, P8_CopyRandomList, Profile_CopyRandomList, TCs_RandomList);
  const result = await SandboxOrchestrator.execute({
    language: 'python',
    sourceCode: driverSource,
    testCasesCount: 1
  });

  assert.strictEqual(result.status, 'RUNTIME_ERROR');
  const msg = result.envelope?.message || result.error || '';
  assert(msg.includes('Memory Identity Violation'), `Expected Memory Identity Violation error but got: ${msg}`);
});

test('Python Driver: DSA-008 valid deep copy passes', async () => {
  const code = `
class Solution:
    def copyRandomList(self, head: 'Optional[Node]') -> 'Optional[Node]':
        if not head: return None
        mapping = {}
        curr = head
        while curr:
            mapping[curr] = Node(curr.val)
            curr = curr.next
        curr = head
        while curr:
            if curr.next: mapping[curr].next = mapping[curr.next]
            if curr.random: mapping[curr].random = mapping[curr.random]
            curr = curr.next
        return mapping[head]
  `;
  const driverSource = DriverGeneratorService.generateDriverHarness('python', code, P8_CopyRandomList, Profile_CopyRandomList, TCs_RandomList);
  const result = await SandboxOrchestrator.execute({
    language: 'python',
    sourceCode: driverSource,
    testCasesCount: 1
  });

  assert.strictEqual(result.status, 'SUCCESS');
  assert.deepStrictEqual(result.envelope.results[0].output, [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]]);
});

test('Ordinary problems without semanticValidator remain unaffected', async () => {
  const code = `
  var twoSum = function(nums, target) {
      return [0, 1];
  };
  `;
  const driverSource = DriverGeneratorService.generateDriverHarness('javascript', code, P1_TwoSum, Profile_TwoSum, [{ input: { nums: [2, 7, 11, 15], target: 9 } }]);
  const result = await SandboxOrchestrator.execute({
    language: 'javascript',
    sourceCode: driverSource,
    testCasesCount: 1
  });

  assert.strictEqual(result.status, 'SUCCESS');
  assert.deepStrictEqual(result.envelope.results[0].output, [0, 1]);
});
