(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TaixinGeminiStudentQA = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const DEFAULT_CONFIG = {
    worker_url: 'https://smart-close-api.toleratestar.workers.dev',
    model: 'gemini-2.5-flash',
    fallback_model: 'gemini-2.0-flash-lite',
    timeout_ms: 30000
  };

  const PHASES = {
    DISCOVERY: 'discovery',
    PROFILE_READY: 'profile_ready',
    RECOMMENDATION: 'recommendation',
    REVISION: 'revision'
  };

  function createSession(profile, context) {
    const deterministic = getDeterministicEngine();
    const base = deterministic ? deterministic.createSession(profile) : null;
    return {
      session_id: 'gemini-' + Date.now(),
      phase: PHASES.DISCOVERY,
      profile: Object.assign({
        name: '',
        birthdate: '',
        region: 'tw',
        role: 'sales_consultant',
        industry: '',
        disc_hate_sales: '',
        disc_hate_workplace: '',
        disc_hate_customer: '',
        problems: [],
        goals: []
      }, profile || {}),
      deterministic_state: base,
      messages: [],
      profile_spec: null,
      response_strategy: base && deterministic ? deterministic.buildProfileSpec(base) : null,
      course_path: null,
      recommendation_allowed: false,
      context: sanitizeContext(context || {})
    };
  }

  async function start(profile, context) {
    const state = createSession(profile, context);
    const prompt = buildRequest(state, '');
    const result = await callGeminiWithFallback(state, prompt);
    state.messages.push({ role: 'assistant', content: result.reply });
    return formatClientResponse(state, result);
  }

  async function transition(state, message) {
    const next = clone(state);
    const text = String(message || '').trim();
    if (!text) return formatClientResponse(next, fallbackReply(next));
    next.messages.push({ role: 'user', content: text });

    if (isAgreement(text) && next.profile_spec) {
      next.recommendation_allowed = true;
      next.phase = PHASES.RECOMMENDATION;
    } else if (isDisagreement(text)) {
      next.recommendation_allowed = false;
      next.phase = PHASES.REVISION;
    }

    const prompt = buildRequest(next, text);
    const result = await callGeminiWithFallback(next, prompt);
    mergeResultIntoState(next, result);
    next.messages.push({ role: 'assistant', content: result.reply });
    return formatClientResponse(next, result);
  }

  function buildRequest(state, userMessage) {
    const deterministic = getDeterministicEngine();
    const deterministicResult = state.deterministic_state && deterministic
      ? {
          disc: deterministic.getDiscResult(state.deterministic_state),
          profile_spec: deterministic.buildProfileSpec(state.deterministic_state),
          computed: state.deterministic_state.computed || {},
          course_path: deterministic.buildCoursePath(state.deterministic_state)
        }
      : null;

    return {
      contents: [
        {
          parts: [
            {
              text: buildSystemPrompt(state, deterministicResult, userMessage)
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.45,
        responseMimeType: 'application/json'
      },
      _model: (state.context.config && state.context.config.model) || DEFAULT_CONFIG.model
    };
  }

  function buildSystemPrompt(state, deterministicResult, userMessage) {
    const context = state.context || {};
    const transcript = state.messages.slice(-8).map((msg) => `${msg.role}: ${msg.content}`).join('\n');
    return [
      '你是 Orikan 李泰欣官網的「銷售天賦探索中心」。',
      '你的任務不是推課，而是像真人銷售顧問一樣，先理解學生的產業、商品、客戶與最近卡住的成交情境，再整理成一份可以帶走的銷售天賦報告。',
      '',
      '語氣規則：',
      '- 用泰欣老師式口吻：直接、實戰、有人性、重視系統。',
      '- 只寫跟學生本人有關的內容，不要解釋系統流程。',
      '- 禁用句：我先不急著推薦課程、先判斷像不像你再推薦課程、我目前不直接猜、最大卡點、AI、規則引擎、系統判斷。',
      '- 不要保證成交，不要編造成效數字、名額、未確認價格。',
      '',
      '課程與銷售架構只能依下列資料使用，不可自行編造泰欣沒教過的架構：',
      JSON.stringify(context.salesBrain || {}, null, 2),
      '',
      '金句規則與種子：',
      JSON.stringify(context.quoteSeeds || {}, null, 2),
      '',
      '已確認課程資訊：',
      JSON.stringify(context.offerings || {}, null, 2),
      '',
      '學生基本資料：',
      JSON.stringify(state.profile || {}, null, 2),
      '',
      '規則型輔助判斷，只能參考，不可照抄成僵硬文字：',
      JSON.stringify(deterministicResult || {}, null, 2),
      '',
      '目前對話：',
      transcript || '(剛開始)',
      '',
      '使用者最新訊息：',
      userMessage || '(剛開始)',
      '',
      '輸出 JSON，不能有 markdown code block。格式：',
      JSON.stringify({
        phase: 'discovery | profile_ready | recommendation | revision',
        reply: '給學生看的自然回覆',
        next_question: '下一題，如果報告已完成可為空字串',
        profile_spec: {
          disc_type: 'D/I/S/C 或混合型',
          life_number: '生涯運數，可為空',
          sales_advantages: [
            { title: '行為模式銷售優點 1', insight: '依 DISC 行為模式看到的銷售優點', strategy: '白話說明可以怎麼用' },
            { title: '行為模式銷售優點 2', insight: '依 DISC 行為模式看到的銷售優點', strategy: '白話說明可以怎麼用' },
            { title: '行為模式銷售優點 3', insight: '依 DISC 行為模式看到的銷售優點', strategy: '白話說明可以怎麼用' }
          ],
          life_talents: [
            { title: '生涯運數天賦 1', insight: '依 reduction chain / 生日數 / 生涯運數整理', strategy: '白話說明在銷售上怎麼發揮' },
            { title: '生涯運數天賦 2', insight: '依 reduction chain / 生日數 / 生涯運數整理', strategy: '白話說明在銷售上怎麼發揮' },
            { title: '九宮連線或生涯運數天賦 3', insight: '若有九宮連線，講連線優點；沒有就講第三個數字', strategy: '白話說明在銷售上怎麼發揮' }
          ],
          sales_rhythm: '他的成交節奏',
          persuasion_power: '最該放大的說服力量',
          practical_advice: '一段實戰建議',
          final_quote: '不超過30字的個人化收束金句'
        },
        course_path: [
          { id: 'zhizhi', name: '直指人心', reason: '為什麼先學' }
        ],
        cta_ready: false
      }, null, 2),
      '',
      '階段規則：',
      '- 前 2-4 輪要問跟學生回答有關的問題，不能重複問同一題。',
      '- 如果還不知道他的商品、客戶、最近卡住情境，優先追問這三件事。',
      '- 當你已有足夠資訊，phase 設為 profile_ready，產出報告，最後問：你覺得這份描述像你嗎？',
      '- sales_advantages 固定給三點：只講 DISC 行為模式在銷售上的優點，例如 D 的推進力、I 的互動感、S 的信任感、C 的專業感。不要寫課程稿，必須白話、像顧問在跟他說。',
      '- life_talents 固定給三點：依生涯運數 reduction_chain 的每個號碼解釋天賦，例如 3、4、7 就分別講 3、4、7 的天賦；如果有九宮連線，第三點可以改講該連線的優點。必須白話、跟銷售現場有關。',
      '- 只有學生表示像、準、對、有中之後，phase 才能是 recommendation，cta_ready 才能 true，並自然給學習順序。',
      '- 如果學生問價格、日期，只引用已確認課程資訊；吉隆坡金額維持待確認；複訓一律 NT$ 3,200。'
    ].join('\n');
  }

  async function callGeminiWithFallback(state, body) {
    try {
      const result = await callGemini(state, body);
      return normalizeGeminiResult(state, result);
    } catch (error) {
      return fallbackReply(state);
    }
  }

  async function callGemini(state, body) {
    const config = Object.assign({}, DEFAULT_CONFIG, (state.context && state.context.config) || {});
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), config.timeout_ms || DEFAULT_CONFIG.timeout_ms) : null;
    try {
      const response = await fetch(config.worker_url || DEFAULT_CONFIG.worker_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller ? controller.signal : undefined
      });
      if (!response.ok) throw new Error('Gemini worker failed: ' + response.status);
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || 'Gemini error');
      const text = extractText(data);
      return parseJson(text);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function extractText(data) {
    if (typeof data.output_text === 'string') return data.output_text;
    if (typeof data.text === 'string') return data.text;
    const candidate = data.candidates && data.candidates[0];
    const part = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
    if (part && typeof part.text === 'string') return part.text;
    throw new Error('Gemini text missing');
  }

  function parseJson(text) {
    const clean = String(text || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    try {
      return JSON.parse(clean);
    } catch (error) {
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw error;
      return JSON.parse(match[0]);
    }
  }

  function normalizeGeminiResult(state, result) {
    const coursePath = Array.isArray(result.course_path) ? result.course_path : [];
    const normalized = {
      phase: result.phase || state.phase || PHASES.DISCOVERY,
      reply: sanitizeReply(result.reply || ''),
      next_question: String(result.next_question || ''),
      profile_spec: normalizeProfileSpec(result.profile_spec),
      course_path: coursePath,
      cta_ready: Boolean(result.cta_ready) || Boolean(state.recommendation_allowed && coursePath.length)
    };
    if (!normalized.reply) return fallbackReply(state);
    if (!state.recommendation_allowed && normalized.cta_ready) {
      normalized.cta_ready = false;
      normalized.course_path = [];
      normalized.phase = normalized.profile_spec ? PHASES.PROFILE_READY : PHASES.DISCOVERY;
    }
    if (hasUnsafeCommercialClaim(normalized.reply, state.context && state.context.offerings)) {
      return fallbackReply(state, true);
    }
    return normalized;
  }

  function normalizeProfileSpec(spec) {
    if (!spec || typeof spec !== 'object') return null;
    const advantages = Array.isArray(spec.sales_advantages)
      ? spec.sales_advantages.slice(0, 3)
      : (Array.isArray(spec.sales_talents) ? spec.sales_talents.slice(0, 3) : []);
    const lifeTalents = Array.isArray(spec.life_talents) ? spec.life_talents.slice(0, 3) : [];
    return {
      disc_type: String(spec.disc_type || ''),
      life_number: String(spec.life_number || ''),
      sales_advantages: advantages.map((item, index) => ({
        title: String(item.title || `行為模式銷售優點 ${index + 1}`),
        insight: String(item.insight || ''),
        strategy: String(item.strategy || '')
      })),
      life_talents: lifeTalents.map((item, index) => ({
        title: String(item.title || `生涯運數天賦 ${index + 1}`),
        insight: String(item.insight || ''),
        strategy: String(item.strategy || '')
      })),
      sales_rhythm: String(spec.sales_rhythm || ''),
      persuasion_power: String(spec.persuasion_power || ''),
      practical_advice: String(spec.practical_advice || ''),
      final_quote: trimQuote(spec.final_quote)
    };
  }

  function fallbackReply(state, commercialGuard) {
    const messages = state.messages || [];
    const userTurns = messages.filter((msg) => msg.role === 'user').length;
    const deterministic = getDeterministicEngine();
    const spec = state.deterministic_state && deterministic ? deterministic.buildProfileSpec(state.deterministic_state) : null;
    const computed = state.deterministic_state && state.deterministic_state.computed ? state.deterministic_state.computed : {};
    const life = computed.life_numbers && computed.life_numbers.length ? computed.life_numbers.join('、') : computed.life_number;

    if (commercialGuard) {
      return {
        phase: state.phase,
        reply: '目前已確認的課程資訊我整理在左側場次表。吉隆坡場日期已確認，金額還在確認中；複訓費用是 NT$ 3,200。',
        next_question: '',
        profile_spec: null,
        course_path: [],
        cta_ready: false
      };
    }

    if (state.recommendation_allowed) {
      return {
        phase: PHASES.RECOMMENDATION,
        reply: '如果這份描述像你，我會建議你把學習順序放在「先看懂人，再補成交流程，最後把表達放大」。我幫你把順序整理在下方。',
        next_question: '',
        profile_spec: null,
        course_path: fallbackCoursePath(state),
        cta_ready: true
      };
    }

    if (userTurns >= 3) {
      const profile = buildFallbackProfile(state, spec, life);
      return {
        phase: PHASES.PROFILE_READY,
        reply: '我把你剛剛講的銷售狀況整理成一份報告。你不是沒有能力，而是要把自己最自然的成交方式放大。\n\n你覺得這份描述像你嗎？',
        next_question: '',
        profile_spec: profile,
        course_path: [],
        cta_ready: false
      };
    }

    const questions = [
      '你先跟我說一下，你現在主要賣什麼？客戶通常是哪一種人？',
      '最近一次成交卡住，是發生在哪一個環節？對方當時怎麼回你？',
      '如果要你回想一個成交比較順的客戶，當時是因為信任、提問、產品說明，還是後續追蹤做得好？'
    ];
    const question = questions[userTurns] || questions[2];
    return {
      phase: PHASES.DISCOVERY,
      reply: question,
      next_question: question,
      profile_spec: null,
      course_path: [],
      cta_ready: false
    };
  }

  function buildFallbackProfile(state, spec, life) {
    const disc = spec && spec.disc_type ? spec.disc_type : 'S';
    const course = spec && spec.next_skill ? spec.next_skill.course : 'zhizhi';
    return {
      disc_type: disc,
      life_number: life ? String(life) : '',
      sales_advantages: buildDiscAdvantages(disc),
      life_talents: buildLifeTalents(computed),
      sales_rhythm: '先建立信任，再用問題找原因，最後用小成交推進。',
      persuasion_power: '把客戶的感受翻成可以行動的理由。',
      practical_advice: '下一次客戶說考慮看看時，不要急著解釋。先問他是在比較方案、擔心預算，還是怕買錯，答案會帶你找到真正的成交入口。',
      final_quote: trimQuote('信任到了，成交就近了。'),
      primary_course: course
    };
  }

  function buildDiscAdvantages(disc) {
    const primary = String(disc || 'S').charAt(0);
    const map = {
      D: [
        ['你抓重點很快', '你不容易在對話裡繞太久，能幫客戶看見下一步。', '適合用清楚選項推進成交，讓客戶知道現在該決定什麼。'],
        ['你有推進力', '遇到猶豫型客戶，你比較敢把問題攤開來談。', '記得先聽完對方顧慮，再用一句話帶回決策點。'],
        ['你適合做結果型說服', '你講話可以直接對準成果，不會只停在氣氛。', '把產品價值翻成省時間、少風險、得結果，成交會更快。']
      ],
      I: [
        ['你有互動感', '你容易讓客戶覺得聊天不尷尬，願意多講一點。', '適合先用故事打開情緒，再用問題接到需求。'],
        ['你會帶氣氛', '客戶跟你談話時比較容易放鬆，這是建立信任的入口。', '要把熱度接到下一步，不要只聊開心。'],
        ['你適合故事型說服', '你能把產品講得有畫面，讓客戶感覺跟自己有關。', '用 MBAF 先講好處，再補案例，說服力會更穩。']
      ],
      S: [
        ['你容易建立安全感', '你不會讓客戶覺得被逼，對方比較敢說真話。', '適合先問顧慮，再慢慢把下一步變小。'],
        ['你有長期信任感', '你適合經營需要時間醞釀的客戶，不是只靠一招成交。', '每次互動都留一個清楚下一步，信任會累積成成交。'],
        ['你會照顧感受', '你能注意到客戶的不安，這會讓對方覺得你懂他。', '拒絕處理時先接住情緒，再處理價格或方案。']
      ],
      C: [
        ['你有專業感', '你重視依據與細節，客戶會覺得你不是亂講。', '適合用比較表、案例和流程讓客戶安心。'],
        ['你能拆問題', '你不容易被表面拒絕帶走，能往真正原因追。', '用五連問釐清對方卡的是預算、信任還是需求。'],
        ['你適合系統型成交', '你能把成交變成步驟，而不是只靠臨場反應。', '把常見拒絕整理成固定回應，成交會更穩。']
      ]
    };
    return (map[primary] || map.S).map(([title, insight, strategy]) => ({ title, insight, strategy }));
  }

  function buildLifeTalents(computed) {
    const numbers = Array.isArray(computed.life_numbers) && computed.life_numbers.length
      ? computed.life_numbers
      : [computed.birthday_number, computed.life_number].filter(Boolean);
    const activeLine = Array.isArray(computed.active_lines) && computed.active_lines.length ? computed.active_lines[0] : null;
    const items = numbers.slice(0, 3).map((number) => lifeTalentFor(number));
    if (activeLine && items.length >= 3) items[2] = lineTalentFor(activeLine);
    if (activeLine && items.length < 3) items.push(lineTalentFor(activeLine));
    while (items.length < 3) items.push(lifeTalentFor(items.length + 1));
    return items.slice(0, 3);
  }

  function lifeTalentFor(number) {
    const map = {
      1: ['1 號：開創力', '你適合先把方向打開，不怕第一個去嘗試。', '銷售上可以負責破冰、開發新客戶、把下一步講清楚。'],
      2: ['2 號：協調力', '你容易站在別人角度想，能讓對方覺得被理解。', '銷售上適合處理關係、安撫顧慮、把雙方拉到同一邊。'],
      3: ['3 號：表達力', '你有把事情說得有趣、有畫面的能力。', '銷售上適合用故事、比喻和案例讓客戶聽懂價值。'],
      4: ['4 號：落地力', '你做事比較重承諾與步驟，能讓人覺得可靠。', '銷售上適合把方案、流程、後續服務講清楚，降低不安。'],
      5: ['5 號：變通力', '你反應快，能在不同客戶面前調整說法。', '銷售上適合處理臨場異議，把卡住的對話轉成新角度。'],
      6: ['6 號：照顧力', '你容易讓人感覺被在乎，願意信任你的建議。', '銷售上適合從需求與風險感出發，讓客戶感覺你站在他那邊。'],
      7: ['7 號：洞察力', '你會想知道事情背後真正的原因，不只看表面。', '銷售上適合用提問找出真正顧慮，再給精準建議。'],
      8: ['8 號：目標力', '你對結果和資源敏感，知道怎麼把事情推到位。', '銷售上適合談效益、投資報酬和方案價值。'],
      9: ['9 號：影響力', '你比較看得到大局，容易把事情說成一個有意義的方向。', '銷售上適合談願景、改變與長期價值。']
    };
    const [title, insight, strategy] = map[number] || map[7];
    return { title, insight, strategy };
  }

  function lineTalentFor(line) {
    const name = line && line.name ? line.name : '九宮連線';
    return {
      title: `${name}：整合優勢`,
      insight: '你的數字不是單點發力，而是幾個能力可以串在一起用。',
      strategy: '銷售上適合把表達、推進和信任接成一條流程，不要只靠單一話術。'
    };
  }

  function fallbackCoursePath(state) {
    const deterministic = getDeterministicEngine();
    if (state.deterministic_state && deterministic) return deterministic.buildCoursePath(state.deterministic_state);
    return [
      { order: 1, id: 'zhizhi', name: '直指人心', page: 'zhizhirenxin.html', reason: '先看懂客戶行為模式與信任建立。' },
      { order: 2, id: 'chengjiao', name: '成交地圖', page: 'chengjiaoditu.html', reason: '再把提問、價值說明與拒絕處理接成流程。' },
      { order: 3, id: 'yanzhi', name: '言之有物', page: 'yanzhiyouwu.html', reason: '最後把表達力放大成一對多影響。' }
    ];
  }

  function mergeResultIntoState(state, result) {
    state.phase = result.phase || state.phase;
    if (result.profile_spec) state.profile_spec = result.profile_spec;
    if (isCoursePathReady(state, result)) state.course_path = result.course_path || fallbackCoursePath(state);
  }

  function formatClientResponse(state, result) {
    const coursePathReady = isCoursePathReady(state, result);
    return {
      state,
      phase: result.phase || state.phase,
      reply: result.reply,
      next_question: result.next_question || '',
      profile_spec: result.profile_spec || null,
      response_strategy: deriveResponseStrategy(state),
      course_path: coursePathReady ? (result.course_path || fallbackCoursePath(state)) : null,
      cta: coursePathReady ? {
        signup_url: 'https://docs.google.com/forms/d/e/1FAIpQLScFcX7QtpCpUozxWGKv9nSj6Ur9h-gR6dwA5Dqm9BG7CVJ9Nw/viewform?usp=header',
        line_url: 'https://line.me/ti/p/jzdho94spl'
      } : null
    };
  }

  function isCoursePathReady(state, result) {
    return Boolean(state.recommendation_allowed && (result.cta_ready || (Array.isArray(result.course_path) && result.course_path.length)));
  }

  function deriveResponseStrategy(state) {
    const deterministic = getDeterministicEngine();
    if (state.deterministic_state && deterministic) {
      const disc = deterministic.getDiscResult(state.deterministic_state);
      return { disc_primary: disc.primary, disc_label: disc.label, confidence: disc.confidence };
    }
    return { disc_primary: 'S', disc_label: 'S', confidence: 0.5 };
  }

  function sanitizeContext(context) {
    return {
      config: Object.assign({}, DEFAULT_CONFIG, context.config || {}),
      salesBrain: context.salesBrain || null,
      quoteSeeds: context.quoteSeeds || null,
      offerings: context.offerings || null
    };
  }

  function sanitizeReply(reply) {
    return String(reply || '')
      .replace(/我先不急著推薦課程。?/g, '')
      .replace(/先判斷像不像你，再推薦課程。?/g, '')
      .replace(/我目前不直接猜。?/g, '')
      .replace(/最大卡點/g, '目前要整理的地方')
      .trim();
  }

  function hasUnsafeCommercialClaim(reply, offerings) {
    const text = String(reply || '');
    if (/保證(成交|成功|有效)|一定.{0,8}(成交|成功|有效)|名額剩|剩餘名額|限量/.test(text)) return true;
    if (/吉隆坡|超級銷冠系統/.test(text) && /(?:MYR|RM|馬幣)\s?[\d,]+|[\d,]+\s?(?:馬幣|令吉)/i.test(text)) return true;
    if (/(?:NT\$|新台幣|台幣|TWD)\s?[\d,]+|[\d,]+\s?元/.test(text)) {
      const allowed = new Set();
      for (const item of (offerings && offerings.offerings) || []) {
        if (item.price !== null && item.price !== undefined) allowed.add(Number(item.price));
      }
      if (offerings && offerings.retake_policy) allowed.add(Number(offerings.retake_policy.price));
      const matches = text.match(/(?:NT\$|新台幣|台幣|TWD)?\s?[\d,]+\s?(?:元)?/g) || [];
      for (const match of matches) {
        const n = Number((match.match(/[\d,]+/) || [''])[0].replace(/,/g, ''));
        if (n && !allowed.has(n)) return true;
      }
    }
    return false;
  }

  function trimQuote(value) {
    const text = String(value || '').replace(/[「」"']/g, '').trim();
    return text.length > 30 ? text.slice(0, 30) : text;
  }

  function isAgreement(text) {
    return /(像|準|有中|符合|滿對|蠻對|很對|對耶|是我|沒錯)/.test(text);
  }

  function isDisagreement(text) {
    return /(不像|不太像|不準|不太準|不太對|不是|偏掉|不符合|想補充)/.test(text);
  }

  function getDeterministicEngine() {
    if (typeof TaixinStudentQA !== 'undefined') return TaixinStudentQA;
    if (typeof require === 'function') {
      try { return require('./state-machine'); } catch (error) { return null; }
    }
    return null;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  return {
    createSession,
    start,
    transition,
    buildRequest,
    parseJson,
    normalizeGeminiResult,
    PHASES
  };
});
