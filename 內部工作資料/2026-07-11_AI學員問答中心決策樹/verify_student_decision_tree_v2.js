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

function finishTalentAsDisc(p, discIndex) {
  let result = engine.start(p);
  result = engine.transition(result.state, result.buttons[discIndex]);
  result = engine.transition(result.state, result.buttons[discIndex]);
  result = engine.transition(result.state, result.buttons[discIndex]);
  assert.equal(result.phase, 'report_ready');
  return result;
}

const reportResults = students.map(([name, industry, problems]) => finishTalent(profile(name, industry, problems)));

const courseReplies = new Map();
const courseNames = ['流量磁鐵', '成交地圖', '直指人心', '言之有物', '極致效率'];
courseNames.forEach((courseName) => {
  let courseResult = engine.transition(reportResults[0].state, '課程介紹');
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
  assert.equal(courseResult.phase, 'course_next_step');
  assert.deepEqual(courseResult.buttons, ['我要報名課程', '找教育顧問聊一聊', '我還有一個疑慮', '看看其他課程']);
});
assert.equal(courseReplies.size, 15, 'all fifteen course answers must be unique');

const objectionReplies = new Set();
const objectionFollowReplies = new Set();
['D', 'I', 'S', 'C'].forEach((disc, discIndex) => {
  map.objections.forEach((node) => {
    let objectionResult = finishTalentAsDisc(profile(`${disc}-${node.key}`, '測試產業', ['成交不了']), discIndex);
    objectionResult = engine.transition(objectionResult.state, '課程介紹');
    objectionResult = engine.transition(objectionResult.state, '成交地圖');
    objectionResult = engine.transition(objectionResult.state, '我都清楚了');
    objectionResult = engine.transition(objectionResult.state, '我還有一個疑慮');
    assert.equal(objectionResult.phase, 'objection_gate');
    const detail = engine.transition(objectionResult.state, node.ask);
    assert.equal(detail.phase, 'objection_detail');
    assert.equal(detail.response_strategy.primary_disc, disc);
    assert(!/流量磁鐵.{0,16}(第一步|先上)|第一步.{0,16}流量磁鐵/.test(detail.reply), `${disc}/${node.key} fixed-course leakage`);
    assert(!objectionReplies.has(detail.reply), `duplicate objection reply: ${disc}/${node.key}`);
    objectionReplies.add(detail.reply);
    node.follow.forEach((label) => {
      const follow = engine.transition(detail.state, label);
      assert.equal(follow.phase, 'objection_detail');
      assert.deepEqual(follow.buttons, ['這樣有回答我的問題', '我還有一個疑慮', '課程介紹', '依我的情況推薦課程']);
      assert(!/流量磁鐵.{0,16}(第一步|先上)|第一步.{0,16}流量磁鐵/.test(follow.reply), `${disc}/${node.key}/${label} fixed-course leakage`);
      if (disc === 'C') assert(/1\./.test(follow.reply), `${node.key}/${label} C response must be structured`);
      assert(!objectionFollowReplies.has(follow.reply), `duplicate objection follow reply: ${disc}/${node.key}/${label}`);
      objectionFollowReplies.add(follow.reply);
    });
  });
});
assert.equal(objectionReplies.size, 28, 'all 7 objections x 4 DISC answers must be unique');
assert.equal(objectionFollowReplies.size, 84, 'all 7 objections x 3 followups x 4 DISC answers must be unique');

let recommendation = reportResults[2];
recommendation = engine.transition(recommendation.state, '推薦我的課程');
recommendation = engine.transition(recommendation.state, '上班族或家庭客戶');
recommendation = engine.transition(recommendation.state, '他覺得太貴');
recommendation = engine.transition(recommendation.state, '把價值講清楚');
assert(/1\. 《.+》[\s\S]*2\. 《.+》[\s\S]*3\. 《.+》/.test(recommendation.reply), 'recommendation must list all three courses in chat');

console.log(JSON.stringify({ status: 'PASS', students: students.length, course_nodes: courseReplies.size, objection_nodes: objectionReplies.size, objection_followups: objectionFollowReplies.size }, null, 2));
