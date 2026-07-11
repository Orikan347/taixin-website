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
if (!Array.isArray(map.proof_cards) || map.proof_cards.length < 10) failures.push('公開證據卡不足十張');
const proofCards = new Map((map.proof_cards || []).map((card) => [card.id, card]));
for (const card of proofCards.values()) {
  ['id', 'title', 'public_text', 'source'].forEach((field) => requireValue(card[field], `證據卡/${card.id}/${field}`));
}
const bannedPublicCopy = (map.public_copy_rules && map.public_copy_rules.banned) || [];
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
const expectedProtocol = ['理解顧慮', '確認真正問題', '找出顧慮來源', '用 MBAF 回應', '確認是否已解決', '提供下一步'];
(map.objections || []).forEach((node) => {
  if (JSON.stringify(node.response_protocol) !== JSON.stringify(expectedProtocol)) failures.push(`${node.id} 的拒絕處理六步驟不完整`);
  if (!Array.isArray(node.follow) || node.follow.length !== 3) failures.push(`${node.id} 必須有三個追問按鈕`);
  ['D', 'I', 'S', 'C'].forEach((disc) => requireValue(node.responses && node.responses[disc], `${node.id}/${disc} 回覆`));
  const variants = Object.values(node.responses || {}).map(normalize);
  if (new Set(variants).size !== variants.length) failures.push(`${node.id} 的四型回覆重複`);
  if (!Array.isArray(node.follow_responses) || node.follow_responses.length !== 3) failures.push(`${node.id} 必須有三個追問完整回答`);
  (node.follow_responses || []).forEach((follow) => {
    const steps = follow.six_steps || {};
    ['understand', 'clarify', 'source', 'mbaf', 'confirm', 'next_actions'].forEach((field) => requireValue(steps[field], `${node.id}/${follow.label}/六步驟.${field}`));
    ['mini_yes', 'benefit', 'advantage', 'feature'].forEach((field) => requireValue(steps.mbaf && steps.mbaf[field], `${node.id}/${follow.label}/MBAF.${field}`));
    ['D', 'I', 'S', 'C'].forEach((disc) => {
      const response = follow.responses && follow.responses[disc];
      requireValue(response, `${node.id}/${follow.label}/${disc} 回覆`);
      if (/流量磁鐵.{0,16}(第一步|先上)|第一步.{0,16}流量磁鐵/.test(response || '')) failures.push(`${node.id}/${follow.label}/${disc} 不可固定推流量磁鐵`);
      if (!String(response || '').split(/\n\s*\n/)[0].includes(follow.label)) failures.push(`${node.id}/${follow.label}/${disc} 第一段必須直接承接上一顆按鈕`);
      bannedPublicCopy.forEach((phrase) => {
        if (String(response || '').includes(phrase)) failures.push(`${node.id}/${follow.label}/${disc} 含禁用公版句：${phrase}`);
      });
    });
    if (!Array.isArray(follow.proof_card_ids)) failures.push(`${node.id}/${follow.label} 缺少證據卡清單`);
    (follow.proof_card_ids || []).forEach((id) => {
      const card = proofCards.get(id);
      if (!card) failures.push(`${node.id}/${follow.label} 引用不存在的證據卡：${id}`);
      else if (!Object.values(follow.responses || {}).every((response) => String(response).includes(card.public_text))) failures.push(`${node.id}/${follow.label} 沒有把證據卡文字直接說給學生`);
    });
    if (follow.label === '我想先看退費保障') {
      ['refund-policy', 'refund-record'].forEach((id) => {
        if (!(follow.proof_card_ids || []).includes(id)) failures.push(`${node.id}/${follow.label} 缺少 ${id}`);
      });
      Object.values(follow.responses || {}).forEach((response) => {
        ['第一堂課', '無條件全額退費', '無效、無解、無理由'].forEach((required) => {
          if (!String(response).includes(required)) failures.push(`${node.id}/${follow.label} 必須明確說明：${required}`);
        });
      });
    }
    if (follow.label === '我想先看成功案例') {
      ['map-rookie', 'human-premium'].forEach((id) => {
        if (!(follow.proof_card_ids || []).includes(id)) failures.push(`${node.id}/${follow.label} 缺少真實成果：${id}`);
      });
    }
    if (!/1\./.test(follow.responses && follow.responses.C || '')) failures.push(`${node.id}/${follow.label}/C 型必須有條列比較`);
    const values = Object.values(follow.responses || {}).map(normalize);
    if (new Set(values).size !== values.length) failures.push(`${node.id}/${follow.label} 的四型回答重複`);
  });
});

if (failures.length) {
  console.error('closing-map FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`closing-map PASS: 3 DISC questions, ${map.course_nodes.length} course nodes, ${map.objections.length} objection nodes, and no duplicate sibling content.`);
