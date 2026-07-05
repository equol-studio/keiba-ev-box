# keiba-app 進捗ログ

司令官の指示: netkeiba を claude-in-chrome で操作し、各開催・各レースで「期待値のある馬」を選出するアプリを作る。
方向性が固まり司令官が「作成して」と言うまで**実装はしない**。進捗はすべてこの `docs/` に集約する。

## 体制
- 司令官（PT・馬券戦略オーナー）
- 秘書（Claude）: タスク割り振り・進捗管理
- CEO（advisor 起用）: アプリの方向性策定。必要に応じて部署を作り委任してよい

## タイムライン
- 2026-07-05: プロジェクト始動。CEO 雇用。方向性策定に着手（実装は保留）。

## 現状の資産
- 既存 PWA「競馬 期待値ボックス」= このリポジトリ（Terea-equol/keiba-ev-box、equol-studio.github.io/keiba-ev-box で公開）
- 現行方式: GitHub Actions で netkeiba 出馬表を取得→ルール判定→ auto.js 生成→表示（オッズ不使用の確定版）
- 目指す方向: claude-in-chrome で netkeiba を能動操作し、EV（期待値）ベースで馬を選出

## 決定待ち事項
- アプリの方向性（CEO 策定中）
