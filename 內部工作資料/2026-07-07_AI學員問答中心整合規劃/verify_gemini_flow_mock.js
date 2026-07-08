const assert = require('assert');
const gemini = require('../../lib/gemini-student-qa');

const context = {
  config: {
    worker_url: 'https://smart-close-api.toleratestar.workers.dev',
    model: 'gemini-2.5-flash',
    timeout_ms: 5000
  },
  salesBrain: require('../../data/taixin-sales-brain.json'),
  quoteSeeds: require('../../data/golden-quote-seeds.json'),
  offerings: require('../../data/course-offerings.json')
};

let callCount = 0;
global.fetch = async (_url, options) => {
  callCount += 1;
  const body = JSON.parse(options.body);
  const prompt = body.contents[0].parts[0].text;
  assert(prompt.includes('BAF'));
  assert(prompt.includes('五連問'));
  assert(prompt.includes('拒絕處理 6 句循環'));
  assert(prompt.includes('能量 × 邏輯 × 格局'));
  assert(prompt.includes('金句'));
  assert(prompt.includes('極致效率'));
  assert(prompt.includes('課程會學到什麼'));
  assert(prompt.includes('銷售力不從心，因為從沒遇過李泰欣。'));
  assert(prompt.includes('smart-close') || body._model);

  const latestMatch = prompt.match(/使用者最新訊息：\n([\s\S]*?)\n\n輸出 JSON/);
  const latestMessage = latestMatch ? latestMatch[1] : '';
  const discoveryMatch = prompt.match(/對話蒐集狀態：\n([\s\S]*?)\n\n目前已確認的學生資訊欄位/);
  const discovery = discoveryMatch ? JSON.parse(discoveryMatch[1]) : { can_build_report: false };
  const payload = latestMessage.trim() === '上班族'
    ? {
        phase: 'discovery',
        reply: '我先抓到你賣的是保健品。那通常會買單的是哪一種客戶？',
        next_question: '',
        profile_spec: null,
        course_path: [],
        cta_ready: false
      }
    : /^(有|有啊|有喔)$/.test(latestMessage.trim()) || /(有準|像我)/.test(latestMessage)
    ? {
        phase: 'recommendation',
        reply: '太好了，這代表你的優勢其實很清楚。接下來照這個學習順序補，你會更快把看懂客戶、追蹤和成交接起來。',
        next_question: '',
        profile_spec: null,
        course_path: [
          { id: 'zhizhi', name: '直指人心', reason: '先看懂客戶與信任建立。' },
          { id: 'chengjiao', name: '成交地圖', reason: '再補五連問、MBAF 與拒絕處理。' }
        ]
      }
    : discovery.can_build_report
      ? {
          phase: 'profile_ready',
          reply: '我把你的銷售現場整理成報告。你適合先用信任打開對話，再用提問找到真正原因。\n\n你看完之後，覺得像你嗎？有準嗎？',
          next_question: '',
          profile_spec: {
            disc_type: 'S',
            life_number: '7',
            sales_advantages: [
              { title: '信任力', insight: '你讓人放下防備。', strategy: '先問出擔心，再說明價值。' },
              { title: '穩定力', insight: '你適合長期互動。', strategy: '把每次接觸留下下一步。' },
              { title: '故事力', insight: '你適合用真實案例說服。', strategy: '用 MBAF 接故事。' }
            ],
            life_talents: [
              { title: '7 號：洞察力', insight: '你能追到真正原因。', strategy: '用提問找出真顧慮。' },
              { title: '提問力', insight: '你適合把表面答案往下追。', strategy: '先讓客戶說出心裡話。' },
              { title: '整合優勢', insight: '你能把感受、需求和方案整理在一起。', strategy: '把對話記錄下來，追蹤會更有方向。' }
            ],
            student_strength: '你很適合用信任與提問打開成交。',
            persuasion_power: '把擔心翻成行動理由。',
            practical_advice: '遇到太貴，先問他是在比較價格還是還沒看見差異。',
            final_quote: '信任到了，成交就近了。'
          },
          course_path: [],
          cta_ready: false
        }
      : {
          phase: 'discovery',
          reply: callCount === 1
            ? '好，我抓到了。你賣的是保險，對象是家庭客戶。我再往下看一點：最近一次沒有成交，對方是怎麼回你的？'
            : '你剛剛提到客戶會猶豫。下一次遇到同樣狀況，你最想讓自己哪個地方更強？',
          next_question: '',
          profile_spec: null,
          course_path: [],
          cta_ready: false
        };

  return {
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [
              { text: JSON.stringify(payload) }
            ]
          }
        }
      ]
    })
  };
};

