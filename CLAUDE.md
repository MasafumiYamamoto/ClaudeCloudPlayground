# CLAUDE.md

素の HTML / CSS / JavaScript で作る Todo アプリ。
**ビルドツールと外部ライブラリは使わない**（npm 依存ゼロ、`node_modules` は作らない）。

## ファイル構成

```
.
├── index.html              画面のマークアップ（<template> で一覧の行を定義）
├── style.css               スタイル。デザイントークンは :root のカスタムプロパティ
├── app.js                  DOM 操作・状態保持・イベント処理（ブラウザ専用）
├── src/
│   └── todo.js             Todo のロジック（純粋関数のみ。DOM に触れない）
├── test/
│   └── todo.test.js        src/todo.js のテスト（node:test）
├── package.json            スクリプト定義のみ。dependencies は追加しない
└── .github/workflows/
    └── test.yml            push / PR でテストを実行
```

### レイヤーの分け方（最重要）

| ファイル | 役割 | 触ってよいもの |
| --- | --- | --- |
| `src/todo.js` | ロジック | 引数だけ。`document`・`window`・`localStorage`・`Date.now()`・`Math.random()` は禁止 |
| `app.js` | 配線 | DOM、`localStorage`、id の採番。ロジックは書かず `src/todo.js` を呼ぶ |

- **新しいロジックは必ず `src/todo.js` に純粋関数として追加し、テストを書く。**
  `app.js` に `if` が増えてきたら、それはロジックなので切り出すサイン。
- `src/todo.js` の関数は引数を変更せず、常に**新しい配列・オブジェクト**を返す
  （`filter` / `map` / スプレッド構文を使う。`push` / `splice` / 代入は使わない）。
- id の採番や現在時刻のような非決定的な値は `app.js` 側で作り、
  `src/todo.js` には**引数として渡す**（テストを決定的にするため）。

### Todo の形

```js
{ id: string, text: string, done: boolean }
```

この形を変えるときは `src/todo.js`・`app.js`・`test/todo.test.js`、
および `app.js` の `loadTodos()` にある localStorage の検証を合わせて更新する。

## テストの実行方法

```sh
npm test        # = node --test （test/ 以下の *.test.js を自動で探す）
node --test     # npm を介さず直接実行する場合
node --test --watch    # 変更を監視しながら実行
node --test test/todo.test.js          # 1 ファイルだけ実行
node --test --test-name-pattern="addTodo"   # 名前で絞り込み
```

- テストランナーは **Node.js 標準の `node:test`** と `node:assert/strict` のみ。
  Jest / Vitest などのテストフレームワークは導入しない。
- Node.js は 20 以上（CI では 20.x と 22.x で実行）。
- `app.js` は DOM に依存するためテスト対象外。テストできる形にしたいロジックは
  `src/todo.js` に移す。
- 追加・変更のたびに `npm test` を通してからコミットする。

### テストの書き方

- `describe()` で関数ごとにまとめ、`test()` は「何を保証するか」を日本語 1 文で書く。
- 各関数について最低限このあたりを確認する：
  正常系 / 空の配列 / 存在しない id / **元の配列を変更していないこと** / エラー条件。
- 共有のテストデータは `Object.freeze` して、うっかり変更したら壊れるようにする。

## 動作確認（ブラウザ）

ES Modules を使っているため `file://` では動かない。HTTP で配信すること。

```sh
python3 -m http.server 8000    # → http://localhost:8000
```

## コーディング規約

### 共通

- インデントは**スペース 2**、文末のセミコロンあり、文字列は**シングルクォート**。
- 行の長さは 80 文字を目安にする。
- コメントは「なぜそうしたか」を書く。コードを読めば分かることは書かない。
- コメント・UI 文言・コミットメッセージは日本語、識別子は英語。

### JavaScript

- ES Modules（`import` / `export`）を使う。`var` は使わず、再代入しないものは `const`。
- `export` する関数には JSDoc（`@param` / `@returns` / `@throws`）を付ける。
- 比較は `===` / `!==`。`null` チェックは `x === null` と明示する。
- 早期 return でネストを浅く保つ。
- `src/todo.js` では不正な引数を**例外で弾く**（呼び出し側のバグを早く見つけるため）。
- 命名：関数は動詞から（`addTodo`, `countActive`）、真偽値は `is` / `has` / `done` など。

### HTML / CSS

- クラス名は BEM 風（`block__element--modifier`）。
- CSS の色・余白・角丸は `:root` のカスタムプロパティを使い、値の直書きをしない。
  ダークモードは `prefers-color-scheme` でトークンを差し替える（個別の指定を増やさない）。
- ID は JavaScript から掴む要素にだけ付け、スタイルには使わない。
- ユーザー入力の描画は必ず `textContent`（`innerHTML` は使わない）。
- フォームの入力欄には `<label>`、アイコンのみのボタンには `aria-label` を付ける。
  状態を持つボタンは `aria-pressed` などで状態を伝える。

## CI

`.github/workflows/test.yml` が push と PR で `npm test` を実行する（Node 20.x / 22.x）。
npm 依存が無いので `npm install` のステップは無い。
依存を足したくなった場合は、まず標準機能で実現できないかを検討する。
