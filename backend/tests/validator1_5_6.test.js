import { describe, test, before } from 'node:test';
import assert from 'node:assert';
import { SeededPRNG } from '../services/judge/generators/prng/SeededPRNG.js';
import { ConstraintValidator } from '../services/judge/validators/ConstraintValidator.js';
import { UniquePairGeneratorPlugin } from '../services/judge/generators/plugins/UniquePairGeneratorPlugin.js';
import { BSTGeneratorPlugin } from '../services/judge/generators/plugins/BSTGeneratorPlugin.js';
import { ConnectedGraphPlugin } from '../services/judge/generators/plugins/ConnectedGraphPlugin.js';

describe('Phase 1.5.6 Constraint & Guarantee Validator Stage', () => {
  let validator;

  before(() => {
    validator = new ConstraintValidator();
  });

  test('1. validateRange correctly verifies array lengths and element min/max bounds', () => {
    const validCheck = validator.validate(
      { nums: [10, 20, 30] },
      { minN: 2, maxN: 5, minValue: 0, maxValue: 50 }
    );
    assert.strictEqual(validCheck.valid, true);

    const invalidLength = validator.validate(
      { nums: [10] },
      { minN: 2, maxN: 5 }
    );
    assert.strictEqual(invalidLength.valid, false);
    assert.strictEqual(invalidLength.reason.includes('below minN'), true);

    const invalidValue = validator.validate(
      { nums: [10, 100] },
      { minValue: 0, maxValue: 50 }
    );
    assert.strictEqual(invalidValue.valid, false);
    assert.strictEqual(invalidValue.reason.includes('exceeds maxValue'), true);
  });

  test('2. validateTwoSum accepts valid target pairs and rejects invalid target pairs', () => {
    const validPair = validator.validate(
      { nums: [2, 7, 11, 15], target: 9 },
      { rule: 'twoSum' }
    );
    assert.strictEqual(validPair.valid, true);

    const invalidPair = validator.validate(
      { nums: [2, 7, 11, 15], target: 99 },
      { rule: 'twoSum' }
    );
    assert.strictEqual(invalidPair.valid, false);
    assert.strictEqual(invalidPair.reason.includes('No pair'), true);
  });

  test('3. validateBST accepts valid BST arrays and rejects invalid BST arrays', () => {
    // Valid BST: 4, left 2, right 6
    const validBST = validator.validate(
      { root: [4, 2, 6, 1, 3, 5, 7] },
      { rule: 'bst' }
    );
    assert.strictEqual(validBST.valid, true);

    // Invalid BST: 4, left 5 (violates Left < Node)
    const invalidBST = validator.validate(
      { root: [4, 5, 6] },
      { rule: 'bst' }
    );
    assert.strictEqual(invalidBST.valid, false);
    assert.strictEqual(invalidBST.reason.includes('fails BST'), true);
  });

  test('4. validateDAG accepts topological u < v edges and rejects cycle edges', () => {
    const validDAG = validator.validate(
      { n: 4, edges: [[0, 1], [0, 2], [1, 3]] },
      { rule: 'dag' }
    );
    assert.strictEqual(validDAG.valid, true);

    const invalidDAG = validator.validate(
      { n: 4, edges: [[0, 1], [2, 1]] }, // 2 >= 1
      { rule: 'dag' }
    );
    assert.strictEqual(invalidDAG.valid, false);
    assert.strictEqual(invalidDAG.reason.includes('violates topological'), true);
  });

  test('5. validateConnectedGraph accepts 100% reachable graphs and rejects disconnected graphs', () => {
    const connected = validator.validate(
      { n: 3, edges: [[0, 1], [1, 2]] },
      { rule: 'connectedGraph' }
    );
    assert.strictEqual(connected.valid, true);

    const disconnected = validator.validate(
      { n: 4, edges: [[0, 1]] }, // Node 2 & 3 disconnected
      { rule: 'connectedGraph' }
    );
    assert.strictEqual(disconnected.valid, false);
    assert.strictEqual(disconnected.reason.includes('disconnected'), true);
  });

  test('6. validateCustomRule evaluates custom JavaScript function code', () => {
    const customCode = 'return input.sum === input.a + input.b;';

    const validCustom = validator.validate(
      { a: 5, b: 10, sum: 15 },
      { rule: 'custom', customRuleCode: customCode }
    );
    assert.strictEqual(validCustom.valid, true);

    const invalidCustom = validator.validate(
      { a: 5, b: 10, sum: 99 },
      { rule: 'custom', customRuleCode: customCode }
    );
    assert.strictEqual(invalidCustom.valid, false);
  });

  test('7. generateValidInput retries candidate generation until valid candidate is produced', () => {
    const prng = new SeededPRNG(888);
    const pairPlugin = new UniquePairGeneratorPlugin();

    const { candidate, attempts } = ConstraintValidator.generateValidInput(
      pairPlugin,
      prng,
      { lengthMin: 8, lengthMax: 8 },
      { rule: 'twoSum', minN: 5, maxN: 10 }
    );

    assert.strictEqual(attempts >= 1, true);
    assert.strictEqual(candidate.input.nums.length, 8);
    assert.strictEqual(typeof candidate.input.target, 'number');

    const check = validator.validate(candidate.input, { rule: 'twoSum' });
    assert.strictEqual(check.valid, true);
  });
});
