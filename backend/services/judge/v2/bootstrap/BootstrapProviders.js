import { ProviderRegistry } from '../registries/ProviderRegistry.js';

// Primitive Providers
import { NumberPrimitiveGenerator } from '../providers/primitives/NumberPrimitiveGenerator.js';
import { StringPrimitiveGenerator } from '../providers/primitives/StringPrimitiveGenerator.js';
import { ArrayPrimitiveGenerator } from '../providers/primitives/ArrayPrimitiveGenerator.js';
import { MatrixPrimitiveGenerator } from '../providers/primitives/MatrixPrimitiveGenerator.js';
import { PrimitiveParser } from '../providers/primitives/PrimitiveParser.js';
import { PrimitiveSerializer } from '../providers/primitives/PrimitiveSerializer.js';
import { PrimitiveComparator } from '../providers/primitives/PrimitiveComparator.js';
import { PrimitiveValidator } from '../providers/primitives/PrimitiveValidator.js';

// Structural Type Providers
import { LinkedListGeneratorProvider, LinkedListComparatorProvider } from '../providers/structures/LinkedListProvider.js';
import { RandomListGeneratorProvider, RandomListComparatorProvider } from '../providers/structures/RandomListProvider.js';
import { BinaryTreeGeneratorProvider, BinaryTreeComparatorProvider } from '../providers/structures/BinaryTreeProvider.js';
import { NaryTreeGeneratorProvider, NaryTreeComparatorProvider } from '../providers/structures/NaryTreeProvider.js';
import { GraphGeneratorProvider, GraphComparatorProvider } from '../providers/structures/GraphProvider.js';
import { TrieGeneratorProvider, TrieComparatorProvider } from '../providers/structures/TrieProvider.js';

// Grammar Providers
import { GrammarEngine } from '../providers/grammar/GrammarEngine.js';
import { EncodedStringGrammarProvider } from '../providers/grammar/EncodedStringGrammarProvider.js';
import { ExpressionGrammarProvider } from '../providers/grammar/ExpressionGrammarProvider.js';
import { ParenthesesGrammarProvider } from '../providers/grammar/ParenthesesGrammarProvider.js';

export function bootstrapV2Providers() {
  // Register Primitive Providers
  ProviderRegistry.registerProvider(new NumberPrimitiveGenerator());
  ProviderRegistry.registerProvider(new StringPrimitiveGenerator());
  ProviderRegistry.registerProvider(new ArrayPrimitiveGenerator());
  ProviderRegistry.registerProvider(new MatrixPrimitiveGenerator());
  ProviderRegistry.registerProvider(new PrimitiveParser());
  ProviderRegistry.registerProvider(new PrimitiveSerializer());
  ProviderRegistry.registerProvider(new PrimitiveComparator());
  ProviderRegistry.registerProvider(new PrimitiveValidator());

  // Register Structural Providers
  ProviderRegistry.registerProvider(new LinkedListGeneratorProvider());
  ProviderRegistry.registerProvider(new LinkedListComparatorProvider());

  ProviderRegistry.registerProvider(new RandomListGeneratorProvider());
  ProviderRegistry.registerProvider(new RandomListComparatorProvider());

  ProviderRegistry.registerProvider(new BinaryTreeGeneratorProvider());
  ProviderRegistry.registerProvider(new BinaryTreeComparatorProvider());

  ProviderRegistry.registerProvider(new NaryTreeGeneratorProvider());
  ProviderRegistry.registerProvider(new NaryTreeComparatorProvider());

  ProviderRegistry.registerProvider(new GraphGeneratorProvider());
  ProviderRegistry.registerProvider(new GraphComparatorProvider());

  ProviderRegistry.registerProvider(new TrieGeneratorProvider());
  ProviderRegistry.registerProvider(new TrieComparatorProvider());

  // Register Grammar Engine & Grammar Providers
  ProviderRegistry.registerProvider(new GrammarEngine());
  ProviderRegistry.registerProvider(new EncodedStringGrammarProvider());
  ProviderRegistry.registerProvider(new ExpressionGrammarProvider());
  ProviderRegistry.registerProvider(new ParenthesesGrammarProvider());
}
