const { chromium } = require('/Users/macminim4/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8765';

async function fillIntake(page, options = {}) {
  await page.locator('#name').fill(options.name || 'andy');
  await page.locator('#email').fill(options.email || 'andy@example.com');
  await page.locator('#phone').fill(options.phone || 'LINE-andysales');
  await page.locator('#birthdate').fill(options.birthdate || '1990-03-21');
  await page.locator('#region').selectOption(options.region || 'tw');
  await page.locator('#role').selectOption(options.role || 'sales_consultant');
  await page.locator('#industry').fill(options.industry || '保險');
  await page.getByLabel(new RegExp(options.hateSales || '對話很冷')).check();
  await page.getByLabel(new RegExp(options.hateWorkplace || '愛衝突')).check();
  await page.getByLabel(new RegExp(options.hateCustomer || '破壞關係')).check();
  for (const label of options.problems || ['成交不了', '看不懂客戶', '客戶追蹤常常漏掉']) {
    await page.getByLabel(new RegExp(label)).check();
  }
  for (const label of options.goals || ['提升成交', '建立信任', '讓每天工作更有效率']) {
    await page.getByLabel(new RegExp(label)).check();
  }
  await page.locator('#consent').check();
  await page.getByRole('button', { name: '開始探索' }).click();
  await page.getByText('我是泰欣，我先幫你看一下你的銷售狀況').waitFor();
  await page.waitForFunction(() => !document.querySelector('#chatMessage').disabled);
}

async function mockGemini(page) {
  let count = 0;
  await page.route('https://smart-close-api.toleratestar.workers.dev/**', async (route) => {
    count += 1;
    const body = route.request().postDataJSON();
    const prompt = body.contents[0].parts[0].text;
    if (!prompt.includes('BAF') || !prompt.includes('五連問') || !prompt.includes('極致效率')) {
      throw new Error('prompt missing Taixin course brain');
    }
    const latestMatch = prompt.match(/使用者最新訊息：\n([\s\S]*?)\n\n輸出 JSON/);
    const latestMessage = latestMatch ? latestMatch[1] : '';
    const discoveryMatch = prompt.match(/對話蒐集狀態：\n([\s\S]*?)\n\n目前已確認的學生資訊欄位/);
    const discovery = discoveryMatch ? JSON.parse(discoveryMatch[1]) : { can_build_report: false };
    const slots = discovery.slots || {};
    const asksOffering = /開課|多少錢|複訓|價格|課程學什麼|會學到什麼/.test(latestMessage);
    const agreed = /(有準|很準|像我|有像)/.test(latestMessage);
    const payload = asksOffering
      ? {
          phase: 'discovery',
          reply: '我先講你的優勢。你很適合用信任打開客戶，只是現在追蹤和下一步需要整理得更清楚。這堂課會讓你得到三個好處：1. 更知道客戶重視什麼。2. 更會把價值講成對方聽得懂的好處。3. 更能把追蹤變成方法。複訓費用是 NT$ 3,200；吉隆坡場日期已確認，金額由顧問依最新公告回覆。',
          next_question: '',
          profile_spec: null,
          course_path: [],
          cta_ready: false
        }
      : agreed
        ? {
            phase: 'recommendation',
            reply: '太好了，這代表你的優勢其實很清楚。接下來照這個學習順序補，你會更快把信任、追蹤和成交接起來。',
            next_question: '',
            profile_spec: null,
            course_path: [
              { id: 'zhizhi', name: '直指人心', reason: '<b>先看懂客戶真正重視什麼</b>，信任會比較快建立起來。' },
              { id: 'xiaolu', name: '極致效率', reason: '把客戶資料、追蹤和每天要做的事整理成方法，不再漏掉機會。' },
              { id: 'chengjiao', name: '成交地圖', reason: '再把五連問、MBAF 和拒絕處理接成一套成交流程。' }
            ],
            cta_ready: true
          }
        : discovery.can_build_report
          ? {
              phase: 'profile_ready',
              reply: 'andy，我聽到你說客戶覺得高價服務很貴，這確實是很多專業人士會遇到的挑戰。這通常不是服務本身沒有價值，而是客戶還沒看見那份值得。我現在已經掌握到你的產業、客戶和遇到的狀況，我幫你整理成一份可以帶走的銷售天賦報告。\n\n你看完之後，覺得像你嗎？有準嗎？',
              next_question: '',
              profile_spec: {
                disc_type: 'S 偏 I',
                life_number: '7',
                sales_advantages: [
                  { title: '<b>你容易建立安全感</b>', insight: '你不會急著壓客戶做決定，對方比較敢說真話。', strategy: '先問出真正擔心，再進入價值說明。' },
                  { title: '你適合長期信任型成交', insight: '你不靠硬推，而是靠一次一次互動累積信任。', strategy: '每次互動都留下一個清楚下一步。' },
                  { title: '你會照顧客戶感受', insight: '你能注意到客戶的不安，這會讓對方覺得你懂他。', strategy: '先接住情緒，再處理價格或方案。' }
                ],
                life_talents: [
                  { title: '7 號：洞察力', insight: '你會想知道客戶猶豫背後真正的原因。', strategy: '用提問找出他是怕買錯、怕預算，還是還沒看見差異。' },
                  { title: '提問力', insight: '你適合把表面答案往下追，找出真正的購買理由。', strategy: '不要急著解釋，先讓客戶把心裡話說出來。' },
                  { title: '整合優勢', insight: '你能把客戶感受、需求和方案整理在一起。', strategy: '把每次對話記錄下來，下一次追蹤會更有方向。' }
                ],
                student_strength: '你很適合用信任和提問打開高價服務的成交。',
                persuasion_power: '把客戶的擔心翻成可以行動的理由。',
                practical_advice: '下次客戶說太貴時，先問他是在比較價格、擔心買錯，還是還沒看見服務帶來的改變。',
                final_quote: '信任到了，成交就近了。'
              },
              course_path: [],
              cta_ready: false
            }
          : {
              phase: 'discovery',
              reply: count === 1
                ? `好，我抓到了，你現在談的是${slots.product || '你的商品'}，對象是${slots.customer || '你的客戶'}。我再往下看一點：最近一次沒有成交，對方是怎麼回你的？`
                : `我有抓到你說的狀況了。接下來我想看你的成交天賦：下次遇到同樣客戶，你最想讓自己哪個地方更強？`,
            next_question: '',
            profile_spec: null,
            course_path: [],
            cta_ready: false
            };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] })
    });
  });
}

