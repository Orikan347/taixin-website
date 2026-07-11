const assert = require('assert');
const engine = require('../../lib/state-machine.js');

const students = [
  ['Amy', '保健品業務', ['成交不了', '講不清楚價值']],
  ['Brian', '房仲主管', ['很忙沒結果', '帶團隊需要方法']],
  ['Cindy', '醫美顧問', ['看不懂客戶']],
  ['David', '企業顧問', ['客戶不夠多']],
  ['Eva', '教育課程業務', ['成交不了']],
  ['Frank', '汽車銷售主管', ['成交不了', '帶團隊需要方法']],
  ['Grace', '保險顧問', ['講不清楚價值']],
  ['Henry', '健身教練', ['客戶不夠多', '很忙沒結果']],
  ['Ivy', 'SaaS 業務', ['成交不了']],
  ['Jason', '直銷團隊帶領者', ['帶團隊需要方法', '很忙沒結果']]
];

function profile(name, industry, problems) {
  return { name, email: `${name}@example.com`, birthdate: '1990-04-18', region: 'tw', role: 'sales_consultant', industry, product: '測試服務', problems, consent: true };
}

function finishTalent(p) {
  let result = engine.start(p);
  result = engine.transition(result.state, result.buttons[0]);
  result = engine.transition(result.state, result.buttons[1]);
  result = engine.transition(result.state, result.buttons[2]);
  assert.equal(result.phase, 'report_ready');
  assert.equal(result.profile_spec.sales_advantages.length, 3);
  assert.equal(result.profile_spec.life_talents.length, 3);
  assert.equal(result.profile_spec.improvement_points.length, 3);
  return result;
}

const reportResults = students.map(([name, industry, problems]) => finishTalent(profile(name, industry, problems)));

const courseReplies = new Map();
let courseResult = reportResults[0];
courseResult = engine.transition(courseResult.state, '課程介紹');
Object.keys(engine.COURSE_TREE).forEach((courseId, courseIndex, courseIds) => {
  const courseName = engine.COURSE_TREE[courseId].name;
  courseResult = engine.transition(courseResult.state, courseName);
  engine.COURSE_TREE[courseId].questions.forEach(([label]) => {
    const detail = engine.transition(courseResult.state, label);
    assert.equal(detail.phase, 'course_detail');
    assert(detail.reply.includes(label) || detail.reply.length > 80, `${courseName} ${label} response too short`);
    assert(!courseReplies.has(detail.reply), `duplicate course reply: ${courseName} / ${label}`);
    courseReplies.set(detail.reply, `${courseName} / ${label}`);
    courseResult = detail;
  });
  courseResult = engine.transition(courseResult.state, '我都清楚了');
  if (courseIndex < courseIds.length - 1) assert.equal(courseResult.phase, 'course_overview');
  else assert.equal(courseResult.phase, 'objection_gate');
});
assert.equal(courseReplies.size, 15, 'all fifteen course answers must be unique');

let objectionResult = reportResults[1];
objectionResult = engine.transition(objectionResult.state, '課程介紹');
Object.keys(engine.COURSE_TREE).forEach((id) => {
  objectionResult = engine.transition(objectionResult.state, engine.COURSE_TREE[id].name);
  objectionResult = engine.transition(objectionResult.state, '我都清楚了');
});
assert.equal(objectionResult.phase, 'objection_gate');
const objectionReplies = new Set();
Object.keys(engine.OBJECTIONS).forEach((label) => {
  const detail = engine.transition(objectionResult.state, label);
  assert.equal(detail.phase, 'objection_detail');
  assert.equal(detail.buttons.length, 4);
  assert(!objectionReplies.has(detail.reply), `duplicate objection reply: ${label}`);
  objectionReplies.add(detail.reply);
});
assert.equal(objectionReplies.size, 7, 'all seven objections must be unique');

console.log(JSON.stringify({ status: 'PASS', students: students.length, course_nodes: courseReplies.size, objection_nodes: objectionReplies.size }, null, 2));
