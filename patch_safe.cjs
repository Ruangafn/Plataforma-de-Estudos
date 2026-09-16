const fs = require('fs');
let html = fs.readFileSync('index_backup.html', 'utf8');

// Insert custom modal HTML
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

// Add custom functions
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

        // --- INÍCIO SCRIPTS ---
`;

html = html.replace('let currentCustSubId = null;', customJs + 'let currentCustSubId = null;');


// 1. generateMacroCycle
html = html.replace(
    /if \(appData\.cycle\.active && !confirm\("Atenção: Isso gerará um NOVO cronograma completo de estudos substituindo o atual\. Deseja prosseguir\?"\)\) return;\s+const weeklyHoursEl/g,
    `const proceed = () => {\n            const weeklyHoursEl`
);
html = html.replace(
    /renderAll\(\); \s+window\.scrollTo\(0, 0\);\s+\}\s+\/\/ --- GERAÇÃO AVANÇADA DE CICLO/g,
    `renderAll(); \n            window.scrollTo(0, 0);\n            }; // end proceed\n            \n            if (appData.cycle.active) {\n                customConfirm("Atenção: Isso gerará um NOVO cronograma completo de estudos substituindo o atual. Deseja prosseguir?", proceed);\n            } else {\n                proceed();\n            }\n        }\n\n        // --- GERAÇÃO AVANÇADA DE CICLO`
);


// 2. realignCycleToToday
html = html.replace(
    /if \(!confirm\("Isso ajustará as datas do cronograma restante a partir da data de hoje, mantendo todo o seu histórico já concluído\. Deseja prosseguir\?"\)\) return;\s+const now = new Date\(\);/g,
    `customConfirm("Isso ajustará as datas do cronograma restante a partir da data de hoje, mantendo todo o seu histórico já concluído. Deseja prosseguir?", () => {\n            const now = new Date();`
);
html = html.replace(
    /alert\("Datas do ciclo realinhadas para hoje com sucesso!"\);\s+\}/g,
    `customAlert("Datas do ciclo realinhadas para hoje com sucesso!");\n            });\n        }`
);


// 3. resetPerformanceStats
html = html.replace(
    /if \(!confirm\("Deseja realmente zerar as estatísticas[\s\S]*?return;\s+\}\s+appData\.streak = 0;/g,
    `customConfirm("Deseja realmente zerar as estatísticas de desempenho deste perfil (Aproveitamento Geral, Sequência/Streak, Horas Líquidas e Metas Validadas)? Suas matérias e assuntos cadastrados NÃO serão apagados.", () => {\n            appData.streak = 0;`
);
html = html.replace(
    /alert\("Estatísticas de desempenho zeradas com sucesso![\s\S]*?"\);\s+\}/g,
    `customAlert("Estatísticas de desempenho zeradas com sucesso! Seu aproveitamento, streak, horas e metas foram reiniciados mantendo suas disciplinas intactas.");\n            });\n        }`
);


// 4. deleteCurrentProfile
html = html.replace(
    /if \(!confirm\(\`Atenção: Tem certeza de que deseja excluir permanentemente o perfil[\s\S]*?return;\s+\}\s+\/\/ Apaga perfil/g,
    `customConfirm(\`Atenção: Tem certeza de que deseja excluir permanentemente o perfil "\${currentProfileKey}" e todo o seu planejamento?\`, () => {\n            // Apaga perfil`
);
html = html.replace(
    /alert\(\`Perfil excluído com sucesso![\s\S]*?"\);\s+\}/g,
    `customAlert(\`Perfil excluído com sucesso! Agora você está no perfil "\${currentProfileKey}".\`);\n            });\n        }`
);


// 5. deleteCurrentCycle
html = html.replace(
    /if \(!confirm\("Tem certeza que deseja apagar o ciclo atual\?[\s\S]*?return;\s+\}\s+appData\.cycle\.active = false;/g,
    `customConfirm("Tem certeza que deseja apagar o ciclo atual? As tarefas agendadas e o calendário serão resetados, mas suas matérias e histórico de questões serão mantidos.", () => {\n            appData.cycle.active = false;`
);
html = html.replace(
    /alert\("Ciclo apagado com sucesso! Agora você pode gerar um novo ciclo quando quiser\."\);\s+\}/g,
    `customAlert("Ciclo apagado com sucesso! Agora você pode gerar um novo ciclo quando quiser.");\n            });\n        }`
);


// 6. removeTopicCust
html = html.replace(
    /if\(!confirm\("Remover este assunto\?"\)\) return;\s+const sub =/g,
    `customConfirm("Remover este assunto?", () => {\n            const sub =`
);
html = html.replace(
    /renderCustomizeList\(\);\s+\}\s+function renderCustomizeList/g,
    `renderCustomizeList();\n            });\n        }\n\n        function renderCustomizeList`
);


// 7. removeSubject
html = html.replace(
    /if\(confirm\("Remover esta disciplina e todos os seus assuntos\?"\)\) \{\s+appData\.subjects/g,
    `customConfirm("Remover esta disciplina e todos os seus assuntos?", () => {\n                appData.subjects`
);
html = html.replace(
    /saveData\(\);\s+\}\s+\}/g,
    `saveData();\n            });\n        }`
);


// 8. resetAllApplicationData
html = html.replace(
    /if \(!confirm\("⚠️ ATENÇÃO: Esta ação é irreversível![\s\S]*?localStorage\.clear\(\);/g,
    `customConfirm("⚠️ ATENÇÃO: Esta ação é irreversível! Isso apagará TODOS os perfis, todas as matérias e ciclos. Deseja realmente continuar?", () => {\n            localStorage.clear();`
);
html = html.replace(
    /renderAll\(\);\s+\}/g,
    `renderAll();\n            });\n        }`
);

// Replace ALL OTHER alerts with customAlert
html = html.replace(/alert\(/g, 'customAlert(');

fs.writeFileSync('index.html', html);
console.log("Safe patch applied");
