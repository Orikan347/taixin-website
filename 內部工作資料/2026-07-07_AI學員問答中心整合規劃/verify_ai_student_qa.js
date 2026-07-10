const { chromium } = require('/Users/macminim4/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8766';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function send(page, text) {
  await page.locator('#chatMessage').fill(text);
  await page.locator('#chatMessage').press('Enter');
  await page.waitForFunction(() => !document.querySelector('#chatMessage').disabled);
}

async function fillIntake(page) {
  await page.locator('#name').fill('流程測試');
  await page.locator('#email').fill('flow-test@example.invalid');
  await page.locator('#birthdate').fill('1991-05-03');
  await page.locator('#industry').fill('企業顧問');
  await page.locator('#product').fill('企業銷售顧問服務');
  await page.locator('input[name="disc_hate_sales"][value="C"]').check();
  await page.locator('input[name="disc_hate_workplace"][value="C"]').check();
  await page.locator('input[name="disc_hate_customer"][value="C"]').check();
  await page.locator('input[name="disc_hate_think"][value="C"]').check();
  await page.locator('input[name="problems"][value="產品介紹講不清楚"]').check();
  await page.locator('input[name="goals"][value="提升成交"]').check();
  await page.locator('#consent').check();
  await page.getByRole('button', { name: '開始探索' }).click();
  await page.getByText('我先來認識你現在的銷售現場').waitFor();
  await page.waitForFunction(() => !document.querySelector('#chatMessage').disabled);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route('https://deal-alliance-lead-hub.orikan347.workers.dev/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, lead_id: 'flow-test' }) });
  });
  await page.goto(`${baseUrl}/ai-student-qa.html`, { waitUntil: 'networkidle' });

  await page.getByText('超級銷冠系統（吉隆坡場）', { exact: true }).waitFor();
  await page.getByText('RM 4,680', { exact: true }).waitFor();
  await page.getByText('超級銷冠系統（台灣場）', { exact: true }).waitFor();
  await page.getByText('NT$ 31,000', { exact: true }).waitFor();

  await fillIntake(page);
  await send(page, '我賣企業銷售顧問服務，客戶多半是中小企業老闆。');
  await send(page, '客戶常說想再比較，也會問很多細節。');
  await send(page, '我想把價值講清楚，讓成交更穩。');

  assert(await page.getByRole('button', { name: '了解課程介紹' }).count() === 1, 'course introduction route missing');
  assert(await page.getByRole('button', { name: '找出我的銷售天賦' }).count() === 1, 'talent route missing');
  assert(await page.locator('#profilePanel.is-visible').count() === 0, 'report appeared before talent choice');

  await page.getByRole('button', { name: '了解課程介紹' }).click();
  await page.getByText('流量磁鐵', { exact: true }).waitFor();
  await page.getByText('極致效率', { exact: true }).waitFor();
  await page.getByRole('button', { name: '找出我的銷售天賦' }).click();
  await page.locator('#profilePanel.is-visible').waitFor();
  await page.getByText('你的銷售優點是：').waitFor();
  await page.getByText('你的銷售天賦是：').waitFor();

  await page.getByRole('button', { name: '建議學習路徑', exact: true }).click();
  await page.locator('#coursePanel.is-visible').waitFor();
  const body = await page.locator('body').innerText();
  assert(!body.includes('[object Object]'), 'object serialization appeared');
  assert(!body.includes('<b>'), 'raw HTML tag appeared');
  assert(!body.includes('目標貫通線'), 'invented life-number line appeared');

  await browser.close();
  console.log('PASS\nCOURSE-OFFERINGS-VISIBLE: PASS\nTHREE-QUESTION-ROUTE-CHOICE: PASS\nCOURSE-INTRODUCTION-BRANCH: PASS\nTALENT-REPORT-BRANCH: PASS\nCOURSE-PATH-BUTTON: PASS');
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
