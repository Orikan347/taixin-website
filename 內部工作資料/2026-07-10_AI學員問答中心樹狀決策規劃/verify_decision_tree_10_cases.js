const fs = require('fs');
const path = require('path');
const engine = require('../../lib/state-machine.js');

const badPatterns = [
  /<b>|<\/b>/i,
  /\[object Object\]/,
  /你先跟我說清楚/,
  /你想把哪一句話/,
  /不是叫你一次全買/,
  /我目前不直接猜/,
  /我先不急著推薦課程/
];

const cases = [
  {
    name: 'amy',
    email: 'amy@example.com',
    birthdate: '1990-04-18',
    region: 'tw',
    role: 'sales_consultant',
    industry: '保健品',
    product: '高單價營養保健方案',
    disc_hate_sales: 'I',
    disc_hate_workplace: 'S',
    disc_hate_customer: 'C',
    disc_hate_think: 'I',
    problems: ['講不清楚價值', '成交不了'],
    goals: ['提升成交', '建立信任'],
    answers: ['我賣保健品，客戶多半是上班族跟家庭客戶', '客戶常說很貴，考慮看看', '我最想提高成交率']
  },
  {
    name: 'brian',
    email: 'brian@example.com',
    birthdate: '1987-11-09',
    region: 'tw',
    role: 'owner',
    industry: '房仲',
    product: '中古屋買賣服務',
    disc_hate_sales: 'D',
    disc_hate_workplace: 'D',
    disc_hate_customer: 'D',
    disc_hate_think: 'D',
    problems: ['很忙沒結果', '帶團隊卡住'],
    goals: ['提升成交', '複製團隊'],
    answers: ['我賣房屋，客戶通常是換屋族和屋主', '客戶會拖很久不決定，說要再看看', '我想把成交和團隊效率變強']
  },
  {
    name: 'cindy',
    email: 'cindy@example.com',
    birthdate: '1993-07-27',
    region: 'tw',
    role: 'sales_consultant',
    industry: '醫美',
    product: '皮膚管理與療程方案',
    disc_hate_sales: 'I',
    disc_hate_workplace: 'I',
    disc_hate_customer: 'S',
    disc_hate_think: 'I',
    problems: ['看不懂客戶', '講不清楚價值'],
    goals: ['建立信任', '提升成交'],
    answers: ['我做醫美療程，客戶多半在意安全和效果', '客戶說怕沒效，也怕被推銷', '我希望信任感更強']
  },
  {
    name: 'david',
    email: 'david@example.com',
    birthdate: '1984-02-14',
    region: 'tw',
    role: 'consultant',
    industry: '企業顧問',
    product: '企業銷售顧問服務',
    disc_hate_sales: 'C',
    disc_hate_workplace: 'C',
    disc_hate_customer: 'C',
    disc_hate_think: 'C',
    problems: ['客戶不夠多', '講不清楚價值'],
    goals: ['增加名單', '建立信任'],
    answers: ['我賣企業顧問服務，客戶是中小企業老闆', '他們會問很多細節，也想跟別家比較', '我想讓價值講得更清楚']
  },
  {
    name: 'eva',
    email: 'eva@example.com',
    birthdate: '1995-09-03',
    region: 'tw',
    role: 'sales_consultant',
    industry: '教育課程',
    product: '兒童英文課程',
    disc_hate_sales: 'S',
    disc_hate_workplace: 'S',
    disc_hate_customer: 'S',
    disc_hate_think: 'S',
    problems: ['看不懂客戶', '成交不了'],
    goals: ['建立信任', '提升成交'],
    answers: ['我賣教育課程，客戶是家長', '家長常說要跟另一半討論', '我想更會問出他真正擔心什麼']
  },
  {
    name: 'frank',
    email: 'frank@example.com',
    birthdate: '1979-12-30',
    region: 'tw',
    role: 'leader',
    industry: '汽車銷售',
    product: '進口車與車貸方案',
    disc_hate_sales: 'D',
    disc_hate_workplace: 'D',
    disc_hate_customer: 'C',
    disc_hate_think: 'D',
    problems: ['成交不了', '帶團隊卡住'],
    goals: ['提升成交', '複製團隊'],
    answers: ['我賣車，客戶有家庭客戶也有企業主', '客戶會一直比價格和贈品', '我想讓團隊講價值不要只殺價']
  },
  {
    name: 'grace',
    email: 'grace@example.com',
    birthdate: '1991-06-21',
    region: 'tw',
    role: 'sales_consultant',
    industry: '金融保險',
    product: '保障規劃與退休金方案',
    disc_hate_sales: 'C',
    disc_hate_workplace: 'S',
    disc_hate_customer: 'C',
    disc_hate_think: 'C',
    problems: ['講不清楚價值', '客戶不夠多'],
    goals: ['建立信任', '增加名單'],
    answers: ['我賣保險和退休規劃，客戶通常很謹慎', '客戶會說先不用，或已經有人服務', '我想把專業講得更容易懂']
  },
  {
    name: 'henry',
    email: 'henry@example.com',
    birthdate: '1988-08-08',
    region: 'tw',
    role: 'owner',
    industry: '健身教練',
    product: '一對一體態管理方案',
    disc_hate_sales: 'I',
    disc_hate_workplace: 'I',
    disc_hate_customer: 'I',
    disc_hate_think: 'I',
    problems: ['客戶不夠多', '很忙沒結果'],
    goals: ['增加名單', '提升成交'],
    answers: ['我賣健身課，客戶是想瘦身和改善體態的人', '客戶說最近忙，怕自己做不到', '我想要穩定名單，也想更有效率追蹤']
  },
  {
    name: 'ivy',
    email: 'ivy@example.com',
    birthdate: '1996-03-15',
    region: 'tw',
    role: 'sales_consultant',
    industry: 'SaaS 軟體',
    product: '企業專案管理系統',
    disc_hate_sales: 'C',
    disc_hate_workplace: 'C',
    disc_hate_customer: 'D',
    disc_hate_think: 'C',
    problems: ['講不清楚價值', '成交不了'],
    goals: ['提升成交', '建立信任'],
    answers: ['我賣企業軟體，客戶是部門主管和老闆', '客戶說要回去評估 ROI', '我想把價值和效益講得更清楚']
  },
  {
    name: 'jason',
    email: 'jason@example.com',
    birthdate: '1982-05-06',
    region: 'my',
    role: 'leader',
    industry: '馬來西亞直銷',
    product: '健康食品與團隊事業機會',
    disc_hate_sales: 'D',
    disc_hate_workplace: 'I',
    disc_hate_customer: 'S',
    disc_hate_think: 'D',
    problems: ['帶團隊卡住', '很忙沒結果'],
    goals: ['複製團隊', '提升成交'],
    answers: ['我在馬來西亞做直銷，客戶和夥伴都有', '很多人有興趣但行動很慢', '我最想讓團隊可以複製成交方法']
  }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertCleanText(text, label) {
  badPatterns.forEach((pattern) => {
    assert(!pattern.test(String(text || '')), `${label} contains bad text: ${pattern}`);
  });
}

function assertButtons(response, label) {
  assert(Array.isArray(response.buttons), `${label} buttons missing`);
  assert(response.buttons.length === 4, `${label} should have 4 buttons`);
  assert(response.buttons.some((button) => /我都清楚/.test(button)), `${label} should include clear button`);
}

function runCase(student) {
  const profile = Object.assign({}, student);
  delete profile.answers;
  let response = engine.start(profile);
  const seenReplies = [];
  assertButtons(response, `${student.name} start`);
  assertCleanText(response.reply, `${student.name} start`);
  seenReplies.push(response.reply);

  student.answers.forEach((answer, index) => {
    response = engine.transition(response.state, answer);
    assertButtons(response, `${student.name} turn ${index + 1}`);
    assertCleanText(response.reply, `${student.name} turn ${index + 1}`);
    if (seenReplies.length) {
      assert(response.reply !== seenReplies[seenReplies.length - 1], `${student.name} repeated previous reply at turn ${index + 1}`);
    }
    seenReplies.push(response.reply);
  });

  response = engine.transition(response.state, '我都清楚了');
  assertCleanText(response.reply, `${student.name} report`);
  assert(response.profile_spec, `${student.name} report missing`);
  assert(response.course_path && response.course_path.length === 3, `${student.name} course path missing`);
  assert(response.profile_spec.sales_advantages.length === 3, `${student.name} sales advantages missing`);
  assert(response.profile_spec.life_talents.length === 3, `${student.name} life talents missing`);
  assert(/你看完之後，覺得像你嗎/.test(response.reply), `${student.name} accuracy prompt missing`);
  assertCleanText(JSON.stringify(response.profile_spec), `${student.name} report json`);

  const courseResponse = engine.transition(response.state, 'yes');
  assert(courseResponse.course_path && courseResponse.course_path.length === 3, `${student.name} yes course path missing`);
  assertCleanText(courseResponse.reply, `${student.name} yes`);

  const contentResponse = engine.transition(courseResponse.state, '這個課程會學什麼');
  assertButtons(contentResponse, `${student.name} course content`);
  assert(/利益點/.test(contentResponse.reply), `${student.name} course content should explain benefits`);
  assertCleanText(contentResponse.reply, `${student.name} course content`);

  return {
    name: student.name,
    industry: student.industry,
    disc: response.profile_spec.disc_type,
    life_number: response.profile_spec.life_number,
    course_path: response.course_path.map((course) => course.name),
    first_reply: seenReplies[0],
    final_reply: response.reply
  };
}

const results = cases.map(runCase);

const officialLineProfile = engine.createSession({
  birthdate: '1991-05-03',
  disc_hate_sales: 'S',
  disc_hate_workplace: 'S',
  disc_hate_customer: 'S',
  disc_hate_think: 'S'
});
const officialLineSpec = engine.buildProfileSpec(officialLineProfile);
assert(officialLineSpec.life_talents[2].title === '事必躬親線', '159 line must use the verified calculator name');
assert(!/目標貫通線/.test(JSON.stringify(officialLineSpec)), 'report must not use invented life-number line names');
assert(!/銷售力不從心，因為從沒遇過李泰欣/.test(officialLineSpec.final_quote), 'report gift quote must help the student instead of repeating the brand slogan');

const expressionReplies = ['怎麼講得更有感', '怎麼講出差異', '怎麼講給主管聽'].map((answer) => {
  const state = engine.createSession({ name: '表達測試', birthdate: '1991-05-03' });
  state.phase = 'explanation';
  return engine.transition(state, answer);
});
assert(new Set(expressionReplies.map((response) => response.reply)).size === 3, 'expression buttons must have three distinct replies');
expressionReplies.forEach((response, index) => {
  assertButtons(response, `expression detail ${index + 1}`);
  assertCleanText(response.reply, `expression detail ${index + 1}`);
});

const outputPath = path.join(__dirname, '10-case-verification-result.json');
fs.writeFileSync(outputPath, JSON.stringify({
  generated_at: new Date().toISOString(),
  case_count: results.length,
  passed: true,
  results
}, null, 2));

console.log(`PASS ${results.length} cases`);
results.forEach((result) => {
  console.log(`${result.name} | ${result.industry} | ${result.disc} | ${result.course_path.join(' > ')}`);
});
