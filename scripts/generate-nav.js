const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filelist);
    } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

const files = walk('docs');
const groups = {};

files.forEach(filepath => {
  const rel = path.relative('docs', filepath).replace(/\\/g, '/');
  const parts = rel.split('/');
  const group = parts.length > 1 ? parts[0] : 'root';
  const page = rel.replace(/\.(md|mdx)$/, '');
  if (!groups[group]) groups[group] = [];
  groups[group].push(page);
});

const navigation = {
  groups: Object.entries(groups).map(([group, pages]) => ({
    group,
    pages
  }))
};

const docsJson = JSON.parse(fs.readFileSync('docs.json', 'utf-8'));
docsJson.navigation = navigation;
fs.writeFileSync('docs.json', JSON.stringify(docsJson, null, 2));
console.log('docs.jsonのnavigationを自動生成しました');
