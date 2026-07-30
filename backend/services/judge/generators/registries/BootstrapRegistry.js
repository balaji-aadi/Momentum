import { GeneratorPluginRegistry } from './GeneratorPluginRegistry.js';

// Primitives
import { ArrayPrimitive } from '../primitives/ArrayPrimitive.js';
import { StringPrimitive } from '../primitives/StringPrimitive.js';
import { MatrixPrimitive } from '../primitives/MatrixPrimitive.js';
import { TreePrimitive } from '../primitives/TreePrimitive.js';
import { GraphPrimitive } from '../primitives/GraphPrimitive.js';
import { LinkedListPrimitive } from '../primitives/LinkedListPrimitive.js';

// Reusable Pattern Plugins
import { RandomArrayPlugin } from '../plugins/RandomArrayPlugin.js';
import { SortedArrayPlugin } from '../plugins/SortedArrayPlugin.js';
import { DistinctArrayPlugin } from '../plugins/DistinctArrayPlugin.js';
import { UniquePairGeneratorPlugin } from '../plugins/UniquePairGeneratorPlugin.js';
import { IntervalGeneratorPlugin } from '../plugins/IntervalGeneratorPlugin.js';
import { PrefixSumPlugin } from '../plugins/PrefixSumPlugin.js';
import { SlidingWindowPlugin } from '../plugins/SlidingWindowPlugin.js';
import { BSTGeneratorPlugin } from '../plugins/BSTGeneratorPlugin.js';
import { BalancedTreePlugin } from '../plugins/BalancedTreePlugin.js';
import { SkewedTreePlugin } from '../plugins/SkewedTreePlugin.js';
import { ConnectedGraphPlugin } from '../plugins/ConnectedGraphPlugin.js';
import { DAGPlugin } from '../plugins/DAGPlugin.js';
import { CyclicLinkedListPlugin } from '../plugins/CyclicLinkedListPlugin.js';
import { ExpressionGeneratorPlugin } from '../plugins/ExpressionGeneratorPlugin.js';
import { RandomListGeneratorPlugin } from '../plugins/RandomListGeneratorPlugin.js';
import { EncodedStringPlugin } from '../plugins/EncodedStringPlugin.js';

/**
 * BootstrapRegistry - Centralized Generator & Plugin Autoloader
 * Registers all primitive generators and pattern plugins during application startup.
 * Guarantees ProblemPackageCompiler has zero direct imports or hardcoded plugin fallbacks.
 */
export class BootstrapRegistry {
  static initialized = false;

  static init() {
    if (this.initialized) return;

    // 1. Register Data Primitives
    GeneratorPluginRegistry.registerPrimitive('ArrayPrimitive', new ArrayPrimitive());
    GeneratorPluginRegistry.registerPrimitive('StringPrimitive', new StringPrimitive());
    GeneratorPluginRegistry.registerPrimitive('MatrixPrimitive', new MatrixPrimitive());
    GeneratorPluginRegistry.registerPrimitive('TreePrimitive', new TreePrimitive());
    GeneratorPluginRegistry.registerPrimitive('GraphPrimitive', new GraphPrimitive());
    GeneratorPluginRegistry.registerPrimitive('LinkedListPrimitive', new LinkedListPrimitive());

    // 2. Register Pattern Plugins
    GeneratorPluginRegistry.registerPlugin('RandomArrayPlugin', new RandomArrayPlugin());
    GeneratorPluginRegistry.registerPlugin('SortedArrayPlugin', new SortedArrayPlugin());
    GeneratorPluginRegistry.registerPlugin('DistinctArrayPlugin', new DistinctArrayPlugin());
    GeneratorPluginRegistry.registerPlugin('UniquePairGeneratorPlugin', new UniquePairGeneratorPlugin());
    GeneratorPluginRegistry.registerPlugin('IntervalGeneratorPlugin', new IntervalGeneratorPlugin());
    GeneratorPluginRegistry.registerPlugin('PrefixSumPlugin', new PrefixSumPlugin());
    GeneratorPluginRegistry.registerPlugin('SlidingWindowPlugin', new SlidingWindowPlugin());
    GeneratorPluginRegistry.registerPlugin('BSTGeneratorPlugin', new BSTGeneratorPlugin());
    GeneratorPluginRegistry.registerPlugin('BalancedTreePlugin', new BalancedTreePlugin());
    GeneratorPluginRegistry.registerPlugin('SkewedTreePlugin', new SkewedTreePlugin());
    GeneratorPluginRegistry.registerPlugin('ConnectedGraphPlugin', new ConnectedGraphPlugin());
    GeneratorPluginRegistry.registerPlugin('DAGPlugin', new DAGPlugin());
    GeneratorPluginRegistry.registerPlugin('CyclicLinkedListPlugin', new CyclicLinkedListPlugin());
    GeneratorPluginRegistry.registerPlugin('ExpressionGeneratorPlugin', new ExpressionGeneratorPlugin());
    GeneratorPluginRegistry.registerPlugin('RandomListGeneratorPlugin', new RandomListGeneratorPlugin());
    GeneratorPluginRegistry.registerPlugin('EncodedStringPlugin', new EncodedStringPlugin());

    this.initialized = true;
  }
}
