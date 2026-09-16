const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
    /if \(!confirm\("Tem certeza que deseja apagar o ciclo atual[\s\S]*?appData\.cycle = \{/g,
    `customConfirm("Tem certeza que deseja apagar o ciclo atual? As tarefas agendadas e o calendário serão resetados, mas suas matérias e histórico de questões serão mantidos.", () => {\n            appData.cycle = {`
);

fs.writeFileSync('index.html', html);
