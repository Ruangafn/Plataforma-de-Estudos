const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Revert confirm replace first
html = fs.readFileSync('index.html', 'utf8');

// I didn't execute node patch7.cjs. So alert and confirm are not globally replaced.
// Let's manually replace them one by one, properly using customConfirm.

html = html.replace(/alert\(/g, 'customAlert(');

const c1 = `if (!confirm("Deseja realmente zerar as estatísticas de desempenho deste perfil (Aproveitamento Geral, Sequência/Streak, Horas Líquidas e Metas Validadas)?\\n\\nSuas matérias e assuntos cadastrados NÃO serão apagados.")) {
                return;
            }
            appData.streak = 0;`;
const r1 = `customConfirm("Deseja realmente zerar as estatísticas de desempenho deste perfil (Aproveitamento Geral, Sequência/Streak, Horas Líquidas e Metas Validadas)? Suas matérias e assuntos cadastrados NÃO serão apagados.", () => {
            appData.streak = 0;`;

const c2 = `if (!confirm(\`Atenção: Tem certeza de que deseja excluir permanentemente o perfil "\${currentProfileKey}" e todo o seu planejamento?\`)) {
                return;
            }
            
            // Apaga perfil`;
const r2 = `customConfirm(\`Atenção: Tem certeza de que deseja excluir permanentemente o perfil "\${currentProfileKey}" e todo o seu planejamento?\`, () => {
            // Apaga perfil`;

const c3 = `if (!confirm("Tem certeza que deseja apagar o ciclo atual? As tarefas agendadas e o calendário serão resetados, mas suas matérias e histórico de questões serão mantidos.")) {
                return;
            }
            appData.cycle.active = false;`;
const r3 = `customConfirm("Tem certeza que deseja apagar o ciclo atual? As tarefas agendadas e o calendário serão resetados, mas suas matérias e histórico de questões serão mantidos.", () => {
            appData.cycle.active = false;`;

const c4 = `if (!confirm("⚠️ ATENÇÃO: Esta ação é irreversível!\\n\\nIsso apagará TODOS os perfis, todas as matérias, questões registradas, histórico e ciclos salvos neste navegador.\\n\\nDeseja realmente continuar?")) {
                return;
            }

            let word = prompt("Para confirmar, digite APAGAR:");`;
const r4 = `customConfirm("⚠️ ATENÇÃO: Esta ação é irreversível! Isso apagará TODOS os perfis, todas as matérias e ciclos. Deseja realmente continuar?", () => {
            let word = prompt("Para confirmar, digite APAGAR:");`;


const c5 = `if(!confirm("Remover este assunto?")) return;
            const sub = appData.subjects.find(s => s.id === currentCustSubId);`;
const r5 = `customConfirm("Remover este assunto?", () => {
            const sub = appData.subjects.find(s => s.id === currentCustSubId);`;

const c6 = `function removeSubject(id) {
            if(confirm("Remover esta disciplina e todos os seus assuntos?")) { 
                appData.subjects = appData.subjects.filter(s => s.id !== id);
                renderAll();
                saveData();
            }
        }`;
const r6 = `function removeSubject(id) {
            customConfirm("Remover esta disciplina e todos os seus assuntos?", () => {
                appData.subjects = appData.subjects.filter(s => s.id !== id);
                renderAll();
                saveData();
            });
        }`;


// Need to add closing brackets for callbacks

// r1 fix
html = html.replace(c1, r1);
const f1 = `customAlert("Estatísticas de desempenho zeradas com sucesso! Seu aproveitamento, streak, horas e metas foram reiniciados mantendo suas disciplinas intactas.");
        }`;
html = html.replace(f1, `customAlert("Estatísticas de desempenho zeradas com sucesso! Seu aproveitamento, streak, horas e metas foram reiniciados mantendo suas disciplinas intactas.");
        });
        }`);

// r2 fix
html = html.replace(c2, r2);
const f2 = `customAlert(\`Perfil excluído com sucesso! Agora você está no perfil "\${currentProfileKey}".\`);
        }`;
html = html.replace(f2, `customAlert(\`Perfil excluído com sucesso! Agora você está no perfil "\${currentProfileKey}".\`);
        });
        }`);

// r3 fix
html = html.replace(c3, r3);
const f3 = `customAlert("Ciclo apagado com sucesso! Agora você pode gerar um novo ciclo quando quiser.");
        }`;
html = html.replace(f3, `customAlert("Ciclo apagado com sucesso! Agora você pode gerar um novo ciclo quando quiser.");
        });
        }`);

// r4 fix
html = html.replace(c4, r4);
const f4 = `customAlert("Todos os dados foram excluídos e o sistema foi restaurado para o padrão inicial.");
            renderAll();
        }`;
html = html.replace(f4, `customAlert("Todos os dados foram excluídos e o sistema foi restaurado para o padrão inicial.");
            renderAll();
        });
        }`);

// r5 fix
html = html.replace(c5, r5);
const f5 = `renderCustomizeList();
        }`;
const f5New = `renderCustomizeList();
        });
        }`;
html = html.replace(f5, f5New);

// r6 fix
html = html.replace(c6, r6);


fs.writeFileSync('index.html', html);
