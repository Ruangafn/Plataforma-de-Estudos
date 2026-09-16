const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
    /customAlert\(\`Ciclo gerado com sucesso! Foram planejados \$\{allDays\.length\} dias de estudo com respeito aos seus limites diários\.\`\);\s+\}/g,
    `customAlert(\`Ciclo gerado com sucesso! Foram planejados \${allDays.length} dias de estudo com respeito aos seus limites diários.\`);\n            };\n            if(appData.cycle && appData.cycle.active) customConfirm("Atenção: Isso gerará um NOVO cronograma completo de estudos substituindo o atual. Deseja prosseguir?", proceed);\n            else proceed();\n        }`
);

fs.writeFileSync('index.html', html);
