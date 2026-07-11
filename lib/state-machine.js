(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TaixinStudentQA = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const COURSE_LINKS = {
    signupUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScFcX7QtpCpUozxWGKv9nSj6Ur9h-gR6dwA5Dqm9BG7CVJ9Nw/viewform?usp=header',
    lineUrl: 'https://line.me/ti/p/jzdho94spl',
    courses: { liuliang: 'liuliang.html', chengjiao: 'chengjiaoditu.html', zhizhi: 'zhizhirenxin.html', xiaolu: 'jizhixiaolv.html', yanzhi: 'yanzhiyouwu.html' }
  };

  const DISC = {
    D: { label: 'D 結果導向型', short: 'D 型', strengths: [['抓重點很快', '你容易直接看到事情的核心，適合幫客戶把問題收斂成下一步。'], ['推進力強', '你不喜歡事情停在原地，關鍵時刻敢把話問清楚。'], ['目標感清楚', '你適合用結果和效益，幫客戶看見現在行動的理由。']], improvement: [['留一點空間', '先問完對方真正顧慮，再推下一步，成交會更穩。'], ['把速度變成確認', '先確認需求和決策條件，別只急著給答案。'], ['讓人跟得上', '講重點時補一句原因，客戶會更願意相信。']] },
    I: { label: 'I 感染帶動型', short: 'I 型', strengths: [['互動感染力', '你容易讓客戶放鬆，願意多講真話。'], ['故事表達力', '你適合把產品講得有畫面，讓客戶覺得跟自己有關。'], ['帶動氣氛', '你能把冰冷對話變成有溫度的交流，信任比較快出來。']], improvement: [['收回重點', '聊得有感之後，要幫客戶把下一步定下來。'], ['用紀錄接住熱度', '把承諾和追蹤時間記下來，熱情才不會散掉。'], ['少一點跳題', '一次先處理一個需求，客戶更容易跟上。']] },
    S: { label: 'S 穩定關係型', short: 'S 型', strengths: [['信任感穩', '你不會讓客戶覺得被逼，適合經營長期關係。'], ['耐心陪伴', '你能讓客戶慢慢說出顧慮，找到真正的購買原因。'], ['關係維護力', '你適合回訪和追蹤，讓客戶感覺有人真的在乎他。']], improvement: [['敢把下一步講出來', '照顧關係不等於不成交，邀請對方做選擇就好。'], ['提早確認條件', '別等到最後才問預算和決策者，提早知道會更安心。'], ['讓專業被看見', '多說一點你的判斷與依據，客戶才知道你能幫什麼。']] },
    C: { label: 'C 邏輯分析型', short: 'C 型', strengths: [['專業可信', '你重視資料和依據，客戶容易覺得你不是亂講。'], ['結構清楚', '你適合把複雜方案整理成有順序的選擇。'], ['風險意識好', '你會先想清楚問題在哪，能幫客戶做更安心的決定。']], improvement: [['分析後要行動', '資料整理好後，記得直接提出一個可選的下一步。'], ['先講結論再補依據', '讓客戶先知道你建議什麼，再決定要不要聽細節。'], ['把專業講白話', '少一點術語，多一個跟客戶生活有關的例子。']] }
  };

  const TALENT_QUESTIONS = [
    { id: 'talent-friction', prompt: '事情不順的時候，最讓你受不了哪一種狀況？', options: [['事情一直拖，卻沒有結論', 'D'], ['氣氛很冷，對方完全沒有反應', 'I'], ['被逼很快做決定，關係變得有壓力', 'S'], ['資料不完整，大家卻憑感覺亂講', 'C']] },
    { id: 'talent-pressure', prompt: '壓力一來，你通常先怎麼做？', options: [['直接把問題問清楚，趕快推進', 'D'], ['先把互動拉回來，讓氣氛不要冷掉', 'I'], ['先穩住關係，不想讓對方有壓力', 'S'], ['先補資料、確認細節，再判斷', 'C']] },
    { id: 'talent-collaboration', prompt: '跟你合作的人，最常感受到你哪一點？', options: [['你會把事情往前推，不喜歡拖', 'D'], ['你很會帶氣氛，讓人想跟你聊', 'I'], ['你讓人安心，願意慢慢說真話', 'S'], ['你很可靠，事情交給你比較放心', 'C']] }
  ];

  const COURSE_TREE = {
    liuliang: { name: '流量磁鐵', overview: '把客戶來源和名單管理整理起來，不再只靠介紹或碰運氣。', questions: [
      ['客戶到底要從哪裡來？', '你現在不是缺一篇貼文，而是需要一個能一直找到對的人入口。流量磁鐵會把線上、線下、社群、個人品牌、實體場景和人脈整理成天地人網，幫你挑出最適合自己產業的開發方向。'],
      ['我發內容，為什麼沒有人來問？', '內容不是寫得多就會有詢問。重點是先講客戶正在經歷的問題，再給他一個願意回應的小入口。課程會帶你把內容、個人品牌和實際互動串起來，而不是只叫你一直發。'],
      ['名單很多，可是最後都不見了，怎麼辦？', '名單不是加進手機就結束。你會用存、記、分、細把資料、互動、狀態和下一步留下來，下一次聯絡時不必重新猜。'] ] },
    chengjiao: { name: '成交地圖', overview: '把第一印象、需求、價值與成交收尾排成一條清楚的路。', questions: [
      ['客戶說「再想想」，我到底要怎麼接？', '「再想想」通常代表還有一件事沒說出口。成交地圖會教你用五連問把對方真正考慮的點問出來，再用成交 365 接住，不必急著硬推。'],
      ['客戶說太貴，怎麼讓他看見價值？', '價格不是先降下來，而是先讓客戶看懂這件事跟他有什麼關係。課程會用 MBAF：先接住他的需要，再說利益、優勢，最後才講產品特點。'],
      ['我不想每次成交都靠臨場反應。', '你需要的是一套可照著走的流程。從第一印象、五大核心問題、MBAF 到成交 365，每一段都有用途，讓你知道現在在哪裡、下一步怎麼做。'] ] },
    zhizhi: { name: '直指人心', overview: '看懂不同客戶在意什麼，讓你的說法更容易被聽進去。', questions: [
      ['怎麼快速看懂客戶？', '你不必靠猜。直指人心會帶你從外貌舉止、聲音語調、回答速度和他一直在意的問題，找出行為線索，再決定怎麼開口。'],
      ['D、I、S、C 客戶要怎麼說？', 'D 重結果和效率，I 重互動和感覺，S 重安全和穩定，C 重資料和邏輯。課程的重點不是貼標籤，而是讓你把同一份價值換成對方聽得懂的說法。'],
      ['客戶不信任我，怎麼辦？', '信任不是講更多，而是先讓對方感覺你真的懂他。課程會把觀察、提問和說明放回成交過程，讓你不再每個人都用同一套。'] ] },
    yanzhi: { name: '言之有物', overview: '把專業講得清楚、有感，也能把經驗說成團隊聽得懂的方法。', questions: [
      ['我的產品明明不差，為什麼講不進客戶心裡？', '客戶不是只需要知道功能，他要先看見這件事能替自己帶來什麼改變。言之有物會用能量、邏輯、格局，讓你的介紹既有感覺也有重點。'],
      ['我想把故事講得讓人有感。', '故事不是把經歷講很長，而是讓對方在你的故事裡看見自己。課程會把經驗整理成能打動人、又能回到產品價值的表達方式。'],
      ['我想帶團隊，但不知道怎麼把經驗講出去。', '你會學向上、平級、向下三種溝通方式，再用 30 秒電梯簡報和 YPD 把腦中的經驗說成別人能理解、願意照著做的方法。'] ] },
    xiaolu: { name: '極致效率', overview: '把客戶資料、追蹤和時間整理好，讓忙碌真的累積成成果。', questions: [
      ['我每天很忙，為什麼還是沒有結果？', '問題不是你不夠努力，而是太多時間花在找資料、回想對話和處理重複工作。極致效率會把客戶、時間和下一步整理成可執行的系統，讓你把時間留給真正重要的客戶。'],
      ['客戶很多，我卻常常忘記追蹤。', '每一次互動沒有留下來，下次就得重新開始。課程會用存、記、分、細與行事曆安排，讓你知道誰該跟、什麼時候跟、下一句要接什麼。'],
      ['我想把工作變成團隊也能複製的方法。', '你需要的不是再交代一次，而是把名單、客戶資料、追蹤和下一步做成共用流程。極致效率會幫你把個人的努力整理成團隊能接住的系統。'] ] }
  };

  const OBJECTIONS = {
    '我覺得課程還是太貴了': { key: 'price', follow: ['我想知道先上哪一堂最划算', '我想看台灣與吉隆坡場次', '我想先看退費保障'], fact: '全額退費保障與零退費紀錄' },
    '我還想再想一想': { key: 'think', follow: ['我還在想課程內容', '我還在想時間安排', '我還在想費用'], fact: '課程內容可先公開了解' },
    '我以前上課沒效果，怕這次也一樣': { key: 'result', follow: ['我怕回去不知道怎麼做', '我想看真實成果', '我想看課程怎麼練習'], fact: '超過 300 堂課、17 個產業、50 家企業' },
    '我現在真的抽不出時間': { key: 'time', follow: ['我最怕工作排不開', '我怕上完沒有時間做', '我想先看極致效率'], fact: '極致效率的客戶追蹤與時間系統' },
    '我需要先跟主管或家人討論': { key: 'decision', follow: ['我需要一份課程重點', '我想知道怎麼跟主管說', '我想先看價格日期'], fact: '已確認的課程資訊與學習重點' },
    '我覺得自己看書、看影片就好了': { key: 'selfstudy', follow: ['我想知道跟自學差在哪', '我怕自己跟不上', '我想先看一堂課內容'], fact: '完整系統、互動練習與公開課程重點' },
    '我怕自己學不會，最後還是做不出成果': { key: 'learn', follow: ['我需要知道第一步怎麼做', '我想看適合我的課程', '我想先看成功案例'], fact: '全額退費保障與跨產業學員成果' }
  };

  const LIFE = {
    1: [['主動開路', '你訂好目標後，會想把事情推到完成。'], ['說服表達', '你適合把重點講清楚，帶客戶做決定。'], ['帶路能力', '把主導力用在提問，客戶會更願意跟著你走。']],
    2: [['協調整合', '你能顧到客戶與團隊兩邊的需求。'], ['信任建立', '你容易察覺感受，客戶比較願意說真話。'], ['溫和推進', '照顧關係的同時，也能把下一步定下來。']],
    3: [['創意吸引', '你有把平常內容講得有趣、讓人想聽下去的能力。'], ['社交互動', '你擅長打開話題，讓初次接觸不那麼生硬。'], ['聚焦表達', '把重點收成一句話，感染力會更強。']],
    4: [['組織流程', '你能把事情整理成清楚步驟，讓客戶更安心。'], ['穩定踏實', '你說到做到，這會讓長期客戶信任你。'], ['承諾落地', '你適合把想法變成可執行的安排。']],
    5: [['靈活開發', '你善於看到新機會，也能接住客戶的變化。'], ['風趣互動', '你的說話方式容易讓客戶放鬆。'], ['臨場變通', '遇到不同情況時，你能換角度找到出口。']],
    6: [['照顧感', '客戶會感覺你不是只想成交，而是真的願意把事情做好。'], ['長期關係', '你適合回訪與服務，讓信任慢慢變成口碑。'], ['責任感', '你會把對方交代的事情放在心上。']],
    7: [['專業分析', '你擅長看細節、整理資訊，能給客戶有根據的建議。'], ['精準說服', '你不是靠大聲，而是靠看懂問題後說到重點。'], ['洞察提問', '你問得好時，客戶會更容易說出真正顧慮。']],
    8: [['帶動資源', '你有推動事情與整合資源的力量。'], ['果斷決策', '面對複雜問題時，你較能抓住方向。'], ['效益感', '你能幫客戶把投入和回報連起來。']],
    9: [['全局規劃', '你容易從更大的角度看見客戶真正想達成的事。'], ['理解需求', '你能接住客戶感受，找到對他有意義的說法。'], ['願景轉行動', '你能把大的想法收成一個可做的下一步。']]
  };

  // The published map is the reviewable source. These constants remain only as
  // a defensive fallback when somebody opens the page without its JSON file.
  let closingMap = null;

  function configure(map) {
    closingMap = map && map.schema_version && Array.isArray(map.course_nodes) ? map : null;
  }

  function talentQuestions() {
    if (!closingMap || !closingMap.talent_line || !Array.isArray(closingMap.talent_line.nodes)) return TALENT_QUESTIONS;
    return closingMap.talent_line.nodes.map(function (node) {
      return { id: node.id, prompt: node.ask, options: Object.keys(node.options || {}).map(function (label) { return [label, node.options[label]]; }) };
    });
  }

  function courseTree() {
    if (!closingMap || !Array.isArray(closingMap.course_nodes)) return COURSE_TREE;
    const tree = {};
    Object.keys(COURSE_TREE).forEach(function (id) {
      const name = COURSE_TREE[id].name;
      const mappedCourse = closingMap.courses && closingMap.courses[name];
      tree[id] = { name: name, overview: mappedCourse && mappedCourse.overview ? mappedCourse.overview : COURSE_TREE[id].overview, questions: [] };
    });
    closingMap.course_nodes.forEach(function (node) {
      const id = Object.keys(tree).find(function (key) { return tree[key].name === node.course; });
      if (id) tree[id].questions.push(node);
    });
    return tree;
  }

  function objections() {
    if (!closingMap || !Array.isArray(closingMap.objections)) return OBJECTIONS;
    const mapped = {};
    closingMap.objections.forEach(function (node) {
      const fallback = OBJECTIONS[node.ask];
      if (fallback) mapped[node.ask] = Object.assign({}, fallback, {
        source: node.source,
        purpose: node.purpose,
        follow: node.follow || fallback.follow,
        fact: node.evidence || fallback.fact,
        reply_by_disc: node.reply_by_disc || null
      });
    });
    return Object.keys(mapped).length ? mapped : OBJECTIONS;
  }

  function dialogue(id, values, fallback) {
    const template = closingMap && closingMap.dialogue && closingMap.dialogue[id] || fallback || '';
    return Object.keys(values || {}).reduce(function (text, key) {
      return text.split(`{${key}}`).join(values[key] === undefined ? '' : values[key]);
    }, template);
  }

  function newState(profile) {
    const p = Object.assign({ name: '', email: '', birthdate: '', region: 'tw', role: '', industry: '', product: '', problems: [], consent: false }, profile || {});
    return { version: 'decision-tree-v2', profile: p, phase: 'talent', talentIndex: 0, discScores: { D: 0, I: 0, S: 0, C: 0 }, talentAnswers: [], courseAnswers: {}, viewedCourses: [], activeCourse: '', answeredCourseNodes: [], activeObjection: '', conversation: [], computed: life(p.birthdate), report_ready: false };
  }

  function start(profile) {
    const state = newState(profile);
    const name = state.profile.name || '你好';
    const questions = talentQuestions();
    return reply(state, dialogue('welcome', { name, question: questions[0].prompt }, `${name}，你好！\n\n${questions[0].prompt}`), labels(questions[0]));
  }

  function transition(state, raw) {
    const next = clone(state || newState({}));
    const text = String(raw || '').trim();
    if (!text) return reply(next, '直接選一個最像你的答案就好。', buttons(next));
    next.conversation.push({ phase: next.phase, text: text });
    if (text === '課程介紹') return courseOverview(next);
    if (text === '我的銷售天賦') return talentStart(next);
    if (text === '推薦我的課程' || text === '建議學習路徑') return audienceQuestion(next);

    if (next.phase === 'talent') return answerTalent(next, text);
    if (next.phase === 'report_ready') return reportMenu(next, text);
    if (next.phase === 'course_audience') return answerAudience(next, text);
    if (next.phase === 'course_situation') return answerSituation(next, text);
    if (next.phase === 'course_skill') return answerSkill(next, text);
    if (next.phase === 'course_overview') return chooseCourse(next, text);
    if (next.phase === 'course_detail') return answerCourseDetail(next, text);
    if (next.phase === 'objection_gate') return answerObjectionGate(next, text);
    if (next.phase === 'objection_detail') return answerObjectionDetail(next, text);
    if (next.phase === 'recommendation') return recommendation(next);
    return reply(next, '你可以從下面選一個方向，我會接著幫你整理。', buttons(next));
  }

  function talentStart(state) {
    state.phase = 'talent'; state.talentIndex = 0; state.discScores = { D: 0, I: 0, S: 0, C: 0 }; state.talentAnswers = [];
    const questions = talentQuestions();
    return reply(state, dialogue('talent_restart', { question: questions[0].prompt }), labels(questions[0]));
  }

  function answerTalent(state, text) {
    const questions = talentQuestions();
    const question = questions[state.talentIndex];
    const option = question.options.find(function (item) { return item[0] === text; });
    if (!option) return reply(state, dialogue('talent_invalid', { question: question.prompt }), labels(question));
    state.discScores[option[1]] += 1; state.talentAnswers.push({ id: question.id, answer: text, disc: option[1] }); state.talentIndex += 1;
    if (state.talentIndex < questions.length) {
      const nextQuestion = questions[state.talentIndex];
      return reply(state, `${discBridge(option[1], state.talentIndex)}\n\n${nextQuestion.prompt}`, labels(nextQuestion));
    }
    state.report_ready = true; state.phase = 'report_ready';
    const report = profileSpec(state); const path = defaultPath(state);
    return reply(state, dialogue('report_ready', { name: state.profile.name || '你' }), ['課程介紹', '推薦我的課程', '我的銷售天賦', '我都清楚了'], report, path);
  }

  function reportMenu(state, text) {
    if (/yes|有準|像|成長|我都清楚/i.test(text)) return audienceQuestion(state);
    if (text === '課程介紹') return courseOverview(state);
    return reply(state, dialogue('report_menu'), ['課程介紹', '推薦我的課程', '我的銷售天賦', '我都清楚了'], profileSpec(state), defaultPath(state));
  }

  function audienceQuestion(state) {
    state.phase = 'course_audience';
    return reply(state, dialogue('audience_question'), ['上班族或家庭客戶', '企業老闆或主管', '高價專業服務客戶', '招募團隊或尋找合作夥伴']);
  }

  function answerAudience(state, text) {
    const allowed = ['上班族或家庭客戶', '企業老闆或主管', '高價專業服務客戶', '招募團隊或尋找合作夥伴'];
    if (allowed.indexOf(text) === -1) return audienceQuestion(state);
    state.courseAnswers.audience = text; state.phase = 'course_situation';
    const options = text === '招募團隊或尋找合作夥伴'
      ? ['對方有興趣，但一直沒有行動', '團隊聽懂了，卻做不出來', '我不知道怎麼帶出可複製的方法', '我都清楚了']
      : text === '企業老闆或主管'
        ? ['他一直比較效益與風險', '他說要回去和團隊討論', '他覺得現在沒有急迫性', '我都清楚了']
        : ['他覺得太貴', '他說再想想', '他還不夠信任我', '我都清楚了'];
    state.expectedButtons = options;
    return reply(state, dialogue('situation_question', { audience: text }), options);
  }

  function answerSituation(state, text) {
    const choices = state.expectedButtons || []; if (choices.indexOf(text) === -1) return reply(state, '選最接近那一次的情況就好。', choices);
    state.courseAnswers.situation = text; state.phase = 'course_skill';
    const options = /團隊|複製|做不出/.test(text) ? ['把方法講成團隊做得到的 SOP', '讓團隊更願意行動', '把追蹤和管理整理起來', '我都清楚了']
      : /太貴|比較|效益/.test(text) ? ['把價值講清楚', '問出真正考量', '讓對方相信結果', '我都清楚了']
      : /信任/.test(text) ? ['看懂對方在意什麼', '讓對方更安心', '把專業說得更容易懂', '我都清楚了']
      : ['問出真正原因', '把下一步推清楚', '把追蹤和流程整理好', '我都清楚了'];
    state.expectedButtons = options;
    return reply(state, dialogue('skill_question', { situation: text }), options);
  }

  function answerSkill(state, text) {
    if ((state.expectedButtons || []).indexOf(text) === -1) return reply(state, '選一個你最想先變強的地方就好。', state.expectedButtons || []);
    state.courseAnswers.skill = text; state.phase = 'recommendation';
    const path = coursePath(state);
    return reply(state, dialogue('recommendation_after_diagnosis', { name: state.profile.name || '你', path: formatCoursePath(path), skill: text }), ['課程介紹', '我的銷售天賦', '我要看開課資訊', '我都清楚了'], profileSpec(state), path);
  }

  function courseOverview(state) {
    state.phase = 'course_overview'; state.activeCourse = ''; state.answeredCourseNodes = [];
    const courses = courseTree();
    const list = Object.keys(courses).map(function (id) { const course = courses[id]; return `${course.name}：${course.overview}`; }).join('\n');
    return reply(state, dialogue('course_overview', { courses: list }), Object.keys(courses).map(function (id) { return courses[id].name; }));
  }

  function chooseCourse(state, text) {
    const courses = courseTree();
    const id = Object.keys(courses).find(function (key) { return courses[key].name === text; });
    if (!id) return reply(state, '直接點一堂課，我會用你聽得懂的方式拆給你看。', buttons(state));
    state.phase = 'course_detail'; state.activeCourse = id; state.answeredCourseNodes = [];
    const course = courses[id];
    return reply(state, dialogue('course_choose', { course: course.name }), detailButtons(state));
  }

  function answerCourseDetail(state, text) {
    const course = courseTree()[state.activeCourse];
    if (text === '回到五堂課介紹') return courseOverview(state);
    if (text === '推薦我的課程') return audienceQuestion(state);
    if (text === '我都清楚了') {
      if (state.viewedCourses.indexOf(state.activeCourse) === -1) state.viewedCourses.push(state.activeCourse);
      if (state.viewedCourses.length >= 5) return objectionGate(state);
      return courseOverview(state);
    }
    if (text === '課程介紹') return courseOverview(state);
    if (text === '我的銷售天賦') return talentStart(state);
    const node = course.questions.find(function (item) { return item.ask === text; });
    if (!node) return reply(state, '直接選一個你最想知道的問題，我接著說。', detailButtons(state));
    state.answeredCourseNodes.push(text);
    const studentDisc = discResult(state).primary;
    const replyText = node.responses && node.responses[studentDisc]
      ? node.responses[studentDisc]
      : courseLead(studentDisc, state, course.name) + '\n\n' + node.base_answer + '\n\n' + courseClose(studentDisc, course.name);
    return reply(state, replyText, detailButtons(state, node));
  }

  function detailButtons(state, activeNode) {
    const course = courseTree()[state.activeCourse];
    if (activeNode && Array.isArray(activeNode.buttons)) return activeNode.buttons.map(function (button) { return button.label; });
    const remaining = course.questions.filter(function (item) { return state.answeredCourseNodes.indexOf(item.ask) === -1; }).map(function (item) { return item.ask; });
    if (remaining.length >= 3) return remaining.concat('我都清楚了');
    const out = remaining.slice();
    if (out.length < 3) out.push('回到五堂課介紹');
    if (out.length < 3) out.push('推薦我的課程');
    out.push('我都清楚了');
    return out.slice(0, 4);
  }

  function objectionGate(state) {
    state.phase = 'objection_gate';
    return reply(state, dialogue('objection_gate'), Object.keys(objections()).concat('沒有疑慮了'));
  }

  function answerObjectionGate(state, text) {
    if (text === '沒有疑慮了') return recommendation(state);
    const item = objections()[text]; if (!item) return objectionGate(state);
    state.phase = 'objection_detail'; state.activeObjection = text;
    const disc = discResult(state).primary; const recommended = coursePath(state)[0];
    return reply(state, objectionReply(item.key, disc, state, recommended) + `\n\n你想先從哪一點再看清楚？`, item.follow.concat('我都清楚了'));
  }

  function answerObjectionDetail(state, text) {
    if (text === '我都清楚了') return recommendation(state);
    const item = objections()[state.activeObjection]; if (!item || item.follow.indexOf(text) === -1) return answerObjectionGate(state, state.activeObjection);
    const course = coursePath(state)[0];
    const followup = item.follow_responses && item.follow_responses.find(function (entry) { return entry.label === text; });
    const answer = followup && followup.responses && followup.responses[discResult(state).primary]
      ? `${followup.responses[discResult(state).primary]}\n\n所以現在最適合先看的是《${course ? course.name : '第一堂課'}》。`
      : objectionFollowUp(item.key, text, discResult(state).primary, course);
    return reply(state, answer, ['課程介紹', '推薦我的課程', '我的銷售天賦', '我都清楚了']);
  }

  function recommendation(state) {
    state.phase = 'recommendation'; const path = coursePath(state);
    return reply(state, dialogue('recommendation', { name: state.profile.name || '你', path: formatCoursePath(path) }), ['我要看開課資訊', '我要報名', 'LINE 顧問', '課程介紹'], profileSpec(state), path);
  }

  function objectionReply(key, disc, state, course) {
    const name = state.profile.name || '你'; const courseName = course ? course.name : '這堂課';
    const variants = {
      price: { D: '我直接幫你算重點：不必一次全上，先從最需要的一堂開始。你現在最想處理的問題如果少掉一次漏單或一次錯誤跟進，這筆投資怎麼看才划算？', I: '我懂你想把每一分錢花得值得。很多人一開始也會猶豫，但真正重要的是：這堂課能不能讓你少走很多自己摸索的路。', S: '你想謹慎一點很正常。你不用一次把所有課都決定，先從最需要的一堂開始，確認自己用得上再往下走。', C: '費用要看投入和可驗證的回報。可以先選最對應目前問題的一堂，再用全額退費保障與零退費紀錄降低決策風險。' },
      think: { D: '可以。你現在到底還在想內容、時間還是費用？先把那一點講清楚，不用帶著一堆模糊問題回去。', I: '當然可以想清楚！你心裡最在意的是內容、時間還是費用？你說出來，我們把那一點拆開就好。', S: '慢慢確認沒有問題。你現在還想多知道的是內容、時間還是費用？我先把你在意的那一點講清楚。', C: '做決定前完整評估很合理。你目前需要補的是內容適配性、時間安排、還是費用效益？我會只補那一部分。' },
      result: { D: '你擔心的是上完沒有方法，不是沒有熱情。這裡教的是可照著走的系統，內容可先看，還有全額退費保障。', I: '以前上完課很熱血，回去又回到原本樣子，真的會失望。我們要看的不是聽起來多厲害，而是你回去能不能真的用。', S: '有過不好的經驗，再謹慎很正常。這次先看你最常遇到的情境，再決定哪一堂最能幫你，不需要勉強自己一次全選。', C: '可以用三件事評估：課綱是否透明、方法是否有步驟、風險是否有保障。目前有超過 300 堂課、17 個產業、50 家企業的驗證。' },
      time: { D: '你越忙，越要先把時間花在會累積的地方。先花一段時間整理方法，比每天重複忙同一件事更有效。', I: '我知道你不是懶，是每天事情真的很多。這正是極致效率要幫你的：把雜事收起來，讓時間回到客戶和成果。', S: '行程滿的時候，再多一件事都會有壓力。可以先從最需要的一堂開始，讓你慢慢把工作整理得更舒服。', C: '把時間當投資看：現在大量時間耗在找資料、回想與漏追蹤；先建立流程，才能持續降低重複成本。' },
      decision: { D: '沒問題，我幫你整理重點，你直接拿去談。先讓對方看到問題、方法和已確認的課程資訊。', I: '很好，你願意跟重要的人一起確認，代表你是認真看待這件事。我會把重點整理得讓你更好說明。', S: '先和主管或家人討論很合理。你可以帶著清楚的課程重點、日期和價格回去，不必自己轉述一大段。', C: '可以提供可核對的課程重點、場次與價格，讓決策者依問題、方法和風險保障評估。' },
      selfstudy: { D: '書和影片很多，但如果資訊就能解決，你現在應該已經不用花時間找答案。差別在於這裡給你一套可直接執行的順序。', I: '自學當然有用，但一個人拼很多零散內容，常常越看越多、越不知道先做什麼。課堂的價值是有人幫你把路排好。', S: '自己慢慢學也可以。只是當你想要有人帶著練、確認做法沒有偏掉，完整系統會讓你少一點不安。', C: '自學的限制是資訊零散、缺少回饋與校正。課程把方法整理成架構，讓你能檢查自己是否真的用對。' },
      learn: { D: '你不需要一次全會。先抓一個最常遇到的情境，照方法做一次，再往下一步推。', I: '你不是做不到，只是還沒有人把方法拆成你能立刻用的一步。從最有感的地方開始，很快就會看到自己不一樣。', S: '不用怕跟不上。先從最需要的一堂開始，照著步驟做，慢慢把信心累積起來。', C: '能不能學會，要看方法有沒有清楚步驟與檢核點。先選和你目前問題最直接相關的一堂，降低同時學太多的負擔。' }
    };
    const objection = objections()[state.activeObjection];
    const answer = objection && objection.responses && objection.responses[disc]
      ? objection.responses[disc]
      : objection && objection.reply_by_disc && objection.reply_by_disc[disc] ? objection.reply_by_disc[disc] : variants[key][disc];
    const evidence = objection && objection.fact;
    return `${name}，${answer}\n\n就你前面說的狀況，我會先把「${courseName}」放在第一步。${evidence || ''}會在需要時提供給你確認。`;
  }

  function objectionFollowUp(key, choice, disc, course) {
    const courseName = course ? course.name : '第一堂課';
    const core = {
      price: '先從最需要的一堂開始，比一次比較所有課更容易算清楚。', think: '把你真正還沒確認的那一點說清楚，才是有效的考慮。', result: '你回去會有明確的第一步，而不是只多了一堆名詞。', time: '先把會重複耗掉時間的流程整理起來，才有空做真正重要的事。', decision: '把問題、方法、課程重點和已確認資訊整理成一頁，討論會更有效率。', selfstudy: '書給知識，系統給順序；課堂讓你有機會在現場把順序練成自己的。', learn: '先從一個情境練起，方法用得出來，信心才會跟上。'
    };
    return `${discClose(disc)} ${choice}這一點，我先替你收成一句：${core[key]}\n\n所以現在最適合先看的是《${courseName}》。你可以直接看課程介紹，或回到你的學習路徑。`;
  }

  function coursePath(state) {
    const text = [state.profile.problems || [], state.courseAnswers.situation || '', state.courseAnswers.skill || '', state.courseAnswers.audience || '', state.profile.role || ''].join(' ');
    const score = { liuliang: 0, chengjiao: 0, zhizhi: 0, xiaolu: 0, yanzhi: 0 };
    function add(id, n) { score[id] += n; }
    if (/客戶不夠|名單|內容|流量/.test(text)) add('liuliang', 4);
    if (/成交|再想想|太貴|價值|需求|下一步|比較|效益/.test(text)) add('chengjiao', 4);
    if (/信任|看懂|安心|客戶類型/.test(text)) add('zhizhi', 4);
    if (/忙|追蹤|資料|時間|複製|SOP/.test(text)) add('xiaolu', 4);
    if (/講|表達|故事|帶人|團隊/.test(text)) add('yanzhi', 4);
    if (/招募團隊|合作夥伴/.test(text)) { add('yanzhi', 2); add('chengjiao', 2); add('xiaolu', 2); }
    if (!Object.values(score).some(Boolean)) add('chengjiao', 1);
    return Object.keys(score).sort(function (a, b) { return score[b] - score[a] || a.localeCompare(b); }).slice(0, 3).map(function (id, index) {
      return { order: index + 1, id: id, name: courseTree()[id].name, page: COURSE_LINKS.courses[id], reason: pathReason(id, state) };
    });
  }

  function defaultPath(state) { return coursePath(state); }
  function formatCoursePath(path) {
    return path.map(function (course) { return `${course.order}. 《${course.name}》\n${course.reason}`; }).join('\n\n');
  }
  function pathReason(id, state) {
    const reasons = { liuliang: '先把客戶從哪裡來與名單怎麼留下來整理好。', chengjiao: '先把需求、價值與下一步變成可照著走的成交流程。', zhizhi: '先看懂不同客戶在意什麼，讓信任建立得更快。', xiaolu: '先把客戶資料、追蹤與時間整理好，讓努力累積成成果。', yanzhi: '先把你的專業與經驗講得更有感、更容易被聽懂。' };
    return reasons[id];
  }

  function profileSpec(state) {
    const disc = discResult(state); const lifeTalents = LIFE[state.computed.life_number] || LIFE[3]; const problems = state.profile.problems || [];
    const advice = /忙|追蹤/.test(problems.join(' ')) ? '先把每位客戶的最後一次互動、下一步和追蹤時間留在同一個地方。你不用更忙，先讓每一次努力留得下來。'
      : /講|價值/.test(problems.join(' ')) ? '下一次介紹產品時，先講客戶現在的問題，再講他用了之後會變成什麼樣子，最後才補你的方法。'
      : '下一次對話先少講一點產品，多問一個和對方現況有關的問題。對方講得越多，你越知道下一步怎麼幫。';
    const quote = { D: '把重點說清楚，行動才會開始。', I: '讓客戶有感，價值才會被看見。', S: '信任走在前面，成交就不必硬推。', C: '把方法整理好，專業才會變成果。' }[disc.primary];
    return { disc_type: disc.label, life_number: String(state.computed.life_number || ''), sales_advantages: toItems(DISC[disc.primary].strengths), life_talents: toItems(lifeTalents), improvement_points: toItems(DISC[disc.primary].improvement), practical_advice: advice, final_quote: quote };
  }

  function toItems(pairs) { return pairs.slice(0, 3).map(function (pair) { return { title: pair[0], insight: pair[1], strategy: '' }; }); }
  function discResult(state) { const entries = Object.keys(state.discScores).map(function (key) { return { key: key, score: state.discScores[key] }; }).sort(function (a, b) { return b.score - a.score; }); const top = entries[0]; const second = entries[1]; const mixed = top.score > 0 && top.score === second.score; return { primary: top.score ? top.key : 'I', label: mixed ? `偏向 ${DISC[top.key].short}，也帶有 ${DISC[second.key].short} 特質` : DISC[top.key].label }; }
  function life(birthdate) { const digits = String(birthdate || '').replace(/\D/g, '').split('').map(Number); const total = digits.reduce(function (sum, n) { return sum + n; }, 0); return { life_number: reduce(total) }; }
  function reduce(n) { let value = Number(n) || 0; while (value > 9) value = String(value).split('').map(Number).reduce(function (sum, digit) { return sum + digit; }, 0); return value || 3; }
  function labels(question) { return question.options.map(function (item) { return item[0]; }); }
  function buttons(state) { if (state.phase === 'talent') return labels(talentQuestions()[state.talentIndex]); if (state.phase === 'course_detail') return detailButtons(state); if (state.phase === 'course_overview') return Object.keys(courseTree()).map(function (id) { return courseTree()[id].name; }); if (state.phase === 'course_situation' || state.phase === 'course_skill') return state.expectedButtons || []; return []; }
  function discBridge(disc, index) { const text = { D: '我懂，你很在意事情有沒有往前走。', I: '我懂，你很在意互動有沒有溫度。', S: '我懂，你很在意關係不要被弄壞。', C: '我懂，你很在意事情有沒有根據。' }[disc]; return index === 1 ? text : '這一點我記下來了，我再確認最後一題。'; }
  function courseLead(disc, state, course) {
    if (closingMap && closingMap.disc_voice && closingMap.disc_voice[disc]) return closingMap.disc_voice[disc].opening;
    return { D: `你前面想要的是更快看到結果。${course}不是多一套話術，而是讓你知道現在該做哪一步。`, I: `你前面很在意對方有沒有感覺。${course}會把你的互動和說法變得更容易讓人聽進去。`, S: `你前面在意關係和安心。${course}會給你一套不用硬推、也能慢慢把事情推進的做法。`, C: `你前面重視方法和依據。${course}會把判斷、步驟和可執行的工具整理清楚。` }[disc];
  }
  function courseClose(disc, course) {
    if (closingMap && closingMap.disc_voice && closingMap.disc_voice[disc]) return closingMap.disc_voice[disc].closing;
    return { D: `這一段學會後，你會更清楚下一步怎麼做。`, I: `你會更有把握把價值講得讓人有感。`, S: `你不用急著變成別人，一步一步做就好。`, C: `你可以依這個架構檢查自己目前少了哪一段。` }[disc];
  }
  function discClose(disc) { return { D: '我先直接幫你收斂重點。', I: '我們把這件事說得更清楚一點。', S: '不用急，我們一步一步看。', C: '我把判斷條件整理給你。' }[disc]; }
  function reply(state, text, actionButtons, profileSpecValue, path) { return { phase: state.phase, reply: text, buttons: actionButtons || [], state: state, deterministic_state: state, profile_spec: profileSpecValue || null, course_path: path || null, response_strategy: { primary_disc: discResult(state).primary, disc_label: discResult(state).label } }; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  return { start: start, transition: transition, configure: configure, COURSE_LINKS: COURSE_LINKS, COURSE_TREE: COURSE_TREE, OBJECTIONS: OBJECTIONS };
});
