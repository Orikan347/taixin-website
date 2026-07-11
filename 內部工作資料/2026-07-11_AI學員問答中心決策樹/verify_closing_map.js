const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const sourcePath = path.join(__dirname, '成交地圖資料庫.md');
const map = JSON.parse(fs.readFileSync(path.join(root, 'data/taixin-closing-map.json'), 'utf8'));
const failures = [];
const normalize = (value) => String(value || '').replace(/\s+/g, '').replace(/[，。！？、：]/g, '');

function requireValue(value, label) {
  if (!value) failures.push(`${label} 缺少內容`);
}

const source = fs.readFileSync(sourcePath, 'utf8');
const sourceMatch = source.match(/<!-- CLOSING_MAP_JSON_START -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- CLOSING_MAP_JSON_END -->/);
if (!sourceMatch) failures.push('成交地圖資料庫.md 缺少內容資料區');
else if (JSON.stringify(JSON.parse(sourceMatch[1])) !== JSON.stringify(map)) failures.push('網站 JSON 與成交地圖資料庫.md 不一致，必須先跑 build_closing_map_database.js');

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
  const answers = nodes.map((node) => normalize(node.responses && node.responses.D));
  if (new Set(answers).size !== answers.length) failures.push(`${course} 的不同按鈕回覆重複`);
  nodes.forEach((node) => {
    ['id', 'ask', 'source'].forEach((field) => requireValue(node[field], `${course}/${node.id}/${field}`));
    ['mini_yes', 'benefit', 'advantage', 'feature'].forEach((field) => requireValue(node.mbaf && node.mbaf[field], `${course}/${node.id}/MBAF.${field}`));
    if (!/[？?]/.test(node.mbaf && node.mbaf.mini_yes)) failures.push(`${course}/${node.id} 的 Mini Yes 必須是學生能回答的問題`);
    ['D', 'I', 'S', 'C'].forEach((disc) => {
      const response = node.responses && node.responses[disc];
      requireValue(response, `${course}/${node.id}/${disc} 回覆`);
      const paragraphs = String(response || '').split(/\n\s*\n/);
      if (!paragraphs[0] || !paragraphs[0].includes(node.mbaf.mini_yes)) failures.push(`${course}/${node.id}/${disc} 第一段必須先說 Mini Yes`);
      if (!paragraphs[1] || !paragraphs[1].includes(node.mbaf.benefit)) failures.push(`${course}/${node.id}/${disc} 第二段必須先說學完的利益點`);
    });
    if (!Array.isArray(node.buttons) || node.buttons.length !== 4) failures.push(`${course}/${node.id} 必須有四個按鈕`);
    const clear = (node.buttons || []).find((button) => button.label === '我都清楚了');
    if (!clear || clear.next !== 'course-next-step') failures.push(`${course}/${node.id} 的我都清楚了必須進入單堂課下一步`);
  });
});

['course_next_step', 'course_next_confirmation'].forEach((key) => requireValue(map.dialogue && map.dialogue[key], `dialogue.${key}`));

if (!Array.isArray(map.objections) || map.objections.length !== 7) failures.push('疑慮區必須有七種公開疑慮');
(map.objections || []).forEach((node) => {
  if (!Array.isArray(node.follow) || node.follow.length !== 3) failures.push(`${node.id} 必須有三個追問按鈕`);
  ['D', 'I', 'S', 'C'].forEach((disc) => requireValue(node.responses && node.responses[disc], `${node.id}/${disc} 回覆`));
  const variants = Object.values(node.responses || {}).map(normalize);
  if (new Set(variants).size !== variants.length) failures.push(`${node.id} 的四型回覆重複`);
  if (!Array.isArray(node.follow_responses) || node.follow_responses.length !== 3) failures.push(`${node.id} 必須有三個追問完整回答`);
  (node.follow_responses || []).forEach((follow) => ['D', 'I', 'S', 'C'].forEach((disc) => requireValue(follow.responses && follow.responses[disc], `${node.id}/${follow.label}/${disc} 回覆`)));
});

if (failures.length) {
  console.error('closing-map FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`closing-map PASS: 3 DISC questions, ${map.course_nodes.length} course nodes, ${map.objections.length} objection nodes, and no duplicate sibling content.`);
