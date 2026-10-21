import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHandlers } from '../bot.js';

/** Minimal Bolt app stub that captures registered handlers. */
function createFakeApp() {
  const handlers = { event: {}, command: {}, error: null };
  return {
    handlers,
    event: (name, handler) => (handlers.event[name] = handler),
    command: (name, handler) => (handlers.command[name] = handler),
    error: (handler) => (handlers.error = handler),
  };
}

const fakeLogger = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} };

test('message handler logs and replies to /hello messages', async () => {
  const app = createFakeApp();
  registerHandlers(app);

  const posted = [];
  const client = {
    chat: { postMessage: async (payload) => posted.push(payload) },
  };

  await app.handlers.event.message({
    event: {
      type: 'message',
      channel: 'C123',
      user: 'U456',
      text: '/hello everyone',
      ts: '1700000000.000100',
    },
    client,
    logger: fakeLogger,
  });

  assert.equal(posted.length, 1);
  assert.equal(posted[0].channel, 'C123');
  assert.equal(posted[0].thread_ts, '1700000000.000100');
  assert.match(posted[0].text, /Hello <@U456>/);
});

test('message handler ignores bots, subtypes and non-command messages', async () => {
  const app = createFakeApp();
  registerHandlers(app);

  const posted = [];
  const client = {
    chat: { postMessage: async (payload) => posted.push(payload) },
  };

  const base = { channel: 'C123', user: 'U456', ts: '1700000000.000100' };
  await app.handlers.event.message({ event: { ...base, type: 'message', text: 'hi', bot_id: 'B1' }, client, logger: fakeLogger });
  await app.handlers.event.message({ event: { ...base, type: 'message', text: '/hello', subtype: 'channel_join' }, client, logger: fakeLogger });
  await app.handlers.event.message({ event: { ...base, type: 'message', text: 'just a normal message' }, client, logger: fakeLogger });

  assert.equal(posted.length, 0);
});

test('slash command /hello acknowledges and responds', async () => {
  const app = createFakeApp();
  registerHandlers(app);

  let acked = false;
  const responses = [];

  await app.handlers.command['/hello']({
    command: { user_id: 'U456', channel_id: 'C123' },
    ack: async () => (acked = true),
    respond: async (payload) => responses.push(payload),
    logger: fakeLogger,
  });

  assert.equal(acked, true);
  assert.equal(responses.length, 1);
  assert.equal(responses[0].response_type, 'in_channel');
  assert.match(responses[0].text, /Hello <@U456>/);
});
