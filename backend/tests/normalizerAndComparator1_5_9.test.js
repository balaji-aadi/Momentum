import { describe, test } from 'node:test';
import assert from 'node:assert';
import { OutputNormalizers } from '../services/judge/normalizers/OutputNormalizers.js';
import { UnorderedNestedArrayMatch } from '../services/judge/comparators/UnorderedNestedArrayMatch.js';
import { FloatToleranceMatch } from '../services/judge/comparators/FloatToleranceMatch.js';
import { ComparatorRegistry } from '../services/judge/comparators/ComparatorRegistry.js';

describe('Phase 1.5.9 Output Normalizer Layer & Extended Comparators', () => {
  test('1. OutputNormalizers.sortInnerLists produces canonical sorted nested arrays', () => {
    const raw = [[3, 1], [2], [1, 5, 2]];
    const res = OutputNormalizers.sortInnerLists(raw);

    assert.deepStrictEqual(res, [[1, 2, 5], [1, 3], [2]]);
  });

  test('2. OutputNormalizers.truncateFloat truncates floating point values to epsilon precision', () => {
    const rawNum = 3.14159265;
    assert.strictEqual(OutputNormalizers.truncateFloat(rawNum, 1e-5), 3.14159);

    const rawArr = [1.000004, 2.999999];
    assert.deepStrictEqual(OutputNormalizers.truncateFloat(rawArr, 1e-4), [1.0000, 3.0000]);
  });

  test('3. OutputNormalizers.canonicalizeTree trims trailing nulls from tree level-order array', () => {
    const treeArr = [1, 2, 3, null, null, null];
    assert.deepStrictEqual(OutputNormalizers.canonicalizeTree(treeArr), [1, 2, 3]);
  });

  test('4. OutputNormalizers.canonicalizeGraph sorts adjacency list keys and neighbor arrays', () => {
    const graph = {
      adjacencyList: {
        '2': [4, 1],
        '0': [3, 2]
      }
    };
    const res = OutputNormalizers.canonicalizeGraph(graph);

    assert.deepStrictEqual(Object.keys(res.adjacencyList), ['0', '2']);
    assert.deepStrictEqual(res.adjacencyList['0'], [2, 3]);
    assert.deepStrictEqual(res.adjacencyList['2'], [1, 4]);
  });

  test('5. UnorderedNestedArrayMatch matches multiset combination outputs regardless of ordering', () => {
    const comparator = new UnorderedNestedArrayMatch();

    const actual = [[2, 1, 3], [4]];
    const expected = [[4], [3, 2, 1]];

    const res = comparator.compare(actual, expected);
    assert.strictEqual(res.match, true);

    const wrongActual = [[2, 1], [4]];
    const wrongRes = comparator.compare(wrongActual, expected);
    assert.strictEqual(wrongRes.match, false);
  });

  test('6. FloatToleranceMatch evaluates floating point output within epsilon bounds', () => {
    const comparator = new FloatToleranceMatch();

    const actual = 0.30000000000000004;
    const expected = 0.3;

    const res = comparator.compare(actual, expected, { epsilon: 1e-5 });
    assert.strictEqual(res.match, true);

    const actualArr = [1.00001, 2.00002];
    const expectedArr = [1.0, 2.0];
    const resArr = comparator.compare(actualArr, expectedArr, { epsilon: 1e-4 });
    assert.strictEqual(resArr.match, true);
  });

  test('7. ComparatorRegistry integrates UnorderedNestedArrayMatch and FloatToleranceMatch', () => {
    const nestedRes = ComparatorRegistry.compareOutput(
      'UnorderedNestedArrayMatch',
      '[[2, 3], [1]]',
      '[[1], [3, 2]]'
    );
    assert.strictEqual(nestedRes.match, true);

    const floatRes = ComparatorRegistry.compareOutput(
      'FloatToleranceMatch',
      '[3.141592, 2.718281]',
      '[3.14159, 2.71828]'
    );
    assert.strictEqual(floatRes.match, true);
  });
});
