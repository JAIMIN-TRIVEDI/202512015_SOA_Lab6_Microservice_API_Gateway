const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

test('API Gateway - Configuration & Environment Defaults', (t) => {
  const config = require('../src/config/services');
  assert.strictEqual(typeof config.port, 'number');
  assert.ok(config.services.userService.url);
  assert.ok(config.services.productService.url);
  assert.ok(config.services.orderService.url);
});

test('API Gateway - Health & Metrics Middleware Exports', (t) => {
  const { register } = require('../src/middleware/metrics');
  assert.ok(register);
  assert.strictEqual(typeof register.metrics, 'function');
});
