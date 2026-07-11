const fs = require('fs');
const path = require('path');

const workDir = __dirname;
const sourcePath = path.join(workDir, '成交地圖資料庫.md');
const source = fs.readFileSync(sourcePath, 'utf8');
const match = source.match(/<!-- CLOSING_MAP_JSON_START -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- CLOSING_MAP_JSON_END -->/);

if (!match) throw new Error('找不到成交地圖資料區。');

const map = JSON.parse(match[1]);

const proofCards = [
  {
    id: 'refund-policy',
    title: '三無退費承諾',
    public_text: '無效、無解、無理由。第一堂課上完若覺得沒有收穫，無條件全額退費。',
    source: 'liuliang.html:437；chengjiaoditu.html:438；zhizhirenxin.html:434；jizhixiaolv.html:466；yanzhiyouwu.html:470',
    use_when: ['退費保障', '怕沒效果', '太貴', '怕學不會']
  },
  {
    id: 'refund-record',
    title: '零退費紀錄',
    public_text: '目前零退費紀錄。',
    source: '使用者 2026-07-11 確認',
    use_when: ['退費保障', '怕沒效果', '太貴']
  },
  {
    id: 'scale-record',
    title: '跨產業教學紀錄',
    public_text: '已累積超過 300 堂課，橫跨 17 個產業、50 家企業。',
    source: '使用者 2026-07-11 確認；index.html:1038 可核對 17+ 產業與 50+ 家企業',
    use_when: ['怕沒效果', '成功案例', '主管討論']
  },
  {
    id: 'map-rookie',
    course: '成交地圖',
    title: '三個月衝上新人第一名',
    public_text: '保險業張小姐以前被拒絕會難過整天；上完《成交地圖》後，她理解客戶不是拒絕她，而是步驟走錯，照著做三個月衝上新人第一名。',
    source: 'chengjiaoditu.html:370-372',
    use_when: ['拒絕處理', '怕沒效果', '成功案例', '怕學不會']
  },
  {
    id: 'human-premium',
    course: '直指人心',
    title: '實收保費直接破億',
    public_text: '保險業林先生學會看懂人性、調整語調與提供數據後，公開回饋是今年實收保費直接破億。',
    source: 'zhizhirenxin.html:368-370',
    use_when: ['看不懂客戶', '怕沒效果', '成功案例', '高價客戶']
  },
  {
    id: 'flow-traffic',
    course: '流量磁鐵',
    title: '90 天流量突破 3,000 萬',
    public_text: '《流量磁鐵》公開見證：90 天流量突破 3,000 萬，讓精準名單順著漏斗主動找上門。',
    source: 'liuliang.html:383-385',
    use_when: ['客戶不夠', '內容沒人問', '成功案例']
  },
  {
    id: 'flow-income',
    course: '流量磁鐵',
    title: '薪資成長 3 倍',
    public_text: '《流量磁鐵》公開見證：掌握名單後，學員薪資成長 3 倍，從配角成為團隊主力。',
    source: 'liuliang.html:397-399',
    use_when: ['客戶不夠', '成功案例', '主管討論']
  },
  {
    id: 'efficiency-cost',
    course: '極致效率',
    title: '每月省下 3 萬多元秘書成本',
    public_text: '《極致效率》公開見證：學員省下一個月 36,000 多元的秘書成本，且沒有多花額外時間。',
    source: 'jizhixiaolv.html:364-366',
    use_when: ['沒時間', '忙碌沒結果', '成功案例']
  },
  {
    id: 'efficiency-family',
    course: '極致效率',
    title: '把陪伴家人的時間找回來',
    public_text: '《極致效率》公開見證：學員用系統快速傳送大量訊息、整理公司流程，找回陪伴家人的時間。',
    source: 'jizhixiaolv.html:378-380',
    use_when: ['沒時間', '忙碌沒結果', '成功案例']
  },
  {
    id: 'speech-practice',
    course: '言之有物',
    title: '招招落地，學了就能用',
    public_text: '《言之有物》公開見證：上過多種銷售表達課後，學員認為泰欣老師的內容招招落地、學了就能用。',
    source: 'yanzhiyouwu.html:377-379',
    use_when: ['自學差異', '怕學不會', '怕沒效果']
  },
  {
    id: 'speech-strategy',
    course: '言之有物',
    title: '用策略取代蠻力',
    public_text: '《言之有物》公開見證：行銷業學員用表達公式輸出，讓原本混亂的想法變得有邏輯。',
    source: 'yanzhiyouwu.html:391-393',
    use_when: ['講不清價值', '自學差異', '成功案例']
  }
];

