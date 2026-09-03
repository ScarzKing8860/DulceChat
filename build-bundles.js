const fs = require('fs');
const path = require('path');

const root = process.cwd();
const cssFiles = ['style.css', 'main.css', 'support.css', 'browser.css', 'dashboard.css', 'profile.css', 'settings.css'];
const jsFiles = ['script.js', 'stript.js', 'support.js', 'browser.js', 'dashboard.js', 'settings.js', 'profile.js'];

function buildBundle(fileList, banner, extension) {
  const parts = [];
  for (const name of fileList) {
    const filePath = path.join(root, name);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8').replace(/\s*$/g, '');
      parts.push(`/* --- ${name} --- */\n${content}`);
    }
  }
  const output = `${banner}\n\n${parts.join('\n\n')}\n`;
  fs.writeFileSync(path.join(root, `bundle.${extension}`), output, 'utf8');
}

buildBundle(cssFiles, '/* DulceChat bundled CSS */', 'css');
buildBundle(jsFiles, '// DulceChat bundled JavaScript', 'js');

for (const name of [...cssFiles, ...jsFiles]) {
  const filePath = path.join(root, name);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

console.log('Created bundle.css and bundle.js');
console.log('Removed original CSS and JS files');
