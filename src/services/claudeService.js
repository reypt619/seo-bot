const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

const SYSTEM_PROMPT = `你是一位專業的 B2B SEO 網站文案撰寫師，擅長撰寫能吸引目標客群、提升搜尋排名的中文網站文案。

你的文案風格：
- 清晰、專業、有說服力
- 以客戶痛點出發，強調解決方案
- 自然融入 SEO 關鍵字，不生硬堆砌
- 符合台灣 B2B 市場溝通習慣

輸出格式要求：嚴格按照指定格式輸出，每個區塊用「===區塊名稱===」分隔。`;

function buildUserPrompt(answers) {
  return `請根據以下公司資訊，撰寫完整的 SEO 網站文案：

【公司資訊】
- 公司名稱與服務：${answers.company}
- 目標客群：${answers.audience}
- 核心優勢：${answers.advantage}
- 客戶常見問題：${answers.faq}
- 主打關鍵字：${answers.keywords}
- 期望訪客行動：${answers.cta}

請按照以下格式輸出文案（保留分隔符號）：

===首頁主標題===
（一句話，20字以內，包含主要關鍵字）

===首頁副標題===
（補充說明，30字以內，說明核心價值）

===關於我們===
（約150字，介紹公司背景、使命與核心優勢）

===服務說明1===
小標題：（10字以內）
說明：（約80字，說明服務內容與客戶效益）

===服務說明2===
小標題：（10字以內）
說明：（約80字）

===服務說明3===
小標題：（10字以內）
說明：（約80字）

===SEO Meta Title===
（60字以內，包含主要關鍵字與品牌名）

===SEO Meta Description===
（150字以內，吸引點擊，包含關鍵字與行動呼籲）`;
}

async function generateSEOCopy(answers) {
  const stream = client.messages.stream({
    model: config.anthropic.model,
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(answers),
      },
    ],
  });

  const message = await stream.finalMessage();
  const textBlock = message.content.find((b) => b.type === 'text');
  return textBlock ? textBlock.text : '';
}

module.exports = { generateSEOCopy };
