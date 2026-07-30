import test from 'node:test';
import assert from 'node:assert';
import { CustomTypeRegistry } from '../services/judge/types/CustomTypeRegistry.js';
import { RandomListGeneratorPlugin } from '../services/judge/generators/plugins/RandomListGeneratorPlugin.js';
import { RandomListComparator } from '../services/judge/comparators/RandomListComparator.js';
import { SeededPRNG } from '../services/judge/generators/prng/SeededPRNG.js';
import { ProblemPackageCompiler } from '../services/judge/ProblemPackageCompiler.js';

test('Phase 1 CustomTypeRegistry & RandomListNode Integration', async (t) => {
  await t.test('1. CustomTypeRegistry retrieves random_list_node schema and aliases', () => {
    const schema = CustomTypeRegistry.getType('random_list_node');
    assert.ok(schema, 'Schema random_list_node should be registered');
    assert.strictEqual(schema.className, 'Node');
    assert.strictEqual(schema.serializationFormat, 'pair_array');

    const aliasSchema = CustomTypeRegistry.getType('RandomListNode');
    assert.strictEqual(aliasSchema, schema, 'Alias RandomListNode should map to random_list_node');

    assert.ok(schema.classHeaders.python.includes('class Node:'));
    assert.ok(schema.classHeaders.javascript.includes('function Node('));
  });

  await t.test('2. RandomListGeneratorPlugin produces valid pair array [[val, random_index], ...]', () => {
    const prng = new SeededPRNG(133742);
    const plugin = new RandomListGeneratorPlugin();
    const result = plugin.apply(prng, null, {
      nodeCountMin: 5,
      nodeCountMax: 5,
      valueMin: 1,
      valueMax: 10,
      paramName: 'head'
    });

    assert.ok(result.input.head, 'Output object should contain head');
    assert.strictEqual(result.input.head.length, 5, 'List length should equal 5');

    for (const pair of result.input.head) {
      assert.strictEqual(pair.length, 2, 'Each element should be a pair [val, random_index]');
      assert.ok(typeof pair[0] === 'number', 'First element should be value');
      assert.ok(pair[1] === null || (typeof pair[1] === 'number' && pair[1] >= 0 && pair[1] < 5), 'Random index must be null or valid index');
    }
  });

  await t.test('3. RandomListComparator verifies value and random pointer target equality', () => {
    const comparator = new RandomListComparator();

    const expected = [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]];
    const matching = [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]];
    const wrongVal = [[7, null], [13, 0], [99, 4], [10, 2], [1, 0]];
    const wrongPointer = [[7, null], [13, 1], [11, 4], [10, 2], [1, 0]];

    assert.strictEqual(comparator.compare(matching, expected).pass, true, 'Identical lists should pass');
    assert.strictEqual(comparator.compare(wrongVal, expected).pass, false, 'Mismatched node value should fail');
    assert.strictEqual(comparator.compare(wrongPointer, expected).pass, false, 'Mismatched random pointer should fail');
  });

  await t.test('4. End-to-End Package Compilation for Copy List with Random Pointer', async () => {
    const pythonRef = `
def copyRandomList(head):
    return head
`;

    const pkg = await ProblemPackageCompiler.compile({
      problemId: 'copy_random_list_test',
      title: 'Copy List with Random Pointer',
      functionDefinition: {
        name: 'copyRandomList',
        parameters: [{ name: 'head', type: 'RandomListNode' }],
        returnType: 'RandomListNode'
      },
      generatorName: 'RandomListGeneratorPlugin',
      comparatorName: 'RandomListMatch',
      referenceLanguage: 'python',
      referenceCode: pythonRef,
      randomCount: 3,
      stressCount: 0,
      seed: 12345
    });

    const manifest = pkg.packageManifest || pkg;
    const testCases = manifest.hiddenTestCases || pkg.hiddenTestCases;

    assert.ok(manifest, 'Package should include manifest');
    assert.strictEqual(testCases.length, 3, 'Package should include 3 generated test cases');
    assert.ok(Array.isArray(testCases[0].input.head), 'Test case input should be pair array');
  });
});
