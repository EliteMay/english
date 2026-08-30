# English Worksheet Lab

**Version: v0.5.3**  
**Build: 20260830-5**  
**Data Schema: 4 / Analysis Schema: 2 / Submission Package: 2**

個人用の英語問題集サイトです。GitHub Pages上で、PDFのワークシートのように複数問題を並べ、ペンタブで問題文へ直接書き込みます。

学習の流れは次の通りです。

**問題を選ぶ → 紙面へ直接解く → 左に問題・右に答えを出して自己採点 → 解いた紙をZIPでChatGPTへ渡す → 弱点分析JSONをサイトへ戻す**

## 目的

- 入力フォーム中心ではなく、紙へ直接書く感覚で解く
- 同じ型の簡単問題を大量反復しない
- 逐語訳より先に英文の骨格を取る
- S/V → O/C・5文型 → 動詞 → to/ing → 節 → 時制 → 語順 → 誤文修正 → 長文へ積み上げる
- 正誤だけでなく、丸・下線・括弧・矢印・消去・書き直し・時間も残す
- ChatGPT分析で見えた弱点を、次の問題・サイト改善へ反映する

## v0.5.3 — 「骨格S」と「S全体」を分離

実際の提出ZIPを分析したあと、学習目的と文法上の厳密な範囲を混同していた部分を修正しました。

### 3種類の問題モード

#### 1. 骨格読み

長文を読む第一段階です。

修飾を一旦後回しにして、**S側の中心と主節Vを先に取ります。**

例:

```text
Reading difficult sentences slowly helps me notice the structure.
```

最初は:

```text
Reading / helps
Sの核    V
```

まで見えればよいとします。

`difficult sentences` や `slowly` は後から戻ります。

ここでいう **骨格S / Sの核は読解用のラベル** であり、文法上の主語全体と同じ意味ではありません。

#### 2. 範囲問題

問題文に **「S全体」「範囲問題」** と書いてある場合だけ、文法上の主語として働く句・節を端まで確認します。

上の文なら:

```text
Reading difficult sentences slowly
```

全体が主語として働きます。

骨格読みで `slowly` を省いたこと自体は誤答扱いしません。

#### 3. 構造分解

S/V/O/C、文型、節などを厳密に分けます。

例:

```text
The student has been absent this week.
```

```text
S = The student
V = has been
C = absent
this week = 修飾
```

`absent` をVへ含めません。

また:

```text
has already been checked
```

では `already` は副詞なので、Vグループは:

```text
has been checked
```

です。

### UI改善

問題用紙と答え合わせ欄に:

- 骨格読み
- 範囲問題
- 構造分解

のバッジを表示します。

答え合わせ右ペインには **「← 問Nを見る」** を追加し、押すと左の問題用紙の該当問題へ移動します。

### ChatGPT分析ルールも修正

提出ZIPの依頼文へ以下を追加しています。

- 骨格問題で省いた修飾語を弱点扱いしない
- 範囲問題だけS全体の端を評価する
- Vから副詞を除く
- SVCではCをVへ含めない
- 骨格Sと文法上のS全体を区別する

## 現在の問題集

**15セット / 200問**

1. S/Vを本当に見抜く
2. 補強｜骨格SとVグループを分ける
3. O/C・5文型を関係で判定
4. 同じ動詞でも構造が変わる
5. to / ing をイメージで理解
6. 前置詞を核イメージで考える
7. 前置詞の核イメージを広げる
8. 修飾を外して節を分ける
9. 時制を時間の見え方で選ぶ
10. 語順から英文の骨格を組み立てる
11. 誤文修正｜なぜ不自然かを見抜く
12. 構造トラップ｜Vっぽい形を全部Vにしない
13. 総合診断｜どこで判断が崩れるか
14. 長文を骨格から読む
15. 段落読解｜骨格・指示語・論理を追う

## 画面構成

### 01 問題を選ぶ

- 15セット / 200問
- 分野・難易度・進捗で絞り込み
- フリーワード検索
- 続きから
- ChatGPT分析からの推奨問題
- △・×から作るミス復習
- 5段階カリキュラム

### 02 問題を解く

A4風の問題用紙へ常時ペン入力します。

- 黒 / 赤 / 青 / 緑
- 蛍光マーカー
- 細 / 中 / 太
- 筆圧
- 消しゴム
- Undo / Redo
- ページ消去 + Undo
- 85 / 100 / 115 / 130%表示
- 集中モード
- ページ学習時間
- 途中状態保存

