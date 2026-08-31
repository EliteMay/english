# English Worksheet Lab

個人用の英語問題集サイトです。GitHub Pages上でPDFワークシートのように問題を並べ、ペンタブで英文・選択肢・回答欄へ直接書き込みます。

**学習フロー:** 問題を選ぶ → 紙面へ直接解く → 左に問題用紙を残して右で答え合わせ → 結果・復習 → 解いた紙ZIPをChatGPTへ渡す → 弱点分析JSONを戻す

## Project Profile

Adopted Guide: `web-project-guide` **1.9.0**

Profiles: **STATIC + DATA + MEDIA + AI-HANDOFF + TOOL**

現在のApp Version / Build / Schema / Guide Versionの正本は [`js/app/meta.js`](js/app/meta.js) です。READMEへVersion値を重複記載しません。

変更履歴は [`CHANGELOG.md`](CHANGELOG.md)、詳細な実装・検証記録は [`作業報告書.md`](作業報告書.md)、長期的な失敗・成功・再発防止知識は [`PROJECT_LEARNINGS.md`](PROJECT_LEARNINGS.md) を参照してください。Coding Agent向けの入口は [`AGENTS.md`](AGENTS.md) です。

## 崩してはいけない仕様

1. サイトの中心は紙の問題集である
2. 複数問題を1ページに並べる
3. ペンタブで問題そのものへ直接書く
4. 入力フォーム中心の学習UIへ戻さない
5. 同型の簡単問題で問題数を水増ししない
6. 基礎から扱うが説明を幼くしすぎない
7. 骨格読みでは修飾を一旦後回しにする
8. 「骨格S」と文法上の「S全体」を混同しない
9. 範囲問題だけS全体の端まで評価する
10. Vは動詞グループとして扱い、副詞・O・Cを混ぜない
11. 問題開始時のPaper Snapshotを保存し、後の教材更新で既存紙面を変形させない
12. 新しい手書きは問題単位の0〜1相対座標で保存する
13. 既存v0.5系手書きデータを勝手に消さない
14. 未着手問題を0点扱いしない
15. 解いた紙面をChatGPTへZIPで渡せる
16. APIキー・個人データを公開GitHubへ自動送信しない
17. 破壊的操作には確認・Backup・Recoveryを用意する
18. GitHub Pagesの相対Pathを維持する
19. 答え合わせではページ全体を横スクロールさせず、左紙と右回答を同時に見られる状態を維持する
20. fixed / sticky UIを問題・回答カードの上へ重ねない
21. Runtime Diagnosticsへ学習回答本文・手書きStroke・File本文・Token等を自動記録しない
22. Remote DiagnosticsをCore機能の必須依存にしない。現在はRemote Handoffを無効のまま維持する

## 画面構成

### 01 問題を選ぶ

- 問題セット一覧
- 分野・難易度・進捗フィルター
- 検索
- 続きから
- ChatGPT分析の推奨
- 新しい紙を開始

問題セット数・問題数は `data/packs/index.json` のManifestを正本とし、JSへ件数を重複hardcodeしません。

### 02 問題を解く

- PDF風の白い問題用紙
- 黒 / 赤 / 青 / 緑ペン
- 蛍光マーカー
- 細 / 中 / 太
- 消しゴム
- Undo / Redo
- ページ消去
- 表示倍率
- 集中モード
- 入力デバイス・筆圧表示
- ページ学習時間

問題用紙には解くために必要な情報を優先し、長い説明・正答・迷いタグは答え合わせ側へ分離します。

### 答え合わせ

デスクトップでは:

- 左: 解いた問題用紙
- 右: 正答・解説・○△×・迷いタグ・メモ

左右を独立スクロールします。950pxの紙内部レイアウトは変えず、必要時は左ペインへ紙全体を等倍率縮小します。

狭い画面では1カラムへ切り替え、ページ全体の不要な横overflowを発生させないことを優先します。

### 03 結果・復習

- スコアと進捗率を分離
- 未着手を0点にしない
- 分野別の最新理解度
- 学習時間
- 履歴
- △・×復習

