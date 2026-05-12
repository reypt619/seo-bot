# SEO 文案機器人

Telegram 機器人，自動收集公司資訊、呼叫 Claude AI 產出 SEO 網站文案，並上傳至 Notion。

## 功能

- 依序詢問 6 個問題（約 3 分鐘完成）
- 呼叫 Claude AI 自動產出 SEO 網站文案
- 文案包含：H1/H2、關於我們、3 項服務說明、Meta Title / Description
- 自動將資料與文案存入 Notion Database
- 架構預留 Line 擴充介面（`src/handlers/lineHandler.js`）

---

## 快速開始

### 1. 申請 Telegram Bot（BotFather）

1. 在 Telegram 搜尋 `@BotFather`，發送 `/newbot`
2. 輸入機器人名稱（顯示名）及 username（需以 `bot` 結尾）
3. 取得 **Bot Token**，格式如：`123456789:ABCdefGHI...`
4. 填入 `.env` 的 `TELEGRAM_BOT_TOKEN`

### 2. 申請 Anthropic API Key

1. 前往 [console.anthropic.com](https://console.anthropic.com)
2. 登入後至 **API Keys** → **Create Key**
3. 複製 Key，填入 `.env` 的 `ANTHROPIC_API_KEY`

### 3. 建立 Notion Integration 與 Database

#### 3a. 建立 Integration

1. 前往 [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. 點擊 **+ New integration**，填入名稱（如：SEO Bot）
3. 選擇工作區，點擊 **Submit**
4. 複製 **Internal Integration Token**（`secret_...`），填入 `.env` 的 `NOTION_TOKEN`

#### 3b. 建立 Database

在 Notion 建立新的 Full Page Database，並新增以下欄位（**欄位名稱需完全相同**）：

| 欄位名稱 | 類型 |
|---------|------|
| 公司名稱 | Title（預設） |
| 主要服務 | Text |
| 目標客群 | Text |
| 核心優勢 | Text |
| 常見問題 | Text |
| 主打關鍵字 | Text |
| 期望行動 | Text |
| 來源平台 | Select（選項：Telegram、Line） |
| 完成時間 | Date |
| 文案狀態 | Select（選項：已產出） |

#### 3c. 取得 Database ID

從 Database 頁面 URL 複製 ID：
```
https://www.notion.so/your-workspace/[DATABASE_ID]?v=...
```
填入 `.env` 的 `NOTION_DATABASE_ID`

#### 3d. 連接 Integration

在 Database 頁面右上角 → **...** → **Connections** → 選擇你的 Integration

### 4. 本地開發

```bash
# 複製設定檔
cp .env.example .env
# 填寫所有環境變數後：

npm install
npm run dev
```

本地開發可使用 [ngrok](https://ngrok.com) 建立公開 URL：
```bash
ngrok http 3000
# 將 https://xxxx.ngrok.io 填入 WEBHOOK_URL
```

### 5. 部署至 Render.com

1. Push 專案到 GitHub
2. 至 [render.com](https://render.com) → **New Web Service** → 連接 GitHub repo
3. 設定：
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. 在 **Environment** 頁填入所有環境變數
5. 部署完成後，複製服務 URL（如：`https://seo-bot.onrender.com`）
6. 填入 `WEBHOOK_URL`，**重新部署**一次（讓 Telegram webhook 正確設定）

---

## 環境變數說明

| 變數 | 說明 |
|-----|------|
| `TELEGRAM_BOT_TOKEN` | Telegram BotFather 提供的 Token |
| `ANTHROPIC_API_KEY` | Anthropic 控制台的 API Key |
| `NOTION_TOKEN` | Notion Integration Token（`secret_...`） |
| `NOTION_DATABASE_ID` | Notion Database 的 ID（32位字串） |
| `PORT` | 伺服器 Port，預設 3000（Render 自動設定） |
| `WEBHOOK_URL` | 公開 URL，如 `https://your-app.onrender.com` |

---

## 擴充 Line 支援

1. 安裝 SDK：`npm install @line/bot-sdk`
2. 在 `.env` 新增：
   ```
   LINE_CHANNEL_SECRET=your_line_channel_secret
   LINE_CHANNEL_ACCESS_TOKEN=your_line_access_token
   ```
3. 在 `src/index.js` 新增：
   ```js
   const line = require('@line/bot-sdk');
   const { handleLineEvent } = require('./handlers/lineHandler');

   const lineConfig = {
     channelSecret: process.env.LINE_CHANNEL_SECRET,
     channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
   };
   const lineClient = new line.Client(lineConfig);

   app.post('/webhook/line', line.middleware(lineConfig), (req, res) => {
     req.body.events.forEach(event => handleLineEvent(lineClient, event));
     res.sendStatus(200);
   });
   ```
4. 在 Line Developers Console 設定 Webhook URL：`https://your-app.onrender.com/webhook/line`

---

## 專案結構

```
seo-bot/
├── src/
│   ├── index.js              # Express 伺服器、Telegram webhook
│   ├── config.js             # 環境變數集中管理
│   ├── questions.js          # 問題清單與歡迎訊息
│   ├── state/
│   │   └── sessionManager.js # In-memory 對話狀態
│   ├── services/
│   │   ├── claudeService.js  # Anthropic SDK 呼叫
│   │   └── notionService.js  # Notion API 整合
│   └── handlers/
│       ├── telegramHandler.js # Telegram 訊息處理
│       └── lineHandler.js     # Line 擴充介面（預留）
├── .env.example
├── package.json
└── README.md
```
