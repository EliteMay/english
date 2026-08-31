# PROJECT LEARNINGS

このファイルは、English Worksheet Labで発生した**再発防止価値の高い失敗**と、今後も維持したい**成功パターン**の正本です。

`作業報告書.md` は「今回何を変更したか」、このファイルは「このProjectから何を学んだか」を記録します。

## Failure

### PL-F-001 ページ全体座標で保存した手書きが教材更新でずれた

- Date: 2026-08-30
- Status: resolved / monitoring legacy data
- Severity: critical
- Cost: very-high
- Symptom: 答え合わせや問題文更新後、手書きのS/V・下線・丸が別の回答欄や別問題へずれて表示された。
- Expected: 問題の高さや上部UIが変わっても、手書きは書いた対象問題と一緒に移動する。
- Actual: 1ページCanvasの0〜1座標だったため、上の問題の高さ変更が後続問題すべてへ影響した。
- Trigger / Reproduction: 問題1の回答欄数・説明・高さを変更した後、既存attemptを答え合わせで開く。
- Root Cause: 永続手書きをPaper全体のgeometryへ結びつけ、対象Questionとの意味的なAnchorを保存していなかった。
- Final Fix: v0.6で新規手書きをQuestion-local 0〜1座標へ変更。問題開始時のPaper Snapshot / Revisionを保存し、v0.5系はlegacyInkとして隔離。
- Affected files / systems: `js/app/ink.js`, `js/app/db.js`, `js/app/state.js`, `data/legacy/`, Paper renderer
- Detection method: Firefox E2E + ユーザー実画面
- Regression Guard: `tests/e2e.spec.mjs` の answer-check geometry test、Static validatorのquestion-local ink確認
- Prevention: 永続座標は画面全体ではなく対象Object内の相対座標で保存し、後から意味が変わる表示DataはSnapshotを持つ。
- Related Issue / PR / Commit: v0.6.0 refactor
- Guide candidate: yes
- Guide note: `web-project-guide` F-003 / S-006 / AP-006へ還元済み。

---

### PL-F-002 Version別Patch Runtimeを重ねて修正同士が干渉した

- Date: 2026-08-30
- Status: resolved
- Severity: critical
- Cost: very-high
- Symptom: `practice-v050.js`、`pedagogy-v053.js`、`review-geometry-v054.js`、`paper-schema-v055.js`等が既存関数を順番に包み、修正後に別Layerが再びDOMや挙動を変更した。
- Expected: 1機能の正式実装が1か所にあり、変更の責務と最終Rendererが分かる。
- Actual: VersionごとのPatchとDOM後付けが恒久Runtime化していた。
- Trigger / Reproduction: 既存Rendererへ新しいUI/geometry修正を追加するたびに上書きLayerを増やす。
- Root Cause: 緊急修正を正式Moduleへ統合せず、Version名付きFileを実行時に残し続けた。
- Final Fix: v0.6でRuntimeを `js/app/` へ統合し、Version / Buildは `js/app/meta.js` に分離。MutationObserverによる自前DOM後付けも正式Rendererへ統合。
- Affected files / systems: Runtime全体、`index.html`, `js/app/*`, CSS
- Detection method: Architecture review / Static validator
- Regression Guard: `tests/validate.mjs` でVersioned Runtime pathとMutationObserver再混入を検出
- Prevention: Patchは一時的に限定し、完成前に正式Runtimeへ統合する。Runtime pathへVersion番号を恒久化しない。
- Related Issue / PR / Commit: v0.6.0 / v0.6.2 refactor
- Guide candidate: yes
- Guide note: `web-project-guide` F-001 / F-017 / S-021 / AP-001 / AP-024へ還元済み。

---

### PL-F-003 答え合わせ2Paneが固定幅紙面に押されて横overflowした

- Date: 2026-08-30
- Status: resolved
- Severity: high
- Cost: high
- Symptom: 答え合わせで右側へスクロールすると左の問題用紙がほぼ消え、保存ボタンが回答カードへ重なった。
- Expected: 左に解いた紙、右に正答を同時表示し、左右だけを独立スクロールできる。
- Actual: 950px固定紙面が親Paneを押し広げ、ページ全体に横overflowが発生。Footerも2Pane外で浮いた。
- Trigger / Reproduction: Desktop幅で答え合わせへ入り、右回答をスクロールする。
- Root Cause: 固定幅Paperを2Paneへ入れる際の縮小戦略とFixed/Stickyの責務を後付けした。
- Final Fix: 紙内部layoutを変えずPaper全体をPane幅へ等倍率縮小。左右独立scroll。採点保存ActionをReview pane自身へ移動。
- Affected files / systems: `css/review.css`, `js/app/review-layout.js`, `js/app/practice.js`
- Detection method: Firefox E2E + ユーザー実画面
- Regression Guard: Page overflow、2Pane幅、低い縦解像度、Footer重なりをE2Eで検査
- Prevention: 固定幅Contentを比較Paneへ入れる場合、ReflowではなくScale / Local scroll戦略を先に決める。
- Related Issue / PR / Commit: v0.6.1
- Guide candidate: yes
- Guide note: `web-project-guide` F-006 / F-007 / F-012へ還元済み。