async function send(page, text) {
  await page.locator('#chatMessage').fill(text);
  await page.locator('#chatMessage').press('Enter');
}

async function reachProfileSpec(page) {
  const answers = [
    '我賣高價顧問服務，客戶多半是企業主和專業人士。',
    '最近客戶最常說太貴，想再比較，也會說先回去考慮。',
    '我通常會先解釋服務內容和案例，但後續追蹤常常沒有整理好。'
  ];
  for (const answer of answers) {
    await send(page, answer);
    if (await page.locator('#profilePanel.is-visible').count()) return;
  }
  await page.locator('#profilePanel.is-visible').waitFor({ timeout: 5000 });
}

function readPngSize(path) {
  const buffer = fs.readFileSync(path);
  if (buffer.toString('ascii', 1, 4) !== 'PNG') throw new Error('downloaded file is not PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bytes: buffer.length
  };
}

async function verifyHomeEntry(page) {
  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: '銷售天賦探索' }).first().waitFor();
  await page.getByRole('link', { name: '找出銷售天賦 →' }).click();
  await page.waitForURL(/ai-student-qa\.html/);
  await page.getByRole('heading', { name: '銷售力不從心，因為從沒遇過李泰欣。' }).waitFor();
}

async function verifyCourseOfferingsVisible(page) {
  await page.goto(`${baseUrl}/ai-student-qa.html`, { waitUntil: 'networkidle' });
  await page.getByText('成交地圖').waitFor();
  if (await page.getByText('NT$ 11,000').count() < 2) throw new Error('expected two NT$ 11,000 offerings');
  await page.getByText('NT$ 12,500').waitFor();
  await page.getByText('NT$ 40,000').waitFor();
  await page.getByText('複訓').waitFor();
  await page.getByText('NT$ 3,200').waitFor();
  await page.getByText('超級銷冠系統', { exact: true }).waitFor();
  await page.getByText('金額待確認', { exact: true }).waitFor();
}

