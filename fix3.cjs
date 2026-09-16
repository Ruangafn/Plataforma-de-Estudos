const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// I need to properly close the customConfirm for removeSubject!
// The current state of removeSubject in index.html is probably missing `});`!
html = html.replace(
    /saveData\(\);\s+renderAll\(\);\s+\}\s+\}/g,
    `saveData();\n                renderAll();\n            });\n        }`
);

fs.writeFileSync('index.html', html);
