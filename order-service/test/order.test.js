const test = require('node:test');
const assert = require('node:assert');

test('Order Service - Model Schema Validation', (t) => {
  const Order = require('../src/models/Order');
  assert.ok(Order);
  const schema = Order.schema;
  assert.ok(schema.paths.orderId);
  assert.ok(schema.paths.userId);
  assert.ok(schema.paths.productId);
  assert.ok(schema.paths.quantity);
  assert.ok(schema.paths.totalAmount);
});

test('Order Service - Prometheus Metrics Registry', (t) => {
  const { register } = require('../src/middleware/metrics');
  assert.ok(register);
  assert.strictEqual(typeof register.metrics, 'function');
});
