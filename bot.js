// bot.js — Slack bot built with Node.js + Bolt (Slack's official framework).
//
// What this file does:
//   1. Connects the bot to Slack.
//      - Socket Mode when SLACK_APP_TOKEN (xapp-) is set — best for local dev.
//      - Otherwise HTTP mode: receives Events API requests on PORT.
//   2. Responds to the custom /hello command — both as a real Slack slash
//      command and when "/hello" is the first word of a regular message.
//   3. Logs all messages the bot receives in its channels.

import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import bolt from '@slack/bolt';

const { App, LogLevel } = bolt;

// --- Custom command recognition ----------------------------------------------

/** Returns true when the first word of `text` matches `command` (case-insensitive). */
export function isCustomCommand(text, command) {
  if (typeof text !== 'string') return false;
  const firstWord = text.trim().split(/\s+/)[0];
  return typeof firstWord === 'string' && firstWord.toLowerCase() === command.toLowerCase();
}

// --- Bot logic ----------------------------------------------------------------

/** Registers the bot's event / command handlers on a Bolt app. */
export function registerHandlers(app) {
  // 1. Log ALL messages from channels the bot is in.
  app.event('message', async ({ event, client, logger }) => {
    // Skip subtypes (joins, edits, ...) and other bots to avoid feedback loops.
    if (event.subtype || event.bot_id) return;

    logger.info(
      `Message received | channel=${event.channel} user=${event.user} text=${JSON.stringify(event.text)}`
    );

    // 2. Respond to the custom /hello command written in a message.
    if (isCustomCommand(event.text, '/hello')) {
      await client.chat.postMessage({
        channel: event.channel,
        thread_ts: event.ts,
        text: `Hello <@${event.user}>! 👋`,
      });
    }
  });

  // 2b. Respond to the real /hello slash command (Slack app > Slash Commands).
  app.command('/hello', async ({ command, ack, respond, logger }) => {
    await ack();
    logger.info(`Slash command /hello | user=${command.user_id} channel=${command.channel_id}`);
    await respond({
      response_type: 'in_channel',
      text: `Hello <@${command.user_id}>! 👋`,
    });
  });

  // Central error logging.
  app.error(async (error) => {
    console.error('Bolt error:', error);
  });
}

// --- Connection / startup -----------------------------------------------------

/** Builds the Bolt app from the environment and validates the credentials. */
export function createApp() {
  const {
    SLACK_BOT_TOKEN,
    SLACK_SIGNING_SECRET,
    SLACK_APP_TOKEN,
    PORT = 3000,
  } = process.env;

  // Socket Mode is used when an app-level token (xapp-) is provided.
  const useSocketMode = Boolean(SLACK_APP_TOKEN);

  const missing = [];
  if (!SLACK_BOT_TOKEN) missing.push('SLACK_BOT_TOKEN');
  if (!useSocketMode && !SLACK_SIGNING_SECRET) missing.push('SLACK_SIGNING_SECRET');
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Copy .env.example to .env and fill in your Slack credentials.');
    process.exit(1);
  }

  // 1. Connect your bot to Slack.
  const app = new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET,
    socketMode: useSocketMode,
    appToken: SLACK_APP_TOKEN,
    logLevel: LogLevel.INFO,
  });

  registerHandlers(app);

  return { app, useSocketMode, port: PORT };
}

/** Starts the bot and begins listening for Slack events. */
export async function start() {
  const { app, useSocketMode, port } = createApp();
  await app.start(port);
  console.log(
    `⚡️ Slack bot is running (${useSocketMode ? 'Socket Mode' : `HTTP mode on port ${port}`})`
  );
  return app;
}

// Start the bot only when this file is executed directly (`node bot.js`),
// not when it is imported by the tests.
const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  start().catch((error) => {
    console.error('Failed to start the bot:', error);
    process.exit(1);
  });
}
