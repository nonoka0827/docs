// scripts/generate-nav.js
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..'); // プロジェクトルートのパス
const configPath = path.join(projectRoot, 'docs.json'); // 設定ファイルのパス
const allowedExtensions = ['.md', '.mdx'];

// グループ名とディレクトリ名のマッピングを定義する方が確実かもしれない
// ここでは、特定のグループ名に対するディレクトリ名を返すように変更
function getDirectoryForGroup(groupName) {
  if (groupName === "共有ドキュメント") {
    return "essentials";
  } else if (groupName === "Api Reference") { // 他のグループも同様に追加可能
    return "api-reference";
  } else {
    // デフォルト: 英語名を小文字化・ハイフン化 (必要なら残す)
    // return groupName.toLowerCase().replace(/\s+/g, '-');
    // 今回はこのデフォルト変換は使わないかもしれない
    return null; // 不明なグループ名は null を返す
  }
}

// ファイル名をページパスに変換する関数 (例: introduction.md -> introduction)
function fileNameToPagePath(filePath, baseDir) {
  const relativePath = path.relative(baseDir, filePath);
  const ext = path.extname(relativePath);
  return relativePath.replace(ext, '').replace(/\\/g, '/');
}

try {
  // 既存の設定ファイルを読み込む
  let config = {};
  if (!fs.existsSync(configPath)) {
    console.error(`Error: ${configPath} not found.`);
    process.exit(1);
  }

  const rawConfig = fs.readFileSync(configPath, 'utf-8');
  try {
    config = JSON.parse(rawConfig);
  } catch (e) {
    console.error(`Error parsing ${configPath}:`, e);
    process.exit(1);
  }

  // navigationオブジェクトとtabs配列の存在を確認
  if (!config.navigation || !Array.isArray(config.navigation.tabs)) {
    console.error(`Error: Invalid structure in ${configPath}. Missing 'navigation' or 'navigation.tabs'.`);
    process.exit(1);
  }

  // 各タブ、各グループのpagesを更新
  config.navigation.tabs.forEach(tab => {
    if (tab.groups && Array.isArray(tab.groups)) {
      tab.groups.forEach(group => {
        const groupName = group.group;
        let pages = [];

        const groupDirName = getDirectoryForGroup(groupName); // 新しい関数でディレクトリ名を取得

        if (groupDirName) { // ディレクトリ名が取得できた場合のみ処理
          const groupDirPath = path.join(projectRoot, groupDirName);

          if (fs.existsSync(groupDirPath) && fs.lstatSync(groupDirPath).isDirectory()) {
            const dirEntries = fs.readdirSync(groupDirPath, { withFileTypes: true });
            dirEntries.forEach(entry => {
              if (entry.isFile() && allowedExtensions.includes(path.extname(entry.name))) {
                const pagePath = path.join(groupDirName, entry.name.replace(path.extname(entry.name), '')).replace(/\\/g, '/');
                pages.push(pagePath);
              }
            });
            console.log(`Updated pages for group "${groupName}". Found ${pages.length} files in ${groupDirPath}.`);
          } else {
            console.warn(`Warning: Directory not found for group "${groupName}" (expected: ${groupDirPath}). Skipping update for this group.`);
          }
        } else {
           // groupDirName が null の場合 (getDirectoryForGroup でマッピングが見つからない場合)
           console.warn(`Warning: No directory mapping found for group "${groupName}". Skipping update for this group.`);
           // 既存の pages を維持するか、空にするか？ ここでは維持 (何もしない)
           pages = group.pages || []; // 既存のページがあれば維持、なければ空
        }

        // pages をソートする場合
        pages.sort(); // ファイル名順にソートする例
        group.pages = pages;
      });
    }
  });

  // 更新した設定をファイルに書き込む
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(`Successfully updated navigation pages in ${configPath}`);


