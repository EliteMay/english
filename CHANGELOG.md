# CHANGELOG

## v0.7.0 / Build 20260831-2 — 2026-08-31

`web-project-guide` 1.10.0 のCross-Repository GitHub Infrastructureへ内部運用を更新。**公開画面のHTML / CSS / Layout / Visualは変更していない。**

- Guide採用Versionを1.10.0へ更新
- `web-project-guide` のReusable Web BaselineをCommit SHA固定で導入
- Common BaselineへJS / MJS syntaxとJSON parseを分離
- English固有のWorkbook validator / Unit / Firefox E2EはこのRepositoryへ維持
- Reusable Workflowの`@main`追従を禁止するStatic Guardを追加
- npm / GitHub Actions用Dependabotをweekly・grouped設定で追加
- Dependency PRの無条件Auto Mergeは採用しない
- 古いCIの責務重複を整理し、Common Baseline → Project Static → Firefox E2Eの順に実行
- App Version表示はv0.7.0を維持し、内部Buildだけ更新

State / Paper / Analysis Schema、IndexedDB、手書き形式、教材Data、`index.html`、`css/`は変更していない。

## v0.7.0 — 2026-08-31

`web-project-guide` 1.9.0 に合わせ、Project MemoryとLocal-first Development Diagnosticsを追加。

- `PROJECT_LEARNINGS.md` を追加し、高コストBug・成功Pattern・Regression Guardを長期記録
- `AGENTS.md` を追加し、AI Coding Agent向けの薄いProject Routerを用意
- `js/app/diagnostics.js` を追加
  - App Version / Build / Schema / Guide Version
  - View / Viewport / Browserの最小情報
  - 重要Breadcrumb
  - JavaScript Error / Unhandled Rejection
  - Catalog fetch failure
  - Backup Import / Rollback結果
  - Storage概要
- 診断Eventを直近120件のRing Bufferに制限
- 診断文字列のURL query / fragmentと代表的Secret patternをSanitize
- `data/diagnostics.schema.json` Schema v2を追加
- データ管理画面へ「開発診断JSON」「診断ログ消去」を追加
- Remote Diagnostic Handoffは明示的にdisabled
- 学習分析用ZIPと不具合調査用Diagnostics JSONを役割分離
- Unit TestへDiagnostics sanitize / ring buffer / safe defaultを追加
- Firefox E2EへDiagnostic JSON download導線を追加
- Static ValidatorへGuide 1.9.0 / Project Learnings / AGENTS / Diagnostics safe default検査を追加

保存State Schema / Paper Schema / IndexedDB Store / 既存手書き形式は変更していない。

## v0.6.2 — 2026-08-30

`web-project-guide` 1.1.0 に合わせた保守・品質改善。

- `js/v060/` を `js/app/` へ変更し、Versioned Runtimeの恒久化を解消
- `css/app-v060.css` を `css/app.css` へ変更
- App Version / Build / Schemaを `js/app/meta.js` へ一元化
- 学習Sessionの `appVersion` 固定値を廃止し、Metadata正本を参照
- HTMLの手動cache-bust queryを削除
- Project Profileを `STATIC + DATA + MEDIA + AI-HANDOFF + TOOL` として記録
- 答え合わせ操作をMutationObserverで後付けせず、正式Rendererで生成する構造へ統合
- Backup / ChatGPT分析JSONのImport Validationを追加
- Backup Import途中失敗時のIndexedDB Rollbackを追加
- 複数タブ更新を `storage` eventで検知し警告
- `aria-live` / `aria-pressed` / `aria-current` / focus-visible / reduced-motionを改善
- Small viewport / 低い縦解像度 / データ管理DialogのFirefox E2Eを追加
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
