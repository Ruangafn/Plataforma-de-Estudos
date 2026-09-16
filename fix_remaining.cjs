const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix deleteCurrentProfile
html = html.replace(
    /if \(!confirm\(\`Atenção: Tem certeza de que deseja excluir permanentemente o perfil[\s\S]*?try \{/g,
    `customConfirm(\`Atenção: Tem certeza de que deseja excluir permanentemente o perfil "\${currentProfileKey}" e todo o seu planejamento?\`, () => {\n            try {`
);

// Fix deleteCurrentCycle
html = html.replace(
    /if \(!confirm\("Tem certeza que deseja apagar o ciclo atual[\s\S]*?appData\.cycle\.active = false;/g,
    `customConfirm("Tem certeza que deseja apagar o ciclo atual? As tarefas agendadas e o calendário serão resetados, mas suas matérias e histórico de questões serão mantidos.", () => {\n            appData.cycle.active = false;`
);

fs.writeFileSync('index.html', html);
