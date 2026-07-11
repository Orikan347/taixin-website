const fs = require('fs');
const path = require('path');
const { chromium } = require('/Users/macminim4/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const baseUrl = process.env.QA_URL || 'http://127.0.0.1:8767/ai-student-qa.html';
const outDir = path.join(__dirname, 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

async function clickText(page, text) {
  await page.getByRole('button', { name: text, exact: true }).last().click();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
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
  ['五連問', '能把模糊的猶豫問成可處理的原因', '不是背話術', '核心問題與成交 365'].forEach((text) => {
    if (!courseAnswer.includes(text)) throw new Error(`course MBAF answer missing: ${text}`);
  });
  if (await page.locator('#coursePath .course-item').count() !== 3) throw new Error('course path disappeared after course detail');
  await page.screenshot({ path: path.join(outDir, 'desktop-flow.png'), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.goto(baseUrl, { waitUntil: 'networkidle' });
  const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  if (mobileOverflow) throw new Error('mobile horizontal overflow');
  await mobile.screenshot({ path: path.join(outDir, 'mobile-initial.png'), fullPage: true });

  if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
  await browser.close();
  console.log(JSON.stringify({ status: 'PASS', greetingCount, courseAnswerLength: courseAnswer.length, screenshots: ['desktop-flow.png', 'mobile-initial.png', 'amy-report.png'] }, null, 2));
}

main().catch((error) => {
  fs.writeFileSync(path.join(__dirname, 'browser-e2e-error.txt'), String(error.stack || error));
  console.error(error.stack || error);
  process.exit(1);
});
