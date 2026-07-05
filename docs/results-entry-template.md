# 検証ログ 秘書代行入力テンプレ（results.js）

- 準拠: docs/requirements.md §5-3（スキーマ）・§6（変換規約）
- 入力者は**秘書のみ**。司令官は開催後にチャットで一言報告するだけ。

## 1. 司令官の一言 → エントリJSON の変換

例: 「函館11R 複勝⑫500円→払戻1400円。3連複BOXは外れ、1000円」→ 2エントリ。

```js
{
  id: "20260711-函館11R-1",          // 日付-場レース-同レース内連番（1から）
  raceId: "202602010211",            // data.js の当該レースから転記
  date: "2026-07-11", venue: "函館", raceNo: "11R", raceName: "青函S",
  betType: "place",                  // 単勝=win / 複勝=place / ワイド=wide / 3連複=sanrenpuku
  selection: "12",                   // 馬番。ワイド"12-3"、BOX"12.3.6.5.1"
  points: 1,                         // BOXは10
  unitStake: 500, stake: 500,        // stake = unitStake × points
  oddsYoso: 3.1,                     // 【転記】下表参照。手入力しない
  oddsFinal: 2.8,                    // 【転記】finalGate 時点の記録。無ければ null
  evYoso: 0.12, evFinal: 0.08,       // 【転記】同上
  score: 78,                         // 【転記】軸馬（BOXは最高スコア馬）の妙味スコア
  result: "hit",                     // hit / miss / refund（同着・返還）
  payout: 1400,                      // 実払戻（円）。外れは 0、返還は返還額
  profit: 900,                       // payout − stake
  note: ""
}
```

## 2. 転記元の対応表（手入力禁止。当該開催の data.js から転記）

| エントリ項目 | 転記元 |
|---|---|
| raceId / venue / raceNo / raceName | data.js `races[]` の当該レース |
| score | `box[]` の当該馬の `score`（BOXは box 内最高スコア） |
| oddsYoso (win) | auto.js `odds.races[raceId].win[馬番]`（一次採点時点） |
| oddsYoso (place) | 同 `place[馬番]` の (下限+上限)/2 |
| oddsYoso (sanrenpuku) | data.js `sanrenpuku.breakEven`（損益分岐比較用） |
| evYoso | `box[]` の `evWin` / `evPlace`（券種に対応する方） |
| oddsFinal / evFinal | 直前最終ゲート時の記録（`finalGate` 実施時に控えたオッズ/EV）。記録がなければ `null` |

## 3. 記帳ルール（§6）

1. 新エントリは entries の**先頭**に追記（新しい順を維持）。
2. **払戻不明のエントリは作らない**（司令官に払戻額を確認してから記帳）。
3. 同着・返還は `result: "refund"`、`payout` = 返還額（profit は通常 0）。
4. 未購入（見送り）レースはエントリを作らない。
5. `updated` を "YYYY-MM-DD HH:mm JST" で更新。

## 4. push 手順

```
cd keiba-app
（results.js を編集・保存）
git add results.js
git commit -m "results: MM/DD 開催分を記帳"
git push origin main
```

- SLA: 開催翌日 21:00 までに全購入分を反映（requirements §8 S7）。
- push 後、PWA の「検証ログ（回収率）」に通算/券種別/スコア帯別/EV帯別が自動反映される（再計算はアプリ側）。
