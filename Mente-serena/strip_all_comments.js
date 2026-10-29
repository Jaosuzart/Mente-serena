const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('C:\\Users\\Cassio\\mente-serena\\src', (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let newContent = content;

  if (filepath.endsWith('.js')) {
    newContent = newContent.replace(/\/\*[\s\S]*?\*\//g, '');
    newContent = newContent.replace(/(?<!:)\/\/.*$/gm, '');
  } else if (filepath.endsWith('.css')) {
    newContent = newContent.replace(/\/\*[\s\S]*?\*\//g, '');
  } else if (filepath.endsWith('.html')) {
    newContent = newContent.replace(/<!--[\s\S]*?-->/g, '');
  }

  newContent = newContent.replace(/^\s*[\r\n]+/gm, '\n');

  if (content !== newContent) {
    fs.writeFileSync(filepath, newContent, 'utf8');
    console.log('Limpo: ' + filepath);
  }
});

