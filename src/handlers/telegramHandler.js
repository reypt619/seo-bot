const { QUESTIONS, WELCOME_MESSAGE } = require('../questions');
const { getSession, createSession, updateSession, deleteSession } = require('../state/sessionManager');
const { generateSEOCopy } = require('../services/claudeService');
const { saveToNotion } = require('../services/notionService');

async function handleTelegramMessage(bot, msg) {
  const userId = msg.chat.id;
  const text = (msg.text || '').trim();

  // Reset command
  if (text === '重新開始' || text === '/start') {
    deleteSession(userId);
    await bot.sendMessage(userId, WELCOME_MESSAGE);
    createSession(userId, 'Telegram');
    return;
  }

  let session = getSession(userId);

  // New user
  if (!session) {
    await bot.sendMessage(userId, WELCOME_MESSAGE);
    createSession(userId, 'Telegram');
    return;
  }

  // Collect answer for current step
  const currentQuestion = QUESTIONS[session.step];
  if (!currentQuestion) return;

  const updatedAnswers = { ...session.answers, [currentQuestion.key]: text };
  const nextStep = session.step + 1;

  if (nextStep < QUESTIONS.length) {
    // Move to next question
    updateSession(userId, { step: nextStep, answers: updatedAnswers });
    await bot.sendMessage(userId, QUESTIONS[nextStep].text);
  } else {
    // All questions answered — generate copy
    updateSession(userId, { step: nextStep, answers: updatedAnswers });
    await bot.sendMessage(userId, '⏳ 文案生成中，請稍候...');

    try {
      const copy = await generateSEOCopy(updatedAnswers);
      await bot.sendMessage(userId, copy);

      if (process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID) {
        try {
          await saveToNotion({ answers: updatedAnswers, copy, platform: 'Telegram' });
          await bot.sendMessage(userId, '✅ 文案已產出並儲存至 Notion！\n\n如需重新產出，請輸入「重新開始」。');
        } catch (notionErr) {
          console.error('Notion save failed:', notionErr.message);
          await bot.sendMessage(userId, '✅ 文案已產出！\n\n如需重新產出，請輸入「重新開始」。');
        }
      } else {
        await bot.sendMessage(userId, '✅ 文案已產出！\n\n如需重新產出，請輸入「重新開始」。');
      }
    } catch (err) {
      console.error('Error generating copy:', err);
      await bot.sendMessage(
        userId,
        '⚠️ 文案產出時發生錯誤，請輸入「重新開始」再試一次，或聯繫我們的團隊。'
      );
    } finally {
      deleteSession(userId);
    }
  }
}

module.exports = { handleTelegramMessage };