---

### PL-F-004 「骨格読み」と「文法上のS全体」を採点基準で混同した

- Date: 2026-08-30
- Status: resolved / content review continues
- Severity: high
- Cost: medium
- Symptom: `Reading difficult sentences slowly ...` で、骨格を取る練習なのに `slowly` をS範囲へ含めなかったことを弱点・減点として扱った。
- Expected: 骨格読みは読解に必要な中心を先に取り、範囲問題だけ文法上の端まで評価する。
- Actual: 「文法上の構成要素全体」と「最初に読むための核」が同じSラベルで扱われた。
- Trigger / Reproduction: 骨格問題の回答を、完全な句範囲の基準で分析・採点する。
- Root Cause: 教材ルールのSource of Truthがなく、問題文・解説・分析指示で定義が揺れた。
- Final Fix: `data/pedagogy.json` を正本にして `skeleton / range / structure` を分離。問題ごとにstudyModeを持てる構成へ変更。
- Affected files / systems: `data/pedagogy.json`, question data, ChatGPT分析指示, review
- Detection method: 実際の学習ZIPを人間とChatGPTで再確認
- Regression Guard: Static validatorでstudyModeとpedagogy modesの整合を確認
- Prevention: 学習補助用の「核」と文法用語を同一視しない。採点対象は問題modeから決める。
- Related Issue / PR / Commit: v0.5.3以降
- Guide candidate: no
- Guide note: 英語教材固有ルールとしてProject内に保持する。

---

## Success

### PL-S-001 Paper Snapshot + Question-local Ink

- Date: 2026-08-30
- Goal / Problem: 教材を改善し続けても、既に解いた紙と手書きを壊さない。
- Adopted Pattern: Attempt開始時Paper Snapshot + Question単位のnormalized coordinates + Legacy isolation。
- Why it worked: 「教材の現在値」と「解いた当時の紙」と「手書き座標」を分離でき、後から問題データを更新しても過去attemptの意味を維持できる。
- Trade-off: IndexedDB Store、Migration、Legacy rendererが必要になり実装量は増える。
- Reuse when: Canvas/annotationを後から更新される教材・画像・Documentへ紐づけるProject。
- Avoid when: 完全固定Canvasでlayoutが将来も変わらない単発Tool。
- Related files / tests: `js/app/state.js`, `js/app/db.js`, `js/app/ink.js`, `tests/e2e.spec.mjs`
- Guide candidate: yes
- Guide note: GuideのSnapshot / Object-local coordinatesへ反映済み。

---

### PL-S-002 解いた紙を主データにするChatGPT Handoff

- Date: 2026-08-30
- Goal / Problem: 最終Scoreだけでは「どこで迷い、どう書き直したか」をChatGPTが分析できない。
- Adopted Pattern: `papers/*.png` を主データにし、Pen履歴・自己採点・問題Data・Paper Revisionを補助JSONとしてZIP化。
- Why it worked: 手書きの括弧・下線・書き直しと構造化Dataを同時に見られ、弱点の原因をScore以上に具体化できた。
- Trade-off: PNG生成とZIP容量が増え、Binaryが必要なので完全なRemote compact diagnosticsだけには置き換えられない。
- Reuse when: 人間の書き込み・視覚的作業過程そのものがAI分析のEvidenceになるProject。
- Avoid when: Text/JSONだけで十分に再現できる診断。
- Related files / tests: `js/app/export.js`, analysis return schema, paper export
- Guide candidate: yes
- Guide note: AI-HANDOFFのFeedback Package / Binary handoff例として利用可能。

---

### PL-S-003 Static + Firefox E2Eを分けて使う

- Date: 2026-08-30
- Goal / Problem: JSON/JSが正常でも、Paper geometryや2Pane overflowのような実ブラウザBugを検出したい。
- Adopted Pattern: Static validatorでData/Path/Architecture、Firefox Playwrightで主要UI geometryを検証。
- Why it worked: 各Testの得意分野を分けられ、実際に過去発生したCanvasずれ・overflowをRegression Caseにできた。
- Trade-off: Firefox installとE2E maintenance時間が増える。
- Reuse when: Canvas、固定幅Paper、複数Pane、Browser API等を使うInteractive Web Tool。
- Avoid when: Runtime状態のない単純Static page。
- Related files / tests: `.github/workflows/validate.yml`, `tests/validate.mjs`, `tests/e2e.spec.mjs`
- Guide candidate: yes
- Guide note: Guide S-013 / F-012へ反映済み。

---

## Guide Feedback Queue

| ID | Type | Summary | Evidence | Next action |
|---|---|---|---|---|
| PL-S-002 | success | Binaryが思考過程そのものの場合、Remote compact diagnosticsでZIPを完全廃止しない | 実際の学習PNG + pen history分析 | AI-HANDOFF / Remote DiagnosticsのBinary例として継続観察 |
