const engine = require('../../lib/state-machine');

const scenarios = [
  {
    id: 'TW-I-SALES',
    profile: {
      birthdate: '1990-03-21',
      region: 'tw',
      role: 'sales_consultant',
      industry: '保險',
      disc_hate_sales: 'I',
      disc_hate_workplace: 'S',
      disc_hate_customer: 'S',
      problems: ['成交不了，客戶常說再想想', '看不懂客戶，信任建立不足'],
      goals: ['提升成交', '建立信任']
    },
    replies: ['我常常跟客戶聊得很好，但最後他說再想想，我會怕太強勢。'],
    expectedBeforeAgreementNoCourse: true,
    expectedCourseAfterAgreement: true
  },
  {
    id: 'MY-LEADER',
    profile: {
      birthdate: '1985-10-08',
      region: 'my',
      role: 'leader',
      industry: '房地產',
      disc_hate_sales: 'C',
      disc_hate_workplace: 'D',
      disc_hate_customer: 'C',
      problems: ['帶團隊和複製經驗卡住', '產品介紹講不清楚'],
      goals: ['複製團隊', '提升成交']
    },
    replies: ['我想讓團隊第一次就聽懂，也希望新人照流程做。'],
    expectedBeforeAgreementNoCourse: true,
    expectedCourseAfterAgreement: true
  },
  {
    id: 'D-TONE',
    profile: {
      birthdate: '1992-01-11',
      region: 'tw',
      role: 'sales_consultant',
      industry: '汽車',
      disc_hate_sales: 'D',
      disc_hate_workplace: 'D',
      disc_hate_customer: 'D',
      problems: ['成交不了，客戶常說再想想'],
      goals: ['提升成交']
    },
    replies: ['我想要快一點知道下一步，直接有效率地成交。'],
    expectedDisc: 'D'
  },
  {
    id: 'C-TONE',
    profile: {
      birthdate: '1991-07-19',
      region: 'tw',
      role: 'sales_consultant',
      industry: 'B2B',
      disc_hate_sales: 'C',
      disc_hate_workplace: 'C',
      disc_hate_customer: 'C',
      problems: ['產品介紹講不清楚'],
      goals: ['提升成交']
    },
    replies: ['我需要架構、流程、數據和證據，不然我不太敢講。'],
    expectedDisc: 'C'
  },
  {
    id: 'HATE-QUESTION-S',
    profile: {
      birthdate: '1993-05-09',
      region: 'tw',
      role: 'sales_consultant',
      industry: '醫美',
      disc_hate_sales: 'S',
      disc_hate_workplace: 'S',
      disc_hate_customer: 'S',
      problems: ['成交不了，客戶常說再想想'],
      goals: ['提升成交']
    },
    replies: ['我最怕破壞關係，所以通常會退一步確認。'],
    expectedDisc: 'S'
  }
];

function runScenario(scenario) {
  let response = engine.start(scenario.profile);
  for (const reply of scenario.replies) {
    response = engine.transition(response.state, reply);
  }
  while (response.phase === 'discovery') {
    const filler = scenario.expectedDisc === 'D'
      ? '我想要快、直接、有效率，有結果就好，不想繞太久。'
      : scenario.expectedDisc === 'C'
        ? '我通常會先看資料、流程、證據，再用結構確認下一步。'
        : '我通常會先觀察，再用提問確認客戶真正卡在哪裡。';
    response = engine.transition(response.state, filler);
  }
  if (scenario.expectedBeforeAgreementNoCourse && response.course_path) {
    throw new Error(`${scenario.id}: course path appeared before agreement`);
  }
  if (!response.profile_spec) {
    throw new Error(`${scenario.id}: profile spec missing`);
  }
  if (!/你覺得有準嗎？像你嗎？/.test(response.reply)) {
    throw new Error(`${scenario.id}: accuracy prompt missing`);
  }
  if (scenario.expectedDisc && response.response_strategy.disc_primary !== scenario.expectedDisc) {
    throw new Error(`${scenario.id}: expected ${scenario.expectedDisc}, got ${response.response_strategy.disc_primary}`);
  }
  if (scenario.expectedCourseAfterAgreement) {
    const recommended = engine.transition(response.state, '很準，像我');
    if (!recommended.course_path || !recommended.cta) {
      throw new Error(`${scenario.id}: course path or CTA missing after agreement`);
    }
  }
  const dateQuestion = engine.transition(response.state, '最近什麼時候開課？多少錢？');
  if (!/複訓費用已確認：一律 NT\$ 3,200/.test(dateQuestion.reply)) {
    throw new Error(`${scenario.id}: confirmed retake price missing`);
  }
  if (!/金額待確認/.test(dateQuestion.reply)) {
    throw new Error(`${scenario.id}: pending price guard missing`);
  }
  if (/名額剩|剩餘名額|限量/.test(dateQuestion.reply)) {
    throw new Error(`${scenario.id}: unconfirmed capacity leaked`);
  }
  return `${scenario.id}: PASS`;
}

const results = scenarios.map(runScenario);
console.log(['PASS', ...results].join('\n'));
