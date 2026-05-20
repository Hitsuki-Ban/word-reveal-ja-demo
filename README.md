# Typewriter Preview

日本語 RPG / ビジュアルノベル向けのタイプライター演出プレビューです。

## 構成

- `index.html`: 画面構造
- `styles.css`: レイアウト、VN 風プレビュー、レスポンシブ表示
- `app-core.js`: 分割、ポーズ、HTML エスケープ、時間見積もり
- `app.js`: DOM 操作と再生制御
- `assets/portrait-placeholder.png`: 中性の話者プレースホルダー
- `tests/app-core.test.js`: コアロジックの Node.js テスト

## ローカル確認

```bash
npm test
python -m http.server 4173 --bind 127.0.0.1
```

GitHub Pages でそのまま配信できます。
