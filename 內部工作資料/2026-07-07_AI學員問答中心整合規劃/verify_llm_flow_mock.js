const engine = require('../../lib/state-machine');
const offerings = require('../../data/course-offerings.json');

const scenarios = [
  {
    id: 'TW-I-SALES',
    profile: {
      birthdate: '1990-03-21', region: 'tw', role: 'sales_consultant', industry: '保險',
      disc_hate_sales: 'I', disc_hate_workplace: 'S', disc_hate_customer: 'S',
      problems: ['成交不了'], goals: ['提升成交']
    },
    answers: ['我賣保險，客戶多半是家庭客戶。', '客戶常說太貴，還想考慮。', '我想提升成交。'],
    expectedDisc: 'S'
  },
  {
    id: 'MY-C-LEADER',
    profile: {
      birthdate: '1985-10-08', region: 'my', role: 'leader', industry: '房地產',
      disc_hate_sales: 'C', disc_hate_workplace: 'C', disc_hate_customer: 'C',
      problems: ['帶團隊卡住'], goals: ['複製團隊']
    },
    answers: ['我賣房地產，客戶是換屋族和屋主。', '客戶會問很多細節再比較。', '我想讓團隊照流程成交。'],
    expectedDisc: 'C'
  }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runScenario(scenario) {
  const profile = Object.assign({ course_offerings: offerings }, scenario.profile);
  let response = engine.start(profile);
  scenario.answers.forEach((answer) => {
    response = engine.transition(response.state, answer);
  });
  assert(response.phase === 'route_choice', `${scenario.id}: must stop at route choice after three answers`);
  assert(!response.profile_spec, `${scenario.id}: report must wait for explicit talent choice`);
  assert(response.buttons.includes('了解課程介紹'), `${scenario.id}: course route missing`);
  assert(response.buttons.includes('找出我的銷售天賦'), `${scenario.id}: talent route missing`);
  assert(response.response_strategy.disc_primary === scenario.expectedDisc, `${scenario.id}: DISC mismatch`);

  const courseIntro = engine.transition(response.state, '了解課程介紹');
  assert(courseIntro.phase === 'course_intro', `${scenario.id}: course introduction did not open`);
  assert(courseIntro.reply.includes('流量磁鐵') && courseIntro.reply.includes('言之有物'), `${scenario.id}: five-course benefit overview missing`);

  const priceReply = engine.transition(courseIntro.state, '看開課時間費用');
  assert(priceReply.reply.includes('超級銷冠系統（台灣場）：日期待確認，NT$ 31,000'), `${scenario.id}: Taiwan course details missing`);
  assert(priceReply.reply.includes('超級銷冠系統（吉隆坡場）：10/21-10/23，RM 4,680'), `${scenario.id}: Kuala Lumpur course details missing`);
  assert(priceReply.reply.includes('複訓：一律 NT$ 3,200'), `${scenario.id}: retake price missing`);
  assert(!/名額剩|剩餘名額|限量/.test(priceReply.reply), `${scenario.id}: unconfirmed capacity leaked`);

  const report = engine.transition(response.state, '找出我的銷售天賦');
  assert(report.profile_spec, `${scenario.id}: report missing after talent choice`);
  assert(report.course_path && report.course_path.length === 3, `${scenario.id}: course path missing`);
  assert(/你看完之後，覺得像你嗎/.test(report.reply), `${scenario.id}: report accuracy prompt missing`);
  return `${scenario.id}: PASS`;
}

console.log(['PASS', ...scenarios.map(runScenario)].join('\n'));
