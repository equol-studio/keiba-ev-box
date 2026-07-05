// ============================================================
//  検証ログ（KEIBA_RESULTS v1）。入力者は秘書のみ（docs/results-entry-template.md 参照）。
//  新しいエントリは entries の【先頭】に追記（新しい順）→ git push origin main。
//  集計（通算/券種別/スコア帯別/EV帯別）は保存しない。index.html がロード時に毎回計算する。
// ------------------------------------------------------------
//  エントリ形式（docs/requirements.md §5-3）:
//  {
//    id: "20260711-函館11R-1",            // 日付-場レース-同レース内連番
//    raceId: "202602010211",
//    date: "2026-07-11", venue: "函館", raceNo: "11R", raceName: "青函S",
//    betType: "place",                    // "win" | "place" | "wide" | "sanrenpuku"
//    selection: "12",                     // 馬番。ワイド"12-3"、BOX"12.3.6.5.1"
//    points: 1,                           // 点数（BOXは10）
//    unitStake: 500, stake: 500,          // 1点あたり／総額（円）
//    oddsYoso: 3.1,                       // 一次採点時オッズ（BOXは breakEven を記録）
//    oddsFinal: 2.8,                      // 購入直前オッズ
//    evYoso: 0.12, evFinal: 0.08,         // 各時点の数値EV
//    score: 78,                           // 軸馬（BOXは最高スコア馬）の妙味スコア
//    result: "hit",                       // "hit" | "miss" | "refund"
//    payout: 1400,                        // 実払戻（円、外れは0）
//    profit: 900,                         // payout − stake
//    note: ""
//  }
// ============================================================
window.KEIBA_RESULTS = {
  version: 1,
  updated: null,
  entries: []
};
