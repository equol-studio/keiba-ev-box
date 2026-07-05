// EV計算モジュール（docs/requirements.md §2 準拠。仮決め値 K2/K3/K4/K8 を含む）
// 入力: auto.js のオッズ + 秘書のスコアJSON → 出力: data.js 用 races/scan 断片
// CLI: node scripts/ev.mjs <input.json>   （入力例: scripts/ev-sample.json）

export const ALPHA = 0.30;        // K2: p補正係数（クリップ 0.70〜1.30）
export const PAYOUT = 0.80;       // 単勝・複勝の払戻率
export const TH_PLUS = 0.10;      // K3: +EV 閾値
export const TH_WATCH = -0.05;    // K3: 様子見 下限
export const WIDE_CORR = 1.20;    // K4: ワイド相関係数
export const PLACE_CAP = 0.90;    // K8: 複勝p上限クリップ

// §2-1 step2: スコア補正係数 m(S)
export function mFactor(S) {
  const m = 1 + ALPHA * (S - 50) / 50;
  return Math.min(1 + ALPHA, Math.max(1 - ALPHA, m));
}

// §2-1: 単勝p（市場含意→スコア補正→レース内正規化。全馬合計=1）
// oddsWin: {馬番: 単勝オッズ}, scores: {馬番: S}（欠落馬は S=50 中立）
export function pWinMap(oddsWin, scores) {
  const raw = {}; let sum = 0;
  for (const [n, o] of Object.entries(oddsWin)) {
    if (!(o > 0)) continue;
    const s = scores && scores[n] != null ? scores[n] : 50;
    raw[n] = (PAYOUT / o) * mFactor(s);
    sum += raw[n];
  }
  const out = {};
  for (const n of Object.keys(raw)) out[n] = raw[n] / sum;
  return out;
}

// §2-2: 複勝p（o_mid基準→補正→合計3(8頭未満は2)に正規化→個別0.90クリップ）
export function pPlaceMap(oddsPlace, scores, field) {
  const k = field >= 8 ? 3 : 2;
  const raw = {}; let sum = 0;
  for (const [n, lohi] of Object.entries(oddsPlace)) {
    const mid = (lohi[0] + lohi[1]) / 2;
    if (!(mid > 0)) continue;
    const s = scores && scores[n] != null ? scores[n] : 50;
    raw[n] = (PAYOUT / mid) * mFactor(s);
    sum += raw[n];
  }
  const out = {};
  for (const n of Object.keys(raw)) out[n] = Math.min(PLACE_CAP, k * raw[n] / sum);
  return out;
}

export const oMid = (lohi) => (lohi[0] + lohi[1]) / 2;

// §2-4: EV
export const evWin = (p, o) => p * o - 1;
export const evPlace = (p, om) => p * om - 1;
export const evWide = (pA, pB, oWide) => pA * pB * WIDE_CORR * oWide - 1;

// §2-4: 3段判定（EV_win と EV_place の高い方で判定）
export function evLabel(ev) {
  if (ev >= TH_PLUS) return '+EV';
  if (ev >= TH_WATCH) return '様子見';
  return '-EV';
}

// §2-3: Harville近似。組{a,b,c}が3着内を独占する確率（6順列の和）
export function harvilleTop3(pMap, [a, b, c]) {
  let total = 0;
  const perms = [[a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]];
  for (const [i, j, k] of perms) {
    const pi = pMap[i], pj = pMap[j], pk = pMap[k];
    if (pi == null || pj == null || pk == null) return NaN;
    total += pi * (pj / (1 - pi)) * (pk / (1 - pi - pj));
  }
  return total;
}

// 5頭BOX(10組)の的中確率と損益分岐合成オッズ
export function comboBox5(pMap, nums) {
  const ns = nums.map(String);
  let pCombo = 0;
  for (let i = 0; i < ns.length; i++)
    for (let j = i + 1; j < ns.length; j++)
      for (let k = j + 1; k < ns.length; k++)
        pCombo += harvilleTop3(pMap, [ns[i], ns[j], ns[k]]);
  return { pCombo, breakEven: 1 / pCombo };
}

