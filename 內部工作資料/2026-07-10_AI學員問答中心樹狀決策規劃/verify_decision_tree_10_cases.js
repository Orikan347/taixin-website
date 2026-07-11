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

function assertCourseOverview(response, label) {
  assert(response.phase === 'course_overview', `${label} should be course overview`);
  assert(Array.isArray(response.buttons), `${label} course buttons missing`);
  assert(response.buttons.length === 5, `${label} should have five course buttons`);
  assert(new Set(response.buttons).size === 5, `${label} course buttons must be unique`);
  ['流量磁鐵', '成交地圖', '直指人心', '極致效率', '言之有物'].forEach((course) => {
    assert(response.buttons.includes(course), `${label} missing course button ${course}`);
    assert(response.reply.includes(course), `${label} missing course overview ${course}`);
  });
  assert(!/天地人網|MBAF|DISC|YPD|存→記→分→細/.test(response.reply), `${label} overview exposed course detail too early`);
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

  assert(response.phase === 'route_choice', `${student.name} should choose a route after three answers`);
  assert(!response.profile_spec, `${student.name} must not receive a report before choosing the talent route`);
  assert(response.buttons.includes('了解課程介紹'), `${student.name} course-introduction route missing`);
  assert(response.buttons.includes('找出我的銷售天賦'), `${student.name} talent route missing`);

  response = engine.transition(response.state, '找出我的銷售天賦');
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
  assertCourseOverview(contentResponse, `${student.name} course content`);
  assert(!/3,000 萬|破億|36,000|三個月新人第一名|2019 保時捷/.test(contentResponse.reply), `${student.name} course content exposed unconfirmed performance claim`);
  assertCleanText(contentResponse.reply, `${student.name} course content`);

  const courseDetail = engine.transition(contentResponse.state, '成交地圖');
  assert(courseDetail.phase === 'course_detail', `${student.name} course detail phase missing`);
  assert(courseDetail.reply.includes('成交地圖'), `${student.name} selected course missing`);
  assert(!/天地人網|DISC|YPD/.test(courseDetail.reply), `${student.name} course detail dumped other course content`);
  assertButtons(courseDetail, `${student.name} course detail`);
  const detailAnswer = engine.transition(courseDetail.state, 'MBAF 怎麼介紹產品價值？');
  assert(detailAnswer.reply.includes('MBAF'), `${student.name} course detail answer missing MBAF`);
  assert(detailAnswer.reply.includes('客戶得到的利益'), `${student.name} course detail answer missed benefit-first explanation`);
  assertButtons(detailAnswer, `${student.name} course follow-up`);

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

function verifyTreeNodeUniqueness() {
  const rootButtons = [
    '不知道去哪找客戶', '內容發了沒人問', '想建立穩定來源',
    '客戶覺得現在不需要', '客戶不確定有沒有效', '客戶想跟別人比較',
    '他在想價格', '他在想效果', '他在想要問誰',
    '怎麼跟主管說', '怎麼整理價值', '怎麼降低風險',
    '怎麼看懂客戶', '怎麼讓客戶安心', '怎麼問出真話',
    '客戶資料很亂', '常常忘記追蹤', '想用工具省時間',
    '怎麼講得更有感', '怎麼講出差異', '怎麼講給主管聽'
  ];
  const rootReplies = new Set();
  let leafCount = 0;

  rootButtons.forEach((rootButton) => {
    const state = engine.createSession({ name: '樹狀測試', birthdate: '1991-05-03' });
    state.phase = 'explanation';
    const rootResponse = engine.transition(state, rootButton);
    assertButtons(rootResponse, `${rootButton} root`);
    assertCleanText(rootResponse.reply, `${rootButton} root`);
    assert(!rootReplies.has(rootResponse.reply), `${rootButton} reused another root reply`);
    rootReplies.add(rootResponse.reply);

    const childReplies = new Set();
    rootResponse.buttons.slice(0, 3).forEach((childButton) => {
      const leafResponse = engine.transition(rootResponse.state, childButton);
      assertButtons(leafResponse, `${rootButton} -> ${childButton}`);
      assertCleanText(leafResponse.reply, `${rootButton} -> ${childButton}`);
      assert(leafResponse.reply !== rootResponse.reply, `${rootButton} -> ${childButton} repeated root reply`);
      assert(!childReplies.has(leafResponse.reply), `${rootButton} child replies repeat`);
      childReplies.add(leafResponse.reply);
      leafCount += 1;
    });
  });

  assert(rootReplies.size === 21, 'all 21 root button replies must be unique');
  assert(leafCount === 63, 'all 63 second-level replies must exist');
  return { rootNodes: rootReplies.size, leafNodes: leafCount };
}

function verifyCourseDetailTrees() {
  const courseQuestions = {
    '流量磁鐵': ['天地人網怎麼找名單？', '名單找到後怎麼管理？', '沒有名單的人適合嗎？'],
    '成交地圖': ['怎麼問出客戶真正的需求？', 'MBAF 怎麼介紹產品價值？', '客戶拒絕時要怎麼處理？'],
    '直指人心': ['怎麼從互動看出客戶類型？', 'D、I、S、C 要怎麼說？', '怎麼讓客戶更快建立信任？'],
    '極致效率': ['怎麼處理業務員每天很忙？', '客戶資料怎麼整理才不會漏？', '時間碼和行事曆怎麼配合？'],
    '言之有物': ['能量、邏輯、格局是什麼？', '面對不同對象要怎麼說？', '30 秒電梯簡報和 YPD 能幫什麼？']
  };
  const coverage = {};
  Object.entries(courseQuestions).forEach(([courseName, questions]) => {
    const state = engine.createSession({ name: '課程樹測試', birthdate: '1991-05-03' });
    state.phase = 'course_overview';
    const intro = engine.transition(state, courseName);
    assert(intro.phase === 'course_detail', `${courseName} detail phase missing`);
    assertButtons(intro, `${courseName} detail intro`);
    const replies = [];
    let response = intro;
    questions.forEach((question, index) => {
      response = engine.transition(response.state, question);
      assertButtons(response, `${courseName} detail question ${index + 1}`);
      assertCleanText(response.reply, `${courseName} detail question ${index + 1}`);
      assert(!replies.includes(response.reply), `${courseName} repeated detail reply ${index + 1}`);
      assert(new Set(response.buttons).size === response.buttons.length, `${courseName} repeated detail buttons ${index + 1}`);
      replies.push(response.reply);
    });
    coverage[courseName] = { question_count: questions.length, distinct_replies: replies.length };
  });
  return coverage;
}

const results = cases.map(runCase);
const treeCoverage = verifyTreeNodeUniqueness();
const courseTreeCoverage = verifyCourseDetailTrees();

const routeProfile = Object.assign({}, cases[0]);
delete routeProfile.answers;
let routeResponse = engine.start(routeProfile);
cases[0].answers.forEach((answer) => {
  routeResponse = engine.transition(routeResponse.state, answer);
});
assert(routeResponse.phase === 'route_choice', 'three answers must lead to the course-or-talent choice');
assert(!routeResponse.profile_spec, 'route choice must not render a report before the student chooses talent');
assertButtons(routeResponse, 'route choice');
assert(routeResponse.buttons.includes('了解課程介紹'), 'route choice must show course introduction');
assert(routeResponse.buttons.includes('找出我的銷售天賦'), 'route choice must show talent report');

const courseIntro = engine.transition(routeResponse.state, '了解課程介紹');
assertCourseOverview(courseIntro, 'course introduction');
assert(!/3,000 萬|破億|36,000|三個月新人第一名|2019 保時捷/.test(courseIntro.reply), 'course introduction exposed unconfirmed performance claim');
assertCleanText(courseIntro.reply, 'course introduction');

const courseButtons = courseIntro.buttons;
assert(new Set(courseButtons).size === courseButtons.length, 'course introduction buttons must be unique');
const courseDetail = engine.transition(courseIntro.state, '成交地圖');
assert(courseDetail.phase === 'course_detail', 'selected course must open course detail');
assertButtons(courseDetail, 'course detail');
assert(courseDetail.reply.includes('成交地圖'), 'selected course detail missing course name');
assert(!/天地人網|DISC|YPD/.test(courseDetail.reply), 'selected course detail dumped another course');
const courseDetailAnswer = engine.transition(courseDetail.state, 'MBAF 怎麼介紹產品價值？');
assert(courseDetailAnswer.reply.includes('MBAF'), 'course detail answer missing MBAF');
assert(courseDetailAnswer.reply.includes('客戶得到的利益'), 'course detail answer must lead with benefit');
assertButtons(courseDetailAnswer, 'course detail follow-up');

const talentReport = engine.transition(courseIntro.state, '找出我的銷售天賦');
assert(talentReport.profile_spec, 'talent route must render the report from the three collected answers');
assert(talentReport.course_path && talentReport.course_path.length === 3, 'talent route must prepare a three-course path');

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
  tree_coverage: treeCoverage,
  course_tree_coverage: courseTreeCoverage,
  passed: true,
  results
}, null, 2));

console.log(`PASS ${results.length} cases`);
results.forEach((result) => {
  console.log(`${result.name} | ${result.industry} | ${result.disc} | ${result.course_path.join(' > ')}`);
});
