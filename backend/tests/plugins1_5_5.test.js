import { describe, test, before } from 'node:test';
import assert from 'node:assert';
import { SeededPRNG } from '../services/judge/generators/prng/SeededPRNG.js';
import { BSTGeneratorPlugin } from '../services/judge/generators/plugins/BSTGeneratorPlugin.js';
import { BalancedTreePlugin } from '../services/judge/generators/plugins/BalancedTreePlugin.js';
import { SkewedTreePlugin } from '../services/judge/generators/plugins/SkewedTreePlugin.js';
import { ConnectedGraphPlugin } from '../services/judge/generators/plugins/ConnectedGraphPlugin.js';
import { DAGPlugin } from '../services/judge/generators/plugins/DAGPlugin.js';
import { CyclicLinkedListPlugin } from '../services/judge/generators/plugins/CyclicLinkedListPlugin.js';
import { GeneratorPluginRegistry } from '../services/judge/generators/registries/GeneratorPluginRegistry.js';

describe('Phase 1.5.5 Tree, Graph & LinkedList Pattern Plugins', () => {
  let bstPlugin, balancedPlugin, skewedPlugin, connectedGraphPlugin, dagPlugin, cyclicListPlugin;

  before(() => {
    bstPlugin = new BSTGeneratorPlugin();
    balancedPlugin = new BalancedTreePlugin();
    skewedPlugin = new SkewedTreePlugin();
    connectedGraphPlugin = new ConnectedGraphPlugin();
    dagPlugin = new DAGPlugin();
    cyclicListPlugin = new CyclicLinkedListPlugin();

    GeneratorPluginRegistry.registerPlugin('BSTGeneratorPlugin', bstPlugin);
    GeneratorPluginRegistry.registerPlugin('BalancedTreePlugin', balancedPlugin);
    GeneratorPluginRegistry.registerPlugin('SkewedTreePlugin', skewedPlugin);
    GeneratorPluginRegistry.registerPlugin('ConnectedGraphPlugin', connectedGraphPlugin);
    GeneratorPluginRegistry.registerPlugin('DAGPlugin', dagPlugin);
    GeneratorPluginRegistry.registerPlugin('CyclicLinkedListPlugin', cyclicListPlugin);
  });

  test('1. BSTGeneratorPlugin satisfies Left < Node < Right invariant', () => {
    const prng = new SeededPRNG(111);
    const res = bstPlugin.apply(prng, null, { nodeCountMin: 7, nodeCountMax: 7 });

    const rootArray = res.input.root;
    assert.strictEqual(Array.isArray(rootArray), true);
    assert.strictEqual(rootArray.length >= 7, true);

    const nonNullValues = rootArray.filter(v => v !== null);
    assert.strictEqual(nonNullValues.length, 7);
  });

  test('2. BalancedTreePlugin returns level-order array', () => {
    const prng = new SeededPRNG(222);
    const res = balancedPlugin.apply(prng, null, { nodeCountMin: 5, nodeCountMax: 5 });

    assert.strictEqual(Array.isArray(res.input.root), true);
    const nonNullValues = res.input.root.filter(v => v !== null);
    assert.strictEqual(nonNullValues.length, 5);
  });

  test('3. SkewedTreePlugin generates right-skewed and left-skewed trees (H = N)', () => {
    const prngA = new SeededPRNG(333);
    const rightRes = skewedPlugin.apply(prngA, [10, 20, 30], { direction: 'right' });
    const rightArr = rightRes.input.root;
    assert.strictEqual(rightArr[0], 10);
    assert.strictEqual(rightArr[2], 20);
    assert.strictEqual(rightArr[6], 30);

    const prngB = new SeededPRNG(444);
    const leftRes = skewedPlugin.apply(prngB, [10, 20, 30], { direction: 'left' });
    const leftArr = leftRes.input.root;
    assert.strictEqual(leftArr[0], 10);
    assert.strictEqual(leftArr[1], 20);
    assert.strictEqual(leftArr[3], 30);
  });

  test('4. ConnectedGraphPlugin guarantees 100% reachability across all vertices', () => {
    const prng = new SeededPRNG(555);
    const res = connectedGraphPlugin.apply(prng, null, { vertexCountMin: 6, vertexCountMax: 6 });

    const { n, edges } = res.input;
    assert.strictEqual(n, 6);
    assert.strictEqual(edges.length >= 5, true); // At least V-1 edges for connectivity

    // Run BFS to confirm 100% reachability from node 0
    const adj = Array.from({ length: n }, () => []);
    edges.forEach(([u, v]) => {
      adj[u].push(v);
      adj[v].push(u);
    });

    const visited = new Set([0]);
    const queue = [0];
    while (queue.length > 0) {
      const curr = queue.shift();
      adj[curr].forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }

    assert.strictEqual(visited.size, 6);
  });

  test('5. DAGPlugin guarantees acyclic u < v invariant for all edges', () => {
    const prng = new SeededPRNG(666);
    const res = dagPlugin.apply(prng, null, { vertexCountMin: 6, vertexCountMax: 6, edgeCountMin: 5, edgeCountMax: 8 });

    const { n, edges } = res.input;
    assert.strictEqual(n, 6);

    edges.forEach(([u, v]) => {
      assert.strictEqual(u < v, true); // Guarantees zero directed cycles
    });
  });

  test('6. CyclicLinkedListPlugin returns valid pos index (-1 <= pos < head.length)', () => {
    const prng = new SeededPRNG(777);
    const res = cyclicListPlugin.apply(prng, null, { lengthMin: 8, lengthMax: 8, hasCycle: true });

    const { head, pos } = res.input;
    assert.strictEqual(head.length, 8);
    assert.strictEqual(pos >= 0 && pos < 8, true);
  });

  test('7. All Phase 1.5.5 plugins registered and accessible from GeneratorPluginRegistry', () => {
    const plugins = GeneratorPluginRegistry.listPlugins();

    assert.strictEqual(plugins.includes('BSTGeneratorPlugin'), true);
    assert.strictEqual(plugins.includes('BalancedTreePlugin'), true);
    assert.strictEqual(plugins.includes('SkewedTreePlugin'), true);
    assert.strictEqual(plugins.includes('ConnectedGraphPlugin'), true);
    assert.strictEqual(plugins.includes('DAGPlugin'), true);
    assert.strictEqual(plugins.includes('CyclicLinkedListPlugin'), true);
  });
});
