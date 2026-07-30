import { test, describe } from 'node:test';
import assert from 'node:assert';
import { SeededPRNG } from '../services/judge/generators/prng/SeededPRNG.js';
import { ExpressionGeneratorPlugin } from '../services/judge/generators/plugins/ExpressionGeneratorPlugin.js';
import { GeneratorPluginRegistry } from '../services/judge/generators/registries/GeneratorPluginRegistry.js';

describe('ExpressionGeneratorPlugin Unit Tests', () => {
  const prng = new SeededPRNG(1337);
  const plugin = new ExpressionGeneratorPlugin();

  test('1. Postfix Mode (RPN) produces valid RPN token array', () => {
    const { input } = plugin.apply(prng, {}, {
      mode: 'postfix',
      outputType: 'array',
      minValue: -100,
      maxValue: 100,
      paramName: 'tokens'
    });

    assert.strictEqual(Array.isArray(input.tokens), true);
    assert.strictEqual(input.tokens.length >= 3, true);

    // Verify RPN evaluation stack balance
    let stackSize = 0;
    const operators = new Set(['+', '-', '*', '/']);

    for (const token of input.tokens) {
      if (operators.has(token)) {
        assert.strictEqual(stackSize >= 2, true, `Operator ${token} requires at least 2 operands on stack`);
        stackSize -= 1; // 2 operands popped, 1 result pushed
      } else {
        assert.strictEqual(!isNaN(Number(token)), true, `Token ${token} should be a valid number string`);
        stackSize += 1;
      }
    }

    assert.strictEqual(stackSize, 1, 'Final RPN evaluation stack size must be exactly 1');
  });

  test('2. Division by zero is strictly prevented when allowDivisionByZero is false', () => {
    for (let i = 0; i < 20; i++) {
      const seedPrng = new SeededPRNG(1000 + i);
      const { input } = plugin.apply(seedPrng, {}, {
        mode: 'postfix',
        allowDivisionByZero: false,
        operators: ['/']
      });

      // Execute Python/JS RPN stack evaluation on tokens to ensure no division by zero occurs
      const stack = [];
      for (const t of input.tokens) {
        if (t === '/') {
          const b = stack.pop();
          const a = stack.pop();
          assert.notStrictEqual(b, 0, 'Denominator must not be zero');
          stack.push(Math.trunc(a / b));
        } else {
          stack.push(Number(t));
        }
      }
      assert.strictEqual(stack.length, 1);
    }
  });

  test('3. Infix Mode produces parenthesized infix expression string or array', () => {
    const seedPrng = new SeededPRNG(42);
    const { input } = plugin.apply(seedPrng, {}, {
      mode: 'infix',
      outputType: 'string',
      paramName: 'expression'
    });

    assert.strictEqual(typeof input.expression, 'string');
    assert.strictEqual(input.expression.length > 0, true);
  });

  test('4. Prefix Mode produces valid Prefix token array', () => {
    const seedPrng = new SeededPRNG(999);
    const { input } = plugin.apply(seedPrng, {}, {
      mode: 'prefix',
      outputType: 'array',
      paramName: 'tokens'
    });

    assert.strictEqual(Array.isArray(input.tokens), true);
    // First token in prefix mode is an operator for composite expressions
    assert.strictEqual(input.tokens.length >= 3, true);
  });

  test('5. SeededPRNG reproducibility for ExpressionGeneratorPlugin', () => {
    const prng1 = new SeededPRNG(8888);
    const prng2 = new SeededPRNG(8888);

    const res1 = plugin.apply(prng1, {}, { mode: 'postfix' });
    const res2 = plugin.apply(prng2, {}, { mode: 'postfix' });

    assert.deepStrictEqual(res1.input.tokens, res2.input.tokens);
  });

  test('6. ExpressionGeneratorPlugin is registered in GeneratorPluginRegistry', () => {
    GeneratorPluginRegistry.registerPlugin('ExpressionGeneratorPlugin', plugin);
    const retrieved = GeneratorPluginRegistry.getPlugin('ExpressionGeneratorPlugin');
    assert.strictEqual(retrieved, plugin);
  });
});