(async () => {
  let response = await gemini.start({
    birthdate: '1990-03-21',
    name: 'andy',
    email: 'andy@example.com',
    phone: 'LINE-andysales',
    region: 'tw',
    role: 'sales_consultant',
    industry: '保險',
    disc_hate_sales: 'S',
    disc_hate_workplace: 'S',
    disc_hate_customer: 'S',
    problems: ['成交不了，客戶常說再想想'],
    goals: ['提升成交']
  }, context);

  assert.strictEqual(response.reply, '');
  const objection = await gemini.transition(response.state, '看不懂你在講什麼');
  assert(objection.reply.includes('我懂'));
  assert(objection.reply.includes('你指的是哪裡看不懂'));
  assert(objection.reply.includes('這樣有比較清楚嗎'));
  assert(!objection.reply.includes('你最想讓這份報告幫你看見哪一個銷售優勢'));
  response = await gemini.transition(response.state, '我賣保險，客戶多半是家庭客戶。');
  assert(response.reply.includes('最近一次'));
  response = await gemini.transition(response.state, '客戶說太貴，想再考慮看看。');
  assert(!response.profile_spec);
  assert.strictEqual(response.phase, 'discovery');
  assert(response.reply.length > 8);
  response = await gemini.transition(response.state, '我通常會先解釋保障內容，但後續追蹤常常沒有整理好。');
  assert(response.profile_spec);
  assert.strictEqual(response.course_path, null);
  assert(response.profile_spec.sales_advantages.length === 3);
  assert(response.profile_spec.life_talents.length === 3);
  assert(response.profile_spec.life_talents.some((item) => item.title.includes('7')));
  assert(response.profile_spec.final_quote.length <= 30);
  assert(!JSON.stringify(response.profile_spec).includes('[object Object]'));
  assert(!response.reply.includes('我先不急著推薦課程'));
  assert(!response.reply.includes('最大卡點'));
  assert(!response.reply.includes('卡住'));
  assert(response.reply.includes('你看完之後，覺得像你嗎？有準嗎？'));

  const recommended = await gemini.transition(response.state, '有啊');
  assert(recommended.course_path);
  assert.strictEqual(recommended.phase, 'recommendation');
  assert(recommended.cta);

  const shortAnswerEvidence = gemini.analyzeDiscoveryEvidence([
    { role: 'user', content: '保健品' },
    { role: 'assistant', content: '我先抓到你賣的是保健品。那通常會買單的是哪一種客戶？' },
    { role: 'user', content: '上班族' },
    { role: 'assistant', content: '那上班族通常最在意的是效果、價格、信任，還是沒時間了解？' },
    { role: 'user', content: '太貴，也怕沒有效' }
  ], {
    role: 'sales_consultant',
    industry: '保健品',
    problems: [],
    goals: ['提升成交']
  });
  assert.strictEqual(shortAnswerEvidence.slots.product, '保健品');
  assert.strictEqual(shortAnswerEvidence.slots.customer, '上班族');
  assert(shortAnswerEvidence.slots.problem.includes('太貴'));
  assert(shortAnswerEvidence.coverage.product);
  assert(shortAnswerEvidence.coverage.customer);

  const repeatedState = gemini.createSession({
    birthdate: '1991-07-07',
    name: 'amy',
    email: 'amy@example.com',
    phone: 'LINE-amy',
    region: 'tw',
    role: 'sales_consultant',
    industry: '保健品',
    disc_hate_sales: 'I',
    disc_hate_workplace: 'I',
    disc_hate_customer: 'I',
    problems: [],
    goals: ['提升成交']
  }, context);
  repeatedState.messages.push({ role: 'user', content: '保健品' });
  repeatedState.messages.push({ role: 'assistant', content: '我先抓到你賣的是保健品。那通常會買單的是哪一種客戶？' });
  const repeatedResponse = await gemini.transition(repeatedState, '上班族');
  assert(repeatedResponse.reply.includes('保健品'));
  assert(repeatedResponse.reply.includes('上班族'));
  assert(!repeatedResponse.reply.includes('哪一種客戶'));
  console.log('PASS\nGEMINI-PROMPT-INCLUDES-COURSE-BRAIN: PASS\nCOURSE-QA-BOUNDARY: PASS\nDYNAMIC-QUESTIONS: PASS\nSHORT-ANSWER-CONTEXT: PASS\nOBJECTION-RECOVERY: PASS\nTHREE-TALENTS-REPORT: PASS\nPERSONAL-QUOTE: PASS\nAGREEMENT-GATE: PASS');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
