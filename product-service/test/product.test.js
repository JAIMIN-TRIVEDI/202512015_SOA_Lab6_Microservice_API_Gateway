const test = require('node:test');
const assert = require('node:assert');

test('Product Service - Model Schema Validation', (t) => {
  const Product = require('../src/models/Product');
  assert.ok(Product);
  const schema = Product.schema;
  assert.ok(schema.paths.productId);
  assert.ok(schema.paths.name);
  assert.ok(schema.paths.price);
  assert.ok(schema.paths.stock);
});

test('Product Service - Prometheus Metrics Registry', (t) => {
  const { register } = require('../src/middleware/metrics');
  assert.ok(register);
  assert.strictEqual(typeof register.metrics, 'function');
});
