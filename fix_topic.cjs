const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
    /renderCustomizeList\(\);\s+\}\s+\/\/ --- DRAG AND DROP REORDERING ---/g,
    `renderCustomizeList();\n            });\n        }\n\n        // --- DRAG AND DROP REORDERING ---`
);

fs.writeFileSync('index.html', html);