### 04 弱点・ChatGPT分析

提出範囲:

- 今回の問題だけ
- 最近3回
- すべての現在紙

ChatGPTから戻す分析JSONはSchema Version 2としてValidationしてから保存します。AI分析は学習補助情報であり、自動的に絶対正解として扱いません。

## 学習Handoffと開発診断を分ける

このProjectでは、用途の違う2種類のHandoffを混ぜません。

### 学習分析: ChatGPT提出ZIP

実際に解いた紙・手書き・問題文が分析EvidenceなのでBinaryを含むZIPを維持します。

```text
english_submission_YYYY-MM-DD.zip
├─ papers/
│  └─ 実際に解いた問題用紙.png
├─ manifest.json
├─ paper-index.json
├─ paper-snapshots.json
├─ ink-history.json
├─ learning-data.json
├─ questions.json
├─ analysis-return.schema.json
└─ ChatGPTに見てほしいこと.txt
```

紙PNGを優先し、ストローク履歴・自己採点・迷い・Paper Revisionを補助情報として分析します。

### 不具合調査: 開発診断JSON

「データ管理 → 開発診断JSON」から、Sanitize済みの小さいRuntime Evidenceを書き出せます。

主な内容:

- App Version / Build / Schema / Guide Version
- 現在画面
- Session開始後の主要Breadcrumb
- Viewport / Browserの最小Summary
- JavaScript Error / Unhandled Rejection
- Catalog fetch failure
- Backup Import / Rollback結果
- Storage使用量Summary
- Feature Detection

記録しないもの:

- 学習回答本文
- 手書きStroke
- 問題用紙画像
- Import File本文
- Password / Token / Cookie / API Key
- Binary data

診断Eventは `english-worksheet-diagnostics-v1` に直近120件だけ保持します。診断Log自身を無限保存しません。

### Remote Diagnostic Handoff

現在は **disabled** です。

理由:

- このサイトはGitHub PagesだけでCore機能が成立している
- 手書き・紙面を含む学習分析はBinary ZIPが必要で、Compact Runtime Snapshotでは代替できない
- Remote Providerの無料枠・Security・匿名書込経路を必要性なしに増やさない

将来Remote診断を導入する場合も、Local Diagnostics / JSON ExportをFallbackとして残し、Provider停止で学習機能が止まらない構成にします。

## 問題用紙と保存

### Paper Snapshot

問題を開始した時点で、その問題セット全文をIndexedDBの `paperSnapshots` へ保存します。

```text
attempt
 ├─ paperSnapshotId
 ├─ paperRevision
 └─ ink
```

教材JSONを更新しても、既存attemptは開始時の紙面を使い続けます。「新しい紙」を開始した時だけ最新教材を使います。

### 手書き

新しい手書きはページ全体ではなく、各問題枠内の0〜1相対座標としてIndexedDBへ保存します。

これにより上の問題の高さが変わっても、後続問題の手書きは対象問題と一緒に移動します。

旧v0.5系のページ座標は `legacyInk` と `data/legacy/` に隔離して互換表示します。

## 保存場所

### localStorage

軽い状態・設定・Recovery・上限付き開発診断のみです。

```text
english-worksheet-lab-v6
english-worksheet-prefs-v2
english-worksheet-recovery-v2
english-worksheet-diagnostics-v1
```

### IndexedDB

```text
english-worksheet-lab-v6
├─ ink            問題単位の新しい手書き
├─ legacyInk      v0.5系ページ座標の手書き
├─ paperSnapshots 問題開始時の紙面
└─ archives       やり直す前のattempt
```

バックアップJSON読込時はSchemaと主要Store構造を検証し、Import途中に失敗した場合は開始前のIndexedDB SnapshotへのRollbackを試みます。

複数タブで同じ学習データが更新された場合は `storage` eventで警告し、古いタブからの上書きリスクをユーザーへ知らせます。

## 教材ルール

教材方針の正本は [`data/pedagogy.json`](data/pedagogy.json) です。

- `skeleton`: 骨格読み
- `range`: 範囲問題
- `structure`: 構造分解

