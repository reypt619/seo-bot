const QUESTIONS = [
  {
    key: 'company',
    text: '【問題 1/6】請問貴公司名稱，以及主要提供什麼產品或服務？',
  },
  {
    key: 'audience',
    text: '【問題 2/6】你們的主要客戶是哪些行業或族群？',
  },
  {
    key: 'advantage',
    text: '【問題 3/6】跟競爭對手相比，你們最大的優勢或特色是什麼？',
  },
  {
    key: 'faq',
    text: '【問題 4/6】客戶最常問你們的問題是什麼？（可以多寫幾個）',
  },
  {
    key: 'keywords',
    text: '【問題 5/6】有沒有想主打的關鍵字或服務項目？',
  },
  {
    key: 'cta',
    text: '【問題 6/6】希望網站訪客最終做什麼動作？（例如：詢問報價、預約諮詢、下載型錄）',
  },
];

const WELCOME_MESSAGE = `👋 您好！歡迎使用 SEO 文案機器人！

我將依序問您 6 個問題，幫助您產出專業的 SEO 網站文案。

✅ 全程約 3 分鐘即可完成
✅ 完成後自動產出完整文案
✅ 資料將儲存至系統供後續服務

隨時輸入「重新開始」可清除紀錄重頭來過。

我們開始吧！

${QUESTIONS[0].text}`;

module.exports = { QUESTIONS, WELCOME_MESSAGE };
