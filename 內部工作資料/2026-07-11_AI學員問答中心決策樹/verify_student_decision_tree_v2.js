const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../../lib/state-machine.js');
const root = path.resolve(__dirname, '..', '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'data/taixin-closing-map.json'), 'utf8'));
engine.configure(map);

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
const courseNames = ['流量磁鐵', '成交地圖', '直指人心', '言之有物', '極致效率'];
courseNames.forEach((courseName, courseIndex) => {
  courseResult = engine.transition(courseResult.state, courseName);
  map.course_nodes.filter((node) => node.course === courseName).forEach((node) => {
    const label = node.ask;
    const detail = engine.transition(courseResult.state, label);
    assert.equal(detail.phase, 'course_detail');
    ['mini_yes', 'benefit', 'advantage', 'feature'].forEach((field) => assert(detail.reply.includes(node.mbaf[field]), `${courseName} ${label} missing MBAF ${field}`));
    assert(!courseReplies.has(detail.reply), `duplicate course reply: ${courseName} / ${label}`);
    courseReplies.set(detail.reply, `${courseName} / ${label}`);
    courseResult = detail;
  });
  courseResult = engine.transition(courseResult.state, '我都清楚了');
  if (courseIndex < courseNames.length - 1) assert.equal(courseResult.phase, 'course_overview');
  else assert.equal(courseResult.phase, 'objection_gate');
});
assert.equal(courseReplies.size, 15, 'all fifteen course answers must be unique');

let objectionResult = reportResults[1];
objectionResult = engine.transition(objectionResult.state, '課程介紹');
courseNames.forEach((courseName) => {
  objectionResult = engine.transition(objectionResult.state, courseName);
  objectionResult = engine.transition(objectionResult.state, '我都清楚了');
});
assert.equal(objectionResult.phase, 'objection_gate');
const objectionReplies = new Set();
map.objections.forEach((node) => {
  const label = node.ask;
  const detail = engine.transition(objectionResult.state, label);
  assert.equal(detail.phase, 'objection_detail');
  assert.equal(detail.buttons.length, 4);
  assert(!objectionReplies.has(detail.reply), `duplicate objection reply: ${label}`);
  objectionReplies.add(detail.reply);
});
assert.equal(objectionReplies.size, 7, 'all seven objections must be unique');

let recommendation = reportResults[2];
recommendation = engine.transition(recommendation.state, '推薦我的課程');
recommendation = engine.transition(recommendation.state, '上班族或家庭客戶');
recommendation = engine.transition(recommendation.state, '他覺得太貴');
recommendation = engine.transition(recommendation.state, '把價值講清楚');
assert(/1\. 《.+》[\s\S]*2\. 《.+》[\s\S]*3\. 《.+》/.test(recommendation.reply), 'recommendation must list all three courses in chat');

console.log(JSON.stringify({ status: 'PASS', students: students.length, course_nodes: courseReplies.size, objection_nodes: objectionReplies.size }, null, 2));
