const fs = require('fs');
const path = require('path');

const workDir = __dirname;
const sourcePath = path.join(workDir, '成交地圖資料庫.md');
const outputPath = path.resolve(workDir, '..', '..', 'data', 'taixin-closing-map.json');
const expandedPath = path.join(workDir, '成交地圖資料庫_逐句展開.md');
const source = fs.readFileSync(sourcePath, 'utf8');
const match = source.match(/<!-- CLOSING_MAP_JSON_START -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- CLOSING_MAP_JSON_END -->/);

if (!match) throw new Error('找不到成交地圖資料區。');
const map = JSON.parse(match[1]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(map.schema_version, '缺少 schema_version');
assert(Array.isArray(map.course_nodes) && map.course_nodes.length === 15, '必須有五堂課共 15 個課程節點');
assert(Array.isArray(map.objections) && map.objections.length === 7, '必須有七種學生疑慮');

for (const node of map.course_nodes) {
  assert(node.mbaf, `${node.id} 缺少 MBAF`);
  for (const field of ['mini_yes', 'benefit', 'advantage', 'feature']) assert(node.mbaf[field], `${node.id} 缺少 MBAF.${field}`);
  assert(node.responses, `${node.id} 缺少四型回覆`);
  for (const disc of ['D', 'I', 'S', 'C']) assert(node.responses[disc], `${node.id} 缺少 ${disc} 回覆`);
  assert(Array.isArray(node.buttons) && node.buttons.length === 4, `${node.id} 必須有三個問題與我都清楚了`);
}

for (const node of map.objections) {
  assert(node.responses, `${node.id} 缺少四型回覆`);
  for (const disc of ['D', 'I', 'S', 'C']) assert(node.responses[disc], `${node.id} 缺少 ${disc} 回覆`);
  assert(Array.isArray(node.buttons) && node.buttons.length === 4, `${node.id} 必須有三個追問與我都清楚了`);
  assert(Array.isArray(node.follow_responses) && node.follow_responses.length === 3, `${node.id} 必須有三個追問的完整回答`);
  for (const followup of node.follow_responses) {
    for (const disc of ['D', 'I', 'S', 'C']) assert(followup.responses && followup.responses[disc], `${node.id}/${followup.label} 缺少 ${disc} 回覆`);
  }
}

const lines = ['# 成交地圖資料庫｜逐句展開版', '', `資料庫版本：${map.schema_version}`, ''];
lines.push('## 全站固定對話', '');
Object.entries(map.dialogue || {}).forEach(([id, text]) => lines.push(`### ${id}`, text, ''));
for (const node of map.course_nodes) {
  lines.push(`## ${node.course}｜${node.ask}`, '', `- 節點：\`${node.id}\``, `- 來源：${node.source}`, '', '### MBAF', `- 接住：${node.mbaf.mini_yes}`, `- 學生得到的好處：${node.mbaf.benefit}`, `- 泰欣老師的優勢：${node.mbaf.advantage}`, `- 課堂會帶他的內容：${node.mbaf.feature}`, '');
  for (const disc of ['D', 'I', 'S', 'C']) lines.push(`### ${disc} 型完整回答`, node.responses[disc], '');
  lines.push('### 按鈕與下一題');
  node.buttons.forEach((button) => lines.push(`- ${button.label} -> \`${button.next}\``));
  lines.push('');
}
for (const node of map.objections) {
  lines.push(`## 疑慮｜${node.ask}`, '', `- 節點：\`${node.id}\``, `- 信任證據：${node.evidence || '依情境提供'}`, '');
  for (const disc of ['D', 'I', 'S', 'C']) lines.push(`### ${disc} 型完整回答`, node.responses[disc], '');
  lines.push('### 按鈕與下一題');
  node.buttons.forEach((button) => lines.push(`- ${button.label} -> \`${button.next}\``));
  for (const followup of node.follow_responses || []) {
    lines.push('', `### 追問｜${followup.label}`);
    for (const disc of ['D', 'I', 'S', 'C']) lines.push(`#### ${disc} 型完整回答`, followup.responses[disc], '');
  }
  lines.push('');
}

fs.writeFileSync(outputPath, `${JSON.stringify(map, null, 2)}\n`);
fs.writeFileSync(expandedPath, `${lines.join('\n')}\n`);
console.log(`成交地圖資料庫已產生：${outputPath}`);