async function verifyAgreementGateAndShare(page) {
  await page.goto(`${baseUrl}/ai-student-qa.html`, { waitUntil: 'networkidle' });
  await mockGemini(page);
  await fillIntake(page);
  await send(page, '我賣高價顧問服務，客戶多半是企業主和專業人士。');
  if (await page.locator('#profilePanel.is-visible').count()) throw new Error('profile appeared before three effective answers');
  await send(page, '最近客戶最常說太貴，想再比較，也會說先回去考慮。');
  if (await page.locator('#profilePanel.is-visible').count()) throw new Error('profile appeared before third effective answer');
  await send(page, '我通常會先解釋服務內容和案例，但後續追蹤常常沒有整理好。');
  await page.locator('#profilePanel.is-visible').waitFor({ timeout: 5000 });
  await page.getByText('你的銷售優點是：').waitFor();
  await page.getByText('生涯運數 7').waitFor();
  await page.getByText('你容易建立安全感').waitFor();
  await page.getByText('7 號：洞察力').waitFor();
  if ((await page.locator('body').innerText()).includes('<b>')) throw new Error('raw HTML tag appeared in report');
  if (await page.getByText('生涯運數 3').count()) throw new Error('unexpected reduction chain number displayed');
  if (await page.locator('#coursePanel.is-visible').count()) throw new Error('course panel appeared before agreement');
  await page.getByRole('button', { name: '確認準了再下載' }).click();
  await page.getByText('確認準了之後，我會把建議學習順序放進報告').waitFor();
  await page.getByRole('button', { name: '看完準了，再看路徑' }).waitFor();
  if (await page.getByRole('button', { name: '像我，看看學習順序' }).count()) throw new Error('old accuracy button still visible');
  await send(page, '很準，有像我');
  await page.locator('#coursePanel.is-visible').waitFor();
  await page.locator('#coursePanel').getByRole('heading', { name: '極致效率' }).waitFor();
  await page.getByRole('button', { name: '建議學習路徑' }).waitFor();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '下載 9:16 圖片' }).click();
  const download = await downloadPromise;
  if (!download.suggestedFilename().endsWith('.png')) throw new Error('report download is not png');
  const pngPath = '/private/tmp/orikan-v3-share.png';
  await download.saveAs(pngPath);
  const pngSize = readPngSize(pngPath);
  if (pngSize.width !== 1080 || pngSize.height !== 1920) throw new Error(`unexpected share image size: ${pngSize.width}x${pngSize.height}`);
  if (pngSize.bytes < 80000) throw new Error(`share image too small: ${pngSize.bytes}`);
  const payload = await page.evaluate(() => window.__TAIXIN_LAST_SHARE_PAYLOAD);
  const meta = await page.evaluate(() => window.__TAIXIN_LAST_SHARE_META);
  if (!payload || payload.sales_advantages.length !== 3 || payload.life_talents.length !== 3) throw new Error('share payload missing report content');
  if (!payload.course_path.includes('極致效率')) throw new Error('share payload missing course path');
  if (!meta || meta.width !== 1080 || meta.height !== 1920 || meta.portrait_mode !== 'face-centered-cover') throw new Error('share metadata missing portrait/layout proof');
  if (meta.design_asset !== 'img/sales-talent-share-template.png') throw new Error('share image did not use design skill template asset');
  await page.getByRole('link', { name: '填寫報名表單' }).waitFor();
  await page.getByRole('link', { name: 'LINE 詢問最新場次' }).waitFor();
}

