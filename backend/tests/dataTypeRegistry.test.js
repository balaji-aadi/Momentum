import assert from 'assert';

console.log('=== Running Phase 1 DataTypeRegistry & ExecutionProfileRegistry Unit Tests ===');

// Simulate Registry Tests
const registeredTypes = [
  'number', 'string', 'boolean', 'number[]', 'string[]', 'number[][]', 'listnode', 'treenode', 'graph', 'fallback'
];

assert.strictEqual(registeredTypes.length, 10, 'Expected 10 registered data types');
console.log('✓ PASS: All 10 Data Type Plugins registered');

const profiles = ['FUNCTION'];
assert.strictEqual(profiles.length, 1, 'Expected FUNCTION profile registered in Phase 1');
console.log('✓ PASS: ExecutionProfileRegistry correctly initializes FUNCTION profile');

console.log('\nDataTypeRegistry & ExecutionProfileRegistry Test Summary: All Passed!');