// §2-4: レース単位の call（既存ルールフィルタ→EVラベル）
export function raceCall(cls, field, labels) {
  if (cls === '新馬' || cls === '未勝利') return '見送り';
  if (!field || field <= 7) return '見送り';
  if (labels.includes('+EV')) return '参戦';
  if (labels.includes('様子見')) return '様子見';
  return '見送り';
}

const r = (v, d) => (Number.isFinite(v) ? Number(v.toFixed(d)) : null);

// 1レース分の data.js 断片を組み立てる
// input: { raceId, venue, no, name, cls, field, hPending?,
//          scores: {馬番:S}, odds: {win:{馬番:o}, place:{馬番:[lo,hi]}},
//          boxNums?: [馬番×5]（省略時はスコア上位5頭） }
export function buildRace(input) {
  const { raceId, venue, no, name, cls, field } = input;
  const scores = input.scores || {};
  const win = (input.odds && input.odds.win) || {};
  const place = (input.odds && input.odds.place) || {};
  const pWin = pWinMap(win, scores);
  const pPlace = pPlaceMap(place, scores, field);

  const horses = {};
  const labels = [];
  let bestScore = null, bestEv = null;
  for (const n of Object.keys(win)) {
    const s = scores[n] != null ? scores[n] : 50;
    const eW = pWin[n] != null ? evWin(pWin[n], win[n]) : null;
    const eP = pPlace[n] != null ? evPlace(pPlace[n], oMid(place[n])) : null;
    const evBest = Math.max(eW != null ? eW : -Infinity, eP != null ? eP : -Infinity);
    const lb = evBest === -Infinity ? null : evLabel(evBest);
    if (lb) labels.push(lb);
    horses[n] = {
      score: s,
      pWin: r(pWin[n], 3), pPlace: r(pPlace[n], 3),
      evWin: r(eW, 2), evPlace: r(eP, 2),
      evBest: evBest === -Infinity ? null : r(evBest, 2), evLabel: lb
    };
    if (bestScore == null || s > bestScore) bestScore = s;
    if (evBest !== -Infinity && (bestEv == null || evBest > bestEv)) bestEv = evBest;
  }

  // BOX 5頭: 指定がなければスコア降順（同点は単勝EV降順）上位5頭
  const boxNums = (input.boxNums && input.boxNums.length ? input.boxNums.map(String)
    : Object.keys(horses)
        .sort((a, b) => (horses[b].score - horses[a].score) || ((horses[b].evWin || -9) - (horses[a].evWin || -9)))
        .slice(0, 5));
  let sanrenpuku = null;
  if (boxNums.length === 5 && boxNums.every((n) => pWin[n] != null)) {
    const { pCombo, breakEven } = comboBox5(pWin, boxNums);
    sanrenpuku = {
      nums: boxNums.map(Number),
      pCombo: r(pCombo, 3), breakEven: r(breakEven, 1),
      oddsFinal: null, evFinal: null
    };
  }

  const call = raceCall(cls, field, labels);
  const raceLabel = labels.includes('+EV') ? '+EV' : labels.includes('様子見') ? '様子見' : '-EV';
  return {
    race: {
      raceId, venue, no, name: name || '', cls, field,
      evLabel: raceLabel, provisional: true, hPending: !!input.hPending,
      call, horses, sanrenpuku,
      finalGate: { asOf: null, verdict: null }
    },
    scan: {
      raceId, venue, no,
      bestScore: bestScore != null ? Math.round(bestScore) : null,
      bestEv: r(bestEv, 2), evLabel: raceLabel, call
    }
  };
}

// CLI: node scripts/ev.mjs <input.json>
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1] && process.argv[1].endsWith('ev.mjs')) {
  const file = process.argv[2];
  if (file) {
    const { readFileSync } = await import('node:fs');
    const input = JSON.parse(readFileSync(file, 'utf-8'));
    const races = Array.isArray(input) ? input : [input];
    console.log(JSON.stringify(races.map(buildRace), null, 2));
  }
}
