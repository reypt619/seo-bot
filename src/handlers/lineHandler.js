// LINE handler — placeholder for future implementation
// To add LINE support:
// 1. npm install @line/bot-sdk
// 2. Set LINE_CHANNEL_SECRET and LINE_CHANNEL_ACCESS_TOKEN in .env
// 3. Implement handleLineEvent below following the same pattern as telegramHandler.js
// 4. Register POST /webhook/line in src/index.js

const { QUESTIONS, WELCOME_MESSAGE } = require('../questions');
const { getSession, createSession, updateSession, deleteSession } = require('../state/sessionManager');
const { generateSEOCopy } = require('../services/claudeService');
const { saveToNotion } = require('../services/notionService');

/**
 * Handle a LINE webhook event.
 * @param {Object} lineClient - LINE SDK client instance
 * @param {Object} event - LINE webhook event object
 */
async function handleLineEvent(lineClient, event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userId = event.source.userId;
  const replyToken = event.replyToken;
  const text = (event.message.text || '').trim();

  const reply = (msg) =>
    lineClient.replyMessage(replyToken, { type: 'text', text: msg });

  if (text === '重新開始') {
    deleteSession(userId);
    await reply(WELCOME_MESSAGE);
    createSession(userId, 'Line');
    return;
  }

  let session = getSession(userId);

  if (!session) {
    await reply(WELCOME_MESSAGE);
    createSession(userId, 'Line');
    return;
  }

  const currentQuestion = QUESTIONS[session.step];
  if (!currentQuestion) return;

  const updatedAnswers = { ...session.answers, [currentQuestion.key]: text };
  const nextStep = session.step + 1;

  if (nextStep < QUESTIONS.length) {
    updateSession(userId, { step: nextStep, answers: updatedAnswers });
    await reply(QUESTIONS[nextStep].text);
  } else {
    updateSession(userId, { step: nextStep, answers: updatedAnswers });
    await reply('⏳ 文案生成中，請稍候...');

    try {
      const copy = await generateSEOCopy(updatedAnswers);
      await lineClient.pushMessage(userId, { type: 'text', text: copy });
      await saveToNotion({ answers: updatedAnswers, copy, platform: 'Line' });
      await lineClient.pushMessage(userId, {
        type: 'text',
        text: '✅ 資料已儲存，我們會盡快與您聯繫！\n\n如需重新產出文案，請傳送「重新開始」。',
      });
    } catch (err) {
      console.error('LINE handler error:', err);
      await lineClient.pushMessage(userId, {
        type: 'text',
        text: '⚠️ 文案產出時發生錯誤，請傳送「重新開始」再試一次。',
      });
    } finally {
      deleteSession(userId);
    }
  }
}

module.exports = { handleLineEvent };
