const { Client } = require('@notionhq/client');
const config = require('../config');

const notion = new Client({ auth: config.notion.token });

function parseSection(copy, sectionName) {
  const regex = new RegExp(`===${sectionName}===\\s*([\\s\\S]*?)(?====|$)`);
  const match = copy.match(regex);
  return match ? match[1].trim() : '';
}

function buildNotionBlocks(copy) {
  const blocks = [];

  const sections = [
    { title: '首頁主標題', key: '首頁主標題', level: 1 },
    { title: '首頁副標題', key: '首頁副標題', level: 2 },
    { title: '關於我們', key: '關於我們', level: 2 },
    { title: '服務說明', key: null, level: 2, isServices: true },
    { title: 'SEO Meta Title', key: 'SEO Meta Title', level: 2 },
    { title: 'SEO Meta Description', key: 'SEO Meta Description', level: 2 },
  ];

  // H1: 首頁主標題
  const h1 = parseSection(copy, '首頁主標題');
  if (h1) {
    blocks.push({
      object: 'block',
      type: 'heading_1',
      heading_1: { rich_text: [{ type: 'text', text: { content: h1 } }] },
    });
  }

  // H2: 首頁副標題
  const subtitle = parseSection(copy, '首頁副標題');
  if (subtitle) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: '首頁副標題' } }] },
    });
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: subtitle } }] },
    });
  }

  // 關於我們
  const about = parseSection(copy, '關於我們');
  if (about) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: '關於我們' } }] },
    });
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: about } }] },
    });
  }

  // 服務說明
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '服務說明' } }] },
  });

  for (let i = 1; i <= 3; i++) {
    const service = parseSection(copy, `服務說明${i}`);
    if (service) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: `服務 ${i}` } }],
        },
      });
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: service } }] },
      });
    }
  }

  // SEO
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: 'SEO Meta 資訊' } }] },
  });

  const metaTitle = parseSection(copy, 'SEO Meta Title');
  if (metaTitle) {
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: { rich_text: [{ type: 'text', text: { content: 'Meta Title' } }] },
    });
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: metaTitle } }] },
    });
  }

  const metaDesc = parseSection(copy, 'SEO Meta Description');
  if (metaDesc) {
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: { rich_text: [{ type: 'text', text: { content: 'Meta Description' } }] },
    });
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: metaDesc } }] },
    });
  }

  // Divider + raw copy
  blocks.push({ object: 'block', type: 'divider', divider: {} });
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '完整文案原文' } }] },
  });

  // Notion paragraph has 2000 char limit — split if needed
  const chunks = chunkText(copy, 1900);
  for (const chunk of chunks) {
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: chunk } }] },
    });
  }

  return blocks;
}

function chunkText(text, size) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

function extractCompanyName(companyAnswer) {
  // Use first line or first 30 chars as company name
  const first = companyAnswer.split('\n')[0].trim();
  return first.length > 50 ? first.slice(0, 50) : first;
}

async function saveToNotion({ answers, copy, platform }) {
  const today = new Date().toISOString().split('T')[0];
  const companyName = extractCompanyName(answers.company);
  const pageTitle = `${companyName} — ${today}`;

  const response = await notion.pages.create({
    parent: { database_id: config.notion.databaseId },
    properties: {
      公司名稱: {
        title: [{ text: { content: pageTitle } }],
      },
      主要服務: {
        rich_text: [{ text: { content: answers.company.slice(0, 2000) } }],
      },
      目標客群: {
        rich_text: [{ text: { content: answers.audience.slice(0, 2000) } }],
      },
      核心優勢: {
        rich_text: [{ text: { content: answers.advantage.slice(0, 2000) } }],
      },
      常見問題: {
        rich_text: [{ text: { content: answers.faq.slice(0, 2000) } }],
      },
      主打關鍵字: {
        rich_text: [{ text: { content: answers.keywords.slice(0, 2000) } }],
      },
      期望行動: {
        rich_text: [{ text: { content: answers.cta.slice(0, 2000) } }],
      },
      來源平台: {
        select: { name: platform },
      },
      完成時間: {
        date: { start: new Date().toISOString() },
      },
      文案狀態: {
        select: { name: '已產出' },
      },
    },
    children: buildNotionBlocks(copy),
  });

  return response.id;
}

module.exports = { saveToNotion };