const copy = {
  price: {
    main: {
      D: '你剛剛覺得課程太貴。你要算的不是學費，而是這筆投入能不能把你現在最卡的問題解掉。',
      I: '你剛剛覺得課程太貴，我懂。你希望花出去的錢，最後真的變成自己更有底氣的能力。',
      S: '你剛剛覺得課程太貴，想先想清楚很正常。先把風險和你真正需要的部分看明白，再決定就好。',
      C: '你剛剛覺得課程太貴。先不要急著決定，可以先判斷問題是否對應、投入是否合理、風險是否可控。'
    }
  },
  think: {
    main: {
      D: '你剛剛說還想再想一想。直接把還卡住的那一件事找出來，才不用一直停在原地。',
      I: '你剛剛說還想再想一想，沒問題。你心裡一定還有一點沒有被講清楚，我們把它找出來。',
      S: '你剛剛說還想再想一想，先不用急著做決定。把心裡那個不確定的地方說清楚，你才會真的安心。',
      C: '你剛剛說還想再想一想。請先把考量分成課程內容、時間安排與費用，才能有效判斷。'
    }
  },
  result: {
    main: {
      D: '你剛剛說以前上課沒效果。這次不要再聽完就算了，先看方法能不能直接用在你現在的情境。',
      I: '你剛剛說以前上課沒效果，我懂那種花了錢又失望的感覺。這次先看它能不能真的幫你把眼前的問題做出改變。',
      S: '你剛剛說以前上課沒效果，所以這次更謹慎很正常。我們先看你回去會怎麼做，而不是要你先相信。',
      C: '你剛剛說以前上課沒效果。評估這次課程時，先看做法是否可執行、成果是否可查、風險是否有保障。'
    }
  },
  time: {
    main: {
      D: '你剛剛說真的抽不出時間。重點不是再塞一件事進行程，而是這一天的投入能不能換回你以後的時間。',
      I: '你剛剛說真的抽不出時間，我知道你不是不想進步，是每天真的被工作追著跑。',
      S: '你剛剛說真的抽不出時間，先別逼自己硬排。我們先看哪一段忙碌最消耗你，再決定怎麼安排。',
      C: '你剛剛說真的抽不出時間。需要比較的是一天的學習投入，和目前每天重複浪費的時間成本。'
    }
  },
  decision: {
    main: {
      D: '你剛剛說要先和主管或家人討論。那就把現在的問題、學完的改善和保障講成對方聽得懂的理由。',
      I: '你剛剛想先和主管或家人討論，這很好。你想讓重要的人知道，這不是衝動報名，而是你真的想讓自己變得更強。',
      S: '你剛剛想先和主管或家人討論，先一起確認很正常。我會把該講的重點整理好，讓你不用一個人硬撐著說。',
      C: '你剛剛需要先和主管或家人討論。請準備問題、課程做法、時間費用與保障四項資訊，才能讓對方判斷。'
    }
  },
  selfstudy: {
    main: {
      D: '你剛剛說自己看書、看影片就好了。那我們就直接比較：自學能不能讓你下次遇到同樣情況時，馬上知道怎麼做。',
      I: '你剛剛說想先自己看書、看影片，這沒有錯。你想知道的是，有人帶著練到底會多出什麼改變。',
      S: '你剛剛說想先自己看書、看影片，也是一種做法。你不用急著選，只要先看哪一種方式比較能幫你走到結果。',
      C: '你剛剛認為自學就足夠。可以從知識是否零散、能否練習、現場能否應用三點比較。'
    }
  },
  learn: {
    main: {
      D: '你剛剛怕自己學不會、最後做不出成果。先不要想全部，先確認你回去第一步能不能做得出來。',
      I: '你剛剛怕自己學不會，我懂。你不是想變成別人，你只是想知道自己到底能不能真的做出成果。',
      S: '你剛剛怕自己學不會，這個擔心很真實。我們先從你最常遇到的一個情況開始，不需要一次做到全部。',
      C: '你剛剛怕自己學不會。先確認第一步是否明確、課程是否適合、成果是否有證據，再做判斷。'
    }
  }
};

