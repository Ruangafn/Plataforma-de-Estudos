const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The easier way: just restore index.html from git or something? I don't have git.
// Let's replace `}); \n        }` with `}` and try again.

html = html.replace(/customAlert\("(.*?)"\);\n        \}\);\n        \}/g, 'customAlert("$1");\n        }');

// Let's check resetPerformanceStats
html = html.replace(/if \(!confirm\("Deseja realmente zerar as estatísticas[\s\S]*?return;\n            \}\n/g, 'customConfirm("Deseja realmente zerar as estatísticas de desempenho deste perfil (Aproveitamento Geral, Sequência/Streak, Horas Líquidas e Metas Validadas)? Suas matérias e assuntos cadastrados NÃO serão apagados.", () => {\n');

html = html.replace(/customAlert\("Estatísticas de desempenho zeradas[\s\S]*?\}\n/g, 'customAlert("Estatísticas de desempenho zeradas com sucesso! Seu aproveitamento, streak, horas e metas foram reiniciados mantendo suas disciplinas intactas.");\n});\n}\n');


// check deleteCurrentProfile
html = html.replace(/if \(!confirm\(\`Atenção: Tem certeza de que deseja excluir permanentemente o perfil[\s\S]*?return;\n            \}\n/g, 'customConfirm(`Atenção: Tem certeza de que deseja excluir permanentemente o perfil "${currentProfileKey}" e todo o seu planejamento?`, () => {\n');

html = html.replace(/customAlert\(\`Perfil excluído com sucesso[\s\S]*?\}\n/g, 'customAlert(`Perfil excluído com sucesso! Agora você está no perfil "${currentProfileKey}".`);\n});\n}\n');


// check deleteCurrentCycle
html = html.replace(/if \(!confirm\("Tem certeza que deseja apagar o ciclo atual[\s\S]*?return;\n            \}\n/g, 'customConfirm("Tem certeza que deseja apagar o ciclo atual? As tarefas agendadas e o calendário serão resetados, mas suas matérias e histórico de questões serão mantidos.", () => {\n');

html = html.replace(/customAlert\("Ciclo apagado com sucesso[\s\S]*?\}\n/g, 'customAlert("Ciclo apagado com sucesso! Agora você pode gerar um novo ciclo quando quiser.");\n});\n}\n');


// check resetAllApplicationData
html = html.replace(/if \(!confirm\("⚠️ ATENÇÃO: Esta ação é irreversível[\s\S]*?return;\n            \}\n/g, 'customConfirm("⚠️ ATENÇÃO: Esta ação é irreversível! Isso apagará TODOS os perfis, todas as matérias e ciclos. Deseja realmente continuar?", () => {\n');

html = html.replace(/customAlert\("Todos os dados foram excluídos[\s\S]*?renderAll\(\);\n        \}\n/g, 'customAlert("Todos os dados foram excluídos e o sistema foi restaurado para o padrão inicial.");\nrenderAll();\n});\n}\n');

// check removeTopicCust
html = html.replace(/if\(!confirm\("Remover este assunto\?"\)\) return;\n/g, 'customConfirm("Remover este assunto?", () => {\n');

html = html.replace(/renderCustomizeList\(\);\n        \}/g, 'renderCustomizeList();\n});\n}');

// check removeSubject
html = html.replace(/if\(confirm\("Remover esta disciplina e todos os seus assuntos\?"\)\) \{\n/g, 'customConfirm("Remover esta disciplina e todos os seus assuntos?", () => {\n');

html = html.replace(/saveData\(\);\n            \}\n        \}/g, 'saveData();\n});\n}');

fs.writeFileSync('index.html', html);
