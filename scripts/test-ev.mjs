// ev.mjs のユニットテスト（検算）。実行: node scripts/test-ev.mjs
import assert from 'node:assert/strict';
import {
  mFactor, pWinMap, pPlaceMap, oMid, evWin, evPlace, evWide, evLabel,
  harvilleTop3, comboBox5, raceCall, buildRace,
  ALPHA, PAYOUT, TH_PLUS, TH_WATCH, WIDE_CORR, PLACE_CAP
} from './ev.mjs';

const approx = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`);
let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

// --- m(S) ---
t('m(50)=1 / m(100)=1.30 / m(0)=0.70（クリップ端）', () => {
  approx(mFactor(50), 1);
  approx(mFactor(100), 1 + ALPHA);
  approx(mFactor(0), 1 - ALPHA);
  approx(mFactor(75), 1.15);
});

// --- p_win ---
t('p_win はレース内合計=1、スコア中立なら市場含意比率どおり', () => {
  const odds = { 1: 2.0, 2: 4.0, 3: 8.0 };
  const p = pWinMap(odds, {}); // 全馬S=50 → m=1
  approx(p['1'] + p['2'] + p['3'], 1);
  // p_imp = .40/.20/.10 → 正規化で 4/7, 2/7, 1/7
  approx(p['1'], 4 / 7);
  approx(p['3'], 1 / 7);
});
t('スコア高→pが市場比で上振れ', () => {
  const odds = { 1: 4.0, 2: 4.0 };
  const p = pWinMap(odds, { 1: 100, 2: 50 }); // m=1.3 vs 1.0
  approx(p['1'], 1.3 / 2.3);
  assert.ok(p['1'] > p['2']);
});

// --- p_place ---
t('p_place は合計=3（8頭以上・クリップ非発動時）', () => {
  const place = {}; const field = 10;
  for (let i = 1; i <= 10; i++) place[i] = [2.0, 3.0]; // 全馬同一
  const p = pPlaceMap(place, {}, field);
  const sum = Object.values(p).reduce((a, b) => a + b, 0);
  approx(sum, 3);
  approx(p['1'], 0.3);
});
t('p_place は7頭以下で合計=2、個別0.90クリップ', () => {
  const place = { 1: [1.0, 1.0], 2: [9.0, 9.0], 3: [9.0, 9.0], 4: [9.0, 9.0], 5: [9.0, 9.0], 6: [9.0, 9.0] };
  const p = pPlaceMap(place, {}, 6);
  assert.ok(p['1'] <= PLACE_CAP + 1e-12);
  approx(p['1'], PLACE_CAP); // 生値 2*(0.8/1)/(0.8+5*0.0889)≒1.28 → 0.90 にクリップ
});

// --- EV と3段判定 ---
t('EV式と閾値（境界値含む）', () => {
  approx(evWin(0.25, 5.0), 0.25);
  approx(evPlace(0.5, 2.2), 0.1);
  approx(evWide(0.5, 0.4, 10) , 0.5 * 0.4 * WIDE_CORR * 10 - 1);
  assert.equal(evLabel(TH_PLUS), '+EV');        // ≥ +0.10
  assert.equal(evLabel(0.0999), '様子見');
  assert.equal(evLabel(TH_WATCH), '様子見');    // ≥ -0.05
  assert.equal(evLabel(-0.0501), '-EV');
});

// --- Harville ---
t('Harville: 等確率n頭で P(組)=6/(n(n-1)(n-2))、10頭5頭BOX合計=1/12', () => {
  const p = {}; for (let i = 1; i <= 10; i++) p[i] = 0.1;
  approx(harvilleTop3(p, ['1', '2', '3']), 6 / (10 * 9 * 8));
  const { pCombo, breakEven } = comboBox5(p, [1, 2, 3, 4, 5]);
  approx(pCombo, 10 * 6 / 720);   // = 1/12
  approx(breakEven, 12);
});
t('Harville: 3頭のみなら独占確率=1', () => {
  const p = { 1: 0.5, 2: 0.3, 3: 0.2 };
  approx(harvilleTop3(p, ['1', '2', '3']), 1, 1e-12);
});

// --- レースcall ---
t('raceCall: ルールフィルタ優先→EVラベル', () => {
  assert.equal(raceCall('未勝利', 16, ['+EV']), '見送り');
  assert.equal(raceCall('OP/重賞', 7, ['+EV']), '見送り');
  assert.equal(raceCall('1勝', 12, ['+EV', '-EV']), '参戦');
  assert.equal(raceCall('1勝', 12, ['様子見', '-EV']), '様子見');
  assert.equal(raceCall('1勝', 12, ['-EV', '-EV']), '見送り');
});

// --- buildRace 断片 ---
t('buildRace: サンプル入力で断片が整合', async () => {
  const { readFileSync } = await import('node:fs');
  const input = JSON.parse(readFileSync(new URL('./ev-sample.json', import.meta.url), 'utf-8'));
  const { race, scan } = buildRace(input);
  assert.equal(race.raceId, input.raceId);
  assert.equal(race.provisional, true);
  // p_win 合計=1
  const sum = Object.values(race.horses).reduce((a, h) => a + h.pWin, 0);
  assert.ok(Math.abs(sum - 1) < 0.01);
  // BOX指定どおり・breakEven = 1/pCombo
  assert.deepEqual(race.sanrenpuku.nums, [12, 3, 6, 5, 1]);
  assert.ok(Math.abs(race.sanrenpuku.breakEven - 1 / race.sanrenpuku.pCombo) < 0.2);
  // scan 断片
  assert.equal(scan.bestScore, 78);
  assert.equal(scan.evLabel, race.evLabel);
  assert.ok(['参戦', '様子見', '見送り'].includes(race.call));
  console.log('   sample:', race.no, race.evLabel, 'call=' + race.call,
    'BOX p=' + race.sanrenpuku.pCombo, 'BE=' + race.sanrenpuku.breakEven,
    'best horse 12:', JSON.stringify(race.horses['12']));
});

console.log(`\n${n} tests passed`);