const followCopy = {
  '我想知道先上哪一堂最划算': {
    concern: '你不想一次買很多，而是想先把錢花在最能改善現況的地方。',
    benefit: '先把你卡的是名單、成交、看人、表達還是忙碌分清楚，才知道哪一堂最先幫得到你。',
    advantage: '泰欣老師不會用固定順序推課，而是先用你的客戶情境和問題排順序。',
    feature: '你可以直接走「依我的情況推薦課程」，系統會把三堂建議順序列給你。',
    evidence: ['scale-record'],
    next: '你比較想先看依你情況排的三堂課，還是先看價格與場次？'
  },
  '我想看台灣與吉隆坡場次': {
    concern: '你要先確認地區、日期和費用能不能安排。',
    benefit: '把場次攤開，你可以馬上判斷哪一場比較適合你的行程。',
    advantage: '公開頁只放已確認資訊，不用拿模糊日期回去猜。',
    feature: '台灣超級銷冠系統為 10/16-10/18、NT$31,000；吉隆坡為 10/21-10/23、RM4,680。',
    evidence: [],
    next: '場次看完後，你想先確認退費保障，還是要看哪一堂最適合你？'
  },
  '我想先看退費保障': {
    concern: '你要確認第一堂上完如果沒有收穫，自己有沒有明確的退路。',
    benefit: '你不用先勉強自己相信，可以先上第一堂，再用自己的感受判斷。',
    advantage: '泰欣老師不是要你冒風險，而是先把保障條件講在前面。',
    feature: '第一堂課上完的當天，若你覺得沒有收穫，直接向現場教育顧問或工作人員提出，就依三無退費承諾辦理無條件全額退費。',
    evidence: ['refund-policy', 'refund-record'],
    next: '退費保障這一點清楚後，你想再看成功案例，還是直接依你的情況推薦課程？'
  },
  '我還在想課程內容': {
    concern: '你要確認課程內容是不是真的對得上你現在的問題。',
    benefit: '不用看一堆課名，你可以先找到最能解掉眼前卡點的那一堂。',
    advantage: '每堂課都從學生會遇到的實際情境開始，不是先丟一堆名詞。',
    feature: '五堂課各有三個可直接點開的問題，讓你看得到學完會怎麼用。',
    evidence: [],
    next: '你現在比較想看成交、看懂客戶、講清價值、找客戶，還是解決忙碌？'
  },
  '我還在想時間安排': {
    concern: '你擔心學習又會增加現在的負擔。',
    benefit: '先看這段學習能不能減少你每天重複花掉的時間，再決定要不要安排。',
    advantage: '泰欣老師教的不是多一份待辦，而是把工作變得更可控的方法。',
    feature: '《極致效率》會處理客戶資料、追蹤與下一步安排；場次日期也會直接列出供你比對。',
    evidence: ['efficiency-cost', 'efficiency-family'],
    next: '你是怕抽不出上課那一天，還是怕上完之後沒有時間落地？'
  },
  '我還在想費用': {
    concern: '你要確認費用和眼前要解決的問題是否值得交換。',
    benefit: '把費用放回你現在的卡點，而不是只看一個價格，才知道值不值得。',
    advantage: '不需要一次選完；先補最貼近現況的能力，才不會花冤枉錢。',
    feature: '你可以先看已確認的場次、價格和退費保障，再決定要不要開始。',
    evidence: ['refund-policy', 'refund-record'],
    next: '你要先看場次價格，還是先讓我依你的情況排一個學習順序？'
  },
  '我怕回去不知道怎麼做': {
    concern: '你要的是能帶回現場用的第一步，不是再多一套名詞。',
    benefit: '下次遇到客戶時，你會知道先問什麼、怎麼把價值講清楚、下一步怎麼推。',
    advantage: '泰欣老師教的是有順序的系統，不是要你背一段話術。',
    feature: '課程把問題、提問、價值說明、拒絕處理和下一步拆成可練的段落。',
    evidence: ['map-rookie', 'speech-practice'],
    next: '你現在最怕的是客戶拒絕、講不清價值，還是回去沒有一個能照著走的流程？'
  },
  '我想看真實成果': {
    concern: '你要先確認這套方法是不是有人真的做出成果。',
    benefit: '你可以先看和問題接近的結果，再判斷值不值得投入。',
    advantage: '泰欣老師不把所有成績堆成一句話，而是用不同課程的真實情境說明。',
    feature: '《成交地圖》有保險業張小姐三個月衝上新人第一名；《直指人心》有保險業林先生實收保費破億。',
    evidence: ['map-rookie', 'human-premium', 'scale-record'],
    next: '你想看和你問題接近的案例，還是想直接看一堂課裡到底怎麼練？'
  },
  '我想看課程怎麼練習': {
    concern: '你想知道自己不是聽懂而已，而是真的能不能做出來。',
    benefit: '從你的實際情境開始練，才不會聽完又回到原本做法。',
    advantage: '泰欣老師會把方法接到真實提問、介紹與異議情境，不是只講理論。',
    feature: '每堂課都用對應情境、工具與步驟，讓你帶回去練第一個可執行動作。',
    evidence: ['speech-practice'],
    next: '你想先看怎麼處理拒絕，還是怎麼把價值講得讓客戶聽得懂？'
  },
  '我最怕工作排不開': {
    concern: '你的行程已經滿了，不想再硬塞一件事。',
    benefit: '先看哪些事情正在反覆吃掉你的時間，再決定這一天值不值得安排。',
    advantage: '泰欣老師會把忙的原因拆成流程，不會只叫你再撐一下。',
    feature: '《極致效率》把客戶資料、追蹤與下一步整理成系統，減少找資料和重做。',
    evidence: ['efficiency-cost'],
    next: '你比較怕工作排不開，還是怕學完之後沒有時間持續做？'
  },
  '我怕上完沒有時間做': {
    concern: '你擔心短期安排影響業績，學完又沒有空落地。',
    benefit: '把一天的投入和每天重複浪費的時間放在一起看，才能做完整判斷。',
    advantage: '泰欣老師教的是讓工作更可控的方法，不是再增加一份待辦。',
    feature: '《極致效率》會整理客戶資料、追蹤與下一步，讓你不用每次重新找資料。',
    evidence: ['efficiency-family', 'efficiency-cost'],
    next: '你想先看極致效率的內容，還是先看場次能不能配合你的行程？'
  },
  '我想先看極致效率': {
    concern: '你要確認效率方法是不是和你的忙碌真的有關。',
    benefit: '你需要的不是更快做更多事，而是少掉找資料、回想對話和重做的時間。',
    advantage: '泰欣老師會把客戶、時間與下一步整理成可執行系統。',
    feature: '公開見證有學員每月省下 36,000 多元秘書成本，也有人找回陪伴家人的時間。',
    evidence: ['efficiency-cost', 'efficiency-family'],
    next: '你想先看名單怎麼整理，還是追蹤與下一步怎麼不再漏掉？'
  },
  '我需要一份課程重點': {
    concern: '你希望討論時能把問題和方法說清楚。',
    benefit: '用你現在的問題、對應方法與預期改善來說，比把五堂課全講一遍更有說服力。',
    advantage: '泰欣老師的課程介紹先講學生能得到什麼，再講方法和課堂內容。',
    feature: '你可以把五堂課的主重點、場次與保障整理成一頁給主管或家人看。',
    evidence: ['refund-policy', 'scale-record'],
    next: '你想先拿一段可以跟主管說的話，還是先把你最需要的課程重點挑出來？'
  },
  '我想知道怎麼跟主管說': {
    concern: '你不知道怎麼把學習需求轉成主管聽得懂的理由。',
    benefit: '你可以把「我想上課」改成「我現在卡在哪裡、學完能改善什麼、風險怎麼控」。',
    advantage: '泰欣老師用問題、方法、結果的順序，讓主管能評估，而不是只聽一個課名。',
    feature: '你可以直接這樣說：主管，我現在最常卡在＿＿＿；這堂課會先幫我＿＿＿，讓我避免＿＿＿；第一堂沒收穫可全額退費，所以我想先確認能不能把這個問題解掉。',
    evidence: ['refund-policy', 'scale-record'],
    next: '你要先把這段話換成你的產業版本，還是先看場次和費用？'
  },
  '我想先看價格日期': {
    concern: '你要先確認地區、日期、價格和行程是否可行。',
    benefit: '場次和費用攤開後，你就能直接判斷要不要排進行程。',
    advantage: '公開資訊只放已確認內容，讓你不用拿不確定資料去討論。',
    feature: '台灣超級銷冠系統為 10/16-10/18、NT$31,000；吉隆坡為 10/21-10/23、RM4,680；複訓為 NT$3,200。',
    evidence: [],
    next: '價格日期看完後，你想先確認退費保障，還是想看怎麼跟主管說？'
  },
  '我想知道跟自學差在哪': {
    concern: '你在比較自學是否真的能處理現在的實戰問題。',
    benefit: '書和影片能給你知識；遇到客戶說太貴或再想想時，你還需要知道先問什麼、怎麼說、下一步怎麼做。',
    advantage: '泰欣老師把問題、提問、價值說明和拒絕處理排成一條可練的路。',
    feature: '課堂用你的客戶情境練習，不是再讓你收藏更多內容；公開學員也回饋內容招招落地、學了就能用。',
    evidence: ['speech-practice', 'map-rookie'],
    next: '你想先看這套系統怎麼處理拒絕，還是先看自己會不會跟不上？'
  },
  '我怕自己跟不上': {
    concern: '你擔心投入後，還是無法把方法變成行動。',
    benefit: '先從最常遇到的一個情境開始，做出第一次，比一次想學完全部有效。',
    advantage: '泰欣老師會把大方法拆成你當下能用的步驟，不要求你立刻變成另一種人。',
    feature: '課程依情境練習，讓你先把第一步帶回去做；第一堂沒收穫還有全額退費保障。',
    evidence: ['refund-policy', 'speech-practice'],
    next: '你想先看第一步會怎麼做，還是先看和你狀況接近的學員成果？'
  },
  '我想先看一堂課內容': {
    concern: '你想先核對內容和自己的情境是不是相符。',
    benefit: '先看最接近你目前問題的一堂，再決定值不值得往下。',
    advantage: '每堂課都先從學生真正卡住的情境說起，不只丟課綱。',
    feature: '五堂課各有三個可直接查看的問題與說明；你可以從課程介紹挑一堂先看。',
    evidence: [],
    next: '你現在最想看的是找客戶、成交、看懂客戶、表達，還是效率？'
  },
  '我需要知道第一步怎麼做': {
    concern: '你不想再聽很多道理，只想知道回去第一件事要做什麼。',
    benefit: '第一步不是把全部學會，而是挑一個最常遇到的情境，照方法做一次。',
    advantage: '泰欣老師把方法拆成可落地的順序，讓你先累積一次做得到的經驗。',
    feature: '你會從問題、提問、價值說明或追蹤中，挑一個最貼近自己的動作先練。',
    evidence: ['map-rookie', 'speech-practice'],
    next: '你想先讓我依你的情況排第一堂，還是想先看別人怎麼做出成果？'
  },
  '我想看適合我的課程': {
    concern: '你想確保學習順序符合自己，而不是隨便選。',
    benefit: '會先看你面對的客戶、卡住情況和想補強的能力，再排出三堂課的順序。',
    advantage: '不是用同一套話術套每個人，而是從你的現況出發。',
    feature: '點「依我的情況推薦課程」後，會直接列出第一、第二、第三堂和各自原因。',
    evidence: [],
    next: '你想直接看三堂建議順序，還是先看和你問題接近的案例？'
  },
  '我想先看成功案例': {
    concern: '你要先確認別人是不是真的做出成果。',
    benefit: '先看和問題接近的案例，比聽一串頭銜更能判斷適不適合你。',
    advantage: '泰欣老師不會把所有成果堆成一段話，而是按你現在的問題挑可參考的案例。',
    feature: '例如保險業張小姐學《成交地圖》後三個月新人第一；保險業林先生學《直指人心》後實收保費破億。',
    evidence: ['map-rookie', 'human-premium'],
    next: '你想先看和你問題最接近的案例，還是直接看該從哪一堂開始？'
  }
};

