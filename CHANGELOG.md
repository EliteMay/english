# CHANGELOG

## v0.6.2 — 2026-08-30

`web-project-guide` 1.1.0 に合わせた保守・品質改善。

- `js/v060/` を `js/app/` へ変更し、Versioned Runtimeの恒久化を解消
- `css/app-v060.css` を `css/app.css` へ変更
- App Version / Build / Schemaを `js/app/meta.js` へ一元化
- HTMLの手動cache-bust queryを削除
- Project Profileを `STATIC + DATA + MEDIA + AI-HANDOFF + TOOL` として記録
- Backup / ChatGPT分析JSONのImport Validationを追加
- Backup Import途中失敗時のIndexedDB Rollbackを追加
- 複数タブ更新を `storage` eventで検知し警告
- `aria-live` / `aria-pressed` / `aria-current` / focus-visible / reduced-motionを改善
- Small viewport / 低い縦解像度のFirefox E2Eを追加
- READMEを現在仕様中心へ整理し、Version履歴をCHANGELOGへ分離

保存Schema / Storage Key / Paper Schemaは変更していない。

## v0.6.1 — 2026-08-30

答え合わせ画面のレイアウト修正。

- 950px固定紙面によるページ全体の横overflowを解消
- 左紙と右回答を独立スクロール
- 紙全体をペイン幅へ等倍率縮小
- 答え合わせ中の下部フッター重なりを解消
- 右回答ヘッダーへ採点保存操作を配置
- Firefox E2Eへ横overflow / 2ペイン / 固定UI Regressionを追加

## v0.6.0 — 2026-08-30

長期利用で紙・手書き・保存を壊しにくい土台へ再設計。

- Versioned Patch JSの積み重ねを単一Module Runtimeへ統合
- 手書きをページ絶対座標から問題単位の0〜1相対座標へ変更
- 手書き・Snapshot・ArchiveをIndexedDBへ移行
- Paper Snapshot / Paper Revisionを導入
- v0.5系データMigration / Legacy互換表示を追加
- `data/pedagogy.json` を教材ルールの正本として導入
- ChatGPT提出ZIP v3
- Static Validation + Firefox E2Eを導入
