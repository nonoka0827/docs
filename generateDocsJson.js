const fs = require('fs');
const path = require('path');

// docs.jsonを読み込む
const docsJson = JSON.parse(fs.readFileSync('docs.json', 'utf-8'));

// ルート直下の.mdファイルを取得（README.mdなど除外）
const mdFiles = fs.readdirSync('.').filter(file =>
  file.endsWith('.md') &&
  !['README.md'].includes(file)
).map(file => path.basename(file, '.md'));

// 「Docs」タブの「Overview」グループを探してpagesを書き換え
const tabs = docsJson.navigation.tabs;
for (const tab of tabs) {
  if (tab.tab === 'Docs') {
    for (const group of tab.groups) {
      if (group.group === 'Overview') {
        group.pages = mdFiles;
      }
    }
  }
}

// docs.jsonを書き出し
fs.writeFileSync('docs.json', JSON.stringify(docsJson, null, 2));
console.log('docs.jsonのOverviewグループを自動更新しました');
