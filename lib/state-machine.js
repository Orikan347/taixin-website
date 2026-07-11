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
      benefit: '幫你處理「客戶從哪裡來」。',
      overview: '先把名單來源建立起來，不再只靠介紹或運氣等客戶。',
      audience: '客戶來源不穩、名單不夠，或業績常常要靠介紹的人。',
      learn: [
        '天地人網：把線上、線下、社群、個人品牌、實體場景與人脈整理成開發方向。',
        '存→記→分→細：把名單留下、記錄、分類，再安排後續。',
        '讓你不只等介紹，而是知道下一批客戶可以從哪裡來。'
      ]
    },
    chengjiao: {
      id: 'chengjiao',
      name: '成交地圖',
      page: COURSE_LINKS.courses.chengjiao,
      reason: '把客戶猶豫、拒絕和下一步整理成一套可以照著走的流程。',
      benefit: '幫你處理「客戶來了怎麼成交」。',
      overview: '把從第一印象到成交的每一步整理清楚，知道下一句怎麼接。',
      audience: '客戶會談後常常停住、常聽到再想想，或不知道下一句怎麼接的人。',
      learn: [
        '第一印象：用具體事實和正面特質建立信任。',
        '五大核心問題：問出客戶真正想解決的事，不只停在表面需求。',
        'MBAF 產品介紹法與成交 365：把價值說清楚，處理顧慮，再帶到下一步。'
      ]
    },
    zhizhi: {
      id: 'zhizhi',
      name: '直指人心',
      page: COURSE_LINKS.courses.zhizhi,
      reason: '先看懂客戶在意什麼，用他聽得進去的方式建立信任。',
      benefit: '幫你處理「怎麼看懂客戶」。',
      overview: '看懂不同客戶在意什麼，知道怎麼說他才聽得進去。',
      audience: '常覺得客戶很難懂、信任建立不夠，或每個人都只能用同一套說法的人。',
      learn: [
        '從外貌舉止、聲音語調和互動反應，觀察客戶的行為模式。',
        '用 DISC 四型調整說法：D 重結果、I 重互動、S 重安全、C 重資料和邏輯。',
        '把判斷放回成交流程，讓你不是對每個人都講同一套。'
      ]
    },
    xiaolu: {
      id: 'xiaolu',
      name: '極致效率',
      page: COURSE_LINKS.courses.xiaolu,
      reason: '把客戶資料、時間安排、追蹤與下一步整理起來，讓忙碌累積成成果。',
      benefit: '幫你處理「很忙但沒結果」。',
      overview: '把客戶資料、時間和追蹤整理好，解決每天很忙卻沒有結果。',
      audience: '每天很忙卻沒有結果、資料散落各處，或常常忘記追蹤客戶的人。',
      learn: [
        '把客戶資料和過去互動整理好，找得到資料，才跟得上客戶。',
        '用存→記→分→細管理名單，再配合時間碼和行事曆安排追蹤。',
        '搭配智能 AI 成交助手，把重複整理交給工具，把時間留給真正重要的客戶。'
      ]
    },
    yanzhi: {
      id: 'yanzhi',
      name: '言之有物',
      page: COURSE_LINKS.courses.yanzhi,
      reason: '把產品價值講得有畫面、有邏輯、有格局，讓客戶聽懂跟自己有關。',
      benefit: '幫你處理「怎麼講出價值」。',
      overview: '把產品價值說得清楚、有感，也能用來帶人和影響團隊。',
      audience: '專業做得到卻講不清楚、介紹產品沒有感染力，或需要帶人和影響團隊的人。',
      learn: [
        '用能量、邏輯、格局，把專業講得清楚、有感，而且和對方有關。',
        '學向上、平級、向下三種溝通方式，知道面對不同對象該怎麼說。',
        '用 30 秒電梯簡報和 YPD 三部曲，把想法說出來，也讓別人願意跟著做。'
      ]
    }
  };

  const COURSE_DETAIL_TREE = {
    liuliang: {
      intro: '流量磁鐵先幫你處理「客戶從哪裡來」。它不是叫你一直發內容，而是把線上、線下、社群、個人品牌、實體場景和人脈整理成可以執行的開發方向。',
      questions: [
        { label: '天地人網怎麼找名單？', reply: '天地人網會把線上、線下、社群、個人品牌、實體場景和人脈放在一起看。你不必只依賴一個來源，而是找到適合你產業和個性的開發方式。' },
        { label: '名單找到後怎麼管理？', reply: '名單不是加進手機就結束，而是要做到「存、記、分、細」：先留下來，再記錄互動，分辨現在的狀態，最後安排細節和下一次跟進。' },
        { label: '沒有名單的人適合嗎？', reply: '適合。這堂課就是先處理你不知道去哪裡找客戶的問題，再把找到的人留下來、分清楚，讓開發不再只靠臨時想到。' }
      ]
    },
    chengjiao: {
      intro: '成交地圖先幫你處理「客戶來了怎麼成交」。它把第一印象、核心問題、產品介紹和成交收尾排成一條路，讓你不必每次都靠臨場猜下一句。',
      questions: [
        { label: '怎麼問出客戶真正的需求？', reply: '先不要急著介紹產品。用五大核心問題把客戶的背景、現在的困擾、影響、期待和下一步問出來，才知道他真正想解決的是什麼。' },
        { label: 'MBAF 怎麼介紹產品價值？', reply: '先講客戶得到的利益，再說明你的優勢，最後才補產品特性。MBAF 的重點是把規格翻成客戶聽得懂、感受得到的價值。' },
        { label: '客戶拒絕時要怎麼處理？', reply: '拒絕處理先從理解開始，再問清楚對方指的是哪一個部分、這個訊息從哪裡來，接著用 MBAF 重新說明價值，確認問題有沒有解決，最後再帶到方案。' }
      ]
    },
    zhizhi: {
      intro: '直指人心先幫你處理「怎麼看懂客戶」。你會從互動中的行為線索判斷對方在意什麼，再調整說法，不再每個人都用同一套。',
      questions: [
        { label: '怎麼從互動看出客戶類型？', reply: '可以觀察客戶的外貌舉止、聲音語調、回答速度和他在意的問題，再把這些線索放回 DISC 四型判斷，而不是只憑第一印象下結論。' },
        { label: 'D、I、S、C 要怎麼說？', reply: 'D 型重結果和效率，I 型重感覺和互動，S 型重安全和穩定，C 型重資料和邏輯。重點不是貼標籤，而是讓你的說法更接近對方聽得進去的方式。' },
        { label: '怎麼讓客戶更快建立信任？', reply: '先讓客戶感覺你真的有聽懂他，再用適合他的方式提問、說明和追蹤。當客戶感覺被理解，後面的成交才不會一直靠硬推。' }
      ]
    },
    xiaolu: {
      intro: '極致效率先幫你處理「很忙但沒結果」。它把客戶資料、時間安排、追蹤和下一步整理好，讓你的時間回到真正重要的客戶身上。',
      questions: [
        { label: '怎麼處理業務員每天很忙？', reply: '先把重複找資料、回想對話和安排時間的工作整理起來，再把時間留給客戶互動和成交。效率不是做更多，而是不要把力氣花在一直重來。' },
        { label: '客戶資料怎麼整理才不會漏？', reply: '用「存、記、分、細」管理名單：保存聯絡資料，記下互動內容，分辨客戶狀態，再留下下一步和時間。這樣下次接觸時，不必重新猜。' },
        { label: '時間碼和行事曆怎麼配合？', reply: '先替不同類型的工作留下固定時間，再把客戶的下一步直接放進行事曆。你會更清楚今天要做什麼，也比較不會只忙著處理臨時事情。' }
      ]
    },
    yanzhi: {
      intro: '言之有物先幫你處理「怎麼把價值說清楚」。它不是只教你講得漂亮，而是讓你的話有能量、有邏輯、有格局，客戶和團隊都聽得懂。',
      questions: [
        { label: '能量、邏輯、格局是什麼？', reply: '能量讓人願意聽，邏輯讓人聽得懂，格局讓人看見這件事和未來有什麼關係。三個放在一起，產品介紹才不會只有功能和規格。' },
        { label: '面對不同對象要怎麼說？', reply: '向上溝通要讓決策者看見方向和價值，平級溝通要讓人願意合作，向下溝通要讓團隊知道怎麼執行。對象不同，說法就不能完全一樣。' },
        { label: '30 秒電梯簡報和 YPD 能幫什麼？', reply: '30 秒電梯簡報幫你在很短的時間講清楚重點；YPD 三部曲則幫你把不敢說、說不清楚的地方拆開練習，讓表達可以真正拿回現場使用。' }
      ]
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

  // 每一顆客戶看得到的按鈕都是獨立節點。children 的三個答案不能共用回覆。
  const TREE_NODES = {
    'lead-source': { branch: 'lead', reply: '不知道去哪找客戶時，先別急著把訊息丟給所有人。先選一種你最懂的人，再把他正在煩的問題講清楚，名單才會開始靠近你。', children: {
      '我不知道先找誰': '先回頭看你過去最容易成交的三位客戶：他們的身分、當時在煩什麼、為什麼信任你。下一波名單先找相似的人，不要從完全陌生的方向亂試。',
      '我沒有熟人名單': '沒有熟人名單也可以先做入口。挑一個常見問題寫成短內容，讓對的人回覆關鍵字或留下聯絡方式，再從有反應的人開始對話。',
      '我不知道怎麼開口': '開口不是先介紹自己，而是先問一個對方願意回答的問題。像是「你最近在這件事上最花時間的是哪一段？」先讓他講，才知道你要幫什麼。'
    }},
    'lead-content': { branch: 'lead', reply: '內容發了沒人問，通常不是你不夠努力，而是讀的人還看不懂這跟他有什麼關係。內容第一句先講他正在經歷的情境，不要先講你有多厲害。', children: {
      '我不知道題目怎麼選': '先把客戶常問、常拖、常比較的問題寫下來。一次只挑一題回答，題目越像客戶真的會說的話，越容易有人停下來看。',
      '有人看但沒人私訊': '每一篇內容都要留一個很小的下一步，例如請他回覆一個關鍵字、選一個選項，或說出他最在意哪一點。沒有下一步，讀完就容易離開。',
      '我怕寫得太像廣告': '把內容改成先幫他判斷問題，再給一個能立刻做的小方法。當對方先感覺有收穫，才會願意認識你能提供的完整方案。'
    }},
    'lead-system': { branch: 'lead', reply: '想建立穩定來源，不能只等某一篇爆掉。你要同時有內容入口、對話名單和固定追蹤，這樣客戶不是來一次就消失。', children: {
      '我想先做內容入口': '先固定一個主題，連續回答同一類客戶的三個問題。當別人一想到這個問題就想到你，內容才會變成入口。',
      '我想整理名單': '把名單分成剛認識、正在了解、需要追蹤三類，每一類只設定一個下一步。資料簡單，才會真的每天用。',
      '我想安排追蹤': '追蹤不要只問「考慮得怎麼樣」。每次追蹤都帶一個新價值：案例、提醒、比較表或下一個問題，對方才有理由回你。'
    }},
    'price-not-now': { branch: 'price', reply: '客戶說現在不需要，不要急著證明產品多好。先把他拉回原本想解決的事，才能分辨他是真的不急，還是還沒看見影響。', children: {
      '我想知道他到底急不急': '直接問他：「這件事如果三個月都不處理，最麻煩的會是哪一件？」他說出的後果，就是你下一步要談的價值。',
      '他一直說再等等': '你可以把選擇變得具體：「你是想等預算、等時機，還是還想多看幾個方案？」讓他不用用一句再等等把對話結束。',
      '我怕問了有壓力': '語氣可以放輕，但問題要清楚。你不是要逼他今天買，而是幫他看懂延後決定會帶來什麼差別。'
    }},
    'price-effect': { branch: 'price', reply: '客戶怕沒有效，不是要你保證結果，而是想知道風險怎麼被照顧。先承認他的擔心，再說明你怎麼帶他走過過程。', children: {
      '我沒有很多案例': '沒有一堆案例時，就講清楚你的方法：先判斷什麼、過程怎麼做、每一步怎麼確認。清楚的流程本身就是信任。',
      '我怎麼說明過程': '不要只說服務很好。把第一次會做什麼、中間怎麼調整、最後怎麼確認效果講出來，客戶才看得到自己不是被丟著不管。',
      '客戶要保證怎麼辦': '你可以說明你能承諾的是標準、流程和陪伴，不是替他保證一個不真實的結果。這反而會讓專業更可信。'
    }},
    'price-compare': { branch: 'price', reply: '客戶想比較很正常。你的工作不是阻止他比較，而是教他不要只比價格，要比最後能不能真的解決問題。', children: {
      '我要怎麼比方案': '幫他列三欄：解決什麼問題、執行時有人怎麼陪、最後怎麼驗證。比較表一出來，價格就不會是唯一標準。',
      '對方比較便宜': '不要立刻降價。先問便宜方案少了哪一段服務或風險處理，再讓客戶自己判斷他買的是價格，還是完整結果。',
      '我怎麼守住價值': '守住價值不是重複說高品質，而是講清楚你多做了哪一個客戶需要的步驟。越具體，越不需要靠形容詞。'
    }},
    'think-price': { branch: 'think', reply: '客戶說再想想，若他真正想的是價格，你要先弄清楚他是在擔心預算、投資回收，還是怕買錯。三種情況，不能用同一句話處理。', children: {
      '他是預算不夠': '先問他目前預算怎麼安排，再一起看最小能開始的方案。不要急著替他做決定，先讓他知道有哪些選擇。',
      '他怕花了不值得': '把討論拉回他最在乎的結果：這筆投入成功後能省下什麼時間、少掉什麼麻煩，或多得到什麼機會。',
      '他怕買錯': '你可以問他以前買過什麼、哪裡失望過。聽到舊經驗後，再說你這次如何避免同樣狀況。'
    }},
    'think-effect': { branch: 'think', reply: '客戶在想效果，表示他還沒把你的方法和自己的未來連起來。這時候少講形容詞，多講他會經過哪些改變。', children: {
      '我想讓他看見改變': '先讓他描述現在最不方便的畫面，再請他想像那件事改善後的一天會怎麼不同。這個落差就是產品要解決的事。',
      '我想講案例': '案例不要只說別人變多好，要說對方原本遇到什麼、做了什麼、最後哪一點改變。客戶才會把自己代進去。',
      '我怕講得太誇張': '就講你看得到的過程與條件，不承諾不存在的成果。誠實的說明比漂亮保證更能留住信任。'
    }},
    'think-decision': { branch: 'think', reply: '客戶想問別人時，真正需要的是一段帶得回去、講得清楚的理由。你要幫他整理，而不是讓他只帶著價格回去。', children: {
      '他要問主管': '幫他整理成主管最在意的三句：現在有什麼問題、做了能得到什麼效益、需要哪些資源。主管先看結果，再看細節。',
      '他要問家人': '先問家人最可能擔心什麼，是預算、時間還是風險。把那個擔心先講清楚，對方回去才不會只剩一句很貴。',
      '他一直拖決定': '把下一步縮小成一件事，例如先確認一個條件或安排一次說明。小決定做得出來，大決定才會往前。'
    }},
    'decision-manager': { branch: 'decision', reply: '跟主管說，不是把產品介紹背完，而是讓主管先看懂這件事值不值得投入。順序是問題、效益、執行方式。', children: {
      '我想先講問題': '用一個主管看得到的現象開場，例如時間浪費、客戶流失或團隊重工。問題越具體，後面的方案越容易被聽進去。',
      '我想先講效益': '把效益換成主管會判斷的東西：節省時間、提高成交、降低錯誤或讓團隊更好複製。不要只說會變更好。',
      '我怕主管問細節': '先準備三個關鍵數字或流程：要花多少資源、多久開始、怎麼檢查。細節不是越多越好，是先回答他最在意的。'
    }},
    'decision-value': { branch: 'decision', reply: '整理價值時，先把客戶從「這東西多少錢」帶到「不處理會付出什麼代價」。價值是他看見問題與結果之間的差。', children: {
      '我想講少掉的麻煩': '把客戶現在反覆花掉的時間、出錯或錯失機會說具體。看得見的麻煩，比抽象好處更能推動決定。',
      '我想講得到的結果': '結果要跟他的角色有關。老闆看效益、主管看執行、個人看生活與壓力，先選他最在意的一種說法。',
      '我想整理成一句話': '你可以用「幫你從現在的___，走到___，而且過程有人陪你做到」這個句型，先把價值說短、說清楚。'
    }},
    'decision-risk': { branch: 'decision', reply: '降低風險不是一直說沒問題，而是把客戶最怕的事情攤開來，一項一項告訴他怎麼被處理。', children: {
      '他怕花錯錢': '先確認他心裡的判斷標準，再把方案怎麼符合標準講出來。客戶有標準，就不會只憑感覺害怕。',
      '他怕做不下去': '把開始拆得很小，先說第一週要做什麼、誰會協助、遇到問題怎麼處理。能想像開始，才會願意答應。',
      '他怕影響現有安排': '問他最不能被打亂的是時間、團隊還是預算，再針對那一點說明安排。不要一次回答所有風險。'
    }},
    'trust-understand': { branch: 'trust', reply: '看懂客戶不是猜他在想什麼，而是從他重複說的字、在意的細節和做決定的方式慢慢聽出來。先聽，才有資格說懂。', children: {
      '我想聽他的關鍵字': '客戶反覆講的字最重要，例如一直說怕麻煩、怕浪費或怕被騙。先把那個字重述給他聽，再問他為什麼特別在意。',
      '我想分辨他的決策方式': '有人先要結果、有人先要感覺、有人先要安全、有人先要資料。先看他問什麼，再用他聽得進去的順序回答。',
      '我怕自己判斷錯': '不要急著替他貼標籤。你可以直接確認：「我聽起來你最在意的是___，我有抓對嗎？」讓客戶自己校正你。'
    }},
    'trust-safety': { branch: 'trust', reply: '讓客戶安心，不是一直說相信我，而是讓他感覺每一步都清楚、他有選擇、你不會逼他。', children: {
      '我想先同理他': '先接住他的顧慮，例如「你會擔心很正常，因為這不是一個隨便的決定。」先被理解，客戶才會願意再往下談。',
      '我想說清楚流程': '把接下來會發生什麼講成三步：先確認需求、再看方案、最後決定下一步。未知變少，壓力就會下降。',
      '我想給他小選擇': '不要只問要不要買，改問他想先看哪一種方案、先確認哪個問題。客戶有選擇權，對話更容易繼續。'
    }},
    'trust-truth': { branch: 'trust', reply: '問出真話的關鍵不是問題越多，而是每一題都接著他剛剛的回答。五連問是往下了解，不是把人問到有壓力。', children: {
      '他說再想想': '你可以問：「你想再想想的，是價格、效果，還是怕自己選錯？」給選項，比空泛追問更容易讓他回答。',
      '他怕被推銷': '先說：「我不是要你現在決定，我只是想知道你最不放心哪一點。」先把壓力拿掉，他才會說真正顧慮。',
      '他只回答很短': '不要立刻連問三題。先用他的短回答做確認，再補一題很小的問題，例如「這件事對你最麻煩的是時間還是錢？」'
    }},
    'efficiency-data': { branch: 'efficiency', reply: '客戶資料很亂，不是因為你不會記，而是所有資訊沒有一個固定位置。先把每位客戶的下一步留下來，比蒐集很多資料更重要。', children: {
      '我不知道要記什麼': '每位客戶先只記四件事：他在意什麼、最後說了什麼、下次何時聯絡、下次要帶什麼價值。這四格就夠你開始。',
      '資料散在很多地方': '先選一個你每天最會打開的地方當主清單，其他工具只做補充。重點不是工具多，而是下次找得到。',
      '我想先整理舊名單': '不要一次清完全部。先挑最近三十天有互動的客戶，補上下一步，舊資料再慢慢整理。'
    }},
    'efficiency-followup': { branch: 'efficiency', reply: '忘記追蹤通常不是沒誠意，而是下一步沒有被排進時間。追蹤要先有節點，才不會永遠等有空。', children: {
      '我不知道何時追': '依客戶承諾的時間安排，不要自己亂猜。沒有明確時間時，就約一個具體日期，例如「我週三把比較表給你」。',
      '我不知道追什麼': '每次追蹤帶一件新東西：回答一個疑問、給一個案例、整理一個比較。只問考慮得怎樣，客戶很難想回。',
      '我怕被已讀': '已讀不是拒絕。你可以隔一段時間換成更小的問題或更有用的資訊，讓客戶不必花很多力氣也能回覆。'
    }},
    'efficiency-tools': { branch: 'efficiency', reply: '工具要省時間，前提是你先知道自己的流程。先把名單、跟進、下一步定清楚，再選工具，不然只是把混亂搬到新地方。', children: {
      '我想選一個工具開始': '先選你每天打得開、能記下一步的工具就好。連續用七天，比研究十個工具更有用。',
      '我怕工具太複雜': '把欄位減到最少：姓名、問題、下一步、日期。能每天更新的簡單表，比做一半的複雜系統有效。',
      '我想讓團隊一起用': '先由一個人試跑，再把大家都需要的欄位留下來。團隊工具最怕一開始就做太多規則。'
    }},
    'expression-feel': { branch: 'expression', reply: '要講得有感，先讓客戶看見自己現在正在承受什麼，再講他真正想要變成什麼樣子，最後才說你的方法怎麼幫他做到。', children: {
      '我想練一段開場': '開場先用客戶的日常畫面，不要先報產品名稱。例如「你是不是常常花很多時間，最後還是不知道客戶有沒有要往前？」',
      '我想改產品介紹': '把介紹改成「你會得到什麼」開頭，再說「為什麼做得到」，最後才補功能。客戶先聽見好處，才會想聽細節。',
      '我想把故事講好': '故事只要四段：原本遇到什麼、做了什麼選擇、中間怎麼改變、最後得到什麼。少一點背景，多一點轉折。'
    }},
    'expression-difference': { branch: 'expression', reply: '要講出差異，不要只說自己比較好。要說清楚客戶少掉什麼麻煩、你多做了哪個關鍵步驟、最後他會得到什麼不同結果。', children: {
      '我想抓真正差異': '先問自己：別人不做、但客戶其實很需要的是哪一段？可能是判斷、陪跑、追蹤或把複雜事講明白。那一段才是差異。',
      '我想做比較說法': '比較時用同一個標準，不攻擊別人。你可以說「如果你最在意___，我的做法會多幫你做到___」。這樣比較有分寸也有重點。',
      '我想用案例證明': '案例只挑跟眼前客戶最像的一個，講他原本的問題、你做的關鍵動作、後來出現的改變。越像他，越有說服力。'
    }},
    'expression-manager': { branch: 'expression', reply: '跟主管說，先講現在的問題會造成什麼損失，再講方案帶來什麼效益，最後才補執行方式和需要的資源。', children: {
      '我想整理一頁重點': '一頁只留四格：現在問題、造成影響、建議做法、預期怎麼檢查。主管看得懂，才會願意約時間聽細節。',
      '我想講效益': '效益要換成主管聽得懂的語言，例如少多少重工、縮短多久、提高哪個轉換。先說他要守住的結果。',
      '我想先講風險': '先講不處理的風險，再講方案如何降低它。風險不是恐嚇，是讓主管知道為什麼現在需要決定。'
    }}
  };

  const TREE_BUTTON_TO_NODE = {
    '不知道去哪找客戶': 'lead-source',
    '內容發了沒人問': 'lead-content',
    '想建立穩定來源': 'lead-system',
    '客戶覺得現在不需要': 'price-not-now',
    '客戶不確定有沒有效': 'price-effect',
    '客戶想跟別人比較': 'price-compare',
    '他在想價格': 'think-price',
    '他在想效果': 'think-effect',
    '他在想要問誰': 'think-decision',
    '怎麼跟主管說': 'decision-manager',
    '怎麼整理價值': 'decision-value',
    '怎麼降低風險': 'decision-risk',
    '怎麼看懂客戶': 'trust-understand',
    '怎麼讓客戶安心': 'trust-safety',
    '怎麼問出真話': 'trust-truth',
    '客戶資料很亂': 'efficiency-data',
    '常常忘記追蹤': 'efficiency-followup',
    '想用工具省時間': 'efficiency-tools',
    '怎麼講得更有感': 'expression-feel',
    '怎麼講出差異': 'expression-difference',
    '怎麼講給主管聽': 'expression-manager'
  };

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
      active_tree_node: '',
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

    // 問答中的按鈕先走指定節點，避免「價格」「工具」等字被全站課程查詢搶走。
    if (!['discovery', 'explanation', 'course_overview', 'course_detail'].includes(next.phase)) {
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
      next.phase = 'route_choice';
      return buildRouteChoiceResponse(next);
    }

    if (next.phase === 'route_choice') {
      if (/課程|學什麼|教什麼/.test(text)) return buildCourseContentResponse(next);
      if (/天賦|報告/.test(text)) return buildReportResponse(next);
      if (isClear(text)) return buildRouteChoiceResponse(next, true);
      return formatResponse(next, '你可以先選一條路，我會照你想知道的方向往下整理。', currentButtons(next));
    }

    if (next.phase === 'course_overview') {
      const courseId = Object.keys(COURSE_CATALOG).find((id) => COURSE_CATALOG[id].name === text);
      if (courseId) return buildCourseDetailResponse(next, courseId);
      if (/天賦|報告/.test(text)) return buildReportResponse(next);
      if (isClear(text)) return buildCourseCompletionResponse(next);
      const globalResponse = handleGlobalIntent(next, text);
      if (globalResponse) return globalResponse;
      return formatResponse(next, '你可以直接點一堂課，我會再把那堂課的內容拆開跟你說。', currentButtons(next));
    }

    if (next.phase === 'course_detail') {
      if (/回到五堂|看另一堂課|課程總覽/.test(text)) return buildCourseContentResponse(next);
      if (/找出我的銷售天賦|天賦|報告/.test(text)) return buildReportResponse(next);
      if (isClear(text)) return buildCourseCompletionResponse(next);
      const detailResponse = buildCourseDetailAnswer(next, text);
      if (detailResponse) return detailResponse;
      const globalResponse = handleGlobalIntent(next, text);
      if (globalResponse) return globalResponse;
      return formatResponse(next, '你可以從下面挑一個你最想知道的地方，我會接著往下說。', currentButtons(next));
    }

    if (next.phase === 'course_intro') {
      return buildCourseContentResponse(next);
    }

    if (next.phase === 'explanation') {
      if (isClear(text)) return buildReportResponse(next);
      if (next.active_tree_node) {
        const activeNode = TREE_NODES[next.active_tree_node];
        if (activeNode && Object.prototype.hasOwnProperty.call(activeNode.children, text)) {
          return buildTreeLeafResponse(next, activeNode, text);
        }
      }
      if (TREE_BUTTON_TO_NODE[text]) return buildTreeNodeResponse(next, TREE_BUTTON_TO_NODE[text]);
      const globalResponse = handleGlobalIntent(next, text);
      if (globalResponse) return globalResponse;
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
    if (/時間|日期|開課|多少錢|費用|名額|複訓|重修|全包|課程價格|價格課程/.test(text)) {
      return buildOfferingsResponse(state);
    }
    if (/學什麼|教什麼|課程內容|可以學到|哪一堂|課程差別/.test(text)) {
      return buildCourseContentResponse(state);
    }
    if (/學習路徑|看建議/.test(text) && state.report_ready) return buildRecommendationResponse(state);
    if (/修正報告|修正/.test(text) && state.report_ready) return buildRevisionResponse(state);
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
    if (state.phase === 'route_choice') return ['了解課程介紹', '找出我的銷售天賦', '看開課時間費用', '我都清楚了'];
    if (state.phase === 'course_overview') return courseOverviewButtons();
    if (state.phase === 'course_detail') return courseDetailButtons(state);
    if (state.phase === 'course_intro') return courseOverviewButtons();
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

  function buildRouteChoiceResponse(state, isRepeat) {
    state.phase = 'route_choice';
    const name = state.profile.name || '你';
    const prefix = isRepeat
      ? `${name}，你已經把前三個重點說清楚了。`
      : `${name}，我已經記下你的背景、客戶現場和你想變強的方向。`;
    const reply = `${prefix}\n\n接下來你想先了解每堂課能幫你做到什麼，還是先找出你的銷售天賦？\n\n以上的說明都清楚嗎？`;
    return formatResponse(state, reply, currentButtons(state));
  }

  function buildBranchExplanation(state, branch) {
    const branchData = BRANCHES[branch] || BRANCHES.think;
    state.last_branch = branch;
    state.active_tree_node = '';
    applyTextSignals(state, branchData.label);
    const reply = `我懂，我們就先看「${branchData.label}」這件事。${branchData.summary}\n\n以上的說明都清楚嗎？`;
    return formatResponse(state, reply, nextBranchButtons(branch));
  }

  function buildTreeNodeResponse(state, nodeId) {
    const node = TREE_NODES[nodeId];
    if (!node) return buildBranchExplanation(state, getTopBranch(state));
    state.last_branch = node.branch;
    state.active_tree_node = nodeId;
    applyTextSignals(state, node.branch);
    const buttons = Object.keys(node.children).concat('我都清楚了');
    return formatResponse(state, `我懂，我們就先看這一段。${node.reply}\n\n以上的說明都清楚嗎？`, buttons);
  }

  function buildTreeLeafResponse(state, node, choice) {
    state.last_branch = node.branch;
    state.active_tree_node = '';
    applyTextSignals(state, `${node.branch} ${choice}`);
    const reply = `${node.children[choice]}\n\n以上的說明都清楚嗎？`;
    return formatResponse(state, reply, ['我想看學習路徑', '我想修正報告', '我想問顧問', '我都清楚了']);
  }

  function buildCourseContentResponse(state) {
    state.phase = 'course_overview';
    state.active_course = '';
    state.course_detail_answered = [];
    const intro = Object.values(COURSE_CATALOG)
      .map((course) => `${course.name}：${course.overview}`)
      .join('\n');
    const reply = `好，我先用最簡單的方式，讓你看懂五堂課各自能幫你什麼。你看到有興趣的，就直接點進去，我再繼續跟你說。\n\n${intro}\n\n你想先了解哪一堂？直接點課程名稱就好。`;
    return formatResponse(state, reply, currentButtons(state));
  }

  function buildCourseSelectionResponse(state) {
    return buildCourseContentResponse(state);
  }

  function courseOverviewButtons() {
    return Object.values(COURSE_CATALOG).map((course) => course.name);
  }

  function courseDetailButtons(state) {
    const tree = COURSE_DETAIL_TREE[state.active_course];
    if (!tree) return ['回到五堂課介紹', '找出我的銷售天賦', '看開課時間費用', '我都清楚了'];
    const answered = new Set(state.course_detail_answered || []);
    const remaining = tree.questions
      .filter((question) => !answered.has(question.label))
      .map((question) => question.label);
    if (remaining.length >= 3) return remaining.slice(0, 3).concat('我都清楚了');
    const buttons = remaining.slice(0, 2);
    if (remaining.length === 0) buttons.push('看另一堂課');
    if (buttons.length < 3) buttons.push('回到五堂課介紹');
    if (buttons.length < 3) buttons.push('找出我的銷售天賦');
    buttons.push('我都清楚了');
    return buttons.slice(0, 4);
  }

  function buildCourseDetailResponse(state, courseId) {
    const course = COURSE_CATALOG[courseId];
    state.phase = 'course_detail';
    state.active_course = courseId;
    state.course_detail_answered = [];
    const tree = COURSE_DETAIL_TREE[courseId];
    const reply = `${course.name}，${tree.intro}\n\n你想先從哪一段了解？\n\n以上的說明都清楚嗎？`;
    return formatResponse(state, reply, courseDetailButtons(state));
  }

  function buildCourseDetailAnswer(state, label) {
    const tree = COURSE_DETAIL_TREE[state.active_course];
    if (!tree) return null;
    const question = tree.questions.find((item) => item.label === label);
    if (!question) return null;
    state.course_detail_answered = Array.from(new Set([...(state.course_detail_answered || []), question.label]));
    const reply = `${question.reply}\n\n你還想繼續了解哪一段？\n\n以上的說明都清楚嗎？`;
    return formatResponse(state, reply, courseDetailButtons(state));
  }

  function buildCourseCompletionResponse(state) {
    state.phase = 'route_choice';
    const reply = '好，課程方向先整理到這裡。接下來你可以用前三題的答案，直接拿一份屬於你的銷售天賦報告；也可以看目前的開課時間與費用。\n\n以上的說明都清楚嗎？';
    return formatResponse(state, reply, ['了解課程介紹', '找出我的銷售天賦', '看開課時間費用', '我都清楚了']);
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
    const summary = buildOfferingSummary(state);
    const reply = `我幫你整理目前已公告的課程資訊。${summary ? `\n\n${summary}` : '頁面左側會顯示已確認的時間與金額。'}\n\n座位、名額與付款方式，會依最新公告更新。\n\n以上的說明都清楚嗎？`;
    return formatResponse(state, reply, ['看單堂課程', '看五堂全包', '問複訓費用', '我都清楚了'], state.report_ready ? buildProfileSpec(state) : null, state.course_path_ready ? buildCoursePath(state) : null);
  }

  function buildOfferingSummary(state) {
    const source = state.profile && state.profile.course_offerings;
    const offerings = source && Array.isArray(source.offerings) ? source.offerings : [];
    const superSales = offerings.filter((offering) => /^super_sales_/.test(String(offering.course_id || '')));
    if (!superSales.length) return '';
    const lines = superSales.map((offering) => {
      const start = formatOfferingDate(offering.date_time);
      const end = formatOfferingDate(offering.end_date_time);
      const schedule = start && end ? `${start}-${end}` : '日期待確認';
      return `${offering.course_name}：${schedule}，${formatOfferingPrice(offering.price, offering.currency)}`;
    });
    const retake = source.retake_policy;
    if (retake && retake.price !== null && retake.price !== undefined) {
      lines.push(`複訓：一律 ${formatOfferingPrice(retake.price, retake.currency)}`);
    }
    return lines.join('\n');
  }

  function formatOfferingDate(value) {
    const match = String(value || '').match(/^\d{4}-(\d{2})-(\d{2})/);
    return match ? `${Number(match[1])}/${Number(match[2])}` : '';
  }

  function formatOfferingPrice(price, currency) {
    const amount = Number(price);
    if (!Number.isFinite(amount)) return '金額待確認';
    const prefix = currency === 'TWD' ? 'NT$' : currency === 'MYR' ? 'RM' : String(currency || '');
    return `${prefix} ${amount.toLocaleString('zh-TW')}`.trim();
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
      buttons: (buttons || currentButtons(state)).slice(0, state.phase === 'course_overview' ? 5 : 4),
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
