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
    timeout_ms: 4500
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
    if (!text) return formatClientResponse(next, buildDeterministicResponse(next));
    next.messages.push({ role: 'user', content: text });
    updateDeterministicState(next, text);
    next.discovery_slots = extractDiscoverySlots(next.messages, next.profile);
    next.discovery_evidence = analyzeDiscoveryEvidence(next.messages, next.profile);

    if (isServiceObjection(text)) {
      next.recommendation_allowed = false;
      if (next.profile_spec) next.phase = PHASES.REVISION;
      const recovery = buildSixStepRecovery(next, text);
      mergeResultIntoState(next, recovery);
      next.messages.push({ role: 'assistant', content: recovery.reply });
      return formatClientResponse(next, recovery);
    }

    if (isAgreement(text) && next.profile_spec) {
      next.recommendation_allowed = true;
      next.phase = PHASES.RECOMMENDATION;
      const recommendation = buildAgreementRecommendation(next);
      mergeResultIntoState(next, recommendation);
      next.messages.push({ role: 'assistant', content: recommendation.reply });
      return formatClientResponse(next, recommendation);
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
      '- 如果學生說「看不懂」「不準」「不像」「不好用」「你一直問一樣的」，必須用拒絕處理 6 句循環：先同理、問他指哪一段、確認他從哪句覺得不清楚、用 MBAF 改成白話利益點、確認是否比較清楚、再給下一個很容易回答的問題。不可回同一句。',
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
      return buildDeterministicResponse(state);
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
    if (!normalized.reply) return buildDeterministicResponse(state);
    if (normalized.profile_spec && (!discovery.can_build_report || !isCompleteProfileSpec(normalized.profile_spec))) {
      return discovery.can_build_report
        ? buildDeterministicProfileReady(state)
        : buildDeterministicQuestion(state);
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
      reply: '我正在幫你整理銷售天賦，先照你前面講的內容往下看。',
      next_question: '',
      profile_spec: null,
      course_path: [],
      cta_ready: false,
      transient_error: true
    };
  }

  function buildDeterministicResponse(state) {
    const latest = state.discovery_slots && state.discovery_slots.last_user_answer || '';
    if (isCourseCommercialQuestion(latest)) {
      return safeCommercialNotice(state);
    }
    if (isServiceObjection(latest)) {
      return buildSixStepRecovery(state, latest);
    }
    if (state.recommendation_allowed) {
      return buildAgreementRecommendation(state);
    }
    const discovery = analyzeDiscoveryEvidence(state.messages || [], state.profile || {});
    return discovery.can_build_report ? buildDeterministicProfileReady(state) : buildDeterministicQuestion(state);
  }

  function buildAgreementRecommendation(state) {
    const path = defaultCoursePath(state);
    const first = path && path[0] && path[0].name ? stripDisplayText(path[0].name) : '直指人心';
    const name = state.profile && state.profile.name ? `${stripDisplayText(state.profile.name)}，` : '';
    return {
      phase: PHASES.RECOMMENDATION,
      reply: `${name}太好了，有像就代表方向抓對了！我直接把最適合你的學習順序放在報告底下。\n\n第一步先從「${first}」開始，先把你最自然的成交方式變成方法，後面再接追蹤、表達和成交，進步會更快。`,
      next_question: '',
      profile_spec: null,
      course_path: path,
      cta_ready: true
    };
  }

  function buildDeterministicQuestion(state) {
    const slots = state.discovery_slots || extractDiscoverySlots(state.messages || [], state.profile || {});
    const question = chooseDeterministicQuestion(slots);
    return {
      phase: PHASES.DISCOVERY,
      reply: question,
      next_question: question,
      profile_spec: null,
      course_path: [],
      cta_ready: false
    };
  }

  function chooseDeterministicQuestion(slots) {
    if (!slots.product && !slots.customer) {
      return '好，我先抓方向。你用一句話跟我說：你現在主要賣什麼？你的客戶通常是哪一種人？';
    }
    if (!slots.product) {
      return `我先抓到你的客戶是${slots.customer}。那你現在主要賣的是什麼產品或服務？`;
    }
    if (!slots.customer) {
      return `我先抓到你賣的是${slots.product}。那通常會買單的是哪一種客戶？`;
    }
    if (!slots.problem) {
      return `好，我抓到了，你賣的是${slots.product}，對象是${slots.customer}。最近一次沒有往前走，對方是停在價格、信任，還是一直說再想想？`;
    }
    if (!slots.goal) {
      return `我有抓到你遇到的狀況了。那你現在最想先解決哪一件事？成交、信任、追蹤、表達價值，還是每天太忙沒結果？`;
    }
    return `你前面講的我都記下來了。最後補一個真實情境就好：最近一次客戶沒有往前走，他原話大概怎麼說？`;
  }

  function buildSixStepRecovery(state, text) {
    const slots = state.discovery_slots || extractDiscoverySlots(state.messages || [], state.profile || {});
    const name = state.profile && state.profile.name ? `${state.profile.name}，` : '';
    const hasReport = Boolean(state.profile_spec);
    const repeated = /講過了|問過了|同一個問題|一直問|鬼打牆|重複/.test(text);
    const inaccurate = /不準|不像|不對|不太準|不太像/.test(text);
    const opening = repeated
      ? `${name}你說得對，剛剛那樣一直問，會讓人覺得煩。`
      : inaccurate
        ? `${name}我懂，報告如果不像你，就代表我剛剛抓到的重點還不夠貼近你的現場。`
        : `${name}我懂，你看不懂的時候，我不應該再丟同一句話給你。`;
    const scopeQuestion = hasReport
      ? '你指的是哪一段不準？是行為模式、銷售優點、生涯運數，還是學習順序？'
      : '你指的是哪裡看不懂？是我問的問題、報告邏輯，還是你不知道要怎麼回答？';
    const sourceQuestion = hasReport
      ? '你是從哪一句開始覺得不像你？你直接貼一句或用白話講，我就能幫你重整。'
      : '我換成最簡單的方式：我不是要考你，我是要抓你的銷售現場。';
    const mbaf = hasReport
      ? '我先把好處講清楚：你補充得越具體，報告就越像你本人，後面的課程順序也會更準。'
      : buildRecoveryBenefit(slots);
    const nextQuestion = hasReport
      ? '你直接回我：「哪一段不像」加上一句原因就好。'
      : chooseRecoveryQuestion(slots);
    return {
      phase: hasReport ? PHASES.REVISION : PHASES.DISCOVERY,
      reply: `${opening}\n\n${scopeQuestion}\n${sourceQuestion}\n${mbaf}\n\n這樣有比較清楚嗎？${nextQuestion}`,
      next_question: nextQuestion,
      profile_spec: null,
      course_path: [],
      cta_ready: false
    };
  }

  function buildRecoveryBenefit(slots) {
    if (!slots.product && !slots.customer) {
      return '你只要告訴我你賣什麼、賣給誰，我就能先判斷你的成交方式比較偏信任型、推進型、故事型，還是專業型。';
    }
    if (!slots.problem) {
      return '你只要講最近客戶沒有買的原因，我就能分辨是信任、價格、需求，還是追蹤出了問題。';
    }
    return '你只要講最想解決的結果，我就能把報告整理成對你有用的銷售優點、天賦和學習路徑。';
  }

  function chooseRecoveryQuestion(slots) {
    if (!slots.product || !slots.customer) return '你回我一句就好：你賣什麼？客戶是誰？';
    if (!slots.problem) return '你回我一句就好：最近客戶最常用什麼理由沒有買？';
    if (!slots.goal) return '你回我一句就好：你現在最想先改善成交、信任、追蹤，還是表達價值？';
    return '你回我一句就好：最近一次客戶沒有往前走，他原話大概怎麼說？';
  }

  function buildDeterministicProfileReady(state) {
    const profile = buildGuaranteedProfile(state);
    return {
      phase: PHASES.PROFILE_READY,
      reply: `${state.profile && state.profile.name ? state.profile.name + '，' : ''}我已經把你剛剛講的銷售現場整理好了。你不是沒有能力，而是要把自己最自然的成交方式放大。\n\n你看完之後，覺得像你嗎？有準嗎？`,
      next_question: '',
      profile_spec: profile,
      course_path: [],
      cta_ready: false
    };
  }

  function buildGuaranteedProfile(state) {
    const deterministic = getDeterministicEngine();
    const base = state.deterministic_state && deterministic ? deterministic.buildProfileSpec(state.deterministic_state) : null;
    const computed = state.deterministic_state && state.deterministic_state.computed ? state.deterministic_state.computed : {};
    const disc = base && base.disc_type ? base.disc_type : deriveResponseStrategy(state).disc_label || 'I';
    const primaryDisc = String(disc || 'I').match(/[DISC]/i);
    const lifeNumber = computed.life_number || extractLifeDigit(base && base.life_number) || '';
    const slots = state.discovery_slots || extractDiscoverySlots(state.messages || [], state.profile || {});
    const firstCourse = base && base.next_skill && base.next_skill.course ? base.next_skill.course : mapSlotsToCourse(slots);
    return {
      disc_type: stripDisplayText(disc),
      life_number: String(lifeNumber || ''),
      sales_advantages: buildDiscAdvantages(primaryDisc ? primaryDisc[0].toUpperCase() : 'I'),
      life_talents: buildLifeTalents(computed),
      student_strength: buildStudentStrength(slots, primaryDisc ? primaryDisc[0].toUpperCase() : 'I'),
      persuasion_power: '把客戶真正擔心的地方問出來，再把價值講成他聽得懂的改變。',
      practical_advice: buildPracticalAdvice(slots),
      final_quote: trimQuote(selectPositiveQuote(primaryDisc ? primaryDisc[0].toUpperCase() : 'I')),
      primary_course: firstCourse
    };
  }

  function buildDiscAdvantages(disc) {
    const map = {
      D: [
        ['目標導向的推進力', '你天生比較能抓重點，不容易讓對話一直繞圈。', '適合把客戶的猶豫收斂成清楚的下一步。'],
        ['決策導向的說服力', '你能把複雜資訊整理成明確選項，讓客戶比較敢做決定。', '記得先聽完顧慮，再帶回結果與效益。'],
        ['高效的執行力', '你重視效率，適合把追蹤和成交變成流程。', '把每次互動都留下下一步，成交會更穩。']
      ],
      I: [
        ['互動感染力', '你容易讓客戶放鬆，願意多講真話。', '先用故事和共鳴打開情緒，再用問題接到需求。'],
        ['氣氛帶動力', '你能讓銷售對話有溫度，不會像冷冰冰的介紹。', '記得把熱度接到下一步，不只停在聊得開心。'],
        ['故事型說服力', '你適合把產品講得有畫面，讓客戶感覺跟自己有關。', '用 BAF 先講好處，再補案例，說服力會更穩。']
      ],
      S: [
        ['安全感建立力', '你不會急著壓客戶做決定，對方比較敢說真話。', '先問出真正擔心，再進入價值說明。'],
        ['長期信任力', '你適合經營需要時間醞釀的客戶，不是只靠一招成交。', '每次互動都留下一個清楚下一步，信任會累積成成交。'],
        ['感受照顧力', '你能注意到客戶的不安，這會讓對方覺得你懂他。', '先接住情緒，再處理價格或方案。']
      ],
      C: [
        ['專業信任力', '你重視依據與細節，客戶會覺得你不是亂講。', '適合用比較、案例和流程讓客戶安心。'],
        ['問題拆解力', '你不容易被表面拒絕帶走，能往真正原因追。', '用五連問釐清對方卡的是預算、信任還是需求。'],
        ['系統成交力', '你能把成交變成步驟，而不是只靠臨場反應。', '把常見拒絕整理成固定回應，成交會更穩。']
      ]
    };
    return (map[disc] || map.I).map(([title, insight, strategy]) => ({ title, insight, strategy }));
  }

  function buildLifeTalents(computed) {
    const number = computed && computed.life_number ? computed.life_number : '';
    const birthday = computed && computed.birthday_number ? computed.birthday_number : '';
    const activeLine = computed && Array.isArray(computed.active_lines) && computed.active_lines.length ? normalizeActiveLine(computed.active_lines[0]) : '';
    const first = lifeTalentFor(number);
    const second = birthday && birthday !== number ? lifeTalentFor(birthday) : { title: '提問力', insight: '你適合把表面答案往下追，找出真正的購買理由。', strategy: '不要急著解釋，先讓客戶把心裡話說出來。' };
    const third = activeLine ? lineTalentFor(activeLine) : { title: '整合優勢', insight: '你能把客戶感受、需求和方案整理在一起。', strategy: '把每次對話記錄下來，下一次追蹤會更有方向。' };
    return [first, second, third].slice(0, 3);
  }

  function lifeTalentFor(number) {
    const map = {
      1: ['1 號：主導力', '你有帶方向的能力，適合在混亂時幫客戶看見下一步。', '用清楚選項引導，不要只丟資訊給客戶自己想。'],
      2: ['2 號：感受力', '你能感覺到客戶情緒變化，適合先建立安全感。', '先接住顧慮，再用問題帶出真正需求。'],
      3: ['3 號：表達力', '你有把事情說得有畫面的天賦。', '把規格翻成故事與好處，客戶會更容易有感。'],
      4: ['4 號：流程力', '你適合把銷售步驟整理清楚，靠紀律累積成果。', '把追蹤、紀錄與下一步固定下來，成交不靠記憶。'],
      5: ['5 號：開發力', '你有接觸新機會與打開市場的能力。', '把開發後的追蹤接住，機會才不會散掉。'],
      6: ['6 號：服務力', '你會照顧人，也容易讓客戶覺得被重視。', '不要只服務到最後，記得自然提出下一步。'],
      7: ['7 號：洞察力', '你會想知道客戶猶豫背後真正的原因。', '用提問找出他是怕買錯、怕預算，還是還沒看見差異。'],
      8: ['8 號：成果力', '你對價值交換和結果很敏銳。', '把價格連到效益，讓客戶看見投入後的回收。'],
      9: ['9 號：格局力', '你容易從大局看人與問題。', '把你的經驗整理成方法，會更適合帶團隊或一對多影響。']
    };
    const item = map[number] || map[7];
    return { title: item[0], insight: item[1], strategy: item[2] };
  }

  function lineTalentFor(line) {
    const label = normalizeActiveLine(line);
    return {
      title: label ? `${label} 連線：整合優勢` : '連線整合力',
      insight: '你能把不同訊息串起來，整理出客戶真正需要的方向。',
      strategy: '把客戶的感受、預算、需求與下一步寫清楚，追蹤會更有力量。'
    };
  }

  function normalizeActiveLine(value) {
    if (Array.isArray(value)) return value.map((item) => normalizeActiveLine(item)).filter(Boolean).join('-');
    if (value && typeof value === 'object') {
      if (Array.isArray(value.numbers)) return value.numbers.map((item) => stripDisplayText(item)).filter(Boolean).join('-');
      return stripDisplayText(value.label || value.name || value.title || value.line || value.id || '');
    }
    return stripDisplayText(value);
  }

  function buildStudentStrength(slots, disc) {
    const product = slots.product || '你的產品';
    const customer = slots.customer || '你的客戶';
    if (disc === 'D') return `你適合把${product}的價值講成清楚結果，帶著${customer}往下一步走。`;
    if (disc === 'C') return `你適合用專業與邏輯，讓${customer}安心看懂${product}的價值。`;
    if (disc === 'S') return `你適合先建立信任，再讓${customer}慢慢看見${product}的價值。`;
    return `你適合用互動與故事，讓${customer}對${product}產生感覺。`;
  }

  function buildPracticalAdvice(slots) {
    const problem = slots.problem || '客戶猶豫';
    if (/忙|追蹤|漏掉|效率/.test(slots.problem || slots.goal || '')) {
      return '下一步先把客戶資料、追蹤時間和下一次要問的問題整理起來，讓每一次努力都能累積成結果。';
    }
    if (/太貴|價格|預算/.test(problem)) {
      return '下次客戶說太貴時，先問他是在比較價格、擔心買錯，還是還沒看見服務帶來的改變。';
    }
    return '下一次客戶猶豫時，不要急著解釋。先問出真正原因，再把你的價值接到他的需求上。';
  }

  function selectPositiveQuote(disc) {
    const map = {
      D: '結果清楚了，成交就近了。',
      I: '讓客戶有感，價值就會被看見。',
      S: '信任到了，成交就近了。',
      C: '問題問準了，答案就會出現。'
    };
    return map[disc] || '銷售力不從心，因為從沒遇過李泰欣。';
  }

  function mapSlotsToCourse(slots) {
    const text = [slots.problem, slots.goal].join(' ');
    if (/名單|開發|流量|客戶不夠/.test(text)) return 'liuliang';
    if (/忙|追蹤|效率|漏掉/.test(text)) return 'xiaolu';
    if (/看不懂|信任/.test(text)) return 'zhizhi';
    if (/表達|價值|講不清楚|故事/.test(text)) return 'yanzhi';
    return 'chengjiao';
  }

  function extractLifeDigit(value) {
    const digits = String(value || '').match(/[1-9]/g) || [];
    return digits.length ? digits[digits.length - 1] : '';
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
    if (isCourseCommercialQuestion(value)) return false;
    return /[A-Za-z0-9\u4e00-\u9fff]/.test(value);
  }

  function isCourseCommercialQuestion(text) {
    const value = String(text || '').trim();
    if (!value) return false;
    const isSalesObjection = /(客戶|對方|他|她).{0,12}(價格|太貴|預算|比較)|價格太高|太貴|預算不夠|再比較/.test(value);
    if (isSalesObjection && !/(課程|開課|複訓|重修|報名|學費|上課)/.test(value)) return false;
    return /(開課|上課時間|課程時間|日期|報名|名額|複訓|重修|課程學什麼|會學到什麼|學費|課程費用|課程價格|多少錢|五堂課全包)/.test(value);
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
      last_asked_slot: '',
      last_user_answer: ''
    };
    let expectedSlot = '';
    const userMessages = [];
    for (const msg of messages || []) {
      const content = stripDisplayText(msg && msg.content);
      if (!content) continue;
      if (msg.role === 'assistant') {
        expectedSlot = inferAskedSlot(content) || expectedSlot;
        slots.last_asked_slot = expectedSlot;
        continue;
      }
      if (msg.role !== 'user') continue;
      userMessages.push(content);
      learnSlotsFromText(slots, content, expectedSlot);
      expectedSlot = '';
    }
    slots.last_user_answer = userMessages[userMessages.length - 1] || '';
    return slots;
  }

  function learnSlotsFromText(slots, text, expectedSlot) {
    const value = stripDisplayText(text);
    const normalized = normalizeForEvidence(value);
    const contextual = normalizeShortAnswer(value);
    if (expectedSlot === 'product' && !slots.product && contextual) {
      slots.product = contextual;
    }
    if (expectedSlot === 'customer' && !slots.customer && contextual) {
      slots.customer = contextual;
    }
    if (expectedSlot === 'problem' && contextual) {
      slots.problem = appendUniqueSlot(slots.problem, contextual);
    }
    if (expectedSlot === 'goal' && contextual) {
      slots.goal = appendUniqueSlot(slots.goal, contextual);
    }
    if (!slots.product) {
      const product = extractProduct(value);
      if (product) slots.product = product;
    }
    if (!slots.customer) {
      const customer = extractCustomer(value);
      if (customer) slots.customer = customer;
    }
    const problem = extractProblem(value);
    if (problem) slots.problem = appendUniqueSlot(slots.problem, problem);
    const goal = extractGoal(value);
    if (goal) slots.goal = appendUniqueSlot(slots.goal, goal);
    if (/講過了|問過了|同一個問題|一直問|鬼打牆|重複/.test(normalized)) {
      slots.problem = appendUniqueSlot(slots.problem, '使用者覺得問題重複，需要換方式問');
    }
  }

  function inferAskedSlot(text) {
    const value = stripDisplayText(text);
    if (/(主要賣什麼|賣的是什麼|產品或服務|商品是什麼|服務是什麼)/.test(value)) return 'product';
    if (/(哪一種客戶|哪種客戶|客戶通常|客戶是誰|對象是誰|誰會買|會買單的是|買單的是哪)/.test(value)) return 'customer';
    if (/(沒有往前走|沒有成交|沒有買|最常用什麼理由|停在價格|停在.*信任|再想想|真正擔心|卡在哪|遇到的狀況)/.test(value)) return 'problem';
    if (/(最想先解決|最想改善|最想達成|希望.*變得更強|哪個地方更強|想提升|想要得到)/.test(value)) return 'goal';
    return '';
  }

  function normalizeShortAnswer(text) {
    const value = cleanupSlot(text)
      .replace(/^(就是|應該是|大概是|主要是|通常是|多半是)/, '')
      .trim();
    if (!value) return '';
    if (value.length > 24) return '';
    if (isAgreement(value) || isDisagreement(value) || isCourseCommercialQuestion(value)) return '';
    if (/(看不懂|不懂你|不好用|沒反應|講過了|問過了|同一個問題|一直問|鬼打牆|重複)/.test(value)) return '';
    return value;
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
    const known = value.match(/(上班族|小資族|白領|粉領|企業老闆|企業主|老闆|高階主管|主管|醫師|醫生|媽媽|爸爸|家庭客戶|車主|消費者|買家|會員|業務員|團隊)/);
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

  function appendUniqueSlot(current, value) {
    const clean = cleanupSlot(value);
    if (!clean) return current || '';
    const existing = String(current || '');
    if (existing.split('、').some((item) => item === clean) || existing.includes(clean)) return existing;
    return appendSlot(existing, clean);
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
      .replace(/卡在/g, '停在')
      .replace(/很卡/g, '不順')
      .replace(/卡住/g, '遇到狀況')
      .replace(/成交節奏/g, '成交方式')
      .replace(/\bAI\b/g, '顧問')
      .trim();
  }

  function preventRepeatedReply(state, reply) {
    const clean = stripDisplayText(reply);
    const slots = state.discovery_slots || extractDiscoverySlots(state.messages || [], state.profile || {});
    if ((slots.product || slots.customer) && /(主要賣什麼|賣什麼|客戶通常|哪一種人|哪一種客戶|哪種客戶|客戶是哪|會買單的是|誰會買|買單的是哪)/.test(clean)) {
      const productText = slots.product ? `你剛剛說的是${slots.product}` : '你的商品我已經先記下來';
      const customerText = slots.customer ? `對象是${slots.customer}` : '客戶對象我會接著確認';
      return `${productText}，${customerText}。我往下幫你看成交現場：最近一次沒有往前走，對方是停在價格、信任，還是你不確定下一步怎麼推？`;
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
    if (Array.isArray(value)) value = value.map((item) => stripDisplayText(item)).filter(Boolean).join('、');
    if (value && typeof value === 'object') {
      value = value.title || value.name || value.label || value.line || value.id || value.insight || value.strategy || '';
    }
    return String(value || '')
      .replace(/<\/?[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;\/?[^&]+&gt;/g, '')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  function isAgreement(text) {
    const value = stripDisplayText(text).replace(/[「」"']/g, '').trim();
    if (/(不像|不太像|不準|不太準|不太對|不是|偏掉|不符合)/.test(value)) return false;
    if (/^(有|有啊|有喔|準|很準|像|像我|有像|有準)$/.test(value)) return true;
    return /(很準|有準|有像|像我|有中|符合|滿對|蠻對|很對|對耶|是我|沒錯)/.test(value);
  }

  function isDisagreement(text) {
    return /(不像|不太像|不準|不太準|不太對|不是|偏掉|不符合|想補充)/.test(text);
  }

  function isServiceObjection(text) {
    const value = String(text || '').trim();
    if (!value) return false;
    return /(看不懂|不懂你|聽不懂|不好用|沒反應|沒用|講過了|問過了|同一個問題|一直問|鬼打牆|重複|不準|不像|不太準|不太像)/.test(value);
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