function proofText(ids) {
  return ids.map((id) => proofCards.find((card) => card.id === id)).filter(Boolean).map((card) => `【${card.title}】${card.public_text}`).join('\n');
}

function mainResponse(node, disc) {
  const voice = copy[node.key].main[disc];
  const follow = node.follow.join('、');
  if (disc === 'C') return `${voice}\n\n1. 先確認你真正卡的是哪一點。\n2. 再看課程方法能不能解決。\n3. 最後才決定要不要報名。\n\n你現在想先看：${follow}？`;
  return `${voice}\n\n你現在最想先看的是：${follow}？`;
}

function followResponse(label, data, disc) {
  const proof = proofText(data.evidence);
  if (disc === 'D') return `你剛剛問「${label}」。${data.concern}\n\n${data.benefit}\n\n${data.advantage}\n\n${data.feature}${proof ? `\n\n${proof}` : ''}\n\n${data.next}`;
  if (disc === 'I') return `你剛剛選「${label}」，我懂你想先把這一點弄明白。${data.concern}\n\n你把這件事弄清楚後，${data.benefit}\n\n泰欣老師的做法是：${data.advantage}\n\n${data.feature}${proof ? `\n\n${proof}` : ''}\n\n${data.next}`;
  if (disc === 'S') return `你剛剛選「${label}」，先別急，我們把這一點說清楚。${data.concern}\n\n你不用一次決定；先知道這件事怎麼幫你：${data.benefit}\n\n泰欣老師會陪你用這個方式走：${data.advantage}\n\n${data.feature}${proof ? `\n\n${proof}` : ''}\n\n${data.next}`;
  return `你剛剛選的是「${label}」。可以用三點判斷：\n\n1. 你真正要確認的是：${data.concern}\n2. 學會後你能得到的是：${data.benefit}\n3. 泰欣老師怎麼帶你做到：${data.advantage}\n\n課程資訊：${data.feature}${proof ? `\n\n已確認證據：\n${proof}` : ''}\n\n${data.next}`;
}