## Project Memory

- `作業報告書.md`: 今回何を変更・検証したか
- `PROJECT_LEARNINGS.md`: 高コストBug、成功設計、再発防止
- Runtime Diagnostics: 実際のSession・Error・Breadcrumb

重大Bugを直した場合は、可能な限り **Project Learnings + Regression Guard + Work Report** をセットで更新します。

## ファイル構成

```text
/
├─ index.html
├─ AGENTS.md
├─ PROJECT_LEARNINGS.md
├─ css/
│  ├─ app.css
│  ├─ review.css
│  └─ accessibility.css
├─ js/app/
│  ├─ meta.js
│  ├─ validation.js
│  ├─ diagnostics.js
│  ├─ app.js
│  ├─ db.js
│  ├─ state.js
│  ├─ data.js
│  ├─ library.js
│  ├─ practice.js
│  ├─ review-layout.js
│  ├─ ink.js
│  ├─ results.js
│  ├─ analysis.js
│  └─ export.js
├─ data/
│  ├─ pedagogy.json
│  ├─ curriculum.json
│  ├─ diagnostics.schema.json
│  ├─ analysis-return.schema.json
│  ├─ legacy/
│  └─ packs/
├─ tests/
│  ├─ validate.mjs
│  ├─ unit.mjs
│  └─ e2e.spec.mjs
├─ playwright.config.mjs
├─ package.json
├─ .github/workflows/validate.yml
├─ CHANGELOG.md
├─ README.md
└─ 作業報告書.md
```

## GitHub Pages

公開URL:

```text
https://elitemay.github.io/english/
```

正式利用はGitHub Pagesを前提とします。HTML / CSS / JavaScript / JSONは相対Pathで参照し、localhostやPC固有絶対Pathへ依存しません。

外部APIキーは不要です。

## 自動検証

GitHub Actionsで以下を確認します。

- JavaScript / MJS構文
- Import ValidationのUnit Test
- Diagnostics Sanitize / Ring Buffer / Safe defaultのUnit Test
- JSON / Manifest / ID / Schema整合
- Runtime / CSS参照切れ
- Versioned Runtimeの再混入
- Version / Package / Guide Versionの整合
- `PROJECT_LEARNINGS.md` / `AGENTS.md` / Diagnostics Schemaの存在
- Runtime DiagnosticsがRemoteへ自動送信しないこと
- localhost / PC絶対Path /代表的Secretの混入
- 公開JSONへのData URL混入
- Firefox E2E
- 問題単位Canvas geometry
- 答え合わせの横overflow
- 低い縦解像度での固定UI重なり
- Small viewportでの主要導線
- 開発診断JSONのDownload導線

## 開発・更新時の注意

- 作業開始時は `AGENTS.md` を入口に `README.md` / `PROJECT_LEARNINGS.md` / 最新 `web-project-guide` を確認する
- 新しい修正を `v063.js` のようなPatch Runtimeとして重ねない
- App Version / Build / Schemaは `js/app/meta.js` を更新する
- 問題件数はManifestから算出する
- 保存Schemaを変える場合はMigration / Backup / Rollbackを先に設計する
- READMEは現在仕様を中心にし、Version履歴はCHANGELOGへ書く
- 一度直した重大Bugには可能な範囲でRegression TestとProject Learningを追加する
- Remote Diagnostics / Analytics / Cloud Providerを勝手にCore依存として追加しない
- AI生成Codeも既存仕様・Static / Unit / Browser Test・最終Commit Validationを通す

## 既知・未確認

### Not verified

- Windows実機のペンタブで長時間書いた場合の遅延
- 実機Firefoxで `pointerType=pen` と可変pressureが届くか
- v0.5系の旧ページ座標がすべての過去紙面でピクセル単位まで一致するか
- 大量ページを一度にPNG→ZIP化した場合の実機性能
- ブラウザごとのIndexedDB容量差
- Chromium実ブラウザでのRegression一式
- 開発診断JSONを長期間利用したときの実機Storage影響（120 Event上限あり）

これらはCI成功だけで確認済みとして扱いません。
