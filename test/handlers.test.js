import test from 'node:test';
import assert from 'node:assert/strict';
import { isCustomCommand } from '../bot.js';

test('isCustomCommand matches /hello regardless of case and extra args', () => {
  assert.equal(isCustomCommand('/hello', '/hello'), true);
  assert.equal(isCustomCommand('/HELLO', '/hello'), true);
  assert.equal(isCustomCommand('  /hello   everyone ', '/hello'), true);
  assert.equal(isCustomCommand('/hello team', '/hello'), true);
});

test('isCustomCommand rejects other text', () => {
  assert.equal(isCustomCommand('hello', '/hello'), false);
  assert.equal(isCustomCommand('/goodbye', '/hello'), false);
  assert.equal(isCustomCommand('say /hello please', '/hello'), false);
  assert.equal(isCustomCommand('/hello2', '/hello'), false);
  assert.equal(isCustomCommand(undefined, '/hello'), false);
});
