const fs = require('fs');
let html = fs.readFileSync('index_backup.html', 'utf8');

const customModalHtml = `
    <!-- Custom Dialog Modal -->
    <div id="modal-custom-dialog" class="modal-overlay" style="z-index: 9999;">
        <div class="modal-content" style="width: 400px; max-width: 90vw;">
            <h3 id="custom-dialog-title" style="color: var(--color-primary); margin-bottom: 5px;">Aviso</h3>
            <p id="custom-dialog-msg" style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;"></p>
            <div style="display: flex; gap: 10px;">
                <button id="custom-dialog-cancel" class="btn btn-outline" style="flex: 1;">Cancelar</button>
                <button id="custom-dialog-ok" class="btn btn-primary" style="flex: 1;">Confirmar</button>
            </div>
        </div>
    </div>
</body>`;
html = html.replace('</body>', customModalHtml);

const customJs = `
        let dialogCallback = null;
        function customAlert(msg) {
            document.getElementById('custom-dialog-title').innerText = 'Aviso';
            document.getElementById('custom-dialog-msg').innerText = msg;
            document.getElementById('custom-dialog-cancel').style.display = 'none';
            document.getElementById('custom-dialog-ok').innerText = 'OK';
            document.getElementById('custom-dialog-ok').onclick = () => {
                document.getElementById('modal-custom-dialog').style.display = 'none';
            };
            document.getElementById('modal-custom-dialog').style.display = 'flex';
        }
        function customConfirm(msg, onConfirm) {
            document.getElementById('custom-dialog-title').innerText = 'Confirmação';
            document.getElementById('custom-dialog-msg').innerText = msg;
            document.getElementById('custom-dialog-cancel').style.display = 'block';
            document.getElementById('custom-dialog-ok').innerText = 'Confirmar';
            document.getElementById('custom-dialog-cancel').onclick = () => {
                document.getElementById('modal-custom-dialog').style.display = 'none';
            };
            document.getElementById('custom-dialog-ok').onclick = () => {
                document.getElementById('modal-custom-dialog').style.display = 'none';
                if (onConfirm) onConfirm();
            };
            document.getElementById('modal-custom-dialog').style.display = 'flex';
        }
`;
html = html.replace('let currentCustSubId = null;', customJs + '\n        let currentCustSubId = null;');

// ONLY REPLACING EXACT MATCHES (no regex /g)

// 1. generateMacroCycle
html = html.replace(
    'if (appData.cycle.active && !confirm("Atenção: Isso gerará um NOVO cronograma completo de estudos substituindo o atual. Deseja prosseguir?")) return;\n            \n            const weeklyHoursEl',
    'const proceed = () => {\n            const weeklyHoursEl'
);
html = html.replace(
    'renderAll(); \n            window.scrollTo(0, 0);\n        }\n\n        // --- GERAÇÃO AVANÇADA DE CICLO',
    'renderAll(); \n            window.scrollTo(0, 0);\n            };\n            if(appData.cycle.active) customConfirm("Atenção: Isso gerará um NOVO cronograma completo de estudos substituindo o atual. Deseja prosseguir?", proceed);\n            else proceed();\n        }\n\n        // --- GERAÇÃO AVANÇADA DE CICLO'
);


// 2. realignCycleToToday
html = html.replace(
    'if (!confirm("Isso ajustará as datas do cronograma restante a partir da data de hoje, mantendo todo o seu histórico já concluído. Deseja prosseguir?")) return;\n            \n            const now = new Date();',
    'customConfirm("Isso ajustará as datas do cronograma restante a partir da data de hoje, mantendo todo o seu histórico já concluído. Deseja prosseguir?", () => {\n            const now = new Date();'
);
html = html.replace(
    'alert("Datas do ciclo realinhadas para hoje com sucesso!");\n        }',
    'customAlert("Datas do ciclo realinhadas para hoje com sucesso!");\n            });\n        }'
);