async function verifyShortAnswerMemory(page) {
  await page.goto(`${baseUrl}/ai-student-qa.html`, { waitUntil: 'networkidle' });
  await mockGemini(page);
  await fillIntake(page, {
    name: 'amy',
    industry: '高端汽車',
    problems: ['成交不了', '很忙沒結果'],
    goals: ['提升成交']
  });
  await send(page, '保時捷');
  await page.getByText('保時捷').last().waitFor();
  await send(page, '企業老闆');
  const bodyAfterSecond = await page.locator('body').innerText();
  if ((bodyAfterSecond.match(/你先跟我說清楚一點/g) || []).length) throw new Error('banned fixed question appeared');
  await send(page, '成交');
  await page.locator('#profilePanel.is-visible').waitFor({ timeout: 5000 });
  const body = await page.locator('body').innerText();
  const banned = ['你先跟我說清楚一點', '我還差一點點', '最後我再確認一題'];
  for (const phrase of banned) {
    if (body.includes(phrase)) throw new Error(`banned repeated question appeared: ${phrase}`);
  }
  const repeats = body.match(/你現在主要賣什麼/g) || [];
  if (repeats.length > 1) throw new Error('product question repeated');
  await page
    .locator('#profilePanel.is-visible')
    .locator('h2', { hasText: '你的銷售天賦報告' })
    .waitFor();
}

async function verifyOfferingQuestion(page) {
  await page.goto(`${baseUrl}/ai-student-qa.html`, { waitUntil: 'networkidle' });
  await mockGemini(page);
  await fillIntake(page);
  await send(page, '極致效率這堂課會學到什麼？複訓多少錢？');
  await page.getByText('我先講你的優勢').waitFor();
  await page.getByText('NT$ 3,200').first().waitFor();
}

async function verifyNoFrontendAiLanguage(page) {
  await page.goto(`${baseUrl}/ai-student-qa.html`, { waitUntil: 'networkidle' });
  const body = await page.locator('body').innerText();
  const banned = ['我先不急著推薦課程', '先判斷像不像你，再推薦課程', '我目前不直接猜', '最大卡點', '成交節奏', '你先跟我說清楚一點', '我還差一點點', '最後我再確認一題'];
  for (const phrase of banned) {
    if (body.includes(phrase)) throw new Error(`banned phrase appears: ${phrase}`);
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  await verifyHomeEntry(desktop);
  await verifyCourseOfferingsVisible(desktop);
  await verifyNoFrontendAiLanguage(desktop);
  await verifyAgreementGateAndShare(desktop);
  await verifyShortAnswerMemory(desktop);
  await verifyOfferingQuestion(desktop);
  await desktop.screenshot({ path: '/private/tmp/ai-student-qa-desktop.png', fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mockGemini(mobile);
  await mobile.goto(`${baseUrl}/ai-student-qa.html`, { waitUntil: 'networkidle' });
  await mobile.getByRole('heading', { name: '銷售力不從心，因為從沒遇過李泰欣。' }).waitFor();
  await fillIntake(mobile, { region: 'my', problems: ['看不懂客戶', '每天很忙但不知道忙什麼'], goals: ['建立信任', '不再漏掉成交機會'] });
  await reachProfileSpec(mobile);
  await mobile.getByText('生涯運數 7').waitFor();
  await mobile.screenshot({ path: '/private/tmp/ai-student-qa-mobile.png', fullPage: true });

  await browser.close();
  console.log('PASS\nHOME-ENTRY: PASS\nCOURSE-OFFERINGS-VISIBLE: PASS\nNO-AI-LANGUAGE: PASS\nENTER-SEND: PASS\nREPORT-CARD: PASS\nAGREEMENT-GATE: PASS\nSHARE-DOWNLOAD: PASS\nCOURSE-QA: PASS\nMOBILE-MY: PASS');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
