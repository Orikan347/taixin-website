const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'data/taixin-closing-map.json'), 'utf8'));
const failures = [];
const normalize = (value) => String(value || '').replace(/\s+/g, '').replace(/[，。！？、：]/g, '');

function requireValue(value, label) {
  if (!value) failures.push(`${label} 缺少內容`);
}

requireValue(map.map_name, '地圖名稱');
if (!Array.isArray(map.talent_line && map.talent_line.nodes) || map.talent_line.nodes.length !== 3) failures.push('DISC 天賦線必須有三題');
(map.talent_line && map.talent_line.nodes || []).forEach((node) => {
  if (Object.keys(node.options || {}).length !== 4) failures.push(`${node.id} 必須有四個 DISC 選項`);
});

if (!Array.isArray(map.course_nodes) || map.course_nodes.length !== 15) failures.push('課程介紹必須剛好有 15 個節點');
const courseNames = new Set(['流量磁鐵', '成交地圖', '直指人心', '言之有物', '極致效率']);
courseNames.forEach((course) => {
  const nodes = map.course_nodes.filter((node) => node.course === course);
  if (nodes.length !== 3) failures.push(`${course} 必須有三個學生問題`);
  const answers = nodes.map((node) => normalize(node.base_answer));
  if (new Set(answers).size !== answers.length) failures.push(`${course} 的不同按鈕回覆重複`);
  nodes.forEach((node) => ['id', 'ask', 'base_answer', 'source'].forEach((field) => requireValue(node[field], `${course}/${node.id}/${field}`)));
});

if (!Array.isArray(map.objections) || map.objections.length !== 7) failures.push('疑慮區必須有七種公開疑慮');
(map.objections || []).forEach((node) => {
  if (!Array.isArray(node.follow) || node.follow.length !== 3) failures.push(`${node.id} 必須有三個追問按鈕`);
  ['D', 'I', 'S', 'C'].forEach((disc) => requireValue(node.reply_by_disc && node.reply_by_disc[disc], `${node.id}/${disc} 回覆`));
  const variants = Object.values(node.reply_by_disc || {}).map(normalize);
  if (new Set(variants).size !== variants.length) failures.push(`${node.id} 的四型回覆重複`);
});

if (failures.length) {
  console.error('closing-map FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`closing-map PASS: 3 DISC questions, ${map.course_nodes.length} course nodes, ${map.objections.length} objection nodes, and no duplicate sibling content.`);
