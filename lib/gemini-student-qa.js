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
          sales_talents: [
            { title: '銷售天賦 1', insight: '跟他有關的觀察', strategy: '可以怎麼用' },
            { title: '銷售天賦 2', insight: '跟他有關的觀察', strategy: '可以怎麼用' },
            { title: '銷售天賦 3', insight: '跟他有關的觀察', strategy: '可以怎麼用' }
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
      '- 當你已有足夠資訊，phase 設為 profile_ready，產出三點銷售天賦報告，最後問：你覺得這份描述像你嗎？',
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
    const normalized = {
      phase: result.phase || state.phase || PHASES.DISCOVERY,
      reply: sanitizeReply(result.reply || ''),
      next_question: String(result.next_question || ''),
      profile_spec: normalizeProfileSpec(result.profile_spec),
      course_path: Array.isArray(result.course_path) ? result.course_path : [],
      cta_ready: Boolean(result.cta_ready)
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
    const talents = Array.isArray(spec.sales_talents) ? spec.sales_talents.slice(0, 3) : [];
    return {
      disc_type: String(spec.disc_type || ''),
      life_number: String(spec.life_number || ''),
      sales_talents: talents.map((item, index) => ({
        title: String(item.title || `銷售天賦 ${index + 1}`),
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
    const life = state.deterministic_state && state.deterministic_state.computed ? state.deterministic_state.computed.life_number : '';

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
    const talentText = spec && spec.sales_talent ? spec.sales_talent : '信任建立型';
    return {
      disc_type: disc,
      life_number: life ? String(life) : '',
      sales_talents: [
        {
          title: '你容易讓客戶放下防備',
          insight: `你比較像${talentText}，不是靠硬推，而是靠互動中的安全感讓人願意說真話。`,
          strategy: '先用五連問把對方真正擔心的事問出來，再決定要講哪個價值。'
        },
        {
          title: '你適合穩定推進',
          insight: '你不需要把成交做得很壓迫，而是要讓每次互動都有一個小小下一步。',
          strategy: '用二選一或確認式提問推進，例如先確認需求，再確認方案。'
        },
        {
          title: '你要把價值講得更有畫面',
          insight: '客戶不只聽規格，他要知道這件事跟自己有什麼關係。',
          strategy: '用 MBAF，把功能先翻成利益，再用一個真實情境收束。'
        }
      ],
      sales_rhythm: '先建立信任，再用問題找原因，最後用小成交推進。',
      persuasion_power: '把客戶的感受翻成可以行動的理由。',
      practical_advice: '下一次客戶說考慮看看時，不要急著解釋。先問他是在比較方案、擔心預算，還是怕買錯，答案會帶你找到真正的成交入口。',
      final_quote: trimQuote('信任到了，成交就近了。'),
      primary_course: course
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
    if (result.cta_ready && state.recommendation_allowed) state.course_path = result.course_path || fallbackCoursePath(state);
  }

  function formatClientResponse(state, result) {
    return {
      state,
      phase: result.phase || state.phase,
      reply: result.reply,
      next_question: result.next_question || '',
      profile_spec: result.profile_spec || null,
      response_strategy: deriveResponseStrategy(state),
      course_path: result.cta_ready && state.recommendation_allowed ? (result.course_path || fallbackCoursePath(state)) : null,
      cta: result.cta_ready && state.recommendation_allowed ? {
        signup_url: 'https://docs.google.com/forms/d/e/1FAIpQLScFcX7QtpCpUozxWGKv9nSj6Ur9h-gR6dwA5Dqm9BG7CVJ9Nw/viewform?usp=header',
        line_url: 'https://line.me/ti/p/jzdho94spl'
      } : null
    };
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
