const fs = require('fs');
const path = require('path');
const { chromium } = require('/Users/macminim4/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const baseUrl = process.env.QA_URL || 'http://127.0.0.1:8767/ai-student-qa.html';
const outDir = path.join(__dirname, 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

async function clickText(page, text) {
  await page.getByRole('button', { name: text, exact: true }).last().click();
}

async function completeTalentAndOpenObjection(page, { name, email, industry, product, choices, objection }) {
  await page.locator('#name').fill(name);
  await page.locator('#email').fill(email);
  await page.locator('#birthdate').fill('1990-04-18');
  await page.locator('#industry').fill(industry);
  await page.locator('#product').fill(product);
  await page.locator('input[name="problems"]').nth(1).check();
  await page.locator('#consent').check();
  await page.locator('#intakeForm button[type="submit"]').click();
  for (const choice of choices) await clickText(page, choice);
  await clickText(page, '課程介紹');
  await clickText(page, '成交地圖');
  await clickText(page, '我都清楚了');
  await clickText(page, '我還有一個疑慮');
  await clickText(page, objection);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    window.__openedUrls = [];
    window.open = (url) => { window.__openedUrls.push(String(url)); return null; };
  });
  const taiwanSuperSales = await page.locator('.offering-row', { hasText: '超級銷冠系統（台灣場）' }).textContent();
  const klSuperSales = await page.locator('.offering-row', { hasText: '超級銷冠系統（吉隆坡場）' }).textContent();
  if (/09:00|18:00/.test(taiwanSuperSales) || /09:00|18:00/.test(klSuperSales)) throw new Error('unconfirmed super sales time is visible');
  if (!/10\/16[\s\S]*10\/18[\s\S]*NT\$\s*31,000/.test(taiwanSuperSales)) throw new Error(`Taiwan super sales date or price missing: ${taiwanSuperSales}`);
  if (!/10\/21[\s\S]*10\/23[\s\S]*RM\s*4,680/.test(klSuperSales)) throw new Error(`Kuala Lumpur super sales date or price missing: ${klSuperSales}`);

  await page.locator('#name').fill('Amy');
  await page.locator('#email').fill('amy@example.com');
  await page.locator('#birthdate').fill('1990-04-18');
  await page.locator('#industry').fill('保健品');
  await page.locator('#product').fill('高單價營養保健方案');
  await page.locator('input[name="problems"]').nth(1).check();
  await page.locator('#consent').check();
  await page.locator('#intakeForm button[type="submit"]').click();
  await page.getByText('Amy，你好！我先幫你把現在的銷售狀況抓出來。').waitFor();
  const greetingCount = await page.getByText('Amy，你好！我先幫你把現在的銷售狀況抓出來。').count();
  if (greetingCount !== 1) throw new Error(`expected one greeting, got ${greetingCount}`);

  await clickText(page, '事情一直拖，卻沒有結論');
  await clickText(page, '先把互動拉回來，讓氣氛不要冷掉');
  await clickText(page, '你讓人安心，願意慢慢說真話');
  await page.getByText('你的銷售天賦報告').last().waitFor();
  if (!(await page.getByText('建議補強的點').count())) throw new Error('improvement section missing');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#downloadReportButton').click();
  const download = await downloadPromise;
  await download.saveAs(path.join(outDir, 'amy-report.png'));

  await clickText(page, '推薦我的課程');
  await clickText(page, '上班族或家庭客戶');
  await clickText(page, '他覺得太貴');
  await clickText(page, '把價值講清楚');
  const recommendationBubble = await page.locator('.message.bot').last().textContent();
  if (!/1\. 《.+》[\s\S]*2\. 《.+》[\s\S]*3\. 《.+》/.test(recommendationBubble)) throw new Error('recommendation bubble does not list three courses');
  await page.getByText('建議學習順序').last().waitFor();

  await page.getByRole('button', { name: '課程介紹', exact: true }).last().click();
  await clickText(page, '成交地圖');
  await clickText(page, '客戶說「再想想」，我到底要怎麼接？');
  const courseAnswer = await page.locator('.message.bot').last().textContent();
  ['客戶說「再想想」時，你是不是也想知道他真正還在想什麼？', '你學會之後，你能把模糊的猶豫問成可處理的原因', '不是背話術', '核心問題與成交 365'].forEach((text) => {
    if (!courseAnswer.includes(text)) throw new Error(`course MBAF answer missing: ${text}`);
  });
  if (await page.locator('#coursePath .course-item').count() !== 3) throw new Error('course path disappeared after course detail');
  await clickText(page, '我都清楚了');
  const nextStep = await page.locator('.message.bot').last().textContent();
  if (!nextStep.includes('這一堂課你已經看懂它能怎麼幫你了')) throw new Error('single-course next-step message missing');
  for (const label of ['我要報名課程', '找教育顧問聊一聊', '我還有一個疑慮', '看看其他課程']) {
    if (!await page.getByRole('button', { name: label, exact: true }).count()) throw new Error(`single-course CTA missing: ${label}`);
  }
  await clickText(page, '我要報名課程');
  const openedUrls = await page.evaluate(() => window.__openedUrls);
  if (!openedUrls.some((url) => url.includes('docs.google.com/forms/'))) throw new Error('single-course signup CTA did not open the official form');
  await clickText(page, '我還有一個疑慮');
  if (!(await page.getByText('真的要做決定前，如果心裡還卡著一件事').count())) throw new Error('objection gate missing after single-course CTA');
  await clickText(page, '我覺得自己看書、看影片就好了');
  const selfStudyGate = await page.locator('.message.bot').last().textContent();
  if (/流量磁鐵.{0,16}(第一步|先上)|第一步.{0,16}流量磁鐵/.test(selfStudyGate)) throw new Error('objection gate forced a fixed course');
  await clickText(page, '我想知道跟自學差在哪');
  const selfStudyAnswer = await page.locator('.message.bot').last().textContent();
  if (!selfStudyAnswer.includes('遇到客戶說太貴或再想想時')) throw new Error('self-study six-step answer missing');
  if (/流量磁鐵.{0,16}(第一步|先上)|第一步.{0,16}流量磁鐵/.test(selfStudyAnswer)) throw new Error('self-study answer forced a fixed course');
  for (const label of ['這樣有回答我的問題', '我還有一個疑慮', '課程介紹', '依我的情況推薦課程']) {
    if (!await page.getByRole('button', { name: label, exact: true }).count()) throw new Error(`objection resolution CTA missing: ${label}`);
  }
  await page.screenshot({ path: path.join(outDir, 'desktop-flow.png'), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.goto(baseUrl, { waitUntil: 'networkidle' });
  const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  if (mobileOverflow) throw new Error('mobile horizontal overflow');
  await mobile.screenshot({ path: path.join(outDir, 'mobile-initial.png'), fullPage: true });

  const analytical = await browser.newPage({ viewport: { width: 1280, height: 960 } });
  await analytical.goto(baseUrl, { waitUntil: 'networkidle' });
  await analytical.locator('#name').fill('Chris');
  await analytical.locator('#email').fill('chris@example.com');
  await analytical.locator('#birthdate').fill('1990-04-18');
  await analytical.locator('#industry').fill('B2B SaaS');
  await analytical.locator('#product').fill('企業訂閱服務');
  await analytical.locator('input[name="problems"]').nth(1).check();
  await analytical.locator('#consent').check();
  await analytical.locator('#intakeForm button[type="submit"]').click();
  await clickText(analytical, '資料不完整，大家卻憑感覺亂講');
  await clickText(analytical, '先補資料、確認細節，再判斷');
  await clickText(analytical, '你很可靠，事情交給你比較放心');
  await clickText(analytical, '課程介紹');
  await clickText(analytical, '成交地圖');
  await clickText(analytical, '我都清楚了');
  await clickText(analytical, '我還有一個疑慮');
  await clickText(analytical, '我覺得自己看書、看影片就好了');
  await clickText(analytical, '我想知道跟自學差在哪');
  const analyticalAnswer = await analytical.locator('.message.bot').last().textContent();
  if (!/1\.[\s\S]*2\.[\s\S]*3\./.test(analyticalAnswer)) throw new Error('C-style objection answer is not structured');
  if (/流量磁鐵.{0,16}(第一步|先上)|第一步.{0,16}流量磁鐵/.test(analyticalAnswer)) throw new Error('C-style objection answer forced a fixed course');

  const refund = await browser.newPage({ viewport: { width: 1280, height: 960 } });
  await refund.goto(baseUrl, { waitUntil: 'networkidle' });
  await completeTalentAndOpenObjection(refund, {
    name: 'Rita', email: 'rita@example.com', industry: '房仲', product: '高單價房產服務',
    choices: ['被逼很快做決定，關係變得有壓力', '先穩住關係，不想讓對方有壓力', '你讓人安心，願意慢慢說真話'],
    objection: '我覺得課程還是太貴了'
  });
  await clickText(refund, '我想先看退費保障');
  const refundAnswer = await refund.locator('.message.bot').last().textContent();
  ['我想先看退費保障', '第一堂課', '無條件全額退費', '無效、無解、無理由', '目前零退費紀錄'].forEach((text) => {
    if (!refundAnswer.includes(text)) throw new Error(`refund answer missing: ${text}`);
  });

  const cases = await browser.newPage({ viewport: { width: 1280, height: 960 } });
  await cases.goto(baseUrl, { waitUntil: 'networkidle' });
  await completeTalentAndOpenObjection(cases, {
    name: 'Casey', email: 'casey@example.com', industry: '醫美顧問', product: '高價療程',
    choices: ['氣氛很冷，對方完全沒有反應', '先把互動拉回來，讓氣氛不要冷掉', '你很會帶氣氛，讓人想跟你聊'],
    objection: '我怕自己學不會，最後還是做不出成果'
  });
  await clickText(cases, '我想先看成功案例');
  const casesAnswer = await cases.locator('.message.bot').last().textContent();
  ['我想先看成功案例', '保險業張小姐', '三個月衝上新人第一名', '保險業林先生', '實收保費直接破億'].forEach((text) => {
    if (!casesAnswer.includes(text)) throw new Error(`case answer missing: ${text}`);
  });

  const manager = await browser.newPage({ viewport: { width: 1280, height: 960 } });
  await manager.goto(baseUrl, { waitUntil: 'networkidle' });
  await completeTalentAndOpenObjection(manager, {
    name: 'Derek', email: 'derek@example.com', industry: 'B2B SaaS', product: '企業訂閱服務',
    choices: ['事情一直拖，卻沒有結論', '直接把問題問清楚，趕快推進', '你會把事情往前推，不喜歡拖'],
    objection: '我需要先跟主管或家人討論'
  });
  await clickText(manager, '我想知道怎麼跟主管說');
  const managerAnswer = await manager.locator('.message.bot').last().textContent();
  ['我想知道怎麼跟主管說', '主管，我現在最常卡在', '第一堂沒收穫可全額退費', '超過 300 堂課'].forEach((text) => {
    if (!managerAnswer.includes(text)) throw new Error(`manager answer missing: ${text}`);
  });

  if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
  await browser.close();
  console.log(JSON.stringify({ status: 'PASS', greetingCount, courseAnswerLength: courseAnswer.length, analyticalAnswerLength: analyticalAnswer.length, refundAnswerLength: refundAnswer.length, casesAnswerLength: casesAnswer.length, managerAnswerLength: managerAnswer.length, screenshots: ['desktop-flow.png', 'mobile-initial.png', 'amy-report.png'] }, null, 2));
}

main().catch((error) => {
  fs.writeFileSync(path.join(__dirname, 'browser-e2e-error.txt'), String(error.stack || error));
  console.error(error.stack || error);
  process.exit(1);
});
