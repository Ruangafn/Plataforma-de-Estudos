const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetStr = `bonus: stalenessBonus,`;
const replacementStr = `bonus: stalenessBonus + perfBonus,`;

html = html.replace(targetStr, replacementStr);

fs.writeFileSync('index.html', html);
