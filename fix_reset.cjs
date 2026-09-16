const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The start wasn't replaced, but the end was! 
// Let's replace the start properly using a loose regex!
html = html.replace(
    /if \(!confirm\("Deseja realmente zerar as estatísticas[\s\S]*?appData\.streak = 0;/,
    `customConfirm("Deseja realmente zerar as estatísticas de desempenho deste perfil (Aproveitamento Geral, Sequência/Streak, Horas Líquidas e Metas Validadas)? Suas matérias e assuntos cadastrados NÃO serão apagados.", () => {\n            appData.streak = 0;`
);

fs.writeFileSync('index.html', html);
