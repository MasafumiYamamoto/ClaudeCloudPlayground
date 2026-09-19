# ClaudeCloudPlayground

ClaudeCloudの勉強よう

素の HTML / CSS / JavaScript で作る Todo アプリ（ビルドツール・外部ライブラリなし）。

## 公開ページ（GitHub Pages）

`main` への push で `.github/workflows/pages.yml` がテストを実行し、
リポジトリの中身をそのまま GitHub Pages へ配信する。

初回だけリポジトリ側の設定が必要:

1. GitHub の **Settings → Pages** を開く
2. **Build and deployment → Source** を **GitHub Actions** にする

以降は `main` が更新されるたびに自動で配信される
（**Actions → pages → Run workflow** で手動実行も可能）。
公開 URL は `https://<ユーザー名>.github.io/ClaudeCloudPlayground/`。

アセットの参照はすべて相対パス（`style.css` / `app.js`）なので、
サブパス配信でもそのまま動く。

## ローカルで動かす

ES Modules を使っているため `file://` では動かない。HTTP で配信すること。

```sh
python3 -m http.server 8000    # → http://localhost:8000
```

## テスト

```sh
npm test    # = node --test
```
