const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Add custom modal HTML before closing </body>
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

// Add customConfirm and customAlert functions
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

        // Override generateMacroCycle and realignCycleToToday
`;

const oldRealign = `        function realignCycleToToday() {
            if (!confirm("Isso ajustará as datas do cronograma restante a partir da data de hoje, mantendo todo o seu histórico já concluído. Deseja prosseguir?")) return;
            
            const now = new Date();`;

const newRealign = `        function realignCycleToToday() {
            customConfirm("Isso ajustará as datas do cronograma restante a partir da data de hoje, mantendo todo o seu histórico já concluído. Deseja prosseguir?", () => {
            const now = new Date();`;

const oldRealignEnd = `            renderAll();
            alert("Datas do ciclo realinhadas para hoje com sucesso!");
        }`;
const newRealignEnd = `            renderAll();
            customAlert("Datas do ciclo realinhadas para hoje com sucesso!");
            });
        }`;

html = html.replace(oldRealign, newRealign);
html = html.replace(oldRealignEnd, newRealignEnd);


const oldGen = `        function generateMacroCycle() {
            if (appData.subjects.length === 0) return alert("Cadastre disciplinas antes de gerar um ciclo.");
            if (appData.cycle.active && !confirm("Atenção: Isso gerará um NOVO cronograma completo de estudos substituindo o atual. Deseja prosseguir?")) return;
            
            const weeklyHoursEl = document.getElementById('hours-per-week');`;

const newGen = `        function generateMacroCycle() {
            if (appData.subjects.length === 0) return customAlert("Cadastre disciplinas antes de gerar um ciclo.");
            
            const proceedGeneration = () => {
            const weeklyHoursEl = document.getElementById('hours-per-week');`;

const oldGenEnd = `            renderAll(); 
            window.scrollTo(0, 0);
        }

        // --- GERAÇÃO AVANÇADA DE CICLO COM LIMITES DIÁRIOS POR FASE ---`;

const newGenEnd = `            renderAll(); 
            window.scrollTo(0, 0);
            }; // end proceedGeneration

            if (appData.cycle.active) {
                customConfirm("Atenção: Isso gerará um NOVO cronograma completo de estudos substituindo o atual. Deseja prosseguir?", proceedGeneration);
            } else {
                proceedGeneration();
            }
        }

        // --- GERAÇÃO AVANÇADA DE CICLO COM LIMITES DIÁRIOS POR FASE ---`;

html = html.replace(oldGen, newGen);
html = html.replace(oldGenEnd, newGenEnd);

html = html.replace('// --- ATIVIDADE DE MANUTENÇÃO INTELIGENTE (PRIORIZAÇÃO 2 VERTENTES) ---', customJs + '\n// --- ATIVIDADE DE MANUTENÇÃO INTELIGENTE (PRIORIZAÇÃO 2 VERTENTES) ---');


fs.writeFileSync('index.html', html);
console.log("Replaced");
