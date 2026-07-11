const assert = require('assert');
const gemini = require('../../lib/gemini-student-qa');
const offerings = require('../../data/course-offerings.json');

(async () => {
  const profile = {
    birthdate: '1991-07-07', name: 'amy', email: 'amy@example.com', phone: 'LINE-amy',
    region: 'tw', role: 'sales_consultant', industry: '教育課程', product: '商業技能課程',
    disc_hate_sales: 'I', disc_hate_workplace: 'I', disc_hate_customer: 'I', disc_hate_think: 'I',
    problems: ['講不清楚價值'], goals: ['提升成交'], course_offerings: offerings
  };

  let response = await gemini.start(profile);
  assert(response.reply.includes('你現在主要賣什麼'));
  response = await gemini.transition(response.state, '我賣教育課程，客戶通常是上班族。');
  assert(response.reply.includes('最近一次客戶沒有往前走'));
  response = await gemini.transition(response.state, '客戶覺得太貴，也會說再想想。');
  assert(response.reply.includes('最想讓自己哪個地方變強'));
  response = await gemini.transition(response.state, '我想把價值講清楚，成交也更穩。');
  assert.strictEqual(response.phase, 'route_choice');
  assert.strictEqual(response.profile_spec, null);
  assert(response.buttons.includes('了解課程介紹'));
  assert(response.buttons.includes('找出我的銷售天賦'));

  const courseIntro = await gemini.transition(response.state, '了解課程介紹');
  assert.strictEqual(courseIntro.phase, 'course_overview');
  assert.strictEqual(courseIntro.buttons.length, 5);
  ['流量磁鐵', '成交地圖', '直指人心', '極致效率', '言之有物'].forEach((term) => {
    assert(courseIntro.reply.includes(term), `course intro missing ${term}`);
  });
  assert(!/天地人網|MBAF|DISC|YPD|存→記→分→細/.test(courseIntro.reply));
  assert(!/3,000 萬|破億|36,000|三個月新人第一名/.test(courseIntro.reply));

  const courseDetail = await gemini.transition(courseIntro.state, '成交地圖');
  assert.strictEqual(courseDetail.phase, 'course_detail');
  assert(courseDetail.reply.includes('成交地圖'));
  assert(!/天地人網|DISC|YPD/.test(courseDetail.reply));
  assert.strictEqual(courseDetail.buttons.length, 4);
  const mbaAnswer = await gemini.transition(courseDetail.state, 'MBAF 怎麼介紹產品價值？');
  assert(mbaAnswer.reply.includes('MBAF'));
  assert(mbaAnswer.reply.includes('客戶得到的利益'));
  assert(mbaAnswer.buttons.length === 4);

  const report = await gemini.transition(courseDetail.state, '找出我的銷售天賦');
  assert(report.profile_spec);
  assert.strictEqual(report.profile_spec.sales_advantages.length, 3);
  assert.strictEqual(report.profile_spec.life_talents.length, 3);
  assert(!JSON.stringify(report.profile_spec).includes('[object Object]'));

  const recommended = await gemini.transition(report.state, 'yes');
  assert.strictEqual(recommended.phase, 'recommendation');
  assert(recommended.course_path && recommended.course_path.length === 3);
  console.log('PASS\nADAPTER-THREE-QUESTION-ROUTE-CHOICE: PASS\nADAPTER-COURSE-INTRODUCTION: PASS\nADAPTER-TALENT-REPORT: PASS\nADAPTER-RECOMMENDATION: PASS');
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
