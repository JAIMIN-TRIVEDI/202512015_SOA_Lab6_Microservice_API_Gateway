const test = require('node:test');
const assert = require('node:assert');

test('User Service - Model Schema Validation', (t) => {
  const User = require('../src/models/User');
  assert.ok(User);
  const schema = User.schema;
  assert.ok(schema.paths.userId);
  assert.ok(schema.paths.name);
  assert.ok(schema.paths.email);
});

test('User Service - Prometheus Metrics Registry', (t) => {
  const { register } = require('../src/middleware/metrics');
  assert.ok(register);
  assert.strictEqual(typeof register.metrics, 'function');
});
