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

// Replace ALL alert() with customAlert()
html = html.replace(/alert\(/g, 'customAlert(');

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
const genTarget = `        function generateMacroCycle() {
            if (appData.subjects.length === 0) return customAlert("Cadastre disciplinas antes de gerar um ciclo.");
            if (appData.cycle.active && !confirm("Atenção: Isso gerará um NOVO cronograma completo de estudos substituindo o atual. Deseja prosseguir?")) return;
            
            const weeklyHoursEl = document.getElementById('hours-per-week');`;
const genReplace = `        function generateMacroCycle() {
            if (appData.subjects.length === 0) return customAlert("Cadastre disciplinas antes de gerar um ciclo.");
            
            const proceed = () => {
            const weeklyHoursEl = document.getElementById('hours-per-week');`;
const genTargetEnd = `            renderAll(); 
            window.scrollTo(0, 0);
        }`;
const genReplaceEnd = `            renderAll(); 
            window.scrollTo(0, 0);
            }; // end proceed
            
            if (appData.cycle.active) {
                customConfirm("Atenção: Isso gerará um NOVO cronograma completo de estudos substituindo o atual. Deseja prosseguir?", proceed);
            } else {
                proceed();
            }
        }`;
html = html.replace(genTarget, genReplace);
html = html.replace(genTargetEnd, genReplaceEnd);


// 2. realignCycleToToday
const realignTarget = `        function realignCycleToToday() {
            if (!confirm("Isso ajustará as datas do cronograma restante a partir da data de hoje, mantendo todo o seu histórico já concluído. Deseja prosseguir?")) return;
            
            const now = new Date();`;
const realignReplace = `        function realignCycleToToday() {
            customConfirm("Isso ajustará as datas do cronograma restante a partir da data de hoje, mantendo todo o seu histórico já concluído. Deseja prosseguir?", () => {
            const now = new Date();`;
const realignTargetEnd = `            renderAll();
            customAlert("Datas do ciclo realinhadas para hoje com sucesso!");
        }`;
const realignReplaceEnd = `            renderAll();
            customAlert("Datas do ciclo realinhadas para hoje com sucesso!");
            }); // end confirm
        }`;
html = html.replace(realignTarget, realignReplace);
html = html.replace(realignTargetEnd, realignReplaceEnd);


// 3. resetPerformanceStats
const resetPerfTarget = `        function resetPerformanceStats() {
            if (!confirm("Deseja realmente zerar as estatísticas de desempenho deste perfil (Aproveitamento Geral, Sequência/Streak, Horas Líquidas e Metas Validadas)?\\n\\nSuas matérias e assuntos cadastrados NÃO serão apagados.")) {
                return;
            }
            appData.streak = 0;`;
const resetPerfReplace = `        function resetPerformanceStats() {
            customConfirm("Deseja realmente zerar as estatísticas de desempenho deste perfil (Aproveitamento Geral, Sequência/Streak, Horas Líquidas e Metas Validadas)? Suas matérias e assuntos cadastrados NÃO serão apagados.", () => {
            appData.streak = 0;`;
const resetPerfTargetEnd = `            customAlert("Estatísticas de desempenho zeradas com sucesso! Seu aproveitamento, streak, horas e metas foram reiniciados mantendo suas disciplinas intactas.");
        }`;
const resetPerfReplaceEnd = `            customAlert("Estatísticas de desempenho zeradas com sucesso! Seu aproveitamento, streak, horas e metas foram reiniciados mantendo suas disciplinas intactas.");
            });
        }`;
html = html.replace(resetPerfTarget, resetPerfReplace);
html = html.replace(resetPerfTargetEnd, resetPerfReplaceEnd);


// 4. deleteCurrentProfile
const delProfTarget = `        function deleteCurrentProfile() {
            if (currentProfileKey === 'Principal' && Object.keys(appDataProfiles).length === 1) {
                customAlert("Você possui apenas 1 perfil ativo. Não é possível excluir o único perfil existente. Crie outro perfil primeiro se desejar remover este.");
                return;
            }
            if (!confirm(\`Atenção: Tem certeza de que deseja excluir permanentemente o perfil "\${currentProfileKey}" e todo o seu planejamento?\`)) {
                return;
            }
            
            // Apaga perfil`;
const delProfReplace = `        function deleteCurrentProfile() {
            if (currentProfileKey === 'Principal' && Object.keys(appDataProfiles).length === 1) {
                customAlert("Você possui apenas 1 perfil ativo. Não é possível excluir o único perfil existente. Crie outro perfil primeiro se desejar remover este.");
                return;
            }
            customConfirm(\`Atenção: Tem certeza de que deseja excluir permanentemente o perfil "\${currentProfileKey}" e todo o seu planejamento?\`, () => {
            
            // Apaga perfil`;
const delProfTargetEnd = `            renderProfileSelector();
            renderAll();
            customAlert(\`Perfil excluído com sucesso! Agora você está no perfil "\${currentProfileKey}".\`);
        }`;
const delProfReplaceEnd = `            renderProfileSelector();
            renderAll();
            customAlert(\`Perfil excluído com sucesso! Agora você está no perfil "\${currentProfileKey}".\`);
            });
        }`;
html = html.replace(delProfTarget, delProfReplace);
html = html.replace(delProfTargetEnd, delProfReplaceEnd);


// 5. deleteCurrentCycle
const delCycTarget = `        function deleteCurrentCycle() {
            if (!appData.cycle || !appData.cycle.active) {
                customAlert("Não há nenhum ciclo ativo neste perfil para apagar.");
                return;
            }
            if (!confirm("Tem certeza que deseja apagar o ciclo atual? As tarefas agendadas e o calendário serão resetados, mas suas matérias e histórico de questões serão mantidos.")) {
                return;
            }
            appData.cycle.active = false;`;
const delCycReplace = `        function deleteCurrentCycle() {
            if (!appData.cycle || !appData.cycle.active) {
                customAlert("Não há nenhum ciclo ativo neste perfil para apagar.");
                return;
            }
            customConfirm("Tem certeza que deseja apagar o ciclo atual? As tarefas agendadas e o calendário serão resetados, mas suas matérias e histórico de questões serão mantidos.", () => {
            appData.cycle.active = false;`;
const delCycTargetEnd = `            renderAll();
            customAlert("Ciclo apagado com sucesso! Agora você pode gerar um novo ciclo quando quiser.");
        }`;
const delCycReplaceEnd = `            renderAll();
            customAlert("Ciclo apagado com sucesso! Agora você pode gerar um novo ciclo quando quiser.");
            });
        }`;
html = html.replace(delCycTarget, delCycReplace);
html = html.replace(delCycTargetEnd, delCycReplaceEnd);


// 6. removeTopicCust
const remTopTarget = `        function removeTopicCust(topicId) {
            if(!confirm("Remover este assunto?")) return;
            const sub = appData.subjects.find(s => s.id === currentCustSubId);
            if (!sub) return;
            sub.topics = sub.topics.filter(t => t.id !== topicId);
            renderCustomizeList();
        }`;
const remTopReplace = `        function removeTopicCust(topicId) {
            customConfirm("Remover este assunto?", () => {
            const sub = appData.subjects.find(s => s.id === currentCustSubId);
            if (!sub) return;
            sub.topics = sub.topics.filter(t => t.id !== topicId);
            renderCustomizeList();
            });
        }`;
html = html.replace(remTopTarget, remTopReplace);


// 7. removeSubject
const remSubTarget = `        function removeSubject(id) {
            if(confirm("Remover esta disciplina e todos os seus assuntos?")) { 
                appData.subjects = appData.subjects.filter(s => s.id !== id);
                renderAll();
                saveData();
            }
        }`;
const remSubReplace = `        function removeSubject(id) {
            customConfirm("Remover esta disciplina e todos os seus assuntos?", () => {
                appData.subjects = appData.subjects.filter(s => s.id !== id);
                renderAll();
                saveData();
            });
        }`;
html = html.replace(remSubTarget, remSubReplace);


// 8. resetAllApplicationData (Has prompt, will just confirm)
const resetAppTarget = `        function resetAllApplicationData() {
            if (!confirm("⚠️ ATENÇÃO: Esta ação é irreversível!\\n\\nIsso apagará TODOS os perfis, todas as matérias, questões registradas, histórico e ciclos salvos neste navegador.\\n\\nDeseja realmente continuar?")) {
                return;
            }

            let word = prompt("Para confirmar, digite APAGAR:");
            if (word !== "APAGAR") {
                customAlert("Confirmação não coincidiu. Operação cancelada.");
                return;
            }

            localStorage.clear();`;
const resetAppReplace = `        function resetAllApplicationData() {
            customConfirm("⚠️ ATENÇÃO: Esta ação é irreversível! Isso apagará TODOS os perfis, todas as matérias e ciclos. Deseja realmente continuar?", () => {
            localStorage.clear();`;
const resetAppTargetEnd = `            renderProfileSelector();
            customAlert("Todos os dados foram excluídos e o sistema foi restaurado para o padrão inicial.");
            renderAll();
        }`;
const resetAppReplaceEnd = `            renderProfileSelector();
            customAlert("Todos os dados foram excluídos e o sistema foi restaurado para o padrão inicial.");
            renderAll();
            });
        }`;
html = html.replace(resetAppTarget, resetAppReplace);
html = html.replace(resetAppTargetEnd, resetAppReplaceEnd);


fs.writeFileSync('index.html', html);
console.log("Patched successfully");
