require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const { handleTelegramMessage } = require('./handlers/telegramHandler');

// Validate required env vars
const required = ['TELEGRAM_BOT_TOKEN', 'ANTHROPIC_API_KEY', 'NOTION_TOKEN', 'NOTION_DATABASE_ID', 'WEBHOOK_URL'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
app.use(express.json());

// Health check
app.get('/', (req, res) => res.send('SEO Bot is running ✅'));

// Initialize Telegram bot (no polling — webhook mode)
const bot = new TelegramBot(config.telegram.token);

// Telegram webhook endpoint
app.post('/webhook/telegram', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Register message handler
bot.on('message', (msg) => handleTelegramMessage(bot, msg));

// Handle polling errors (shouldn't happen in webhook mode)
bot.on('polling_error', (err) => console.error('Telegram polling error:', err));

// Start server, then set webhook
const PORT = config.server.port;
app.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);
  try {
    const webhookUrl = `${config.server.webhookUrl}/webhook/telegram`;
    await bot.setWebHook(webhookUrl);
    console.log(`Telegram webhook set: ${webhookUrl}`);
  } catch (err) {
    console.error('Failed to set Telegram webhook:', err.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  process.exit(0);
});
