const fs = require('fs');
const path = require('path');

// docs.jsonのテンプレート（必要に応じてカスタマイズ）
const docsJsonTemplate = {
  "$schema": "https://mintlify.com/docs.json",
  "theme": "mint",
  "name": "Auto Generated Docs",
  "navigation": {
    "pages": []
  }
};

// ルート直下の.mdファイルを取得
const mdFiles = fs.readdirSync('.').filter(file => file.endsWith('.md'));

// navigation.pagesにファイル名（拡張子なし）を追加
docsJsonTemplate.navigation.pages = mdFiles.map(file => path.basename(file, '.md'));

// docs.jsonを書き出し
fs.writeFileSync('docs.json', JSON.stringify(docsJsonTemplate, null, 2));
console.log('docs.jsonを自動生成しました');
