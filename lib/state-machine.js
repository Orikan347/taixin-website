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
      reason: '先建立穩定名單來源，讓你不用只靠運氣等客戶出現。',
      benefit: '幫你處理「客戶從哪裡來」。'
    },
    chengjiao: {
      id: 'chengjiao',
      name: '成交地圖',
      page: COURSE_LINKS.courses.chengjiao,
      reason: '把客戶猶豫、拒絕和下一步整理成一套可以照著走的流程。',
      benefit: '幫你處理「客戶來了怎麼成交」。'
    },
    zhizhi: {
      id: 'zhizhi',
      name: '直指人心',
      page: COURSE_LINKS.courses.zhizhi,
      reason: '先看懂客戶在意什麼，用他聽得進去的方式建立信任。',
      benefit: '幫你處理「怎麼看懂客戶」。'
    },
    xiaolu: {
      id: 'xiaolu',
      name: '極致效率',
      page: COURSE_LINKS.courses.xiaolu,
      reason: '把客戶資料、時間安排、追蹤與下一步整理起來，讓忙碌累積成成果。',
      benefit: '幫你處理「很忙但沒結果」。'
    },
    yanzhi: {
      id: 'yanzhi',
      name: '言之有物',
      page: COURSE_LINKS.courses.yanzhi,
      reason: '把產品價值講得有畫面、有邏輯、有格局，讓客戶聽懂跟自己有關。',
      benefit: '幫你處理「怎麼講出價值」。'
    }
  };

  const DISC_FRONT_LABEL = {
    D: 'D 結果導向型',
    I: 'I 感染帶動型',
    S: 'S 穩定關係型',
    C: 'C 邏輯分析型'
  };

  const DISC_SHORT_LABEL = {
    D: '結果導向',
    I: '感染帶動',
    S: '穩定關係',
    C: '邏輯分析'
  };

  const DISC_STRENGTHS = {
    D: [
      ['抓重點很快', '你容易直接看到事情的核心，適合幫客戶把問題收斂成下一步。'],
      ['推進力強', '你不喜歡事情停在原地，這會讓你在成交時更敢處理關鍵問題。'],
      ['目標感清楚', '你適合用結果和效益讓客戶知道為什麼現在要行動。']
    ],
    I: [
      ['互動感染力', '你容易讓客戶放鬆，願意多講真話，這是很重要的成交起點。'],
      ['故事表達力', '你適合把產品講得有畫面，讓客戶覺得這件事跟自己有關。'],
      ['帶動氣氛', '你能把冰冷的銷售對話變成有溫度的交流，信任會更快出來。']
    ],
    S: [
      ['信任感穩', '你不會讓客戶覺得被逼，適合經營需要長期關係的成交。'],
      ['耐心陪伴', '你能讓客戶慢慢說出顧慮，這會幫你找到真正的購買原因。'],
      ['關係維護力', '你適合做回訪和追蹤，讓客戶感覺有人真的在乎他。']
    ],
    C: [
      ['專業可信', '你重視資料和依據，容易讓客戶覺得你不是亂講。'],
      ['結構清楚', '你適合把複雜方案整理成有順序的選擇，降低客戶的不確定。'],
      ['風險意識好', '你會先想清楚問題在哪，這能幫客戶做更安心的決定。']
    ]
  };

  // 依生涯運數計算器「給業務的建議」資料表轉成學生看得懂的白話，不使用自行命名的天賦。
  const LIFE_TALENTS = {
    1: [['目標導向', '你訂好目標後，會想把事情推到完成。'], ['說服表達', '你適合把重點講清楚，帶客戶做決定。'], ['先聽再帶路', '把主導力用在提問，客戶會更願意跟著你走。']],
    2: [['協調能力', '你能顧到客戶與團隊兩邊的需求。'], ['信任建立', '你容易察覺感受，客戶比較願意把真話告訴你。'], ['溫和推進', '照顧關係的同時，也要幫客戶把下一步定下來。']],
    3: [['創意吸引', '你有把平常內容講得有趣、讓人想聽下去的能力。'], ['社交互動', '你擅長打開話題，讓初次接觸不那麼生硬。'], ['聚焦表達', '把重點收斂成一句客戶聽得懂的話，感染力會更強。']],
    4: [['組織流程', '你能把事情整理成清楚的步驟，讓客戶更安心。'], ['穩定踏實', '你說到做到，這會讓長期客戶願意信任你。'], ['穩中調整', '保有原則，也願意依客戶情況調整做法。']],
    5: [['靈活開發', '你善於看到新機會，也能快速接住客戶的變化。'], ['風趣互動', '你的說話方式容易讓客戶放鬆、願意多交流。'], ['先判斷再行動', '把衝勁放進有策略的下一步，機會才留得住。']],
    6: [['責任感', '客戶會感覺你不是只想成交，而是真的願意把事情做好。'], ['長期關係', '你適合做回訪與服務，讓信任慢慢變成口碑。'], ['有溫度也有界線', '照顧客戶時，記得把你的專業與下一步講清楚。']],
    7: [['專業分析', '你擅長看細節、整理資訊，能給客戶有根據的建議。'], ['精準說服', '你不是靠大聲，而是靠看懂問題後說到重點。'], ['看懂後往前走', '分析完成就定下一步，才能把專業變成成果。']],
    8: [['帶動團隊', '你有推動事情與整合資源的力量。'], ['果斷決策', '面對複雜問題時，你較能抓住方向、快速處理。'], ['強而不壓人', '給客戶選擇與空間，說服力會比硬推更強。']],
    9: [['全局規劃', '你容易從更大的角度看見客戶真正想達成的事。'], ['理解需求', '你能接住客戶感受，找到對他有意義的說法。'], ['把願景變下一步', '把大的想法收成一個可做的行動，影響力才會落地。']]
  };

  // 名稱與核心特質均對照生涯運數計算器的「九宮連線」資料庫。
  const LIFE_LINE_TALENTS = {
    123: ['美感藝術線', '你對畫面、感受和創意比較敏銳，適合把產品講得更有畫面。'],
    456: ['組織管理線', '你習慣把事情排出順序，適合用清楚流程讓客戶放心。'],
    789: ['權勢高峰線', '你有把目標、資源和行動串起來的能力，適合談長期規劃。'],
    147: ['衣食無憂線', '你做事務實，願意為目標投入，適合把承諾做成具體行動。'],
    258: ['公關熱情線', '你重互動、也能帶動關係，適合先建立信任再推進成交。'],
    369: ['聰明智慧線', '你反應快、會思考，適合把複雜資訊整理成客戶聽得懂的重點。'],
    159: ['事必躬親線', '你對事情有責任感，願意親手做到好；銷售上要記得把力氣放在真正重要的下一步。'],
    357: ['溝通表達線', '你容易和人互動，也適合用說明與交流把客戶帶進對話。']
  };

  const QUOTES = {
    lead: '銷售是吸引，不是推銷。',
    price: '話術讓你成交一陣子，系統才能讓你成交一輩子。',
    think: '成交不是逼人，是幫客戶看懂下一步。',
    decision: '數據讓人相信，故事讓人行動。',
    trust: '銷售是解決人的問題。',
    efficiency: '工具不是重點，重點是你有沒有把每一次接觸變成可累積的資產。',
    expression: '數據讓人相信，故事讓人行動。'
  };

  const DISCOVERY_QUESTIONS = [
    {
      id: 'market',
      prompt: '你現在主要賣什麼？客戶通常是哪一種人？',
      buttons: ['上班族或家庭客戶', '企業老闆或主管', '高價專業服務客戶', '我都清楚了']
    },
    {
      id: 'objection',
      prompt: '最近一次客戶沒有往前走，他原話大概怎麼說？',
      buttons: ['客戶覺得太貴', '客戶說再想想', '客戶說要問別人', '我都清楚了']
    },
    {
      id: 'growth',
      prompt: '如果下一次遇到同樣的客戶，你最想讓自己哪個地方變強？',
      buttons: ['提升成交', '提高效率', '建立信任', '我都清楚了']
    }
  ];

  const BRANCHES = {
    lead: {
      label: '客戶不夠多',
      summary: '名單不夠時，真正要補的不是更努力亂發訊息，而是讓對的人看見你、願意相信你，並且知道下一步可以找你。',
      buttons: ['不知道去哪找客戶', '內容發了沒人問', '想建立穩定來源', '我都清楚了']
    },
    price: {
      label: '客戶覺得太貴',
      summary: '客戶卡在價格，很多時候不是單純嫌貴，而是他還沒看見這筆錢跟他的結果有什麼關係。你下一步要補的，是先問出他在意的是預算、效果，還是跟別人比較。',
      buttons: ['客戶覺得現在不需要', '客戶不確定有沒有效', '客戶想跟別人比較', '我都清楚了']
    },
    think: {
      label: '客戶說再想想',
      summary: '「我再想想」通常不是結束，而是客戶還有一個顧慮沒有說出口。你要做的不是追著介紹，而是把他正在想的事情拆清楚。',
      buttons: ['他在想價格', '他在想效果', '他在想要問誰', '我都清楚了']
    },
    decision: {
      label: '客戶說要問別人',
      summary: '客戶說要問別人，代表真正的決策條件還沒整理好。你要幫他帶走一段能跟決策者說清楚的理由，而不是只讓他帶著感覺回去。',
      buttons: ['怎麼跟主管說', '怎麼整理價值', '怎麼降低風險', '我都清楚了']
    },
    trust: {
      label: '客戶還不信任',
      summary: '信任不是靠講更多，而是靠讓客戶感覺你真的懂他。先聽出他在意什麼，再講你的方法，成交會自然很多。',
      buttons: ['怎麼看懂客戶', '怎麼讓客戶安心', '怎麼問出真話', '我都清楚了']
    },
    efficiency: {
      label: '每天很忙但沒結果',
      summary: '你不是不努力，而是客戶資料、追蹤時間和下一步沒有被整理成系統。越忙的人，越需要先把努力變成能累積的流程。',
      buttons: ['客戶資料很亂', '常常忘記追蹤', '想用工具省時間', '我都清楚了']
    },
    expression: {
      label: '講不清楚價值',
      summary: '產品介紹不是把功能全部講完，而是讓客戶聽懂這件事跟自己有什麼關係。你要補的是把價值講得有畫面、有邏輯、有格局。',
      buttons: ['怎麼講得更有感', '怎麼講出差異', '怎麼講給主管聽', '我都清楚了']
    }
  };

  const BRANCH_DETAILS = [
    {
      pattern: /不需要|現在不需要/,
      branch: 'price',
      reply: '如果客戶說現在不需要，你先不要急著補功能。先問：「你原本是想解決哪一件事，只是現在覺得還沒那麼急？」這樣會把話題從價格拉回需求。'
    },
    {
      pattern: /沒效|效果|有效/,
      branch: 'price',
      reply: '如果客戶怕沒效，你要先承認他的擔心是合理的，再用案例、流程和他能得到的改變來說明。重點不是保證，而是讓他看懂你怎麼帶他往結果走。'
    },
    {
      pattern: /比較|別人比較/,
      branch: 'price',
      reply: '如果客戶想比較，表示他還在看表面條件。你可以幫他比三件事：解決什麼問題、少走什麼冤枉路、後續誰會陪他做到。'
    },
    {
      pattern: /問誰|主管|家人|決策者/,
      branch: 'decision',
      reply: '如果客戶要問別人，你要幫他整理一段帶得走的說法：為什麼需要、差在哪裡、現在做有什麼好處。讓他不是只帶價格回去，而是帶價值回去。'
    },
    {
      pattern: /資料很亂|忘記追蹤|省時間|工具/,
      branch: 'efficiency',
      reply: '如果你卡在忙碌，第一件事就是把客戶分成今天要回、這週要追、下次要補價值三種。業務不是更忙才會贏，是每一次接觸都能累積。'
    },
    {
      pattern: /怎麼講得更有感|講得更有感/,
      branch: 'expression',
      reply: '要講得有感，先講客戶現在正在承受什麼，再講他真正想要變成什麼樣子，最後才說你的方法怎麼幫他做到。這樣客戶先看見自己，才會想聽產品。',
      buttons: ['我想練一段開場', '我想改產品介紹', '我想把故事講好', '我都清楚了']
    },
    {
      pattern: /怎麼講出差異|講出差異/,
      branch: 'expression',
      reply: '要講出差異，不要只說自己比較好。你可以直接說清楚三件事：客戶原本會少掉什麼麻煩、你多做了哪一個關鍵步驟、最後他會得到什麼不同結果。這樣差異才不是口號。',
      buttons: ['我想抓真正差異', '我想做比較說法', '我想用案例證明', '我都清楚了']
    },
    {
      pattern: /怎麼講給主管聽|講給主管聽/,
      branch: 'expression',
      reply: '跟主管說時，先講現在的問題會造成什麼損失，再講你的方案能帶來什麼效益，最後才補執行方式和需要的資源。主管要先看懂結果，才會願意聽細節。',
      buttons: ['我想整理一頁重點', '我想講效益', '我想先講風險', '我都清楚了']
    },
    {
      pattern: /有感|差異|講給主管|講得更/,
      branch: 'expression',
      reply: '產品介紹不要從功能開始。先講客戶現在的問題，再講用了之後會變成什麼樣子，最後才補你的方法。這就是 BAF：先講好處，再講優勢，最後講功能。'
    },
    {
      pattern: /看懂客戶|安心|真話|信任/,
      branch: 'trust',
      reply: '要建立信任，先讓客戶覺得「你聽懂我」。你可以用五連問慢慢問出背景、困擾、影響、期待和下一步，客戶會更願意把真話說出來。'
    },
    {
      pattern: /去哪找客戶|沒人問|穩定來源|名單/,
      branch: 'lead',
      reply: '名單要穩，不能只靠臨時曝光。你要先把自己能幫誰、解決什麼問題、為什麼值得相信講清楚，再把內容變成固定入口。'
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function createSession(profile) {
    const state = {
      session_id: 'tree-v4-' + Date.now(),
      decision_tree_version: '2026-07-10-v4-disc-four-buttons',
      phase: 'discovery',
      profile: Object.assign({
        name: '',
        email: '',
        phone: '',
        region: 'tw',
        role: 'sales_consultant',
        industry: '',
        product: '',
        birthdate: '',
        disc_hate_sales: '',
        disc_hate_workplace: '',
        disc_hate_customer: '',
        disc_hate_think: '',
        problems: [],
        goals: []
      }, profile || {}),
      computed: computeLifeNumbers(profile && profile.birthdate),
      scores: {
        disc: { D: 0, I: 0, S: 0, C: 0 },
        course: { liuliang: 0, chengjiao: 0, zhizhi: 0, xiaolu: 0, yanzhi: 0 },
        branches: {}
      },
      answers: [],
      current_question_index: 0,
      visited_nodes: [],
      report_ready: false,
      course_path_ready: false,
      last_branch: '',
      last_user_text: '',
      lead_path: []
    };
    applyProfileSignals(state);
    return state;
  }

  function computeLifeNumbers(birthdate) {
    const match = String(birthdate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return { life_number: '', birthday_number: '', reduction_chain: '', active_lines: [] };
    const digits = (match[1] + match[2] + match[3]).split('').map(Number);
    const sum = digits.reduce((total, num) => total + num, 0);
    const birthday = match[3].split('').map(Number).reduce((total, num) => total + num, 0);
    return {
      life_number: reduceNumber(sum),
      birthday_number: reduceNumber(birthday),
      reduction_chain: buildReductionChain(sum),
      active_lines: getActiveLines(digits)
    };
  }

  function reduceNumber(value) {
    let current = Number(value) || 0;
    while (current > 9) {
      current = String(current).split('').map(Number).reduce((total, num) => total + num, 0);
    }
    return current || '';
  }

  function buildReductionChain(value) {
    const chain = [];
    let current = Number(value) || 0;
    if (!current) return '';
    chain.push(current);
    while (current >= 10) {
      current = String(current).split('').map(Number).reduce((total, num) => total + num, 0);
      chain.push(current);
    }
    return chain.join('>');
  }

  function getActiveLines(digits) {
    const counts = {};
    digits.forEach((digit) => {
      if (digit > 0) counts[digit] = (counts[digit] || 0) + 1;
    });
    const lines = {
      123: '美感藝術線',
      456: '組織管理線',
      789: '權勢高峰線',
      147: '衣食無憂線',
      258: '公關熱情線',
      369: '聰明智慧線',
      159: '事必躬親線',
      357: '溝通表達線'
    };
    return Object.entries(lines)
      .filter(([line]) => line.split('').every((digit) => counts[digit]))
      .map(([line, name]) => ({ line, name }));
  }

  function bump(record, key, amount) {
    if (!key || record[key] === undefined) return;
    record[key] += amount || 1;
  }

  function applyProfileSignals(state) {
    ['disc_hate_sales', 'disc_hate_workplace', 'disc_hate_customer', 'disc_hate_think'].forEach((field) => {
      const value = String(state.profile[field] || '').toUpperCase();
      bump(state.scores.disc, value, 2);
    });
    const text = normalizeText([
      state.profile.industry,
      state.profile.product,
      state.profile.role,
      (state.profile.problems || []).join(' '),
      (state.profile.goals || []).join(' ')
    ].join(' '));
    applyTextSignals(state, text);
    if (state.profile.role === 'leader' || state.profile.role === 'owner') {
      state.scores.course.chengjiao += 1;
      state.scores.course.xiaolu += 1;
      state.scores.course.yanzhi += 1;
      state.scores.disc.D += 0.5;
      state.scores.disc.C += 0.5;
    }
  }

  function applyTextSignals(state, textValue) {
    const text = normalizeText(textValue);
    const signals = [
      { keys: ['客戶不夠', '名單', '流量', '開發', '陌生'], course: 'liuliang', disc: 'D', branch: 'lead' },
      { keys: ['成交', '再想想', '拒絕', '逼單', '收單', '猶豫'], course: 'chengjiao', disc: 'D', branch: 'think' },
      { keys: ['太貴', '價格', '預算', '費用', '便宜'], course: 'chengjiao', disc: 'C', branch: 'price' },
      { keys: ['看不懂', '信任', '關係', '安心', '客戶心裡'], course: 'zhizhi', disc: 'S', branch: 'trust' },
      { keys: ['忙', '效率', '追蹤', '資料', '忘記', '漏掉', '沒時間'], course: 'xiaolu', disc: 'C', branch: 'efficiency' },
      { keys: ['表達', '介紹', '講不清楚', '上台', '故事', '價值'], course: 'yanzhi', disc: 'I', branch: 'expression' },
      { keys: ['主管', '老闆', '團隊', '複製', '帶人'], course: 'yanzhi', disc: 'D', branch: 'decision' },
      { keys: ['冷', '沒反應', '互動', '氣氛'], course: 'zhizhi', disc: 'I', branch: 'trust' },
      { keys: ['問主管', '問家人', '問別人', '決定'], course: 'chengjiao', disc: 'C', branch: 'decision' }
    ];
    signals.forEach((signal) => {
      if (!signal.keys.some((key) => text.includes(normalizeText(key)))) return;
      bump(state.scores.course, signal.course, 1);
      bump(state.scores.disc, signal.disc, 0.7);
      state.scores.branches[signal.branch] = (state.scores.branches[signal.branch] || 0) + 1;
    });
  }

  function getDiscResult(state) {
    const sorted = Object.entries(state.scores.disc)
      .map(([key, score]) => ({ key, score }))
      .sort((a, b) => b.score - a.score);
    const top = sorted[0] && sorted[0].score > 0 ? sorted[0] : { key: 'I', score: 1 };
    const second = sorted[1] || { key: 'S', score: 0 };
    const total = sorted.reduce((sum, item) => sum + item.score, 0) || 1;
    const isMixed = second.score > 0 && Math.abs(top.score - second.score) <= 0.75;
    return {
      primary: top.key,
      secondary: second.key,
      label: isMixed ? `${top.key}/${second.key} 混合傾向` : DISC_FRONT_LABEL[top.key],
      public_label: isMixed ? `${DISC_SHORT_LABEL[top.key]}偏${DISC_SHORT_LABEL[second.key]}` : DISC_SHORT_LABEL[top.key],
      confidence: Number((top.score / total).toFixed(2)),
      isMixed
    };
  }

  function getTopBranch(state) {
    const sorted = Object.entries(state.scores.branches).sort((a, b) => b[1] - a[1]);
    if (sorted.length) return sorted[0][0];
    const topCourse = getTopCourse(state);
    if (topCourse === 'liuliang') return 'lead';
    if (topCourse === 'zhizhi') return 'trust';
    if (topCourse === 'xiaolu') return 'efficiency';
    if (topCourse === 'yanzhi') return 'expression';
    return 'think';
  }

  function getTopCourse(state) {
    const sorted = Object.entries(state.scores.course).sort((a, b) => b[1] - a[1]);
    return sorted[0] && sorted[0][1] > 0 ? sorted[0][0] : 'chengjiao';
  }

  function start(profile) {
    const state = createSession(profile || {});
    return formatResponse(state, DISCOVERY_QUESTIONS[0].prompt, DISCOVERY_QUESTIONS[0].buttons);
  }

  function transition(state, message) {
    const next = clone(state || createSession({}));
    const text = String(message || '').trim();
    if (!text) return formatResponse(next, '你可以直接選下面的按鈕，或用你的話補充。', currentButtons(next));
    next.last_user_text = text;
    next.lead_path.push({ at: new Date().toISOString(), phase: next.phase, text });

    if (next.phase !== 'discovery') {
      const globalResponse = handleGlobalIntent(next, text);
      if (globalResponse) return globalResponse;
    }

    if (next.phase === 'discovery') {
      if (isClear(text) && next.current_question_index < DISCOVERY_QUESTIONS.length) {
        const question = currentQuestion(next);
        return formatResponse(next, `我收到。為了讓報告不要亂抓，我再補這題就好：${question.prompt}`, question.buttons);
      }
      next.answers.push({ question_id: currentQuestion(next).id, answer: text });
      applyTextSignals(next, text);
      next.current_question_index += 1;
      if (next.current_question_index < DISCOVERY_QUESTIONS.length) {
        const question = currentQuestion(next);
        return formatResponse(next, question.prompt, question.buttons);
      }
      next.phase = 'explanation';
      return buildExplanation(next);
    }

    if (next.phase === 'explanation') {
      if (isClear(text)) return buildReportResponse(next);
      const branch = detectBranch(text) || getTopBranch(next);
      return buildBranchExplanation(next, branch);
    }

    if (next.phase === 'report_ready') {
      if (isAgreement(text) || /學習|路徑|課程|我都清楚/.test(text)) return buildRecommendationResponse(next);
      if (isDisagreement(text) || /修正|不像|不準|看不懂/.test(text)) return buildRevisionResponse(next);
      return buildPostReportMenu(next);
    }

    if (next.phase === 'revision') {
      return applyRevision(next, text);
    }

    if (next.phase === 'recommendation') {
      if (/報名/.test(text)) return buildSignupResponse(next);
      if (/LINE|顧問|問/.test(text)) return buildHandoffResponse(next);
      if (/時間|費用|價格|開課|複訓/.test(text)) return buildOfferingsResponse(next);
      return buildRecommendationResponse(next);
    }

    return buildExplanation(next);
  }

  function handleGlobalIntent(state, text) {
    if (/時間|日期|開課|多少錢|價格|費用|名額|複訓|重修|全包/.test(text)) {
      return buildOfferingsResponse(state);
    }
    if (/學什麼|教什麼|課程內容|可以學到|哪一堂|課程差別/.test(text)) {
      return buildCourseContentResponse(state);
    }
    if (/報名|表單/.test(text)) return buildSignupResponse(state);
    if (/line|LINE|客服|問顧問|LINE 顧問|加 LINE/.test(text)) return buildHandoffResponse(state);
    if (/下載|分享|圖片/.test(text) && state.report_ready) {
      return formatResponse(state, '報告下方有下載和分享按鈕。若瀏覽器不支援直接分享，就先下載 9:16 圖片再傳到 LINE。', ['看建議學習路徑', '問顧問', '回去看報告', '我都清楚了']);
    }
    return null;
  }

  function currentQuestion(state) {
    return DISCOVERY_QUESTIONS[Math.min(state.current_question_index, DISCOVERY_QUESTIONS.length - 1)];
  }

  function currentButtons(state) {
    if (state.phase === 'discovery') return currentQuestion(state).buttons;
    if (state.phase === 'report_ready') return ['看建議學習路徑', '我想修正報告', '我想問顧問', '我都清楚了'];
    return ['客戶覺得太貴', '客戶說再想想', '客戶想問別人', '我都清楚了'];
  }

  function buildExplanation(state) {
    const branch = getTopBranch(state);
    const branchData = BRANCHES[branch] || BRANCHES.think;
    state.last_branch = branch;
    const name = state.profile.name || '你';
    const quote = state.last_user_text || (state.answers[1] && state.answers[1].answer) || '剛剛的銷售現場';
    const reply = `${name}，我有聽到你剛剛講「${quote}」。${branchData.summary}\n\n以上的說明都清楚嗎？`;
    return formatResponse(state, reply, branchData.buttons);
  }

  function buildBranchExplanation(state, branch) {
    const branchData = BRANCHES[branch] || BRANCHES.think;
    state.last_branch = branch;
    applyTextSignals(state, branchData.label);
    const detail = matchBranchDetail(state.last_user_text);
    const body = detail ? detail.reply : branchData.summary;
    const reply = `我懂，我們就先看「${branchData.label}」這件事。${body}\n\n以上的說明都清楚嗎？`;
    return formatResponse(state, reply, detail && detail.buttons ? detail.buttons : nextBranchButtons(branch));
  }

  function buildCourseContentResponse(state) {
    const path = state.course_path_ready || state.report_ready ? buildCoursePath(state) : buildCoursePath(state);
    const intro = path.map((course) => {
      const item = COURSE_CATALOG[course.id] || course;
      return `${course.order}. ${course.name}：${item.benefit || course.reason}`;
    }).join('\n');
    const reply = `我用利益點跟你講就好，不講太細。\n\n${intro}\n\n如果你想知道自己先上哪一堂，我可以直接用你的報告排出順序。\n\n以上的說明都清楚嗎？`;
    return formatResponse(state, reply, ['看建議學習路徑', '看開課時間費用', '我要直接報名', '我都清楚了'], state.report_ready ? buildProfileSpec(state) : null, state.report_ready ? path : null);
  }

  function buildReportResponse(state) {
    state.phase = 'report_ready';
    state.report_ready = true;
    const spec = buildProfileSpec(state);
    const coursePath = buildCoursePath(state);
    const reply = `${state.profile.name || '你'}，我把你的銷售天賦整理成表格，已經放在底下給你囉。\n\n你看完之後，覺得像你嗎？有準嗎？想繼續了解就回 yes，或直接按下面的建議學習路徑。`;
    return formatResponse(state, reply, ['看建議學習路徑', '我想修正報告', '我想問顧問', '我都清楚了'], spec, coursePath);
  }

  function buildPostReportMenu(state) {
    return formatResponse(state, '你可以直接看學習路徑，也可以告訴我哪一段不像，我會只修那一段，不會叫你全部重填。', ['看建議學習路徑', '行為模式不像', '實戰建議不適合', '我想問顧問'], buildProfileSpec(state), buildCoursePath(state));
  }

  function buildRevisionResponse(state) {
    state.phase = 'revision';
    return formatResponse(state, '我懂，你不是要一份漂亮報告，你要的是看完真的覺得「這就是我」。我幫你校正一下：是哪一段不像你？', ['行為模式不像我', '銷售優點不像我', '實戰建議不適合', '我想重新回答一次']);
  }

  function applyRevision(state, text) {
    if (/重新|回答/.test(text)) {
      state.phase = 'discovery';
      state.answers = [];
      state.current_question_index = 0;
      const question = currentQuestion(state);
      return formatResponse(state, '可以，我們重新抓一次。你照真實狀況回答就好。' + '\n\n' + question.prompt, question.buttons);
    }
    applyTextSignals(state, text);
    state.phase = 'report_ready';
    const spec = buildProfileSpec(state);
    const path = buildCoursePath(state);
    return formatResponse(state, '好，我把你剛剛補充的地方放進去了。修正版報告已經更新在底下。\n\n以上的說明都清楚嗎？', ['這次比較像', '我想再修一段', '看建議學習路徑', '我想問顧問'], spec, path);
  }

  function buildRecommendationResponse(state) {
    state.phase = 'recommendation';
    state.course_path_ready = true;
    const path = buildCoursePath(state);
    const lines = path.map((course) => `${course.order}. ${course.name}：${course.reason}`).join('\n');
    const reply = `${state.profile.name || '你'}，我直接把最適合你的學習順序放在這裡：\n\n${lines}\n\n先照這個順序開始，你會更快知道自己要補哪一段，也更容易把成交做穩。`;
    return formatResponse(state, reply, ['我想看第一堂課', '我想看時間費用', '我要直接報名', '我想先問顧問'], buildProfileSpec(state), path);
  }

  function buildOfferingsResponse(state) {
    state.phase = state.phase || 'offerings';
    const reply = '我幫你整理目前已公告的課程資訊。頁面左側會顯示已確認的時間與金額；座位、名額、付款方式和吉隆坡課程金額，顧問會依最新公告協助確認。\n\n以上的說明都清楚嗎？';
    return formatResponse(state, reply, ['看單堂課程', '看五堂全包', '問複訓費用', '我都清楚了'], state.report_ready ? buildProfileSpec(state) : null, state.course_path_ready ? buildCoursePath(state) : null);
  }

  function buildSignupResponse(state) {
    const reply = '你可以直接點報名表單留下資料。如果你還想確認哪一堂最適合，也可以先問 LINE 顧問，顧問會依照你的報告接下一步。\n\n以上的說明都清楚嗎？';
    return formatResponse(state, reply, ['我要報名表單', '我想問 LINE 顧問', '先看學習路徑', '我都清楚了'], state.report_ready ? buildProfileSpec(state) : null, state.course_path_ready ? buildCoursePath(state) : null, {
      signup_url: COURSE_LINKS.signupUrl,
      line_url: COURSE_LINKS.lineUrl
    });
  }

  function buildHandoffResponse(state) {
    const reply = '我幫你把剛剛的內容整理好了，等你加 LINE 顧問時，不用再從頭講一次。顧問會看到你的產業、主要問題、行為模式初判、建議課程順序和你最後想確認的問題。\n\n以上的說明都清楚嗎？';
    return formatResponse(state, reply, ['加 LINE 顧問', '先看報名表', '先下載報告', '回去看學習路徑'], state.report_ready ? buildProfileSpec(state) : null, state.course_path_ready ? buildCoursePath(state) : null, {
      signup_url: COURSE_LINKS.signupUrl,
      line_url: COURSE_LINKS.lineUrl,
      handoff_required: true
    });
  }

  function buildProfileSpec(state) {
    const disc = getDiscResult(state);
    const lifeNumber = state.computed.life_number || 7;
    const topCourse = getTopCourse(state);
    const lifeItems = LIFE_TALENTS[lifeNumber] || LIFE_TALENTS[7];
    const activeLine = state.computed.active_lines && state.computed.active_lines[0];
    const lifeTalents = lifeItems.map(([title, insight]) => ({
      title,
      insight,
      strategy: '用在銷售上，就是把你的自然優勢變成客戶聽得懂、感受得到的互動方式。'
    }));
    const verifiedLine = activeLine && LIFE_LINE_TALENTS[activeLine.line];
    if (verifiedLine) {
      lifeTalents[2] = {
        title: verifiedLine[0],
        insight: verifiedLine[1],
        strategy: '把這個特質用在客戶互動上，會讓你的說法更自然、更有說服力。'
      };
    }
    const quote = getFinalQuote(state);
    return {
      disc_type: disc.label,
      public_disc_label: disc.public_label,
      life_number: String(lifeNumber),
      sales_advantages: (DISC_STRENGTHS[disc.primary] || DISC_STRENGTHS.I).map(([title, insight]) => ({
        title,
        insight,
        strategy: '你不用變成另一種人，只要把這個優點用在提問、說明和追蹤上。'
      })),
      life_talents: lifeTalents.slice(0, 3),
      student_strength: `${disc.public_label}的銷售優勢，是用自己的方式讓客戶看見價值。`,
      persuasion_power: COURSE_CATALOG[topCourse].benefit,
      practical_advice: buildPracticalAdvice(state, topCourse),
      final_quote: quote
    };
  }

  function getFinalQuote(state) {
    const branch = state.last_branch || getTopBranch(state);
    return QUOTES[branch] || QUOTES.think;
  }

  function buildPracticalAdvice(state, topCourse) {
    const industry = state.profile.industry || '你的產業';
    const product = state.profile.product || '你的產品或服務';
    const branch = state.last_branch || getTopBranch(state);
    if (branch === 'price') return `你在 ${industry} 賣 ${product} 時，下一步先不要急著降價。先問清楚客戶覺得貴，是因為現在不需要、怕沒效，還是想跟別人比較。`;
    if (branch === 'efficiency') return `你在 ${industry} 最需要先把客戶資料、追蹤時間和下一步整理起來，讓每一次努力都能累積成成果。`;
    if (branch === 'trust') return `你在 ${industry} 要先讓客戶感覺你真的懂他，再介紹 ${product}，信任起來後成交會自然很多。`;
    if (branch === 'expression') return `你要把 ${product} 從功能講成結果，讓客戶聽懂這件事跟他的生活、工作或未來有什麼關係。`;
    return `你下一步要把客戶原話記下來，用同一套問題確認需求、顧慮和決策條件，成交就不會只靠感覺。`;
  }

  function buildCoursePath(state) {
    const first = getTopCourse(state);
    const order = [first];
    const branch = state.last_branch || getTopBranch(state);
    if (branch === 'price' || branch === 'think' || branch === 'decision') pushUnique(order, 'chengjiao');
    if (branch === 'trust') pushUnique(order, 'zhizhi');
    if (branch === 'efficiency') pushUnique(order, 'xiaolu');
    if (branch === 'expression') pushUnique(order, 'yanzhi');
    if (branch === 'lead') pushUnique(order, 'liuliang');
    if (state.profile.role === 'leader' || state.profile.role === 'owner') pushUnique(order, 'yanzhi');
    ['zhizhi', 'chengjiao', 'yanzhi', 'xiaolu', 'liuliang'].forEach((id) => {
      if (order.length < 3) pushUnique(order, id);
    });
    return order.slice(0, 3).map((id, index) => ({
      order: index + 1,
      id,
      name: COURSE_CATALOG[id].name,
      page: COURSE_CATALOG[id].page,
      reason: COURSE_CATALOG[id].reason
    }));
  }

  function pushUnique(list, item) {
    if (!list.includes(item)) list.push(item);
  }

  function detectBranch(text) {
    const value = normalizeText(text);
    if (/太貴|價格|預算|不需要|沒效|比較/.test(value)) return 'price';
    if (/再想|考慮|猶豫/.test(value)) return 'think';
    if (/主管|家人|別人|決定/.test(value)) return 'decision';
    if (/信任|安心|看懂|真話/.test(value)) return 'trust';
    if (/忙|效率|追蹤|資料|工具/.test(value)) return 'efficiency';
    if (/表達|有感|差異|價值|講/.test(value)) return 'expression';
    if (/名單|流量|客戶不夠|沒人問|開發/.test(value)) return 'lead';
    return '';
  }

  function matchBranchDetail(text) {
    const value = normalizeText(text);
    return BRANCH_DETAILS.find((item) => item.pattern.test(value));
  }

  function nextBranchButtons(branch) {
    const data = BRANCHES[branch] || BRANCHES.think;
    const buttons = data.buttons.slice(0, 3);
    if (!buttons.includes('我都清楚了')) buttons.push('我都清楚了');
    return buttons.slice(0, 4);
  }

  function isClear(text) {
    return /我都清楚|清楚了|懂了|了解|知道了/.test(text);
  }

  function isAgreement(text) {
    return /yes|準|像|有中|符合|很對|對耶|比較像|這次比較像/.test(normalizeText(text));
  }

  function isDisagreement(text) {
    return /不準|不像|看不懂|不是|錯|修正|不適合/.test(text);
  }

  function formatResponse(state, reply, buttons, profileSpec, coursePath, cta) {
    return {
      state,
      phase: state.phase,
      reply,
      buttons: (buttons || currentButtons(state)).slice(0, 4),
      profile_spec: profileSpec || null,
      response_strategy: buildResponseStrategy(state),
      course_path: coursePath || null,
      cta: cta || {
        signup_url: COURSE_LINKS.signupUrl,
        line_url: COURSE_LINKS.lineUrl
      },
      decision_tree_version: state.decision_tree_version,
      needs_human: Boolean(cta && cta.handoff_required)
    };
  }

  function buildResponseStrategy(state) {
    const disc = getDiscResult(state);
    return {
      disc_primary: disc.primary,
      disc_secondary: disc.secondary,
      disc_label: disc.label,
      public_label: disc.public_label,
      confidence: disc.confidence
    };
  }

  return {
    COURSE_CATALOG,
    COURSE_LINKS,
    createSession,
    computeLifeNumbers,
    transition,
    start,
    getDiscResult,
    buildProfileSpec,
    buildCoursePath
  };
});
