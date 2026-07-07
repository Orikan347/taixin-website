(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TaixinStudentQA = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const COURSE_LINKS = {
    signupUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScFcX7QtpCpUozxWGKv9nSj6Ur9h-gR6dwA5Dqm9BG7CVJ9Nw/viewform?usp=header',
    lineUrl: 'https://line.me/ti/p/jzdho94spl',
    courses: {
      liuliang: 'liuliang.html',
      chengjiao: 'chengjiaoditu.html',
      zhizhi: 'zhizhirenxin.html',
      xiaolu: 'jizhixiaolv.html',
      yanzhi: 'yanzhiyouwu.html'
    }
  };

  const COURSE_CATALOG = {
    liuliang: {
      id: 'liuliang',
      name: '流量磁鐵',
      page: COURSE_LINKS.courses.liuliang,
      solves: ['缺客', '名單不足', '客戶不夠多'],
      reason: '先把名單與接觸機會建立起來，讓成交不再只靠緣分。'
    },
    chengjiao: {
      id: 'chengjiao',
      name: '成交地圖',
      page: COURSE_LINKS.courses.chengjiao,
      solves: ['成交不了', '再想想', '不敢逼單', '流程不清楚'],
      reason: '把第一印象、提問、產品介紹與成交推進變成一套可以照著走的流程。'
    },
    zhizhi: {
      id: 'zhizhi',
      name: '直指人心',
      page: COURSE_LINKS.courses.zhizhi,
      solves: ['看不懂客戶', '信任不足', '溝通不順'],
      reason: '先看懂客戶在意什麼，信任建立起來，後面的成交才自然。'
    },
    xiaolu: {
      id: 'xiaolu',
      name: '極致效率',
      page: COURSE_LINKS.courses.xiaolu,
      solves: ['很忙', '沒時間', '資料散亂', '忘記追蹤', '漏掉成交機會', '不知道忙什麼'],
      reason: '把客戶資料、時間安排、追蹤與下一步整理成方法，讓每天的努力真的變成結果。'
    },
    yanzhi: {
      id: 'yanzhi',
      name: '言之有物',
      page: COURSE_LINKS.courses.yanzhi,
      solves: ['表達', '上台', '帶團隊', '複製經驗'],
      reason: '把經驗講清楚、講有感，從一對一成交升級成一對多影響。'
    }
  };

  const DISC_STRATEGIES = {
    D: {
      label: 'D 掌控型',
      tone: 'direct_result_oriented',
      wants: ['結果', '效率', '重點', '下一步'],
      avoid: ['太多情緒安撫', '繞圈', '長篇故事', '不明確'],
      promptStyle: '直接講結論，給明確路徑，少鋪陳。'
    },
    I: {
      label: 'I 影響型',
      tone: 'warm_visual_encouraging',
      wants: ['被理解', '共鳴', '畫面感', '正向可能'],
      avoid: ['太冷', '只給表格', '直接糾正'],
      promptStyle: '先接住感受，用故事和畫面讓他覺得被看見。'
    },
    S: {
      label: 'S 穩定型',
      tone: 'safe_stable_reassuring',
      wants: ['安全感', '穩定', '不要被逼', '可慢慢來'],
      avoid: ['催促', '壓迫', '逼他立刻選'],
      promptStyle: '降低壓力，給小步驟，讓他知道不用急著變強勢。'
    },
    C: {
      label: 'C 分析型',
      tone: 'structured_evidence_based',
      wants: ['邏輯', '依據', '結構', '可驗證資訊'],
      avoid: ['只講感覺', '誇張形容', '沒有證據'],
      promptStyle: '用條列、因果與判斷依據說明。'
    }
  };

  const TALENTS = {
    lead_generation: {
      label: '開發名單型',
      description: '你適合創造接觸機會、經營曝光，讓客戶主動靠近。',
      primaryCourse: 'liuliang'
    },
    trust_building: {
      label: '信任建立型',
      description: '你適合先讓客戶放下防備，再慢慢引導他說出真正想法。',
      primaryCourse: 'zhizhi'
    },
    needs_diagnosis: {
      label: '需求診斷型',
      description: '你適合透過提問把客戶真正的恐懼、夢想與購買動機挖出來。',
      primaryCourse: 'chengjiao'
    },
    value_presentation: {
      label: '價值表達型',
      description: '你適合把產品規格轉成故事、利益與客戶聽得懂的理由。',
      primaryCourse: 'yanzhi'
    },
    objection_handling: {
      label: '異議處理型',
      description: '你需要把拒絕轉成釐清，而不是聽到反對就讓對話結束。',
      primaryCourse: 'chengjiao'
    },
    closing: {
      label: '成交推進型',
      description: '你需要練習在關鍵時刻自然推進，讓對話不只停在聊得很好。',
      primaryCourse: 'chengjiao'
    },
    follow_up_system: {
      label: '系統追蹤型',
      description: '你適合建立客戶資料、追蹤與時間系統，讓努力不漏接。',
      primaryCourse: 'xiaolu'
    },
    stage_expression: {
      label: '舞台表達型',
      description: '你適合把個人經驗講成方法，開始一對多影響與帶人。',
      primaryCourse: 'yanzhi'
    }
  };

  const DISC_AVERSION_LABELS = {
    D: '討厭拖延、沒結果、一直開會卻沒下一步',
    I: '討厭冷冰冰、沒互動、被忽略或氣氛很僵',
    S: '討厭被壓迫、衝突、硬逼客戶立刻決定',
    C: '討厭沒邏輯、資料混亂、承諾沒有根據'
  };

  const OFFERING_REPLY = '已確認的開課時間與金額都整理在頁面「開課時間與金額」。複訓費用已確認：一律 NT$ 3,200。吉隆坡「超級銷冠系統」目前日期已確認為 2026/10/21-10/23，金額由顧問依最新公告回覆；名額未提供，所以不顯示。';

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function createSession(profile) {
    const base = {
      session_id: 'local-' + Date.now(),
      phase: 'intake',
      profile: {
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
        goals: [],
        problems: []
      },
      computed: {
        talent_number: null,
        life_number: null,
        birthday_number: null
      },
      scores: {
        disc: { D: 0, I: 0, S: 0, C: 0 },
        sales_talent: {
          lead_generation: 0,
          trust_building: 0,
          needs_diagnosis: 0,
          value_presentation: 0,
          objection_handling: 0,
          closing: 0,
          follow_up_system: 0,
          stage_expression: 0
        },
        blockers: {}
      },
      evidence: [],
      turns: 0,
      recognition: {
        profile_spec_shown: false,
        user_agreed: false,
        user_disagreed: false
      },
      recommendation_allowed: false
    };
    base.profile = Object.assign(base.profile, profile || {});
    base.profile.goals = Array.isArray(base.profile.goals) ? base.profile.goals : [];
    base.profile.problems = Array.isArray(base.profile.problems) ? base.profile.problems : [];
    if (base.profile.birthdate) {
      base.computed = computeLifeNumbers(base.profile.birthdate);
    }
    applyProfileScores(base);
    return base;
  }

  function computeLifeNumbers(birthdate) {
    const match = String(birthdate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return { talent_number: null, life_number: null, birthday_number: null, reduction_chain: '', life_numbers: [], active_lines: [] };
    }
    const digits = (match[1] + match[2] + match[3]).split('').map(Number);
    const sum = digits.reduce((total, num) => total + num, 0);
    const birthday = match[3].split('').map(Number).reduce((total, num) => total + num, 0);
    const reductionChain = getReductionChain(sum);
    const lifeNumber = reduceNumber(sum);
    const birthdayNumber = reduceNumber(birthday);
    return {
      talent_number: sum,
      life_number: lifeNumber,
      birthday_number: birthdayNumber,
      reduction_chain: reductionChain,
      life_numbers: getLifeNumberSet(reductionChain, birthdayNumber, lifeNumber),
      active_lines: getActiveLines(digits)
    };
  }

  function reduceNumber(value) {
    let current = Number(value) || 0;
    while (current > 9) {
      current = String(current).split('').map(Number).reduce((total, num) => total + num, 0);
    }
    return current;
  }

  function getReductionChain(value) {
    const chain = [];
    let current = Number(value) || 0;
    if (!current) return '';
    chain.push(current);
    while (current >= 10) {
      current = String(current).split('').map(Number).reduce((total, num) => total + num, 0);
      chain.push(current);
    }
    return chain.join('');
  }

  function getLifeNumberSet(reductionChain, birthdayNumber, lifeNumber) {
    const values = String(reductionChain || '').split('').map(Number).filter((num) => num > 0);
    [birthdayNumber, lifeNumber].forEach((num) => {
      if (num && !values.includes(num)) values.push(num);
    });
    return values.slice(0, 3);
  }

  function getActiveLines(digits) {
    const counts = {};
    digits.forEach((digit) => {
      if (digit > 0) counts[digit] = (counts[digit] || 0) + 1;
    });
    const definitions = {
      123: '表達推進線',
      456: '穩定落地線',
      789: '願景影響線',
      147: '執行承諾線',
      258: '協調整合線',
      369: '創意表達線',
      159: '目標貫通線',
      357: '變化突破線'
    };
    return Object.entries(definitions)
      .filter(([line]) => line.split('').every((digit) => counts[digit]))
      .map(([line, name]) => ({ line, name }));
  }

  function applyProfileScores(state) {
    const problems = (state.profile.problems || []).join(' ');
    const goals = (state.profile.goals || []).join(' ');
    const text = normalizeText([problems, goals, state.profile.role, state.profile.industry].join(' '));
    applySignals(state, text);
    applyExplicitDiscSignal(state, state.profile.disc_hate_sales, '銷售上最討厭的事');
    applyExplicitDiscSignal(state, state.profile.disc_hate_workplace, '職場上最受不了的人');
    applyExplicitDiscSignal(state, state.profile.disc_hate_customer, '客戶互動最困擾的地方');
    if (state.profile.role === 'leader' || state.profile.role === 'owner') {
      state.scores.sales_talent.stage_expression += 1;
      state.scores.sales_talent.needs_diagnosis += 1;
      state.scores.disc.D += 0.4;
      state.scores.disc.C += 0.2;
    }
  }

  function applyExplicitDiscSignal(state, value, source) {
    const disc = String(value || '').trim().toUpperCase();
    if (!DISC_STRATEGIES[disc]) return;
    state.scores.disc[disc] += 2.2;
    state.evidence.push(`${source}：${DISC_AVERSION_LABELS[disc]}`);
  }

  function applySignals(state, text) {
    const signalMap = [
      { keys: ['缺客', '名單', '流量', '開發', '陌生'], talent: 'lead_generation', disc: 'D', blocker: '名單不足' },
      { keys: ['成交不了', '再想想', '逼單', '收單', '猶豫'], talent: 'closing', disc: 'S', blocker: '成交推進不足' },
      { keys: ['拒絕', '異議', '太貴', '沒預算', '考慮'], talent: 'objection_handling', disc: 'C', blocker: '異議處理不足' },
      { keys: ['看不懂', '信任', '客戶心裡', '關係', '喜歡'], talent: 'trust_building', disc: 'I', blocker: '信任建立不足' },
      { keys: ['提問', '需求', '五連問', '問題'], talent: 'needs_diagnosis', disc: 'C', blocker: '需求診斷不足' },
      { keys: ['表達', '介紹', '故事', '講不清楚', '產品'], talent: 'value_presentation', disc: 'I', blocker: '價值表達不足' },
      { keys: ['很忙', '效率', '時間', '資料', '追蹤', '忘記', '漏掉', '不知道忙什麼'], talent: 'follow_up_system', disc: 'C', blocker: '追蹤與效率系統不足' },
      { keys: ['上台', '主管', '帶團隊', '複製', '演講'], talent: 'stage_expression', disc: 'D', blocker: '一對多影響不足' },
      { keys: ['快', '結果', '直接', '效率'], talent: 'closing', disc: 'D', blocker: '需要快速結果' },
      { keys: ['安心', '穩定', '怕', '壓力', '不敢'], talent: 'trust_building', disc: 'S', blocker: '安全感不足' },
      { keys: ['數據', '邏輯', '證據', '架構', '流程'], talent: 'needs_diagnosis', disc: 'C', blocker: '需要結構依據' },
      { keys: ['互動', '熱絡', '氣氛', '被喜歡', '共鳴'], talent: 'value_presentation', disc: 'I', blocker: '需要關係共鳴' }
    ];

    signalMap.forEach((signal) => {
      const hit = signal.keys.some((key) => text.includes(normalizeText(key)));
      if (!hit) return;
      state.scores.sales_talent[signal.talent] += 1;
      state.scores.disc[signal.disc] += 1;
      state.scores.blockers[signal.blocker] = (state.scores.blockers[signal.blocker] || 0) + 1;
      state.evidence.push(signal.blocker);
    });
  }

  function analyzeMessage(state, message) {
    const text = normalizeText(message);
    applySignals(state, text);
    if (/(準|像|有中|符合|滿對|蠻對|很對|真的|對耶)/.test(message)) {
      state.recognition.user_agreed = true;
      state.recognition.user_disagreed = false;
      state.recommendation_allowed = true;
      state.phase = 'recommendation';
    }
    if (/(不像|不太像|不準|不太準|不太對|沒有|不是|偏掉|不符合)/.test(message)) {
      state.recognition.user_disagreed = true;
      state.recognition.user_agreed = false;
      state.recommendation_allowed = false;
      state.phase = 'revise_profile';
    }
    if (/(時間|日期|開課|多少錢|價格|費用|名額|複訓|重修)/.test(message)) {
      state.evidence.push('詢問課程時間或金額');
    }
  }

  function getSortedEntries(record) {
    return Object.keys(record)
      .map((key) => ({ key, score: record[key] || 0 }))
      .sort((a, b) => b.score - a.score);
  }

  function getDiscResult(state) {
    const sorted = getSortedEntries(state.scores.disc);
    const top = sorted[0] || { key: 'I', score: 0 };
    const second = sorted[1] || { key: 'S', score: 0 };
    const total = sorted.reduce((sum, item) => sum + item.score, 0) || 1;
    const confidence = top.score / total;
    const mixed = Math.abs(top.score - second.score) < 0.12 * total && second.score > 0;
    return {
      primary: top.key,
      secondary: mixed ? second.key : second.key,
      label: mixed ? `${top.key} 偏 ${second.key}` : top.key,
      confidence: Number(confidence.toFixed(2)),
      isMixed: mixed
    };
  }

  function getTopTalent(state) {
    const sorted = getSortedEntries(state.scores.sales_talent);
    const top = sorted.find((item) => item.score > 0) || { key: 'trust_building', score: 0 };
    return Object.assign({ id: top.key, score: top.score }, TALENTS[top.key]);
  }

  function getTopBlocker(state) {
    const sorted = getSortedEntries(state.scores.blockers);
    return sorted.length ? sorted[0].key : '信任建立不足';
  }

  function getLifeNumberNote(number) {
    const notes = {
      1: '你適合練習把主導力用在帶方向，而不是急著推進。',
      2: '你很在意關係和感受，銷售上要學會在溫和裡保留立場。',
      3: '你有表達與感染力，若把故事和結構補起來，影響力會更穩。',
      4: '你適合靠流程與紀律累積成果，關鍵是不要讓細節拖慢行動。',
      5: '你適合開發與變化，但需要一套追蹤系統接住機會。',
      6: '你有照顧與服務感，適合長期信任型銷售，但要練習自然成交。',
      7: '你適合用專業與洞察建立信任，記得把想法說得更白話。',
      8: '你重視成果與價值交換，適合練習更精準的成交推進。',
      9: '你容易站在大局看人，適合把經驗整理成能影響更多人的方法。'
    };
    return notes[number] || '生涯運數目前只作學習與溝通參考，不作命定判斷。';
  }

  function nextDiscoveryQuestion(state) {
    const disc = getDiscResult(state);
    const talent = getTopTalent(state);
    if (!state.profile.birthdate) return '我會用西元生日幫你做生涯運數參考。你方便先填生日嗎？';
    if (disc.confidence < 0.5 && state.turns < 3) {
      return '當客戶說「我再想想」，你通常第一個反應是想追問、想解釋、想退一步，還是先觀察他的表情？';
    }
    if (!talent.score) {
      return '你回想一下，過去成交比較順的客戶，是因為你很會開發、很會建立信任、很會說明價值，還是很會追蹤？';
    }
    if (state.turns < 2) {
      return '你比較怕客戶覺得你太強勢，還是比較怕自己講得不夠專業？';
    }
    return null;
  }

  function buildResponseStrategy(state) {
    const disc = getDiscResult(state);
    const primary = DISC_STRATEGIES[disc.primary] || DISC_STRATEGIES.I;
    const secondary = DISC_STRATEGIES[disc.secondary] || DISC_STRATEGIES.S;
    return {
      disc_primary: disc.primary,
      disc_secondary: disc.secondary,
      disc_label: disc.label,
      confidence: disc.confidence,
      tone: primary.tone,
      should_emphasize: primary.wants.concat(secondary.wants.slice(0, 1)),
      should_avoid: primary.avoid,
      prompt_style: primary.promptStyle
    };
  }

  function buildProfileSpec(state) {
    const disc = getDiscResult(state);
    const talent = getTopTalent(state);
    const blocker = getTopBlocker(state);
    const lifeNumber = state.computed.life_number;
    const strategy = buildResponseStrategy(state);
    const strengths = buildStrengths(disc.primary, talent.id);
    const nextSkill = mapBlockerToSkill(blocker, talent.id);
    const toneIntro = buildToneIntro(strategy, talent, blocker);

    return {
      sales_talent: talent.label,
      sales_talent_id: talent.id,
      disc_type: disc.label,
      life_number: lifeNumber,
      reduction_chain: state.computed.reduction_chain || '',
      life_numbers: state.computed.life_numbers || [],
      active_lines: state.computed.active_lines || [],
      life_number_note: getLifeNumberNote(lifeNumber),
      strengths,
      blockers: [blocker],
      best_sales_strategy: buildBestStrategy(talent.id, disc.primary),
      next_skill: nextSkill,
      reply: `${toneIntro}\n\n我先幫你整理一下，我目前看到的是：\n\n1. 你的銷售天賦：${talent.label}\n${talent.description}\n\n2. 你的行為模式初判：${disc.label}\n這不是絕對定論，是依你剛剛的回答做的初步判斷。\n\n3. 你的生涯運數提醒：${lifeNumber || '待補生日'} 號\n${getLifeNumberNote(lifeNumber)}\n\n4. 你最容易成交的方式：${buildBestStrategy(talent.id, disc.primary)}\n\n5. 你現在要整理的地方：${blocker}\n\n6. 你接下來最該補的能力：${nextSkill.skill}\n\n你看完之後，覺得像你嗎？有準嗎？`
    };
  }

  function buildToneIntro(strategy, talent, blocker) {
    if (strategy.disc_primary === 'D') {
      return `我直接講結論：你不是沒能力，而是現在最需要把「${blocker}」補成一套可執行的步驟。`;
    }
    if (strategy.disc_primary === 'I') {
      return `我覺得你很像那種靠互動、感覺和信任在成交的人。你的天賦不是硬推，而是讓人願意靠近你。`;
    }
    if (strategy.disc_primary === 'S') {
      return `我先跟你說，這不是你的問題。你比較像需要安全感和穩定步驟的人，所以銷售上不能逼自己變得很強勢。`;
    }
    return `我用結構幫你整理。目前我看到你的主要訊號是「${talent.label}」和「${blocker}」。`;
  }

  function buildStrengths(disc, talentId) {
    const byDisc = {
      D: '你有推進事情的力量，適合把複雜問題收斂成下一步。',
      I: '你有感染力與互動感，適合用故事和氣氛打開關係。',
      S: '你有穩定和耐心，適合經營長期信任。',
      C: '你有邏輯與標準，適合用專業建立信任。'
    };
    return [byDisc[disc] || byDisc.I, TALENTS[talentId].description];
  }

  function buildBestStrategy(talentId, disc) {
    const byTalent = {
      lead_generation: '先建立穩定名單來源，再用清楚的紀錄與追蹤接住每一次機會。',
      trust_building: '先讀懂對方在意什麼，用對方舒服的方式建立信任，再談成交。',
      needs_diagnosis: '用五連問把表面需求往下挖，找到真正的購買理由。',
      value_presentation: '把規格翻成利益，再用故事讓客戶感覺到「這跟我有關」。',
      objection_handling: '先理解對方真正擔心哪裡，再證實你的方案能處理那個疑慮。',
      closing: '每次互動都設計一個小成交，不讓關係只停在聊得很好。',
      follow_up_system: '把客戶資料、時間與下一步都系統化，讓機會不靠記憶。',
      stage_expression: '把你的經驗整理成別人聽得懂的架構，開始一對多複製。'
    };
    if (disc === 'S' && talentId === 'closing') {
      return '用不壓迫的二選一和確認式提問推進，讓成交不等於逼人。';
    }
    return byTalent[talentId] || byTalent.trust_building;
  }

  function mapBlockerToSkill(blocker, talentId) {
    if (/名單|開發|流量/.test(blocker) || talentId === 'lead_generation') {
      return { skill: '名單開發與流量系統', course: 'liuliang' };
    }
    if (/信任|安全|看不懂|關係/.test(blocker) || talentId === 'trust_building') {
      return { skill: '人性判斷與信任建立', course: 'zhizhi' };
    }
    if (/表達|價值/.test(blocker) || talentId === 'value_presentation' || talentId === 'stage_expression') {
      return { skill: '價值表達與一對多影響', course: 'yanzhi' };
    }
    if (/追蹤|系統|效率/.test(blocker) || talentId === 'follow_up_system') {
      return { skill: '客戶追蹤與效率系統', course: 'xiaolu' };
    }
    return { skill: '成交流程與異議處理', course: 'chengjiao' };
  }

  function buildCoursePath(state) {
    const spec = buildProfileSpec(state);
    const first = spec.next_skill.course;
    const ordered = [first];
    const blocker = getTopBlocker(state);
    if (first !== 'chengjiao' && /成交|異議|推進|再想想/.test(blocker)) ordered.push('chengjiao');
    if (first !== 'zhizhi' && /信任|看不懂|安全/.test(blocker)) ordered.push('zhizhi');
    if (state.profile.role === 'leader' || state.profile.role === 'owner') {
      if (!ordered.includes('yanzhi')) ordered.push('yanzhi');
    }
    ['chengjiao', 'zhizhi', 'yanzhi', 'xiaolu', 'liuliang'].forEach((id) => {
      if (ordered.length < 3 && !ordered.includes(id)) ordered.push(id);
    });
    return ordered.slice(0, 3).map((id, index) => ({
      order: index + 1,
      id,
      name: COURSE_CATALOG[id].name,
      page: COURSE_CATALOG[id].page,
      reason: COURSE_CATALOG[id].reason
    }));
  }

  function buildRecommendationReply(state) {
    const path = buildCoursePath(state);
    const lines = path.map((course) => `${course.order}. ${course.name}：${course.reason}`).join('\n');
    return `太好了，這代表你的優勢其實很清楚。接下來不要一次什麼都學，照這個順序補，你會更快把優勢發揮出來。\n\n${lines}\n\n目前已確認的場次與金額我整理在頁面上；吉隆坡場金額由顧問依最新公告回覆，複訓費用是 NT$ 3,200。`;
  }

  function transition(state, message) {
    const next = clone(state || createSession());
    if (message) {
      next.turns += 1;
      analyzeMessage(next, message);
    }
    const askedOffering = message && /(時間|日期|開課|多少錢|價格|費用|名額|複訓|重修)/.test(message);
    if (askedOffering) {
      return formatResponse(next, OFFERING_REPLY, null);
    }
    if (next.phase === 'recommendation' && next.recommendation_allowed) {
      return formatResponse(next, buildRecommendationReply(next), null, buildCoursePath(next));
    }
    if (next.phase === 'revise_profile') {
      next.phase = 'discovery';
      return formatResponse(next, '好，我們把你的真實情境再補清楚一點。你覺得剛剛最不像你的地方，是行為模式、銷售天賦，還是我抓錯你的客戶情境？', '你覺得最不像的是哪一塊？');
    }
    const question = nextDiscoveryQuestion(next);
    if (question) {
      next.phase = 'discovery';
      return formatResponse(next, buildDiscoveryReply(next, question), question);
    }
    next.phase = 'accuracy_check';
    next.recognition.profile_spec_shown = true;
    const spec = buildProfileSpec(next);
    return formatResponse(next, spec.reply, null, null, spec);
  }

  function buildDiscoveryReply(state, question) {
    const strategy = buildResponseStrategy(state);
    if (state.turns === 0) {
      return `我先了解你的銷售現場。你回答得越像真實情境，我整理出的銷售天賦越準。\n\n${question}`;
    }
    if (strategy.disc_primary === 'D') return `我先抓重點：你的答案會影響我判斷你適合先補哪個成交能力。\n\n${question}`;
    if (strategy.disc_primary === 'I') return `我有抓到一點你的互動感了，我再問一題，會更準。\n\n${question}`;
    if (strategy.disc_primary === 'S') return `不用急，我們慢慢確認就好。這一題是為了避免我太快下判斷。\n\n${question}`;
    return `我再補一個判斷依據。回答這題後，我會比較能區分你的主要型和次要型。\n\n${question}`;
  }

  function formatResponse(state, reply, nextQuestion, coursePath, profileSpec) {
    return {
      state,
      phase: state.phase,
      reply,
      next_question: nextQuestion,
      profile_spec: profileSpec || null,
      response_strategy: buildResponseStrategy(state),
      accuracy_prompt: state.phase === 'accuracy_check' ? '你覺得有準嗎？像你嗎？' : null,
      course_path: state.recommendation_allowed ? (coursePath || buildCoursePath(state)) : null,
      cta: state.recommendation_allowed ? {
        signup_url: COURSE_LINKS.signupUrl,
        line_url: COURSE_LINKS.lineUrl
      } : null,
      offering_status: 'confirmed_partial',
      safe_offering_reply: OFFERING_REPLY,
      needs_human: false
    };
  }

  function start(profile) {
    const state = createSession(profile);
    return transition(state, '');
  }

  return {
    COURSE_CATALOG,
    COURSE_LINKS,
    DISC_STRATEGIES,
    DISC_AVERSION_LABELS,
    TALENTS,
    createSession,
    computeLifeNumbers,
    transition,
    start,
    getDiscResult,
    getTopTalent,
    buildProfileSpec,
    buildCoursePath
  };
});