#### 答え合わせ

デスクトップでは:

- 左: 実際に解いた問題用紙
- 右: 正答・○△×・迷いタグ・メモ

を同時表示します。

左右は独立スクロールです。右の「問Nを見る」で左の該当問題へ移動できます。

1024px未満では上下配置へ戻します。

### 03 結果・復習

- ○ / △ / ×
- 未着手は0点扱いしない
- 分野別最新理解度
- 学習時間
- 履歴
- ミス復習

### 04 弱点・ChatGPT分析

ChatGPT分析JSONから:

- 弱点
- 原因
- 根拠
- 確信度
- 分野別評価
- 読み方の癖
- 強み
- 次の学習対象
- 推奨問題
- サイト改善案
- 分析履歴

を表示します。

## ChatGPT提出ZIP

```text
english_submission_YYYY-MM-DD.zip
├─ papers/
│  └─ 実際に解いた問題用紙.png
├─ manifest.json
├─ paper-index.json
├─ learning-data.json
├─ ink-history.json
├─ questions.json
├─ diagnostics.json
├─ archived-attempts-summary.json
├─ analysis-return.schema.json
└─ ChatGPTに見てほしいこと.txt
```

分析優先順:

1. `papers/`
2. `ink-history.json`
3. `paper-index.json`
4. `learning-data.json`
5. `questions.json`

## 保存

学習データ:

```text
english-worksheet-lab-v4
```

表示設定:

```text
english-worksheet-prefs-v1
```

復元スナップショット:

```text
english-worksheet-recovery-v1
```

データ管理からバックアップ・復元・整合性診断・安全なリセットができます。

## GitHub Pages

```text
https://elitemay.github.io/english/
```

静的HTML/CSS/JavaScript/JSONのみで動作します。APIキーは不要です。

## ファイル構成

```text
/
├─ .github/workflows/validate.yml
├─ index.html
├─ css/
│  ├─ styles.css
│  ├─ paper-v041.css
│  ├─ product-v050.css
│  ├─ review-split-v052.css
│  └─ pedagogy-v053.css
├─ js/
│  ├─ version.js
│  ├─ core.js
│  ├─ practice.js
│  ├─ results-analysis.js
│  ├─ ink.js
│  ├─ export-zip.js
│  ├─ results-v050.js
│  ├─ export-v050.js
│  ├─ product-v050.js
│  ├─ pedagogy-v053.js
│  └─ bootstrap.js
├─ data/
│  ├─ curriculum.json
│  ├─ analysis-return.schema.json
│  └─ packs/
├─ tests/validate.mjs
├─ README.md
└─ 作業報告書.md
```

## 自動検証

GitHub Actionsでpush / PRごとに確認します。

- JavaScript構文
- JSON構文
- 15セット / 200問
- ID重複
- type別必須データ
- curriculum参照
- HTML参照切れ
- v0.5.3の主要JS/CSS
- `studyMode` の値
- `sv09`: V=`has been checked`
- `pb03`: 骨格S=`Reading` を許容
- `pb08`: V=`has been`, C=`absent`
- 同一英文の過剰反復

## 崩してはいけない仕様

1. サイトの中心は紙の問題集
2. 複数問題を1ページに並べる
3. ペンタブで直接書く
4. 入力フォーム中心へ戻さない
5. 同型問題で水増ししない
6. 基礎でも説明を幼くしない
7. 骨格読みでは修飾を後回しにする
8. 骨格Sと文法上のS全体を混同しない
9. 範囲問題だけS全体を端まで取る
10. Vは動詞グループで、副詞・O・Cを混ぜない
11. 長文は主節・節・修飾・論理を見る
12. 解いた紙面をChatGPTへ渡せる
13. 消した線を含む途中経過を残す
14. ChatGPT分析を次の問題へ反映する
15. 未着手を誤答扱いしない
16. 学習データを公開GitHubへ自動送信しない
17. 破壊的操作には復旧手段を用意する
18. GitHub Pagesの相対パスを維持する
19. 答え合わせでは問題用紙と正答を同時に見られる

## 未確認

- Windows実機ペンタブで長時間使用した際の筆圧・遅延
- Firefoxで大量ページをPNG→ZIP化した場合の性能
- ブラウザごとの保存容量差
- v0.5.3の「問Nを見る」の実画面でのスクロール感

未確認項目を確認済みとして扱わないでください。
