const { chromium } = require('/Users/macminim4/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8765';

async function fillIntake(page, options = {}) {
  await page.locator('#birthdate').fill(options.birthdate || '1990-03-21');
  await page.locator('#region').selectOption(options.region || 'tw');
  await page.locator('#role').selectOption(options.role || 'sales_consultant');
  await page.locator('#industry').fill(options.industry || '保險');
  await page.getByLabel(new RegExp(options.hateSales || '對話很冷')).check();
  await page.getByLabel(new RegExp(options.hateWorkplace || '愛衝突')).check();
  await page.getByLabel(new RegExp(options.hateCustomer || '破壞關係')).check();
  for (const label of options.problems || ['成交不了', '看不懂客戶']) {
    await page.getByLabel(new RegExp(label)).check();
  }
  for (const label of options.goals || ['提升成交', '建立信任']) {
    await page.getByLabel(new RegExp(label)).check();
  }
  await page.getByRole('button', { name: '開始探索' }).click();
}

async function mockGemini(page) {
  let count = 0;
  await page.route('https://smart-close-api.toleratestar.workers.dev/**', async (route) => {
    count += 1;
    const request = route.request();
    const body = request.postDataJSON();
    const prompt = body.contents[0].parts[0].text;
    const latestMatch = prompt.match(/使用者最新訊息：\n([\s\S]*?)\n\n輸出 JSON/);
    const latestMessage = latestMatch ? latestMatch[1] : '';
    const userLatest = prompt.includes('很像我') ? 'agreement' : '';
    const asksOffering = /開課|多少錢|複訓|價格/.test(latestMessage);
    const payload = asksOffering
      ? {
          phase: 'discovery',
          reply: '目前已確認的場次我整理在左側表格。複訓費用是 NT$ 3,200；吉隆坡場日期已確認，金額待確認。',
          next_question: '',
          profile_spec: null,
          course_path: [],
          cta_ready: false
        }
      : userLatest === 'agreement'
      ? {
          phase: 'recommendation',
          reply: '這樣看起來，你適合先把看懂客戶放在第一步，再把成交流程接起來。學習順序我幫你整理在下方。',
          next_question: '',
          profile_spec: null,
          course_path: [
            { id: 'zhizhi', name: '直指人心', reason: '先看懂客戶行為模式與信任建立。' },
            { id: 'chengjiao', name: '成交地圖', reason: '再補五連問、MBAF 與拒絕處理。' },
            { id: 'yanzhi', name: '言之有物', reason: '最後把產品價值講得有能量、邏輯與格局。' }
          ],
          cta_ready: true
        }
      : count >= 3
        ? {
            phase: 'profile_ready',
            reply: '我把你剛剛講的保險銷售現場整理成一份銷售天賦報告。你真正有力量的地方，是能讓客戶先感覺安全，再願意談需求。\n\n你覺得這份描述像你嗎？',
            next_question: '',
            profile_spec: {
              disc_type: 'S 偏 I',
              life_number: '3、4、7',
              sales_advantages: [
                { title: '你容易建立安全感', insight: '你不會急著壓客戶做決定，對方比較敢說真話。', strategy: '先用五連問問出真正擔心，再進入價值說明。' },
                { title: '你適合長期信任型成交', insight: '你不適合只追一次成交，適合累積接觸點。', strategy: '每次互動都留下一個清楚下一步，信任會慢慢變成成交。' },
                { title: '你會照顧客戶感受', insight: '你能注意到客戶的不安，這會讓對方覺得你懂他。', strategy: '拒絕處理時先接住情緒，再處理價格或方案。' }
              ],
              life_talents: [
                { title: '3 號：表達力', insight: '你能把保險講得有畫面，不只是在背條款。', strategy: '用故事讓客戶聽懂保障跟他家庭的關係。' },
                { title: '4 號：落地力', insight: '你做事有步驟，能讓客戶覺得後續有人照顧。', strategy: '把方案、流程和服務講清楚，客戶會比較安心。' },
                { title: '7 號：洞察力', insight: '你會想知道客戶猶豫背後真正的原因。', strategy: '用提問找出他是怕買錯、怕預算，還是還沒看見差異。' }
              ],
              sales_rhythm: '先信任，再提問，最後用小成交推進。',
              persuasion_power: '把客戶的擔心翻成可以行動的理由。',
              practical_advice: '下次客戶說太貴時，先問他是在比較價格、擔心買錯，還是還沒看見保障的差異。',
              final_quote: '信任到了，成交就近了。'
            },
            course_path: [],
            cta_ready: false
          }
        : {
            phase: 'discovery',
            reply: count === 1
              ? '你先跟我說一下，你現在主要賣什麼？客戶通常是哪一種人？'
              : '你剛剛提到客戶會猶豫。最近一次卡住的情境是什麼？對方當時怎麼回你？',
            next_question: '',
            profile_spec: null,
            course_path: [],
            cta_ready: false
          };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                { text: JSON.stringify(payload) }
              ]
            }
          }
        ]
      })
    });
  });
}

async function send(page, text) {
  await page.locator('#chatMessage').fill(text);
  await page.getByRole('button', { name: '送出' }).click();
}

