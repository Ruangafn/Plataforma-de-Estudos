const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
let allScripts = '';
for(let match of scriptMatches) {
   allScripts += match[1] + '\n';
}
fs.writeFileSync('script_final.cjs', allScripts);
