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
  assert(prompt.includes('smart-close') || body._model);

  const payload = prompt.includes('很像我')
    ? {
        phase: 'recommendation',
        reply: '我會建議你先把看懂客戶放在第一步，再補成交流程，最後放大表達。',
        next_question: '',
        profile_spec: null,
        course_path: [
          { id: 'zhizhi', name: '直指人心', reason: '先看懂客戶與信任建立。' },
          { id: 'chengjiao', name: '成交地圖', reason: '再補五連問、MBAF 與拒絕處理。' }
        ]
      }
    : callCount >= 3
      ? {
          phase: 'profile_ready',
          reply: '我把你的銷售現場整理成報告。你適合先用信任打開對話，再用提問找到真正原因。\n\n你覺得這份描述像你嗎？',
          next_question: '',
          profile_spec: {
            disc_type: 'S',
            life_number: '7',
            sales_talents: [
              { title: '信任力', insight: '你讓人放下防備。', strategy: '先問出擔心，再說明價值。' },
              { title: '穩定力', insight: '你適合長期互動。', strategy: '把每次接觸留下下一步。' },
              { title: '故事力', insight: '你適合用真實案例說服。', strategy: '用 MBAF 接故事。' }
            ],
            sales_rhythm: '先信任，再提問，最後推進。',
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
            ? '你先跟我說一下，你現在主要賣什麼？客戶通常是哪一種人？'
            : '你剛剛提到客戶會猶豫。最近一次卡住的情境是什麼？',
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
    region: 'tw',
    role: 'sales_consultant',
    industry: '保險',
    disc_hate_sales: 'S',
    disc_hate_workplace: 'S',
    disc_hate_customer: 'S',
    problems: ['成交不了，客戶常說再想想'],
    goals: ['提升成交']
  }, context);

  assert(response.reply.includes('主要賣什麼'));
  response = await gemini.transition(response.state, '我賣保險，客戶多半是家庭客戶。');
  assert(response.reply.includes('最近一次'));
  response = await gemini.transition(response.state, '客戶說太貴，想再考慮看看。');
  assert(response.profile_spec);
  assert.strictEqual(response.course_path, null);
  assert(response.profile_spec.sales_talents.length === 3);
  assert(response.profile_spec.final_quote.length <= 30);
  assert(!response.reply.includes('我先不急著推薦課程'));
  assert(!response.reply.includes('最大卡點'));

  const recommended = await gemini.transition(response.state, '很像我');
  assert(recommended.course_path);
  assert(recommended.cta);
  console.log('PASS\nGEMINI-PROMPT-INCLUDES-COURSE-BRAIN: PASS\nDYNAMIC-QUESTIONS: PASS\nTHREE-TALENTS-REPORT: PASS\nPERSONAL-QUOTE: PASS\nAGREEMENT-GATE: PASS');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
