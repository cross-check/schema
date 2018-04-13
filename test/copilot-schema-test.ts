import hello from 'copilot-schema';

QUnit.module('copilot-schema tests');

QUnit.test('hello', assert => {
  assert.equal(hello(), 'Hello from copilot-schema');
});
