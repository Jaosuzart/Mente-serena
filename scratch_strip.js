const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const isJSFile = (filepath) => filepath.endsWith('.js');

walkDir('C:\\Users\\Cassio\\mente-serena\\src', (filepath) => {
  if (isJSFile(filepath)) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    let newContent = content.replace(/\/\*[\s\S]*?\*\//g, '');
    
    newContent = newContent.replace(/(?<!:)\/\/.*$/gm, '');
    
    newContent = newContent.replace(/^\s*[\r\n]+/gm, '\n');

    if (content !== newContent) {
      fs.writeFileSync(filepath, newContent, 'utf8');
      console.log('Removido de: ' + filepath);
    }
  }
});
