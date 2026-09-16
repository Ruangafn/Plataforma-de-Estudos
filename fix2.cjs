const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
    /customAlert\("Todos os dados foram excluídos e o sistema foi restaurado para o padrão inicial\."\);\s+\}/g,
    `customAlert("Todos os dados foram excluídos e o sistema foi restaurado para o padrão inicial.");\n            });\n        }`
);

fs.writeFileSync('index.html', html);
