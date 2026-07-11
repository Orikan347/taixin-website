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
assert(Array.isArray(map.proof_cards) && map.proof_cards.length >= 10, '必須有至少十張公開證據卡');
assert(map.public_copy_rules, '缺少學生可見文案規則');

for (const node of map.course_nodes) {
  assert(node.mbaf, `${node.id} 缺少 MBAF`);
  for (const field of ['mini_yes', 'benefit', 'advantage', 'feature']) assert(node.mbaf[field], `${node.id} 缺少 MBAF.${field}`);
  assert(node.responses, `${node.id} 缺少四型回覆`);
  for (const disc of ['D', 'I', 'S', 'C']) assert(node.responses[disc], `${node.id} 缺少 ${disc} 回覆`);
  assert(Array.isArray(node.buttons) && node.buttons.length === 4, `${node.id} 必須有三個問題與我都清楚了`);
}

for (const node of map.objections) {
  assert(Array.isArray(node.response_protocol) && node.response_protocol.length === 6, `${node.id} 必須有拒絕處理六步驟`);
  assert(node.responses, `${node.id} 缺少四型回覆`);
  for (const disc of ['D', 'I', 'S', 'C']) assert(node.responses[disc], `${node.id} 缺少 ${disc} 回覆`);
  assert(Array.isArray(node.buttons) && node.buttons.length === 4, `${node.id} 必須有三個追問與我都清楚了`);
  assert(Array.isArray(node.follow_responses) && node.follow_responses.length === 3, `${node.id} 必須有三個追問的完整回答`);
  for (const followup of node.follow_responses) {
    assert(followup.six_steps, `${node.id}/${followup.label} 缺少六步驟內容`);
    for (const field of ['understand', 'clarify', 'source', 'mbaf', 'confirm', 'next_actions']) assert(followup.six_steps[field], `${node.id}/${followup.label} 缺少六步驟.${field}`);
    for (const field of ['mini_yes', 'benefit', 'advantage', 'feature']) assert(followup.six_steps.mbaf[field], `${node.id}/${followup.label} 缺少 MBAF.${field}`);
    for (const disc of ['D', 'I', 'S', 'C']) assert(followup.responses && followup.responses[disc], `${node.id}/${followup.label} 缺少 ${disc} 回覆`);
    assert(Array.isArray(followup.proof_card_ids), `${node.id}/${followup.label} 缺少證據卡欄位`);
  }
}

const lines = ['# 成交地圖資料庫｜逐句展開版', '', `資料庫版本：${map.schema_version}`, ''];
lines.push('## 全站固定對話', '');
Object.entries(map.dialogue || {}).forEach(([id, text]) => lines.push(`### ${id}`, text, ''));
lines.push('## 公開證據卡', '');
for (const card of map.proof_cards || []) {
  lines.push(`### ${card.title}`, `- 證據代號：\`${card.id}\``, `- 學生可見文字：${card.public_text}`, `- 正式來源：${card.source}`, `- 使用情境：${(card.use_when || []).join('、')}`, '');
}
for (const node of map.course_nodes) {
  lines.push(`## ${node.course}｜${node.ask}`, '', `- 節點：\`${node.id}\``, `- 來源：${node.source}`, '', '### MBAF', `- 接住：${node.mbaf.mini_yes}`, `- 學生得到的好處：${node.mbaf.benefit}`, `- 泰欣老師的優勢：${node.mbaf.advantage}`, `- 課堂會帶他的內容：${node.mbaf.feature}`, '');
  for (const disc of ['D', 'I', 'S', 'C']) lines.push(`### ${disc} 型完整回答`, node.responses[disc], '');
  lines.push('### 按鈕與下一題');
  node.buttons.forEach((button) => lines.push(`- ${button.label} -> \`${button.next}\``));
  lines.push('');
}
for (const node of map.objections) {
  lines.push(`## 疑慮｜${node.ask}`, '', `- 節點：\`${node.id}\``, `- 信任證據：${node.evidence || '依情境提供'}`, `- 處理順序：${(node.response_protocol || []).join(' -> ')}`, '');
  for (const disc of ['D', 'I', 'S', 'C']) lines.push(`### ${disc} 型完整回答`, node.responses[disc], '');
  lines.push('### 按鈕與下一題');
  node.buttons.forEach((button) => lines.push(`- ${button.label} -> \`${button.next}\``));
  for (const followup of node.follow_responses || []) {
    const steps = followup.six_steps || {};
    lines.push('', `### 追問｜${followup.label}`, '', '#### 六步驟規格', `1. 理解：${steps.understand || ''}`, `2. 確認：${steps.clarify || ''}`, `3. 原因：${steps.source || ''}`, `4. MBAF：${steps.mbaf ? `${steps.mbaf.mini_yes}／${steps.mbaf.benefit}／${steps.mbaf.advantage}／${steps.mbaf.feature}` : ''}`, `5. 確認是否解除：${steps.confirm || ''}`, `6. 下一步：${(steps.next_actions || []).join('／')}`, '');
    lines.push(`- 使用證據卡：${(followup.proof_card_ids || []).map((id) => `\`${id}\``).join('、') || '無需證據卡'}`, '');
    for (const disc of ['D', 'I', 'S', 'C']) lines.push(`#### ${disc} 型完整回答`, followup.responses[disc], '');
  }
  lines.push('');
}

fs.writeFileSync(outputPath, `${JSON.stringify(map, null, 2)}\n`);
fs.writeFileSync(expandedPath, `${lines.join('\n')}\n`);
console.log(`成交地圖資料庫已產生：${outputPath}`);
