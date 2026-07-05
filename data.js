// ============================================================
//  毎週ここ(data.js)だけ差し替えればOK
//  各レースの bets: pick=本線(最適券種), box5=3連複5頭BOX(EV_combo>0の時のみ参考掲載。
//  2026-07-05: T12リハーサルでBOX的中0/5と判明し「毎回必須」から任意項目に変更),
//  alloc=配分, note=狙い。 box[]=5頭の選定(num=馬番, tag=軸/◎/○/△/▲)。
//  保存 → git push origin main → Pagesが約1分で再ビルド。
// ------------------------------------------------------------
//  【v2 追加キー】(docs/requirements.md §5-2。値は scripts/ev.mjs の出力を転記)
//   レース: raceId / evLabel("+EV"|"様子見"|"-EV") / provisional / hPending
//           / sanrenpuku{nums,pCombo,breakEven,oddsFinal,evFinal} / finalGate{asOf,verdict}
//   box[] : score(0-100) / pWin / pPlace / evWin / evPlace
//   scan  : raceId / venue / bestScore / bestEv / evLabel
//  ※このファイルの現内容は v2 移行の雛形。スコア/EV値は 6/27-28 開催を題材にした
//    サンプル値（scripts/ev.mjs をモックオッズで実行した出力）であり、実予想ではない。
// ============================================================
window.KEIBA_DATA = {
  title: "競馬 期待値ボックス",
  updated: "2026/07/05 v2雛形（スコア/EV値はサンプル・暫定）",
  headline: "v2移行の雛形＝6/27-28開催を題材にしたサンプル表示",
  note: "フェーズ1(MVP)のv2スキーマ雛形です。妙味スコアと数値EVは「暫定」＝p未較正のため参考値。購入判断は直前の確定オッズEV＋最終ゲート(GO/NO-GO)で行う運用。",
  policy: [
    { h: "対象", t: "全場・全レースに妙味スコア＋暫定EVを付与し、+EVだけ拾う。" },
    { h: "買い方", t: "本線は控除の軽い複勝/ワイドを優先。3連複5頭BOXはEV_combo>0の時だけ参考掲載（必須ではない）。" },
    { h: "直前", t: "参戦レースのみ発走15分前に確定オッズでEV再計算→10分前までにGO/NO-GO。" },
    { h: "暫定", t: "フェーズ1のEVは未較正の暫定値。検証ログ100ベットで較正予定。" }
  ],
  strategy: {
    title: "買い方の方針（EV重視）",
    points: [
      "5頭BOXは常設ではない。損益分岐合成オッズ(BE)を実合成が上回る時だけ参考掲載",
      "券種をエッジに合わせる：割安1頭はワイド/複勝(控除20〜22.5%)、上位を絞れる時は3連複(25%)",
      "軸は1番人気でなく“割安な馬”。レースを絞る（朝の新馬・未勝利は見送り）",
      "3連複は損益分岐合成オッズ(BE)と実合成を比較：実合成 > BE なら+EV"
    ]
  },
  races: [
    {
      raceId: "202602010511",
      venue: "函館", day: "6/27(土)", no: "11R", name: "青函S (OP)",
      course: "芝1200m (右A)", post: "15:20", field: "14頭", status: "枠順確定",
      verdict: "参戦", verdictNote: "14頭OPハンデの混戦＝ボックス向き。先行・内枠有利、稍重でパワー/前残り強化。",
      evLabel: "+EV", provisional: true, hPending: false,
      box: [
        { num: "12", name: "アメリカンステージ", tag: "軸", note: "7枠12番(岩田望)。トップハンデ57.5kg＝OP上位実績の証、4歳の上昇力。",
          score: 78, pWin: 0.253, pPlace: 0.542, evWin: 0.16, evPlace: 0.00 },
        { num: "3", name: "ジョーメッドヴィン", tag: "○", note: "3枠3番(横山琉)。内寄りの好枠＋57kg。先行できれば。",
          score: 62, pWin: 0.109, pPlace: 0.317, evWin: 0.07, evPlace: -0.08 },
        { num: "6", name: "クファシル", tag: "○", note: "4枠6番(北村友)。中枠の先行型。",
          score: 61, pWin: 0.093, pPlace: 0.282, evWin: 0.06, evPlace: -0.08 },
        { num: "5", name: "ティニア", tag: "○", note: "4枠5番(佐々木)。中枠56kg。",
          score: 60, pWin: 0.084, pPlace: 0.260, evWin: 0.06, evPlace: -0.09 },
        { num: "1", name: "ダンツエラン", tag: "▲", note: "1枠1番(古川吉)。最内＋軽量53kg。稍重の前残り一発の波乱要員。",
          score: 66, pWin: 0.052, pPlace: 0.198, evWin: 0.09, evPlace: -0.06 }
      ],
      sanrenpuku: { nums: [12, 3, 6, 5, 1], pCombo: 0.125, breakEven: 8.0, oddsFinal: null, evFinal: null },
      finalGate: { asOf: null, verdict: null },
      bets: {
        stance: "参戦",
        pick: "本線＝単勝⑫（+EV 0.16・暫定）／ワイド ⑫-③",
        box5: "3連複5頭BOX ⑫③⑥⑤①（10点）",
        alloc: "単勝/ワイド5 : 3連複5",
        note: "トップハンデ⑫が市場より過小評価＝妙味の核。BOXは実合成が分岐8.0倍を超えていれば+EV。"
      },
      ev: "3連複BOX: p=12.5% → 損益分岐合成 8.0倍（直前に実合成と比較）",
      memo: "トップハンデでも8枠のロードフォアエース⑬は枠割引。武豊のモリノドリーム⑨(軽量牝)も押さえ候補。"
    },
    {
      venue: "福島", day: "6/27(土)", no: "11R", name: "バーデンバーデンC (3勝)",
      course: "芝2000m (右A)", post: "15:45", field: "9頭", status: "枠順確定",
      verdict: "見送り寄り", verdictNote: "9頭・定量＝堅く決まりやすく妙味薄。5頭BOXは参考掲載。",
      box: [
        { num: "1", name: "テーオーダグラス", tag: "中心", note: "1枠1番(横山典・須貝)。最内の好枠＋先行力。" },
        { num: "3", name: "ハニーコム", tag: "中心", note: "3枠3番(戸崎圭)。福島で最良の3枠。" },
        { num: "4", name: "マリアイリダータ", tag: "○", note: "4枠4番(坂井)。4歳牝の上昇力。" },
        { num: "5", name: "ホウオウスーペリア", tag: "○", note: "5枠5番(津村)。牡6・58kgの地力。" },
        { num: "2", name: "ノーランサンライズ", tag: "▲", note: "2枠2番(菊沢)。内枠の牝4。" }
      ],
      bets: {
        stance: "見送り寄り",
        pick: "見送り寄り（9頭・定量で妙味薄）。買うなら ワイド ①-③ を少額",
        box5: "3連複5頭BOX ①③④⑤②（10点）※妙味は薄め",
        alloc: "-",
        note: "少頭数・定量は人気サイドで堅く収まりやすい。"
      },
      ev: "少頭数のため配当妙味は薄い",
      memo: "9頭・定量はボックスの配当が出にくい。狙うなら①③中心の馬連/ワイド。※旧スキーマのまま（後方互換の確認用）"
    },
    {
      venue: "小倉", day: "6/27(土)", no: "11R", name: "薩摩S (3勝)",
      course: "ダ1700m (右)", post: "15:30", field: "15頭", status: "枠順確定",
      verdict: "参戦", verdictNote: "15頭フルゲート＝ボックス向き。先行・内中枠有利、前半速く上がりかかる。",
      box: [
        { num: "13", name: "シンビリーブ", tag: "軸", note: "7枠13番(川田)。川田騎乗＋4歳の成長力。先行できれば外枠もカバー。" },
        { num: "8", name: "プロミシングスター", tag: "○", note: "5枠8番(団野)。回収率の高い中枠＋先行力。" },
        { num: "4", name: "ハリーケーン", tag: "○", note: "3枠4番(幸)。内中枠の4歳。" },
        { num: "9", name: "ゴッドブルービー", tag: "○", note: "5枠9番(角田和)。中枠の先行型。" },
        { num: "1", name: "ケイアイメキラ", tag: "▲", note: "1枠1番(藤懸)。最内＝内枠有利を最大限、逃げ先行で粘り込み。" }
      ],
      bets: {
        stance: "参戦",
        pick: "本線＝ワイド ⑬-⑧（堅実）／3連複 軸ながし ⑬→⑧④⑨①",
        box5: "3連複5頭BOX ⑬⑧④⑨①（10点）",
        alloc: "ワイド5 : 3連複5",
        note: "先行・内枠重視、外枠⑭⑮は割引。前半速い消耗戦。"
      },
      ev: "現地オッズで合成10倍前後が目安",
      memo: "8枠のメイショウコガシラ⑭・パフ⑮は1角まで343mで先手取れないと外々で割引。"
    },
    {
      raceId: "202602010611",
      venue: "函館", day: "6/28(日)", no: "11R", name: "函館記念 (G3)",
      course: "芝2000m (右A)", post: "15:20", field: "15頭", status: "枠順確定",
      verdict: "参戦", verdictNote: "ハンデ戦で1番人気不振・波乱多発。波乱質＋稍重洋芝で内枠先行に妙味。",
      evLabel: "+EV", provisional: true, hPending: false,
      box: [
        { num: "4", name: "マジックサンズ", tag: "軸", note: "3枠4番。懸念の大外を回避し内寄りの好枠。能力最上位(NHKマイル2着)、稍重洋芝でもパワー足りる。",
          score: 70, pWin: 0.304, pPlace: 0.587, evWin: 0.18, evPlace: 0.00 },
        { num: "8", name: "ケイアイセナ", tag: "◎", note: "5枠8番(武豊)。先行力を活かせる中枠。夏の北海道巧者で稍重は望むところ。妙味の核。",
          score: 76, pWin: 0.126, pPlace: 0.361, evWin: 0.22, evPlace: 0.03 },
        { num: "11", name: "ジュタ", tag: "○", note: "6枠11番。4歳56kgで軽め、中外枠で無難。展開が向けば。",
          score: 63, pWin: 0.089, pPlace: 0.278, evWin: 0.14, evPlace: -0.04 },
        { num: "5", name: "イガッチ", tag: "○", note: "3枠5番。内の好枠＋軽量55kg。内前残りなら一発の穴。",
          score: 64, pWin: 0.047, pPlace: 0.184, evWin: 0.15, evPlace: -0.03 },
        { num: "14", name: "フィーリウス", tag: "△", note: "8枠14番。連勝中の上り馬だが大外で割引。雨が弱まれば見直し。",
          score: 57, pWin: 0.134, pPlace: 0.371, evWin: 0.10, evPlace: -0.07 }
      ],
      sanrenpuku: { nums: [4, 8, 11, 5, 14], pCombo: 0.227, breakEven: 4.4, oddsFinal: null, evFinal: null },
      finalGate: { asOf: null, verdict: null },
      bets: {
        stance: "参戦",
        pick: "本線＝単勝⑧（+EV 0.22・暫定）／ワイド ⑧-④＋複勝⑧",
        box5: "3連複5頭BOX ④⑧⑪⑤⑭（10点）",
        alloc: "単勝/ワイド4 : 3連複4 : 複勝⑧2",
        note: "軸は1番人気④でなく割安な⑧。④は来る前提の相手。BOXは実合成が分岐4.4倍超なら+EV。"
      },
      ev: "3連複BOX: p=22.7% → 損益分岐合成 4.4倍（直前に実合成と比較）",
      memo: "デビットバローズ(8枠15番58kg)は最大外＋トップハンデで除外。エコロディノス(手術明け)は消し。"
    }
  ],
  scan: {
    title: "全レース判定（函館・両日）",
    // asOf: この scan を精査した日時。auto.js の updated よりこれが新しい時だけ昇格表示される。
    // 秘書がEV精査を転記したら必ず asOf を現在時刻(JST)に更新すること。
    asOf: "2026-06-27 12:00 JST",
    intro: "全12R×2日の参戦/見送り＋妙味スコア/暫定EV。bestScore=レース内最高スコア、EVは単複の高い方。※本内容はv2移行の雛形サンプル値。",
    days: [
      { day: "6/27(土)", races: [
        { raceId:"202602010501", venue:"函館", no:"1R", cond:"3歳未勝利・芝1200・16頭", call:"見送り", conf:1, note:"多頭数の未勝利で紛れ大", bestScore:44, bestEv:-0.15, evLabel:"-EV" },
        { raceId:"202602010502", venue:"函館", no:"2R", cond:"3歳未勝利・ダ1000・12頭", call:"見送り", conf:1, note:"ダ短距離未勝利は前傾で紛れ", bestScore:42, bestEv:-0.18, evLabel:"-EV" },
        { raceId:"202602010503", venue:"函館", no:"3R", cond:"3歳未勝利・ダ1700・12頭", call:"見送り", conf:1, note:"未勝利中距離、読みづらい", bestScore:45, bestEv:-0.14, evLabel:"-EV" },
        { raceId:"202602010504", venue:"函館", no:"4R", cond:"3歳未勝利・芝1800・16頭", call:"見送り", conf:1, note:"16頭の未勝利で紛れ大", bestScore:43, bestEv:-0.16, evLabel:"-EV" },
        { raceId:"202602010505", venue:"函館", no:"5R", cond:"2歳新馬・芝1200・8頭", call:"見送り", conf:2, note:"新馬＋少頭数の典型的見送り", bestScore:40, bestEv:-0.20, evLabel:"-EV" },
        { raceId:"202602010506", venue:"函館", no:"6R", cond:"3歳未勝利・ダ1700・11頭", call:"見送り", conf:1, note:"未勝利、妙味薄", bestScore:46, bestEv:-0.13, evLabel:"-EV" },
        { raceId:"202602010507", venue:"函館", no:"7R", cond:"1勝・芝2000・11頭", call:"参戦", conf:2, note:"古馬1勝の堅実戦。武豊ドウアド軸にワイド/複勝＋3連複で中穴", bestScore:68, bestEv:0.12, evLabel:"+EV" },
        { raceId:"202602010508", venue:"函館", no:"8R", cond:"1勝・ダ1000・11頭", call:"様子見", conf:1, note:"ダ1000は紛れ大、妙味薄", bestScore:55, bestEv:0.02, evLabel:"様子見" },
        { raceId:"202602010509", venue:"函館", no:"9R", cond:"長万部特別・1勝・芝1200・9頭", call:"様子見", conf:1, note:"9頭で配当妙味薄め、買うなら絞る", bestScore:56, bestEv:0.01, evLabel:"様子見" },
        { raceId:"202602010510", venue:"函館", no:"10R", cond:"洞爺湖特別・2勝・芝2000・11頭", call:"参戦", conf:3, note:"今週の平場で本命級。洋芝2000の堅実戦＝内中枠先行からワイド/3連複", bestScore:74, bestEv:0.18, evLabel:"+EV" },
        { raceId:"202602010511", venue:"函館", no:"11R", cond:"青函S・OP・芝1200・14頭", call:"参戦", conf:2, note:"OPハンデ混戦。ワイド軸＋5頭BOX（上の本カード参照）", bestScore:78, bestEv:0.16, evLabel:"+EV" },
        { raceId:"202602010512", venue:"函館", no:"12R", cond:"1勝・ダ1700・10頭", call:"参戦", conf:2, note:"武豊メイショウソラリス。ダ1700先行有利でワイド/3連複", bestScore:66, bestEv:0.11, evLabel:"+EV" }
      ]},
      { day: "6/28(日)", races: [
        { raceId:"202602010601", venue:"函館", no:"1R", cond:"3歳未勝利・芝1200", call:"見送り", conf:1, note:"未勝利、読みづらい", bestScore:43, bestEv:-0.17, evLabel:"-EV" },
        { raceId:"202602010602", venue:"函館", no:"2R", cond:"3歳未勝利・ダ1700", call:"見送り", conf:1, note:"未勝利中距離", bestScore:45, bestEv:-0.15, evLabel:"-EV" },
        { raceId:"202602010603", venue:"函館", no:"3R", cond:"3歳未勝利・ダ1000", call:"見送り", conf:1, note:"ダ短距離未勝利は紛れ", bestScore:41, bestEv:-0.19, evLabel:"-EV" },
        { raceId:"202602010604", venue:"函館", no:"4R", cond:"3歳未勝利・芝2600", call:"見送り", conf:1, note:"長距離未勝利は特殊、見送り", bestScore:44, bestEv:-0.16, evLabel:"-EV" },
        { raceId:"202602010605", venue:"函館", no:"5R", cond:"2歳新馬・芝1200", call:"見送り", conf:2, note:"新馬で読めない", bestScore:40, bestEv:-0.21, evLabel:"-EV" },
        { raceId:"202602010606", venue:"函館", no:"6R", cond:"3歳未勝利・芝2000・16頭", call:"見送り", conf:1, note:"16頭の未勝利で紛れ大", bestScore:46, bestEv:-0.14, evLabel:"-EV" },
        { raceId:"202602010607", venue:"函館", no:"7R", cond:"1勝・ダ1700・10頭", call:"参戦", conf:2, note:"武豊ヒミノ/岩田望アリストクラシア。ダ1700先行でワイド/3連複", bestScore:67, bestEv:0.12, evLabel:"+EV" },
        { raceId:"202602010608", venue:"函館", no:"8R", cond:"1勝・芝1200・13頭", call:"参戦", conf:2, note:"13頭スプリント混戦。3連複/ワイドの妙味", bestScore:64, bestEv:0.10, evLabel:"+EV" },
        { raceId:"202602010609", venue:"函館", no:"9R", cond:"臥牛山特別・1勝・芝1800・10頭", call:"参戦", conf:2, note:"条件戦・芝1800。先行からワイド/3連複", bestScore:65, bestEv:0.11, evLabel:"+EV" },
        { raceId:"202602010610", venue:"函館", no:"10R", cond:"渡島特別・2勝・ダ1700牝・11頭", call:"参戦", conf:2, note:"牝2勝・武豊ユージュアーナ中心。ダ1700先行でワイド軸", bestScore:69, bestEv:0.13, evLabel:"+EV" },
        { raceId:"202602010611", venue:"函館", no:"11R", cond:"函館記念・G3・芝2000・15頭", call:"参戦", conf:3, note:"本命級。ワイド⑧-④＋3連複軸ながし＋5頭BOX（上の本カード参照）", bestScore:76, bestEv:0.22, evLabel:"+EV" },
        { raceId:"202602010612", venue:"函館", no:"12R", cond:"湯の川温泉特別・2勝・芝1200・14頭", call:"参戦", conf:2, note:"14頭スプリント混戦。3連複/ワイドの妙味", bestScore:66, bestEv:0.10, evLabel:"+EV" }
      ]}
    ]
  },
  korogashi: {
    title: "複勝転がし（函館・両日）",
    intro: "現地のオッズ板で1〜2番人気の堅実馬を軸に、午後(6R〜)の堅い脚を数珠つなぎ。下記は私の構造上の本命＋適性。複勝は控除20%＝長期-EVの遊びなので、短い連鎖＋早めの利確で。",
    guide: {
      ride: ["8頭以上＝複勝3着まで", "軸が◎の堅実馬（実力・クラス慣れ・先行）", "複勝1.3〜1.7倍（堅さと妙味の両立）"],
      skip: ["7頭以下＝複勝2着まででリスク大", "新馬・荒れ未勝利・大混戦ハンデ", "複勝1.2倍未満＝当たっても増えず非効率"],
      profit: ["元手の2〜3倍に達したら利確", "3〜4連勝で一度区切る", "1日通しは狙わない／上限額を先に決める"]
    },
    days: [
      { day: "6/27(土)", legs: [
        { no:"7R", cond:"1勝・芝2000・11頭", fit:"○", anchor:"ドウアドバンテージ(武豊)＝経験上位。現地で1〜2番人気なら本線" },
        { no:"9R", cond:"長万部特別・1勝・芝1200・9頭", fit:"○", anchor:"現地で1〜2番人気の堅実馬を軸に" },
        { no:"10R", cond:"洞爺湖特別・2勝・芝2000・11頭", fit:"◎", anchor:"ハートメテオ①(岩田望)＝最内・好枠。現地人気も確認" },
        { no:"11R", cond:"青函S・OP・ハンデ・14頭", fit:"△", anchor:"ハンデ混戦で複勝の軸は固めにくい（転がしは回避無難）" },
        { no:"12R", cond:"1勝・ダ1700・10頭", fit:"○", anchor:"メイショウソラリス(武豊)＝先行。現地で人気確認" }
      ]},
      { day: "6/28(日)", legs: [
        { no:"7R", cond:"1勝・ダ1700・10頭", fit:"○", anchor:"ヒミノエトワール(武豊)/アリストクラシア(岩田望)。現地人気で堅い方を" },
        { no:"8R", cond:"1勝・芝1200・13頭", fit:"○", anchor:"現地で堅実な先行馬（1〜2番人気）を軸に" },
        { no:"9R", cond:"臥牛山特別・1勝・芝1800・10頭", fit:"○", anchor:"現地で1〜2番人気の堅実馬を軸に" },
        { no:"10R", cond:"渡島特別・2勝・ダ1700牝・11頭", fit:"○", anchor:"ユージュアーナ(武豊)＝先行。現地で人気確認" },
        { no:"11R", cond:"函館記念・G3・ハンデ・15頭", fit:"○", anchor:"複勝ならマジックサンズ④が堅い部類。現地人気も確認" },
        { no:"12R", cond:"湯の川温泉特別・2勝・芝1200・14頭", fit:"○", anchor:"現地で堅実馬（1〜2番人気）を軸に" }
      ]}
    ],
    note: "朝(1R〜5R)は新馬・未勝利中心で転がし不向き＋参戦も昼以降のため割愛。軸は現地のオッズ板で“1〜2番人気の堅実馬”を確認して確定。上の本命・適性メモを目安に。"
  },
  pending: "次開催から: 金曜夜にActionsが全場の出馬表＋予想オッズを取得(auto.js)→秘書が全レースをスコアリングして本ファイルをv2形式で更新します。",
  disclaimer: "本内容は予想であり的中・利益を保証しません。数値EVは未較正の暫定値です。購入は自己責任で。"
};