// 3. resetPerformanceStats
html = html.replace(
    'if (!confirm("Deseja realmente zerar as estatísticas de desempenho deste perfil (Aproveitamento Geral, Sequência/Streak, Horas Líquidas e Metas Validadas)?\\n\\nSuas matérias e assuntos cadastrados NÃO serão apagados.")) {\n                return;\n            }\n            appData.streak = 0;',
    'customConfirm("Deseja realmente zerar as estatísticas de desempenho deste perfil (Aproveitamento Geral, Sequência/Streak, Horas Líquidas e Metas Validadas)? Suas matérias e assuntos cadastrados NÃO serão apagados.", () => {\n            appData.streak = 0;'
);
html = html.replace(
    'alert("Estatísticas de desempenho zeradas com sucesso! Seu aproveitamento, streak, horas e metas foram reiniciados mantendo suas disciplinas intactas.");\n        }',
    'customAlert("Estatísticas de desempenho zeradas com sucesso! Seu aproveitamento, streak, horas e metas foram reiniciados mantendo suas disciplinas intactas.");\n            });\n        }'
);


// 4. deleteCurrentProfile
html = html.replace(
    'if (!confirm(`Atenção: Tem certeza de que deseja excluir permanentemente o perfil "${currentProfileKey}" e todo o seu planejamento?`)) {\n                return;\n            }\n            \n            // Apaga',
    'customConfirm(`Atenção: Tem certeza de que deseja excluir permanentemente o perfil "${currentProfileKey}" e todo o seu planejamento?`, () => {\n            // Apaga'
);
html = html.replace(
    'alert(`Perfil excluído com sucesso! Agora você está no perfil "${currentProfileKey}".`);\n        }',
    'customAlert(`Perfil excluído com sucesso! Agora você está no perfil "${currentProfileKey}".`);\n            });\n        }'
);


// 5. deleteCurrentCycle
html = html.replace(
    'if (!confirm("Tem certeza que deseja apagar o ciclo atual? As tarefas agendadas e o calendário serão resetados, mas suas matérias e histórico de questões serão mantidos.")) {\n                return;\n            }\n            appData.cycle.active = false;',
    'customConfirm("Tem certeza que deseja apagar o ciclo atual? As tarefas agendadas e o calendário serão resetados, mas suas matérias e histórico de questões serão mantidos.", () => {\n            appData.cycle.active = false;'
);
html = html.replace(
    'alert("Ciclo apagado com sucesso! Agora você pode gerar um novo ciclo quando quiser.");\n        }',
    'customAlert("Ciclo apagado com sucesso! Agora você pode gerar um novo ciclo quando quiser.");\n            });\n        }'
);


// 6. resetAllApplicationData
html = html.replace(
    'if (!confirm("⚠️ ATENÇÃO: Esta ação é irreversível!\\n\\nIsso apagará TODOS os perfis, todas as matérias, questões registradas, histórico e ciclos salvos neste navegador.\\n\\nDeseja realmente continuar?")) {\n                return;\n            }\n\n            const confirmCode = prompt("Para confirmar a exclusão de TODOS os dados, digite LIMPAR abaixo:");\n            if (confirmCode !== \'LIMPAR\') {\n                alert("Confirmação não coincidiu. Operação cancelada.");\n                return;\n            }\n\n            try {',
    'customConfirm("⚠️ ATENÇÃO: Esta ação é irreversível! Isso apagará TODOS os perfis, todas as matérias e ciclos. Deseja realmente continuar?", () => {\n            try {'
);
html = html.replace(
    'alert("Todos os dados foram excluídos e o sistema foi restaurado para o padrão inicial.");\n        }',
    'customAlert("Todos os dados foram excluídos e o sistema foi restaurado para o padrão inicial.");\n            });\n        }'
);


// 7. removeSubject
html = html.replace(
    'if(confirm("Remover esta disciplina e todos os seus assuntos?")) { \n                appData.subjects = appData.subjects.filter(s => s.id !== id);',
    'customConfirm("Remover esta disciplina e todos os seus assuntos?", () => {\n                appData.subjects = appData.subjects.filter(s => s.id !== id);'
);
html = html.replace(
    'saveData(); \n                renderAll(); \n            } \n        }',
    'saveData(); \n                renderAll(); \n            }); \n        }'
);

// 8. removeTopicCust
html = html.replace(
    'if(!confirm("Remover este assunto?")) return;\n            const sub =',
    'customConfirm("Remover este assunto?", () => {\n            const sub ='
);
html = html.replace(
    'sub.topics = sub.topics.filter(t => t.id !== topicId);\n            renderCustomizeList();\n        }',
    'sub.topics = sub.topics.filter(t => t.id !== topicId);\n            renderCustomizeList();\n            });\n        }'
);


html = html.replace(/alert\(/g, 'customAlert(');
fs.writeFileSync('index.html', html);
