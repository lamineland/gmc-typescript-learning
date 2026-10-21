# gmc-slack-bot

A simple Slack bot built with **Node.js** and **Bolt** (Slack’s official framework).
It listens to messages in Slack channels via the **Slack Events API**, logs every
message it receives, and recognizes the custom `/hello` command.

## Features

- 📨 Listens to `message` events and logs channel messages (`channel`, `user`, `text`)
- 👋 Responds to the custom `/hello` command — both as a real Slack slash command
  and when `/hello` appears as the first word of a regular message
- 🔌 Runs in **Socket Mode** (no public URL needed — best for local dev) or
  **HTTP mode** (Events API request URL) depending on your configuration
- 🚫 Ignores bot messages and message subtypes to avoid feedback loops

## Requirements

- Node.js >= 18
- A Slack workspace where you can install apps

## 🔹 Step 1: Set Up Your Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps) and click
   **Create New App** → *From scratch*.
2. Name your app (e.g. `gmc-slack-bot`) and pick your workspace.
3. Under **OAuth & Permissions**, in *Bot Token Scopes*, add:
   - `chat:write`
   - `channels:history`
   - (recommended) `commands` — to use the real `/hello` slash command
4. **Enable the Events API**:
   - *Socket Mode* (recommended for local dev): enable it, then create an
     **App-Level Token** under **Basic Information → App-Level Tokens**
     with the `connections:write` scope (token starts with `xapp-`).
   - *HTTP mode* instead: under **Event Subscriptions**, toggle *Enable Events*,
     set the **Request URL** to `https://<your-public-host>/slack/events`, and add the
     **`message.channels`** bot event under *Subscribe to bot events*.
5. (Optional) Under **Slash Commands**, create a command `/hello`
   (Request URL: `https://<your-public-host>/slack/events` — not needed in Socket Mode).
6. Click **Install App to Workspace**.
7. **Copy and save your OAuth token** (starts with `xoxb-`) from
   **OAuth & Permissions → Bot User OAuth Token**, plus the **Signing Secret**
   from **Basic Information**. You'll need them to connect your bot to Slack.

## 🔹 Step 2: Configure the bot

```bash
cp .env.example .env
```

Then edit `.env` and fill in the values you copied from your Slack app:

```dotenv
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-...   # optional: uncomment to use Socket Mode
```

## 🔹 Step 3: Install and run

```bash
npm install
npm start          # start the bot
npm run dev        # start with auto-reload on file changes
npm test           # run the unit tests
```

You should see:

```text
⚡️ Slack bot is running (Socket Mode)
```

### Try it out

1. Invite the bot to a channel: `/invite @<your-bot-name>`
2. Send any message in that channel → the bot logs it in the console
3. Type `/hello` (slash command) or send a message starting with `/hello`
   → the bot replies `Hello @you! 👋`

## Project structure

```text
gmc-slack-bot/
├── bot.js              # the bot: connects to Slack, responds to /hello, logs all messages
├── test/
│   ├── handlers.test.js        # unit tests for custom command recognition
│   └── message-handler.test.js # integration tests for the Bolt handlers
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

All bot logic lives in a single `bot.js` (run with `npm start` / `node bot.js`).
It exports its helpers (`isCustomCommand`, `registerHandlers`, `createApp`, `start`)
so the tests can import them without starting a Slack connection.

## Notes

- **Socket Mode vs HTTP mode:** if `SLACK_APP_TOKEN` is set the bot connects over
  a WebSocket (no public URL, ideal for running on your laptop). Without it, the
  bot starts an HTTP server on `PORT` and expects Slack Events API requests at
  `POST /slack/events` — put it behind a public HTTPS URL (e.g. ngrok) in that case.
- The `message` listener ignores `bot_id` / `subtype` messages so the bot never
  reacts to its own replies.