async function reachProfileSpec(page) {
  for (let i = 0; i < 4; i += 1) {
    if (await page.locator('#profilePanel.is-visible').count()) return;
    await send(page, '我通常會先觀察，再用提問確認客戶真正卡在哪裡，但我也會怕太強勢。');
  }
  await page.locator('#profilePanel.is-visible').waitFor({ timeout: 5000 });
}

async function verifyHomeEntry(page) {
  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: '銷售天賦探索' }).first().waitFor();
  await page.getByRole('link', { name: '找出銷售天賦 →' }).click();
  await page.waitForURL(/ai-student-qa\.html/);
  await page.getByRole('heading', { name: '先找出你的銷售天賦' }).waitFor();
}

async function verifyCourseOfferingsVisible(page) {
  await page.goto(`${baseUrl}/ai-student-qa.html`, { waitUntil: 'networkidle' });
  await page.getByText('成交地圖').waitFor();
  if (await page.getByText('NT$ 11,000').count() < 2) {
    throw new Error('expected two NT$ 11,000 offerings');
  }
  await page.getByText('言之有物').waitFor();
  await page.getByText('NT$ 12,500').waitFor();
  await page.getByText('五堂課全包').waitFor();
  await page.getByText('NT$ 40,000').waitFor();
  await page.getByText('複訓').waitFor();
  await page.getByText('NT$ 3,200').waitFor();
  await page.getByText('超級銷冠系統', { exact: true }).waitFor();
  if (await page.getByText('金額待確認').count() < 1) {
    throw new Error('expected pending price label');
  }
}

async function verifyAgreementGate(page) {
  await page.goto(`${baseUrl}/ai-student-qa.html`, { waitUntil: 'networkidle' });
  await mockGemini(page);
  await fillIntake(page);
  await reachProfileSpec(page);
  await page.getByText('你容易建立安全感').waitFor();
  await page.getByText('3 號：表達力').waitFor();
  await page.getByText('4 號：落地力').waitFor();
  await page.getByText('7 號：洞察力').waitFor();
  if (await page.locator('#coursePanel.is-visible').count()) {
    throw new Error('course panel appeared before agreement');
  }
  await page.getByRole('button', { name: '像我，看看學習順序' }).click();
  await page.locator('#coursePanel.is-visible').waitFor();
  await page.getByRole('link', { name: '填寫報名表單' }).waitFor();
  await page.getByRole('link', { name: 'LINE 詢問最新場次' }).waitFor();
}

async function verifyReviseGate(page) {
  await page.goto(`${baseUrl}/ai-student-qa.html`, { waitUntil: 'networkidle' });
  await mockGemini(page);
  await fillIntake(page, {
    birthdate: '1985-10-08',
    region: 'my',
    role: 'leader',
    industry: '房地產',
    problems: ['帶團隊'],
    goals: ['複製團隊']
  });
  await reachProfileSpec(page);
  await page.getByRole('button', { name: '我想補充一點' }).click();
  await page.locator('.message.bot').last().waitFor();
  if (await page.locator('#coursePanel.is-visible').count()) {
    throw new Error('course panel appeared after disagreement');
  }
}

async function verifyUnconfirmedOffering(page) {
  await page.goto(`${baseUrl}/ai-student-qa.html`, { waitUntil: 'networkidle' });
  await mockGemini(page);
  await fillIntake(page);
  await send(page, '最近什麼時候開課？多少錢？複訓呢？');
  await page.getByText('NT$ 3,200').first().waitFor();
  await page.getByText('金額待確認', { exact: true }).waitFor();
}

async function verifyNoAiLanguage(page) {
  await page.goto(`${baseUrl}/ai-student-qa.html`, { waitUntil: 'networkidle' });
  const body = await page.locator('body').innerText();
  const banned = ['我先不急著推薦課程', '先判斷像不像你，再推薦課程', '我目前不直接猜', '最大卡點'];
  for (const phrase of banned) {
    if (body.includes(phrase)) throw new Error(`banned phrase appears: ${phrase}`);
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await verifyHomeEntry(desktop);
  await verifyCourseOfferingsVisible(desktop);
  await verifyNoAiLanguage(desktop);
  await verifyAgreementGate(desktop);
  await verifyReviseGate(desktop);
  await verifyUnconfirmedOffering(desktop);
  await desktop.evaluate(() => window.scrollTo(0, 0));
  await desktop.screenshot({ path: '/private/tmp/ai-student-qa-desktop.png', fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mockGemini(mobile);
  await mobile.goto(`${baseUrl}/ai-student-qa.html`, { waitUntil: 'networkidle' });
  await mobile.getByRole('heading', { name: '先找出你的銷售天賦' }).waitFor();
  await fillIntake(mobile, { region: 'my', problems: ['看不懂客戶'], goals: ['建立信任'] });
  await reachProfileSpec(mobile);
  await mobile.getByText('3 號：表達力').waitFor();
  await mobile.getByText('7 號：洞察力').waitFor();
  await mobile.evaluate(() => window.scrollTo(0, 0));
  await mobile.screenshot({ path: '/private/tmp/ai-student-qa-mobile.png', fullPage: true });

  await browser.close();
  console.log('PASS\nHOME-ENTRY: PASS\nCOURSE-OFFERINGS-VISIBLE: PASS\nNO-AI-LANGUAGE: PASS\nAGREEMENT-GATE: PASS\nREVISE-GATE: PASS\nCONFIRMED-OFFERING-GUARD: PASS\nMOBILE-MY: PASS');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
