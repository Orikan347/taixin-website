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
    timeout_ms: 8000
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
        email: '',
        phone: '',
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
      discovery_slots: extractDiscoverySlots([], profile || {}),
      discovery_evidence: analyzeDiscoveryEvidence([], profile || {}),
      profile_spec: null,
      response_strategy: base && deterministic ? deterministic.buildProfileSpec(base) : null,
      course_path: null,
      recommendation_allowed: false,
      context: sanitizeContext(context || {})
    };
  }

  async function start(profile, context) {
    const state = createSession(profile, context);
    return formatClientResponse(state, {
      phase: PHASES.DISCOVERY,
      reply: '',
      next_question: '',
      profile_spec: null,
      course_path: [],
      cta_ready: false
    });
  }

  async function transition(state, message) {
    const next = clone(state);
    const text = String(message || '').trim();
    if (!text) return formatClientResponse(next, serviceNotice(next));
    next.messages.push({ role: 'user', content: text });
    updateDeterministicState(next, text);
    next.discovery_slots = extractDiscoverySlots(next.messages, next.profile);
    next.discovery_evidence = analyzeDiscoveryEvidence(next.messages, next.profile);

    if (isAgreement(text) && next.profile_spec) {
      next.recommendation_allowed = true;
      next.phase = PHASES.RECOMMENDATION;
    } else if (isDisagreement(text)) {
      next.recommendation_allowed = false;
      next.phase = PHASES.REVISION;
    }

    const prompt = buildRequest(next, text);
    const result = await callGeminiSafely(next, prompt);
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
    const discovery = analyzeDiscoveryEvidence(state.messages || [], state.profile || {});
    const slots = extractDiscoverySlots(state.messages || [], state.profile || {});
    return [
      '你是 Orikan 李泰欣官網的「銷售天賦問答顧問」。',
      '你的任務是像泰欣老師本人一樣，用熱情、直接、有畫面感的 I 型影響型語氣，先理解學生的產業、商品、客戶與最近遇到的銷售狀況，再整理成一份可以帶走的銷售天賦報告。',
      '',
      '語氣規則：',
      '- 用泰欣老師式口吻：熱情、直接、實戰、有能量，先讓學生覺得被看見。',
      '- 只寫跟學生本人有關的內容，不要解釋系統流程。',
      '- 禁用句：我先不急著推薦課程、先判斷像不像你再推薦課程、我目前不直接猜、最大卡點、卡住、很卡、節奏、AI、規則引擎、系統判斷。',
      '- 不要說自己不能猜；課程時間與金額就引用已確認資料，未確認的吉隆坡金額用「顧問會以最新公告回覆你」。',
      '- 不要保證成交，不要編造成效數字、名額、未確認價格。',
      '- 可以回答課程會學到什麼、目前開課狀況、價格、複訓、哪一堂適合先上；不能提供完整付費課程逐字稿、細部演練腳本或內部教材。',
      '- 學生問課程學什麼時，用這個模板：我先講你的優勢。你其實很適合____，只是現在遇到____，所以這個優勢還沒有完全發揮出來。這堂課不是要你變成另一種人，而是幫你把原本就有的能力整理出方法。你上完會得到三個好處：1.____ 2.____ 3.____。所以如果你現在最想突破的是____，我會建議你先從____開始。',
      '- 「極致效率」是泰欣很重要的優勢：處理業務員很忙、追蹤亂、努力沒結果、每天不知道忙什麼，幫他把客戶資料、時間安排、追蹤與下一步整理成方法。',
      '- 可以自然使用這句話：銷售力不從心，因為從沒遇過李泰欣。',
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
      '對話蒐集狀態：',
      JSON.stringify(discovery, null, 2),
      '',
      '目前已確認的學生資訊欄位。這些欄位比單句長短更重要，短回答也要算數：',
      JSON.stringify(slots, null, 2),
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
          student_strength: '一句話說出他的銷售優勢',
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
      '- 基本資料不算對話。至少要有 3 則有效使用者回答，而且必須取得：商品/服務、客戶對象、最近遇到的銷售問題、想變強的目標。短回答也算，例如「保時捷」=商品，「企業老闆」=客戶，「成交」=目標。',
      '- 前 3 輪要問跟學生上一句回答有關的問題，不能重複問同一題。',
      '- 如果學生已經回答過商品或客戶，不准再問同一題。要承接他的答案往下問，例如保時捷客戶是企業老闆，就問企業老闆買保時捷時最在意什麼，或最近成交沒有往前走的原因。',
      '- 如果學生抱怨「講過了」「同一個問題問幾次」，要先道歉，承認剛剛重複了，然後改問新的、具體的下一題。',
      '- 當對話蒐集狀態 can_build_report=true，phase 才能設為 profile_ready，產出報告，reply 最後一定要接：你看完之後，覺得像你嗎？有準嗎？',
      '- sales_advantages 固定給三點：只講 DISC 行為模式在銷售上的優點，例如 D 的推進力、I 的互動感、S 的信任感、C 的專業感。不要寫課程稿，必須白話、像顧問在跟他說。',
      '- profile_spec.life_number 只填最終主生涯運數，例如 7，不要填 3、4、7。',
      '- life_talents 固定給三點：以主生涯運數為主，搭配生日數或九宮連線整理三個白話銷售天賦；不要把 reduction chain 逐字列成 3、4、7。',
      '- 只有學生表示像、準、對、有中之後，phase 才能是 recommendation，cta_ready 才能 true，並自然給學習順序。',
      '- 如果學生問價格、日期，只引用已確認課程資訊；吉隆坡金額維持待確認；複訓一律 NT$ 3,200。'
    ].join('\n');
  }

  async function callGeminiSafely(state, body) {
    try {
      const result = await callGemini(state, body);
      return normalizeGeminiResult(state, result);
    } catch (error) {
      return serviceNotice(state);
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
    const discovery = analyzeDiscoveryEvidence(state.messages || [], state.profile || {});
    const normalized = {
      phase: result.phase || state.phase || PHASES.DISCOVERY,
      reply: sanitizeReply(result.reply || ''),
      next_question: stripDisplayText(result.next_question || ''),
      profile_spec: normalizeProfileSpec(result.profile_spec),
      course_path: coursePath.map(normalizeCourseItem),
      cta_ready: Boolean(result.cta_ready) || Boolean(state.recommendation_allowed && coursePath.length)
    };
    if (!normalized.reply) return serviceNotice(state);
    if (normalized.profile_spec && (!discovery.can_build_report || !isCompleteProfileSpec(normalized.profile_spec))) {
      normalized.profile_spec = null;
      normalized.course_path = [];
      normalized.cta_ready = false;
      normalized.phase = PHASES.DISCOVERY;
    }
    if (!state.recommendation_allowed && normalized.cta_ready) {
      normalized.cta_ready = false;
      normalized.course_path = [];
      normalized.phase = normalized.profile_spec ? PHASES.PROFILE_READY : PHASES.DISCOVERY;
    }
    if (hasUnsafeCommercialClaim(normalized.reply, state.context && state.context.offerings)) {
      return safeCommercialNotice(state);
    }
    normalized.reply = preventRepeatedReply(state, normalized.reply);
    return normalized;
  }

  function normalizeProfileSpec(spec) {
    if (!spec || typeof spec !== 'object') return null;
    const advantages = Array.isArray(spec.sales_advantages)
      ? spec.sales_advantages.slice(0, 3)
      : (Array.isArray(spec.sales_talents) ? spec.sales_talents.slice(0, 3) : []);
    const lifeTalents = Array.isArray(spec.life_talents) ? spec.life_talents.slice(0, 3) : [];
    return {
      disc_type: stripDisplayText(spec.disc_type || ''),
      life_number: stripDisplayText(spec.life_number || ''),
      sales_advantages: advantages.map((item, index) => ({
        title: stripDisplayText(item.title || `行為模式銷售優點 ${index + 1}`),
        insight: stripDisplayText(item.insight || ''),
        strategy: stripDisplayText(item.strategy || '')
      })),
      life_talents: lifeTalents.map((item, index) => ({
        title: stripDisplayText(item.title || `生涯運數天賦 ${index + 1}`),
        insight: stripDisplayText(item.insight || ''),
        strategy: stripDisplayText(item.strategy || '')
      })),
      student_strength: stripDisplayText(spec.student_strength || ''),
      sales_rhythm: stripDisplayText(spec.sales_rhythm || ''),
      persuasion_power: stripDisplayText(spec.persuasion_power || ''),
      practical_advice: stripDisplayText(spec.practical_advice || ''),
      final_quote: trimQuote(spec.final_quote)
    };
  }

  function normalizeCourseItem(course, index) {
    return {
      order: course && course.order ? course.order : index + 1,
      id: stripDisplayText(course && course.id || ''),
      name: stripDisplayText(course && course.name || ''),
      page: course && course.page ? String(course.page) : '',
      reason: stripDisplayText(course && course.reason || '')
    };
  }

  function serviceNotice(state) {
    return {
      phase: state.phase || PHASES.DISCOVERY,
      reply: '我這邊正在幫你整理，剛剛連線慢了一點。你先不要重填資料，等一下再送一次，我會接著你前面講的內容繼續看。',
      next_question: '',
      profile_spec: null,
      course_path: [],
      cta_ready: false,
      transient_error: true
    };
  }

  function safeCommercialNotice(state) {
    return {
      phase: state.phase || PHASES.DISCOVERY,
      reply: '目前已確認的課程資訊我整理在左側場次表。吉隆坡場日期已確認，金額由顧問依最新公告回覆；複訓費用是 NT$ 3,200。',
      next_question: '',
      profile_spec: null,
      course_path: [],
      cta_ready: false
    };
  }

  function defaultCoursePath(state) {
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
    if (isCoursePathReady(state, result)) state.course_path = result.course_path || defaultCoursePath(state);
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
      course_path: coursePathReady ? (result.course_path || defaultCoursePath(state)) : null,
      cta: coursePathReady ? {
        signup_url: 'https://docs.google.com/forms/d/e/1FAIpQLScFcX7QtpCpUozxWGKv9nSj6Ur9h-gR6dwA5Dqm9BG7CVJ9Nw/viewform?usp=header',
        line_url: 'https://line.me/ti/p/jzdho94spl'
      } : null
    };
  }

  function isCoursePathReady(state, result) {
    return Boolean(state.recommendation_allowed && (result.cta_ready || (Array.isArray(result.course_path) && result.course_path.length)));
  }

  function updateDeterministicState(state, text) {
    const deterministic = getDeterministicEngine();
    if (!state.deterministic_state || !deterministic || typeof deterministic.transition !== 'function') return;
    const response = deterministic.transition(state.deterministic_state, text);
    if (response && response.state) state.deterministic_state = response.state;
  }

  function analyzeDiscoveryEvidence(messages, profile) {
    const userMessages = (messages || [])
      .filter((msg) => msg.role === 'user')
      .map((msg) => String(msg.content || '').trim())
      .filter(Boolean);
    const slots = extractDiscoverySlots(messages, profile);
    const effectiveMessages = userMessages.filter(isEffectiveDiscoveryAnswer);
    const coverage = {
      background: Boolean(slots.background),
      product: Boolean(slots.product),
      customer: Boolean(slots.customer),
      problem: Boolean(slots.problem),
      goal: Boolean(slots.goal)
    };
    const missing = Object.keys(coverage).filter((key) => !coverage[key]);
    return {
      effective_turns: effectiveMessages.length,
      minimum_turns_required: 3,
      coverage,
      slots,
      missing,
      can_build_report: effectiveMessages.length >= 3 && coverage.product && coverage.customer && coverage.problem && coverage.goal,
      last_effective_answer: effectiveMessages[effectiveMessages.length - 1] || ''
    };
  }

  function isEffectiveDiscoveryAnswer(text) {
    const value = String(text || '').trim();
    if (!value) return false;
    if (isAgreement(value) || isDisagreement(value)) return false;
    if (/(時間|日期|開課|多少錢|價格|費用|名額|複訓|重修|課程學什麼|會學到什麼)/.test(value)) return false;
    return /[A-Za-z0-9\u4e00-\u9fff]/.test(value);
  }

  function extractDiscoverySlots(messages, profile) {
    const profileProblems = profile && Array.isArray(profile.problems) ? profile.problems.filter(Boolean).join('、') : '';
    const profileGoals = profile && Array.isArray(profile.goals) ? profile.goals.filter(Boolean).join('、') : '';
    const slots = {
      background: [profile && roleLabel(profile.role), profile && profile.industry].filter(Boolean).join(' / '),
      product: '',
      customer: '',
      problem: profileProblems,
      goal: profileGoals,
      last_user_answer: ''
    };
    const userMessages = (messages || [])
      .filter((msg) => msg.role === 'user')
      .map((msg) => stripDisplayText(msg.content))
      .filter(Boolean);
    userMessages.forEach((text) => learnSlotsFromText(slots, text));
    slots.last_user_answer = userMessages[userMessages.length - 1] || '';
    return slots;
  }

  function learnSlotsFromText(slots, text) {
    const value = stripDisplayText(text);
    const normalized = normalizeForEvidence(value);
    if (!slots.product) {
      const product = extractProduct(value);
      if (product) slots.product = product;
    }
    if (!slots.customer) {
      const customer = extractCustomer(value);
      if (customer) slots.customer = customer;
    }
    const problem = extractProblem(value);
    if (problem && !slots.problem.includes(problem)) slots.problem = appendSlot(slots.problem, problem);
    const goal = extractGoal(value);
    if (goal && !slots.goal.includes(goal)) slots.goal = appendSlot(slots.goal, goal);
    if (/講過了|問過了|同一個問題|一直問|鬼打牆|重複/.test(normalized)) {
      slots.problem = appendSlot(slots.problem, '使用者覺得問題重複，需要換方式問');
    }
  }

  function extractProduct(text) {
    const value = stripDisplayText(text);
    const patterns = [
      /(?:我)?(?:主要)?(?:賣|銷售|做|提供|介紹)([^，。,.、\n]+?)(?:給|，|。|,|\.|客戶|對象|$)/,
      /(?:商品|產品|服務|方案)是([^，。,.、\n]+)/
    ];
    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match && match[1]) return cleanupSlot(match[1]);
    }
    const known = value.match(/(保時捷|賓士|BMW|特斯拉|汽車|車|房地產|房子|保險|醫美|美容|課程|顧問服務|顧問|軟體|系統|投資|營養品)/);
    if (known) return known[1];
    if (value.length <= 12 && !extractCustomer(value) && !extractGoal(value) && !/(講過|問過|不要|不是)/.test(value)) return value;
    return '';
  }

  function extractCustomer(text) {
    const value = stripDisplayText(text);
    const patterns = [
      /(?:客戶|對象)(?:通常|主要|多半|大多)?(?:是|為)?([^，。,.、\n]+)/,
      /(?:賣給|服務)([^，。,.、\n]+)/
    ];
    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match && match[1]) return cleanupSlot(match[1]);
    }
    const known = value.match(/(企業老闆|企業主|老闆|高階主管|主管|醫師|醫生|媽媽|爸爸|家庭客戶|車主|消費者|買家|會員|業務員|團隊)/);
    if (known) return known[1];
    return '';
  }

  function extractProblem(text) {
    const value = stripDisplayText(text);
    const known = value.match(/(太貴|再想想|考慮看看|考慮|拒絕|異議|沒成交|成交不了|信任不足|追蹤亂|很忙|沒結果|名單不夠|看不懂客戶|講不清楚|客戶沒回|已讀不回|預算|比較)/);
    return known ? known[1] : '';
  }

  function extractGoal(text) {
    const value = stripDisplayText(text);
    const known = value.match(/(成交|提升成交|建立信任|增加名單|開發名單|追蹤|效率|省時間|表達|介紹產品|講故事|帶團隊|複製團隊)/);
    return known ? known[1] : '';
  }

  function cleanupSlot(value) {
    return stripDisplayText(value)
      .replace(/^(我的|主要|通常|多半|大多|是|為)/, '')
      .replace(/(的人|這種人)$/, '')
      .trim();
  }

  function appendSlot(current, value) {
    return [current, value].filter(Boolean).join('、');
  }

  function roleLabel(role) {
    const map = {
      sales_consultant: '銷售顧問 / 業務',
      leader: '主管 / 店長 / 團隊帶領者',
      owner: '老闆 / 經營者',
      training_buyer: '企業課程安排者'
    };
    return map[role] || '';
  }

  function isCompleteProfileSpec(spec) {
    if (!spec || typeof spec !== 'object') return false;
    if (!String(spec.disc_type || '').match(/[DISC]/i)) return false;
    if (!String(spec.life_number || '').match(/[1-9]/)) return false;
    if (!hasThreeCompleteItems(spec.sales_advantages)) return false;
    if (!hasThreeCompleteItems(spec.life_talents)) return false;
    if (String(spec.practical_advice || '').trim().length < 12) return false;
    if (String(spec.final_quote || '').trim().length < 4) return false;
    return true;
  }

  function hasThreeCompleteItems(items) {
    return Array.isArray(items) && items.length >= 3 && items.slice(0, 3).every((item) => (
      String(item && item.title || '').trim().length >= 2 &&
      [item && item.insight, item && item.strategy].filter(Boolean).join('').trim().length >= 8
    ));
  }

  function normalizeForEvidence(text) {
    return String(text || '').trim().toLowerCase();
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
    return stripDisplayText(reply)
      .replace(/我先不急著推薦課程。?/g, '')
      .replace(/先判斷像不像你，再推薦課程。?/g, '')
      .replace(/我目前不直接猜。?/g, '')
      .replace(/你先跟我說清楚一點：?/g, '')
      .replace(/我還差一點點就能幫你整理報告。?/g, '')
      .replace(/最後我再確認一題：?/g, '')
      .replace(/最大卡點/g, '目前要整理的地方')
      .replace(/很卡/g, '不順')
      .replace(/卡住/g, '遇到狀況')
      .replace(/成交節奏/g, '成交方式')
      .replace(/\bAI\b/g, '顧問')
      .trim();
  }

  function preventRepeatedReply(state, reply) {
    const clean = stripDisplayText(reply);
    const slots = state.discovery_slots || extractDiscoverySlots(state.messages || [], state.profile || {});
    if ((slots.product || slots.customer) && /(主要賣什麼|賣什麼|客戶通常|哪一種人|客戶是哪)/.test(clean)) {
      const productText = slots.product ? `你剛剛說的是${slots.product}` : '你的商品我已經先記下來';
      const customerText = slots.customer ? `對象是${slots.customer}` : '客戶對象我會接著確認';
      return `${productText}，${customerText}。我往下幫你看成交現場：最近一次沒有往前走，對方是卡在價格、信任，還是你不確定下一步怎麼推？`;
    }
    const lastAssistant = [...(state.messages || [])]
      .reverse()
      .find((msg) => msg.role === 'assistant');
    if (!lastAssistant) return clean;
    const previous = stripDisplayText(lastAssistant.content);
    if (!previous || normalizeForEvidence(previous) !== normalizeForEvidence(clean)) return clean;
    if (slots.product && slots.customer) {
      return `這題我剛剛問過了，我換個方式問你。以你賣的${slots.product}來說，${slots.customer}最常沒有往前走，是因為價格、信任，還是你不知道下一步怎麼推？`;
    }
    return '這題我剛剛問過了，我換個方式問你。你用一句話講現在最想改善的成交結果就好。';
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
      const matches = text.match(/(?:NT\$|新台幣|台幣|TWD)\s?[\d,]+|[\d,]+\s?元/g) || [];
      for (const match of matches) {
        const n = Number((match.match(/[\d,]+/) || [''])[0].replace(/,/g, ''));
        if (n && !allowed.has(n)) return true;
      }
    }
    return false;
  }

  function trimQuote(value) {
    const text = stripDisplayText(value).replace(/[「」"']/g, '').trim();
    return text.length > 30 ? text.slice(0, 30) : text;
  }

  function stripDisplayText(value) {
    return String(value || '')
      .replace(/<\/?[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;\/?[^&]+&gt;/g, '')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
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
    analyzeDiscoveryEvidence,
    isCompleteProfileSpec,
    PHASES
  };
});
