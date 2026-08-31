# AGENTS.md

> Coding Agent向けの入口 / Routerです。Project仕様のSource of Truthをこのファイルへ複製しません。

## Read First

作業前に、変更内容に関係する範囲で次を確認してください。

1. `README.md`
2. `PROJECT_LEARNINGS.md`
3. `作業報告書.md` / `CHANGELOG.md`
4. `data/pedagogy.json`（教材ルールを触る場合）
5. `data/packs/index.json` と対象pack（問題Dataを触る場合）
6. 最新 `web-project-guide` の `README.md` / `START_HERE.md` と関連章
7. 変更対象のCode / Data / Test

## Project

- Purpose: PDFワークシートのように英語問題をペンタブで直接解き、答え合わせ・結果・ChatGPT分析まで行う個人用学習サイト
- Main entry point: `index.html` → `js/app/app.js`
- Deployment: GitHub Pages
- Public URL: `https://elitemay.github.io/english/`
- Adopted web-project-guide version: `1.10.0`
- Project Profiles: `STATIC + DATA + MEDIA + AI-HANDOFF + TOOL`

## Commands

```bash
npm install
npm run test:static
npm run test:unit
npm run test:e2e
```

`test:e2e`はPlaywright Firefoxを使用します。実行できなかったCommandは成功扱いにせず、未確認として報告してください。

## CI / Cross-Repository Baseline

- Common baseline: `EliteMay/web-project-guide/.github/workflows/reusable-web-baseline.yml`
- Reference policy: reviewed **commit SHA pin** only; permanent `@main`は禁止
- Common responsibility: Node setup基準 / JS・MJS syntax / JSON parse baseline
- Project responsibility: Workbook validator / Unit / Firefox E2E / Storage・Paper・Ink contract
- Dependabot: npm + GitHub Actionsをweeklyで確認。無条件Auto Mergeしない

中央WorkflowへEnglish固有の教材Schema、Paper geometry、Firefox E2Eを移さないでください。共通Baselineが変わる場合はPilotとしてこのRepoでCIを確認してから他Repoへ広げます。

## Runtime Evidence / Remote Diagnostics

- Remote handoff: disabled
- Provider: None
- Project key: `english-worksheet-lab`
- Fallback: サイトの「データ管理 → 開発診断JSON」
- Detailed diagnostics: Local-first / `english-worksheet-diagnostics-v1`
- Binary learning evidence: ChatGPT提出ZIPを維持

同じ症状を調査する場合、利用可能ならユーザーに長文で再説明を求める前に開発診断JSONを確認してください。ただし手書き位置・実際の回答・画像が必要な学習分析では提出ZIPが正本です。

## Non-breakable Rules

詳細は `README.md` の「崩してはいけない仕様」を正本として参照してください。特に次は高リスクです。

- 既存v0.5系手書きDataを勝手に削除しない
- 新しい手書きはQuestion-local normalized coordinatesを維持する
- Paper Snapshot / Revisionを壊さない
- 入力Form中心の学習UIへ戻さない
- 未着手を0点扱いしない
- GitHub Pages相対Pathを維持する
- API Secretや個人Diagnostic Logを公開RepoへCommitしない

## Architecture / File Ownership

| Area | Canonical file / directory | Notes |
|---|---|---|
| Runtime metadata | `js/app/meta.js` | App Version / Build / Schema / Guide Version |
| App shell | `js/app/app.js` | Main orchestration and dialogs |
| Practice renderer | `js/app/practice.js` | 問題用紙・答え合わせDOMの正式Renderer |
| Ink | `js/app/ink.js` | Question-local pen interaction |
| Storage | `js/app/state.js`, `js/app/db.js` | localStorage + IndexedDB |
| Diagnostics | `js/app/diagnostics.js` | Local-first sanitized runtime evidence |
| Pedagogy | `data/pedagogy.json` | skeleton / range / structureの正本 |
| Workbook data | `data/packs/` | Manifest経由で読む問題Data |
| Project tests | `tests/` | Static / Unit / Firefox E2E |
| Common CI baseline | `.github/workflows/validate.yml` | Guide reusable workflowをSHA固定で呼ぶ |
| Dependency updates | `.github/dependabot.yml` | Weekly / grouped / no auto merge |

同じ責務のVersioned Patch / Duplicate Runtimeを増やさないでください。

## High-risk Areas

- Storage / Migration: very high
- Paper Snapshot / Legacy Ink: very high
- Canvas geometry: very high
- Backup / Import / Restore: high
- ChatGPT ZIP / Paper rendering: high
- Pedagogy / scoring semantics: high
- Remote Diagnostics / Telemetry: disabled。勝手にCloud依存を追加しない

## Change Policy

- 小規模変更はSmallest Safe Changeを優先する。
- 複数File・高リスク変更はBranch / PRを優先する。
- 大規模RewriteをDefaultにしない。
- 一時Script / Debug / Workflowを残さない。
- UI変更を依頼されていないMaintenanceではHTML/CSSを不要に変更しない。
- AI生成CodeもCommon Baseline + Static / Unit / Firefox E2Eの該当範囲を通す。
- Runtime Evidenceへ学習回答本文・Stroke・File body・Secretを自動記録しない。
- Remote Diagnosticsを導入する場合は無料条件・Security・Fallbackを再確認し、Core機能の依存先にしない。
- Reusable Workflow参照はCommit SHA固定。Project固有Validator / E2EはこのRepoへ残す。
- Dependabot PRを無条件Auto Mergeしない。

## Completion

- [ ] 要求された変更を実装
- [ ] 関連Regression / Validationを実行
- [ ] 最終Commit / Merge CommitのCIを確認
- [ ] GitHub Pages変更時は同じ最終CommitのDeployを確認
- [ ] README / CHANGELOG / 作業報告 / PROJECT_LEARNINGSを必要に応じて更新
- [ ] Common Baseline参照SHAがReview済みか確認
- [ ] Runtime DiagnosticsのSanitize / size上限を壊していない
- [ ] 未確認事項を明示
