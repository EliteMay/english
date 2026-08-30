# English Worksheet Lab

**Version: v0.6.0**  
**Build: 20260830-8**  
**State Schema: 6 / Paper Schema: 6 / Analysis Schema: 2 / Submission Package: 3**

個人用の英語問題集サイトです。GitHub Pages上でPDFワークシートのように問題を並べ、ペンタブで英文・選択肢・回答欄へ直接書き込みます。

学習の基本フローは変えません。

**問題を選ぶ → 紙面へ直接解く → 左に問題用紙を固定して右で答え合わせ → 結果・復習 → 解いた紙ZIPをChatGPTへ渡す → 弱点分析JSONを戻す**

## v0.6.0で作り直した理由

v0.5系は機能追加を優先した結果、`practice.js` の上から別JSで関数を上書きし、さらに後続パッチを重ねる構成になっていました。またペン座標をページ全体に対して保存していたため、上の問題の高さが変わるだけで後ろの手書きがずれる問題が起きました。

v0.6.0では新機能より先に、**更新しても紙と手書きが壊れない土台**へ作り直しています。

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
11. 問題を開始した時点の紙面Revisionを保存し、後の教材更新で既存紙面を変形させない
12. 新しい手書きは問題単位の座標で保存する
13. 既存のv0.5系手書きデータを勝手に消さない
14. 未着手問題を0点扱いしない
15. 解いた紙面をChatGPTへZIPで渡せる
16. APIキー・個人データを公開GitHubへ自動送信しない
17. 破壊的操作にはバックアップ・復元手段を用意する
18. GitHub Pagesの相対パスを維持する

## 問題用紙とペン保存

### v0.6以降の新しい紙

手書きストロークはページ全体ではなく、**各問題の枠内を0〜1の相対座標**としてIndexedDBへ保存します。

```text
問6
┌──────────────────────┐
│ x=0.24 / y=0.61 の線 │
└──────────────────────┘
```

そのため問1〜5の高さが変わっても、問6の手書きは問6と一緒に動きます。

### 既存v0.5系データ

旧データのページ座標はそのまま捨てず、IndexedDBの`legacyInk`へ移行します。実際に解いた可能性が高いS/V系2セットについてはGit履歴から当時の問題定義を保存してあります。

- `data/legacy/foundation-sv-v051.json`
- `data/legacy/sv-phrase-boundary-v051.json`

新しい書き込みは問題単位方式、旧書き込みは互換レイヤーで表示します。

## Paper Revision

問題を開始した時点で、その問題セット全文を`paperSnapshots`へ保存します。

```text
attempt
 ├─ paperSnapshotId
 ├─ paperRevision
 └─ ink
```

後からGitHub上の問題文・回答欄・説明を変更しても、そのattemptは開始時の問題用紙を使い続けます。

「新しい紙」を選んだ時だけ最新教材で新しいattemptを作ります。

## 保存場所

### localStorage

軽いメタデータのみです。

```text
english-worksheet-lab-v6
english-worksheet-prefs-v2
english-worksheet-recovery-v2
```

### IndexedDB

容量が増えやすいデータを保存します。

```text
english-worksheet-lab-v6
├─ ink            問題単位の新しい手書き
├─ legacyInk      v0.5系ページ座標の手書き
├─ paperSnapshots 問題開始時の紙面
└─ archives       やり直す前のattempt
```

完全バックアップJSONではlocalStorageとIndexedDBの両方を書き出します。

## 画面構成

### 01 問題を選ぶ

- 15セット / 200問
- 分野・難易度・進捗フィルター
- 検索
- 続きから
- ChatGPT分析の推奨
- 新しい紙を開始

### 02 問題を解く

- PDF風の白い問題用紙
- 黒 / 赤 / 青 / 緑
- 蛍光マーカー
- 細 / 中 / 太
- 消しゴム
- Undo / Redo
- ページ消去
- 85 / 100 / 115 / 130%
- 集中モード
- 入力デバイス・筆圧表示
- ページ学習時間

問題用紙では解くために必要な情報だけを表示し、長い説明・正答・迷いタグは答え合わせ右側へ分離します。

### 答え合わせ

デスクトップでは:

- 左: 解いた問題用紙
- 右: 正答・解説・○△×・迷いタグ・メモ

左右を独立スクロールします。答え合わせへ移っても左の問題DOMは同じ問題スナップショットから同じマークアップで再生成し、Firefox E2Eで位置・高さ・幅が変わらないことを確認します。

### 03 結果・復習

- スコアと進捗率を分離
- 未着手を0点にしない
- 分野別の最新理解度
- 学習時間
- 履歴
- △・×復習

### 04 弱点・ChatGPT分析

提出範囲を選べます。

- **今回の問題だけ**（標準）
- 最近3回
- すべての現在紙

## ChatGPT提出ZIP v3

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

紙PNGを最優先にし、ストローク履歴・自己採点・迷い・その時点の問題用紙Revisionを補助情報として分析します。

## 教材ルール

教材方針の正本は`data/pedagogy.json`です。

- `skeleton`: 骨格読み
- `range`: 範囲問題
- `structure`: 構造分解

README・画面・ChatGPT依頼文へ同じルールをばらばらに直書きしない方針です。

## ファイル構成

```text
/
├─ index.html
├─ css/
│  └─ app-v060.css
├─ js/v060/
│  ├─ app.js
│  ├─ db.js
│  ├─ state.js
│  ├─ data.js
│  ├─ library.js
│  ├─ practice.js
│  ├─ ink.js
│  ├─ results.js
│  ├─ analysis.js
│  └─ export.js
├─ data/
│  ├─ pedagogy.json
│  ├─ curriculum.json
│  ├─ analysis-return.schema.json
│  ├─ legacy/
│  └─ packs/
├─ tests/
│  ├─ validate.mjs
│  └─ e2e.spec.mjs
├─ playwright.config.mjs
├─ package.json
├─ .github/workflows/validate.yml
├─ README.md
└─ 作業報告書.md
```

## 自動検証

GitHub Actionsで次を実行します。

### Static

- v0.6 JS構文
- JSON構文
- 15セット / 200問をmanifestから検証
- ID重複
- 問題type必須値
- curriculum参照
- pedagogy定義
- Paper Schema
- HTML参照切れ
- 旧v0.5パッチJSを実行時に読み込んでいないこと
- 問題単位ペン保存コード
- hardcodeされた旧14セット/188問診断が残っていないこと

### Firefox E2E

実際のFirefoxを起動して:

1. 問題を開く
2. 問2へ線を描く
3. 答え合わせへ移動
4. 問1〜3の`offsetTop / height / width`が変わっていないことを確認
5. 問題canvasが問題サイズに一致していることを確認
6. Runtime scriptがv0.6本体1本だけであることを確認

## GitHub Pages

```text
https://elitemay.github.io/english/
```

APIキー不要の静的HTML/CSS/JavaScript/JSONです。

## 既知・未確認

- Windows実機のペンタブで長時間書いた場合の遅延
- 実機Firefoxで`pointerType=pen`と可変pressureが届くか
- v0.5系の旧ページ座標が、すべての過去紙面でピクセル単位まで完全一致するか
- 大量ページを一度にPNG→ZIP化した時の実機性能
- ブラウザごとのIndexedDB上限差

未確認の内容を確認済みとして扱わないでください。
