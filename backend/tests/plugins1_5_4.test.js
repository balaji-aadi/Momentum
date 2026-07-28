import { describe, test, before } from 'node:test';
import assert from 'node:assert';
import { SeededPRNG } from '../services/judge/generators/prng/SeededPRNG.js';
import { RandomArrayPlugin } from '../services/judge/generators/plugins/RandomArrayPlugin.js';
import { SortedArrayPlugin } from '../services/judge/generators/plugins/SortedArrayPlugin.js';
import { DistinctArrayPlugin } from '../services/judge/generators/plugins/DistinctArrayPlugin.js';
import { UniquePairGeneratorPlugin } from '../services/judge/generators/plugins/UniquePairGeneratorPlugin.js';
import { IntervalGeneratorPlugin } from '../services/judge/generators/plugins/IntervalGeneratorPlugin.js';
import { PrefixSumPlugin } from '../services/judge/generators/plugins/PrefixSumPlugin.js';
import { SlidingWindowPlugin } from '../services/judge/generators/plugins/SlidingWindowPlugin.js';
import { GeneratorPluginRegistry } from '../services/judge/generators/registries/GeneratorPluginRegistry.js';

describe('Phase 1.5.4 Reusable Array Pattern Plugins', () => {
  let randomPlugin, sortedPlugin, distinctPlugin, uniquePairPlugin, intervalPlugin, prefixSumPlugin, slidingWindowPlugin;

  before(() => {
    randomPlugin = new RandomArrayPlugin();
    sortedPlugin = new SortedArrayPlugin();
    distinctPlugin = new DistinctArrayPlugin();
    uniquePairPlugin = new UniquePairGeneratorPlugin();
    intervalPlugin = new IntervalGeneratorPlugin();
    prefixSumPlugin = new PrefixSumPlugin();
    slidingWindowPlugin = new SlidingWindowPlugin();

    GeneratorPluginRegistry.registerPlugin('RandomArrayPlugin', randomPlugin);
    GeneratorPluginRegistry.registerPlugin('SortedArrayPlugin', sortedPlugin);
    GeneratorPluginRegistry.registerPlugin('DistinctArrayPlugin', distinctPlugin);
    GeneratorPluginRegistry.registerPlugin('UniquePairGeneratorPlugin', uniquePairPlugin);
    GeneratorPluginRegistry.registerPlugin('IntervalGeneratorPlugin', intervalPlugin);
    GeneratorPluginRegistry.registerPlugin('PrefixSumPlugin', prefixSumPlugin);
    GeneratorPluginRegistry.registerPlugin('SlidingWindowPlugin', slidingWindowPlugin);
  });

  test('1. RandomArrayPlugin returns formatted input object { input: { nums } }', () => {
    const prng = new SeededPRNG(101);
    const res = randomPlugin.apply(prng, null, { lengthMin: 10, lengthMax: 10 });

    assert.strictEqual(Array.isArray(res.input.nums), true);
    assert.strictEqual(res.input.nums.length, 10);
  });

  test('2. SortedArrayPlugin sorts elements in ascending and descending order', () => {
    const prng = new SeededPRNG(202);
    const ascRes = sortedPlugin.apply(prng, [40, 10, 50, 20], { order: 'asc' });
    assert.deepStrictEqual(ascRes.input.nums, [10, 20, 40, 50]);

    const descRes = sortedPlugin.apply(prng, [40, 10, 50, 20], { order: 'desc' });
    assert.deepStrictEqual(descRes.input.nums, [50, 40, 20, 10]);
  });

  test('3. DistinctArrayPlugin guarantees all elements are unique', () => {
    const prng = new SeededPRNG(303);
    const res = distinctPlugin.apply(prng, null, { lengthMin: 15, lengthMax: 15, valueMin: 1, valueMax: 50 });

    const nums = res.input.nums;
    assert.strictEqual(nums.length, 15);
    const uniqueSet = new Set(nums);
    assert.strictEqual(uniqueSet.size, 15);
  });

  test('4. UniquePairGeneratorPlugin guarantees a valid Two Sum target pair', () => {
    const prng = new SeededPRNG(404);
    const res = uniquePairPlugin.apply(prng, null, { lengthMin: 10, lengthMax: 10 });

    const { nums, target } = res.input;
    assert.strictEqual(nums.length, 10);
    assert.strictEqual(typeof target, 'number');

    // Verify at least one pair sums to target
    let foundPair = false;
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        if (nums[i] + nums[j] === target) {
          foundPair = true;
          break;
        }
      }
    }
    assert.strictEqual(foundPair, true);
  });

  test('5. IntervalGeneratorPlugin returns valid sorted intervals [start, end]', () => {
    const prng = new SeededPRNG(505);
    const res = intervalPlugin.apply(prng, null, { countMin: 6, countMax: 6, sorted: true });

    const intervals = res.input.intervals;
    assert.strictEqual(intervals.length, 6);

    for (let i = 0; i < intervals.length; i++) {
      const [start, end] = intervals[i];
      assert.strictEqual(start <= end, true);
      if (i > 0) {
        assert.strictEqual(intervals[i][0] >= intervals[i - 1][0], true);
      }
    }
  });

  test('6. PrefixSumPlugin returns valid query ranges 0 <= L <= R < nums.length', () => {
    const prng = new SeededPRNG(606);
    const res = prefixSumPlugin.apply(prng, null, { lengthMin: 10, lengthMax: 10, queryCountMin: 5, queryCountMax: 5 });

    const { nums, queries } = res.input;
    assert.strictEqual(nums.length, 10);
    assert.strictEqual(queries.length, 5);

    queries.forEach(([L, R]) => {
      assert.strictEqual(L >= 0 && L < nums.length, true);
      assert.strictEqual(R >= 0 && R < nums.length, true);
      assert.strictEqual(L <= R, true);
    });
  });

  test('7. SlidingWindowPlugin returns window size 1 <= k <= nums.length', () => {
    const prng = new SeededPRNG(707);
    const res = slidingWindowPlugin.apply(prng, null, { lengthMin: 12, lengthMax: 12 });

    const { nums, k } = res.input;
    assert.strictEqual(nums.length, 12);
    assert.strictEqual(k >= 1 && k <= 12, true);
  });

  test('8. All 7 Array Pattern Plugins registered and accessible from GeneratorPluginRegistry', () => {
    const plugins = GeneratorPluginRegistry.listPlugins();

    assert.strictEqual(plugins.includes('RandomArrayPlugin'), true);
    assert.strictEqual(plugins.includes('SortedArrayPlugin'), true);
    assert.strictEqual(plugins.includes('DistinctArrayPlugin'), true);
    assert.strictEqual(plugins.includes('UniquePairGeneratorPlugin'), true);
    assert.strictEqual(plugins.includes('IntervalGeneratorPlugin'), true);
    assert.strictEqual(plugins.includes('PrefixSumPlugin'), true);
    assert.strictEqual(plugins.includes('SlidingWindowPlugin'), true);
  });
});
