const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/alert\(/g, 'customAlert(');
html = html.replace(/confirm\(/g, 'customConfirm(');

// But wait! customConfirm doesn't return a boolean, it uses a callback!
// Doing a regex replace on confirm() will break things like `if (!confirm("...")) return;`

fs.writeFileSync('index.html', html);
