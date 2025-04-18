// scripts/generate-nav.js
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs'); // 'docs' ディレクトリのパス
const configPath = path.join(__dirname, '..', 'docs.json'); // 設定ファイルのパスを修正
const allowedExtensions = ['.md', '.mdx'];

// グループ名をディレクトリ名に変換する関数 (例: "Get Started" -> "get-started")
function groupNameToDirName(groupName) {
  return groupName.toLowerCase().replace(/\s+/g, '-');
}

// ファイル名をページパスに変換する関数 (例: introduction.md -> introduction)
function fileNameToPagePath(filePath, baseDir) {
  const relativePath = path.relative(baseDir, filePath);
  const ext = path.extname(relativePath);
  // Windowsのパス区切り文字\を/に置換
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
        const groupDirName = groupNameToDirName(group.group);
        const groupDirPath = path.join(docsDir, groupDirName); // docs/group-name を想定

        if (fs.existsSync(groupDirPath) && fs.lstatSync(groupDirPath).isDirectory()) {
          const pages = [];
          const entries = fs.readdirSync(groupDirPath, { withFileTypes: true });

          entries.forEach(entry => {
            if (entry.isFile()) {
              const ext = path.extname(entry.name);
              if (allowedExtensions.includes(ext)) {
                 // グループディレクトリからの相対パスではなく、docsディレクトリからの相対パスを生成
                 // 例: "essentials/markdown"
                const pagePath = path.join(groupDirName, entry.name);
                pages.push(fileNameToPagePath(pagePath, '')); // '' を基準にする
              }
            }
            // 必要であればサブディレクトリ内のファイルも再帰的に探索
            // else if (entry.isDirectory()) { ... }
          });

          // pages をファイル名順などでソートすることも可能
          // pages.sort();

          group.pages = pages; // pages 配列を上書き
          console.log(`Updated pages for group "${group.group}" in tab "${tab.tab || 'Default'}". Found ${pages.length} files.`);
        } else {
          console.warn(`Warning: Directory not found for group "${group.group}" (expected: ${groupDirPath}). Skipping update for this group.`);
          // 存在しないディレクトリに対応するグループのpagesをどう扱うか？
          // ここでは既存のpagesを維持する（何もしない）
          // group.pages = []; // もしクリアしたいならコメントアウトを外す
        }
      });
    }
  });

  // 更新した設定をファイルに書き込む (元のフォーマットを維持するためインデントは2スペース)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

  console.log(`Successfully updated navigation pages in ${configPath}`);

} catch (error) {
  console.error('Error generating navigation:', error);
  process.exit(1); // エラーで終了
}