map.schema_version = '1.2';
map.proof_cards = proofCards;
map.public_copy_rules = {
  first_sentence: '每一條回覆的第一句必須包含學生剛剛按的按鈕文字，並直接接住該問題。',
  evidence: '只能使用 proof_cards 的公開文字與來源；沒有來源，不得寫成學生已做到的成果。',
  refund: '退費只說明已確認的三無退費承諾、第一堂課、當天提出與無條件全額退費。',
  banned: ['我懂你不是只想聽一個答案', '可核對', '我先抓到', '這透露一個訊號', '探索你的旅程']
};

map.objections.forEach((node) => {
  node.response_protocol = ['理解顧慮', '確認真正問題', '找出顧慮來源', '用 MBAF 回應', '確認是否已解決', '提供下一步'];
  node.responses = {};
  ['D', 'I', 'S', 'C'].forEach((disc) => { node.responses[disc] = mainResponse(node, disc); });
  node.reply_by_disc = node.responses;
  node.follow_responses = node.follow.map((label) => {
    const data = followCopy[label];
    if (!data) throw new Error(`缺少追問資料：${label}`);
    const responses = {};
    ['D', 'I', 'S', 'C'].forEach((disc) => { responses[disc] = followResponse(label, data, disc); });
    return {
      label,
      proof_card_ids: data.evidence,
      six_steps: {
        understand: `先接住學生按下的「${label}」。`,
        clarify: data.concern,
        source: data.concern,
        mbaf: {
          mini_yes: `你要先把「${label}」講清楚，再決定要不要開始，對嗎？`,
          benefit: data.benefit,
          advantage: data.advantage,
          feature: data.feature
        },
        confirm: '這樣有把你現在在意的地方講清楚嗎？',
        next_actions: ['這樣有回答我的問題', '我還有一個疑慮', '課程介紹', '依我的情況推薦課程']
      },
      responses
    };
  });
});

const next = source.replace(match[1], JSON.stringify(map, null, 2));
fs.writeFileSync(sourcePath, next);
console.log('已重建成交地圖資料庫：7 種疑慮、21 個追問、84 條四型回覆與 11 張公開證據卡。');
