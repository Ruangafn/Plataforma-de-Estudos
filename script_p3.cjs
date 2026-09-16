
        // --- MOTOR DE DADOS RESILIENTE COM SUPORTE A FALLBACK ---
        var currentProfileKey = 'Principal';
        try {
            currentProfileKey = localStorage.getItem('studyActiveProfileKey') || 'Principal';
        } catch(e) {
            currentProfileKey = 'Principal';
        }
        
        function getDefaultAppData() {
            return {
                streak: 0, 
                totalHours: 0.0, 
                completedTasksCount: 0,
                globalPerformance: { totalQuestions: 0, correctQuestions: 0 },
                topicHistory: {}, 
                subjects: [
                    {
                        id: generateId('sub'), name: "Direito Constitucional", weight: 4, color: "#3b82f6", hidden: false,
                        topics: [
                            { id: generateId('top'), name: "Teoria Geral dos Direitos Fundamentais", status: 'pending', rounds: 0, phases: ['Teoria', 'Revisão', 'Questões'], currentPhaseIdx: 0, qTotal: 0, qCorrect: 0, link: "", teoHours: 2.0 },
                            { id: generateId('top'), name: "Remédios Constitucionais", status: 'pending', rounds: 0, phases: ['Teoria', 'Revisão', 'Questões'], currentPhaseIdx: 0, qTotal: 0, qCorrect: 0, link: "", teoHours: 2.5 }
                        ]
                    },
                    {
                        id: generateId('sub'), name: "Direito Administrativo", weight: 4, color: "#10b981", hidden: false,
                        topics: [
                            { id: generateId('top'), name: "Princípios da Administração Pública", status: 'pending', rounds: 0, phases: ['Teoria', 'Revisão', 'Questões'], currentPhaseIdx: 0, qTotal: 0, qCorrect: 0, link: "", teoHours: 2.0 },
                            { id: generateId('top'), name: "Poderes Administrativos", status: 'pending', rounds: 0, phases: ['Teoria', 'Revisão', 'Questões'], currentPhaseIdx: 0, qTotal: 0, qCorrect: 0, link: "", teoHours: 3.0 }
                        ]
                    }
                ], 
                cycle: { 
                    active: false, 
                    currentCycleDayIndex: 0, 
                    dateLabels: [], 
                    completedDays: [], 
                    days: [],
                    startDate: null 
                },
                settings: {
                    weeklyHours: 28,
                    revDur: 0.5,
                    queDur: 1.0,
                    teoSlice: 1.5,
                    maxTeoPerDay: 2,
                    maxRevPerDay: 2,
                    maxQuePerDay: 2
                }
            };
        }

        var appData = getDefaultAppData();
        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        let pendingTaskObj = null;
        
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

        let currentCustSubId = null; 
        let currentCalWeekView = 0; 

        // Cronômetro Líquido
        let timerInterval = null;
        let timerSeconds = 0;
        let isTimerRunning = false;

        function generateId(p) { return p + '_' + Math.random().toString(36).substr(2, 9); }
        
        function formatHours(h) {
            if (!h || isNaN(h)) return "0h00m";
            let hrs = Math.floor(h);
            let mins = Math.round((h - hrs) * 60);
            return `${hrs}h${mins > 0 ? (mins < 10 ? '0'+mins : mins)+'m' : '00m'}`;
        }

        // --- GESTÃO DE PERFIS & BACKUP JSON ---
        function getProfilesList() {
            try {
                return JSON.parse(localStorage.getItem('studyProfilesList')) || ['Principal'];
            } catch(e) {
                return ['Principal'];
            }
        }

        function saveProfilesList(list) {
            try {
                localStorage.setItem('studyProfilesList', JSON.stringify(list));
            } catch(e) {}
        }

        function renderProfileSelector() {
            const select = document.getElementById('profile-select');
            if (!select) return;
            const profiles = getProfilesList();
            select.innerHTML = profiles.map(p => `<option value="${p}" ${p === currentProfileKey ? 'selected' : ''}>${p}</option>`).join('');
        }

        function createNewProfile() {
            const name = prompt("Nome do novo perfil de estudos (ex: PC-AP, TJ, OAB):");
            if (!name || !name.trim()) return;
            const trimmed = name.trim();
            const list = getProfilesList();
            if (!list.includes(trimmed)) {
                list.push(trimmed);
                saveProfilesList(list);
            }
            switchProfile(trimmed);
        }

        function switchProfile(name) {
            currentProfileKey = name;
            try {
                localStorage.setItem('studyActiveProfileKey', name);
            } catch(e) {}
            loadData();
        }

        function openProfileSettingsModal() {
            const el = document.getElementById('modal-profile-current-name');
            if (el) el.innerText = currentProfileKey;
            const modal = document.getElementById('modal-profile-settings');
            if (modal) modal.style.display = 'flex';
        }

        function closeProfileSettingsModal() {
            const modal = document.getElementById('modal-profile-settings');
            if (modal) modal.style.display = 'none';
        }

        function resetPerformanceStatsFromModal() {
            closeProfileSettingsModal();
            resetPerformanceStats();
        }

        function resetPerformanceStats() {
            customConfirm("Deseja realmente zerar as estatísticas de desempenho deste perfil (Aproveitamento Geral, Sequência/Streak, Horas Líquidas e Metas Validadas)? Suas matérias e assuntos cadastrados NÃO serão apagados.", () => {
            appData.streak = 0;
            appData.totalHours = 0.0;
            appData.completedTasksCount = 0;
            appData.globalPerformance = { totalQuestions: 0, correctQuestions: 0 };
            appData.topicHistory = {};

            // Zera o histórico de questões de cada assunto cadastrado
            if (Array.isArray(appData.subjects)) {
                appData.subjects.forEach(sub => {
                    if (Array.isArray(sub.topics)) {
                        sub.topics.forEach(top => {
                            top.qTotal = 0;
                            top.qCorrect = 0;
                            top.rounds = 0;
                            top.currentPhaseIdx = 0;
                            if (top.status === 'completed') top.status = 'pending';
                        });
                    }
                });
            }

            // Desmarca tarefas concluídas no ciclo atual
            if (appData.cycle && Array.isArray(appData.cycle.days)) {
                appData.cycle.days.forEach(dayTasks => {
                    if (Array.isArray(dayTasks)) {
                        dayTasks.forEach(task => {
                            task.done = false;
                            delete task.completedAt;
                            delete task.recordedQTotal;
                            delete task.recordedQCorrect;
                        });
                    }
                });
                if (Array.isArray(appData.cycle.completedDays)) {
                    appData.cycle.completedDays = appData.cycle.completedDays.map(() => false);
                }
                appData.cycle.currentCycleDayIndex = 0;
            }

            saveData();
            checkOverdueStatus();
            renderAll();
            customAlert("Estatísticas de desempenho zeradas com sucesso! Seu aproveitamento, streak, horas e metas foram reiniciados mantendo suas disciplinas intactas.");
            });
        }

        function deleteCurrentProfileFromModal() {
            closeProfileSettingsModal();
            deleteCurrentProfile();
        }

        function resetAllApplicationDataFromModal() {
            closeProfileSettingsModal();
            resetAllApplicationData();
        }

        function deleteCurrentProfile() {
            const list = getProfilesList();
            if (list.length <= 1) {
                customAlert("Você possui apenas 1 perfil ativo. Não é possível excluir o único perfil existente. Crie outro perfil primeiro se desejar remover este.");
                return;
            }

            customConfirm(`Atenção: Tem certeza de que deseja excluir permanentemente o perfil "${currentProfileKey}" e todo o seu planejamento?`, () => {
            try {
                localStorage.removeItem(`studyPlannerData_${currentProfileKey}`);
            } catch(e) {}

            const newList = list.filter(p => p !== currentProfileKey);
            saveProfilesList(newList);

            currentProfileKey = newList[0];
            try {
                localStorage.setItem('studyActiveProfileKey', currentProfileKey);
            } catch(e) {}
            loadData();

            customAlert(`Perfil excluído com sucesso! Agora você está no perfil "${currentProfileKey}".`);
            });
        }

        function deleteCurrentCycle() {
            if (!appData.cycle || !appData.cycle.active) {
                customAlert("Não há nenhum ciclo ativo neste perfil para apagar.");
                return;
            }

            if (!confirm("Tem certeza que deseja apagar o ciclo atual? As tarefas agendadas e o calendário serão resetados, mas suas matérias e histórico de questões serão mantidos.")) {
                return;
            }

            appData.cycle = {
                active: false,
                currentCycleDayIndex: 0,
                dateLabels: [],
                completedDays: [],
                days: [],
                startDate: null
            };

            saveData();
            closeCycleSettingsModal();
            checkOverdueStatus();
            renderAll();
            customAlert("Ciclo apagado com sucesso! Agora você pode gerar um novo ciclo quando quiser.");
            });
        }

        function resetAllApplicationData() {
            customConfirm("⚠️ ATENÇÃO: Esta ação é irreversível! Isso apagará TODOS os perfis, todas as matérias e ciclos. Deseja realmente continuar?", () => {
            try {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && (k.startsWith('studyPlannerData') || k === 'studyProfilesList' || k === 'studyActiveProfileKey' || k.startsWith('studyData_') || k === 'studyActiveProfile' || k === 'studyProfileList')) {
                        keysToRemove.push(k);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
            } catch(e) {}

            currentProfileKey = 'Principal';
            saveProfilesList(['Principal']);
            try {
                localStorage.setItem('studyActiveProfileKey', 'Principal');
            } catch(e) {}
            
            appData = getDefaultAppData();
            saveData();
            loadData();

            customAlert("Todos os dados foram excluídos e o sistema foi restaurado para o padrão inicial.");
            });
        }

        function exportBackupJSON() {
            const payload = {
                profile: currentProfileKey,
                exportDate: new Date().toISOString(),
                data: appData
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_estudos_${currentProfileKey}_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        function importBackupJSON(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const parsed = JSON.parse(e.target.result);
                    if (parsed.data && parsed.data.subjects) {
                        appData = parsed.data;
                    } else if (parsed.subjects) {
                        appData = parsed;
                    } else {
                        throw new Error("Formato inválido");
                    }
                    saveData();
                    renderAll();
                    customAlert("Backup restaurado com sucesso para o perfil atual!");
                } catch(err) {
                    customAlert("Erro ao ler o arquivo JSON de backup: " + err.message);
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        }

        // --- CRONÔMETRO DE ESTUDO ---
        function toggleTimer() {
            if (isTimerRunning) {
                clearInterval(timerInterval);
                isTimerRunning = false;
                const btn = document.getElementById('timer-btn-toggle');
                if (btn) btn.innerText = '▶';
            } else {
                timerInterval = setInterval(() => {
                    timerSeconds++;
                    updateTimerUI();
                }, 1000);
                isTimerRunning = true;
                const btn = document.getElementById('timer-btn-toggle');
                if (btn) btn.innerText = '⏸';
            }
        }

        function resetTimer() {
            clearInterval(timerInterval);
            isTimerRunning = false;
            timerSeconds = 0;
            updateTimerUI();
            const btn = document.getElementById('timer-btn-toggle');
            if (btn) btn.innerText = '▶';
        }

        function updateTimerUI() {
            const hrs = String(Math.floor(timerSeconds / 3600)).padStart(2, '0');
            const mins = String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, '0');
            const secs = String(timerSeconds % 60).padStart(2, '0');
            const disp = document.getElementById('timer-display');
            if (disp) disp.innerText = `${hrs}:${mins}:${secs}`;
        }

        // --- INICIALIZAÇÃO DE DADOS COM RECUPERAÇÃO AUTOMÁTICA ---
        function loadData() {
            try {
                currentProfileKey = localStorage.getItem('studyActiveProfileKey') || 'Principal';
            } catch(e) {
                currentProfileKey = 'Principal';
            }

            const storageKey = `studyPlannerData_${currentProfileKey}`;
            let saved = null;
            try {
                saved = localStorage.getItem(storageKey);
                if (!saved) {
                    const legacyKeys = ['studyPlannerDataV18', 'studyData_Principal', 'studyPlannerData', 'studyData_default'];
                    for (const lk of legacyKeys) {
                        const legacyData = localStorage.getItem(lk);
                        if (legacyData) {
                            try {
                                const parsed = JSON.parse(legacyData);
                                if (parsed && (parsed.subjects || parsed.cycle)) {
                                    saved = legacyData;
                                    localStorage.setItem(storageKey, saved);
                                    console.log(`Migrated legacy data from ${lk} to ${storageKey}`);
                                    break;
                                }
                            } catch(err) {}
                        }
                    }
                }
            } catch(e) {
                console.warn("Acesso ao localStorage restrito", e);
            }

            if (saved) {
                try {
                    appData = JSON.parse(saved);
                } catch(e) {
                    console.error("Falha ao analisar JSON salvo, usando padrão", e);
                    appData = getDefaultAppData();
                }
            } else {
                appData = getDefaultAppData();
                saveData();
            }

            if (!appData || typeof appData !== 'object') appData = getDefaultAppData();
            if (!Array.isArray(appData.subjects)) appData.subjects = [];
            if (!appData.topicHistory || typeof appData.topicHistory !== 'object') appData.topicHistory = {};
            if (!appData.cycle || typeof appData.cycle !== 'object') {
                appData.cycle = { active: false, currentCycleDayIndex: 0, dateLabels: [], completedDays: [], days: [], startDate: null };
            }
            if (!Array.isArray(appData.cycle.days)) appData.cycle.days = [];
            if (!Array.isArray(appData.cycle.dateLabels)) appData.cycle.dateLabels = [];
            if (!Array.isArray(appData.cycle.completedDays)) appData.cycle.completedDays = [];

            if (!appData.settings || typeof appData.settings !== 'object') {
                appData.settings = { weeklyHours: 28, revDur: 0.5, queDur: 1.0, teoSlice: 1.5, maxTeoPerDay: 2, maxRevPerDay: 2, maxQuePerDay: 2 };
            }

            appData.subjects.forEach(s => {
                if (!Array.isArray(s.topics)) s.topics = [];
                s.topics.forEach(t => {
                    if (!Array.isArray(t.phases)) t.phases = ['Teoria', 'Revisão', 'Questões'];
                    if (t.currentPhaseIdx === undefined) t.currentPhaseIdx = 0;
                    if (t.qTotal === undefined) t.qTotal = 0;
                    if (t.qCorrect === undefined) t.qCorrect = 0;
                    if (t.status === undefined) t.status = 'pending';
                });
            });

            const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
            setVal('hours-per-week', appData.settings.weeklyHours || 28);
            setVal('cfg-hr-rev', appData.settings.revDur || 0.5);
            setVal('cfg-hr-que', appData.settings.queDur || 1.0);
            setVal('cfg-hr-teo-slice', appData.settings.teoSlice || 1.5);
            setVal('cfg-max-teo-day', appData.settings.maxTeoPerDay || 2);
            setVal('cfg-max-rev-day', appData.settings.maxRevPerDay || 2);
            setVal('cfg-max-que-day', appData.settings.maxQuePerDay || 2);

            if (appData.cycle && appData.cycle.active) {
                currentCalWeekView = Math.floor((appData.cycle.currentCycleDayIndex || 0) / 7);
            }

            renderProfileSelector();
            checkOverdueStatus();
            renderAll();
        }

        function saveData() {
            try {
                const storageKey = `studyPlannerData_${currentProfileKey}`;
                localStorage.setItem(storageKey, JSON.stringify(appData));
            } catch(e) {
                console.warn("Erro ao gravar dados no localStorage", e);
            }
        }

        function switchTab(tabId) {
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
            
            const targetSection = document.getElementById(`view-${tabId}`);
            if (targetSection) targetSection.classList.add('active');
            
            const tabs = document.querySelectorAll('.nav-tab');
            tabs.forEach(tab => {
                const attr = tab.getAttribute('onclick') || '';
                if (attr.includes(`'${tabId}'`)) {
                    tab.classList.add('active');
                }
            });

            if (tabId === 'calendario') {
                if (appData.cycle && appData.cycle.active) {
                    currentCalWeekView = Math.floor((appData.cycle.currentCycleDayIndex || 0) / 7);
                }
                renderCalendar();
            } else { 
                renderAll(); 
            }
        }

        // --- SISTEMA DE VERIFICAÇÃO DE ATRASO ---
        function checkOverdueStatus() {
            const banner = document.getElementById('late-warning-banner');
            if (!banner) return;

            if (!appData.cycle || !appData.cycle.active || !appData.cycle.startDate) {
                banner.style.display = 'none';
                return;
            }

            const activeIdx = appData.cycle.currentCycleDayIndex || 0;
            if (activeIdx >= appData.cycle.days.length) {
                banner.style.display = 'none';
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const start = new Date(appData.cycle.startDate);
            start.setHours(0, 0, 0, 0);

            const expectedDate = new Date(start);
            expectedDate.setDate(start.getDate() + activeIdx);

            if (today.getTime() > expectedDate.getTime()) {
                banner.style.display = 'flex';
            } else {
                banner.style.display = 'none';
            }
        }

        function realignCycleToToday() {
            customConfirm("Isso ajustará as datas do cronograma restante a partir da data de hoje, mantendo todo o seu histórico já concluído. Deseja prosseguir?", () => {
            const now = new Date();
            const activeIdx = appData.cycle.currentCycleDayIndex || 0;
            
            const newStart = new Date(now);
            newStart.setDate(now.getDate() - activeIdx);
            appData.cycle.startDate = newStart.toISOString();

            for(let i = 0; i < appData.cycle.days.length; i++) {
                let d = new Date(newStart);
                d.setDate(newStart.getDate() + i);
                appData.cycle.dateLabels[i] = `${dayNames[d.getDay()]}, ${d.toLocaleDateString('pt-BR').substring(0,5)}`;
            }

            saveData();
            checkOverdueStatus();
            renderAll();
            customAlert("Datas do ciclo realinhadas para hoje com sucesso!");
            });
        }

        function dismissLateBanner() {
            const banner = document.getElementById('late-warning-banner');
            if (banner) banner.style.display = 'none';
        }

        // --- PERSONALIZAÇÃO EM LOTE (MODAL GRANDE) ---
        function openCustomizeModal(subId) {
            currentCustSubId = subId;
            const sub = appData.subjects.find(s => s.id === subId);
            if (!sub) return;
            const titleEl = document.getElementById('cust-title');
            if (titleEl) titleEl.innerText = `Personalizar: ${sub.name}`;
            const weightEl = document.getElementById('cust-sub-weight');
            if (weightEl) weightEl.value = sub.weight || 3; 
            const newTopEl = document.getElementById('cust-new-topic');
            if (newTopEl) newTopEl.value = '';
            renderCustomizeList();
            const modal = document.getElementById('modal-customize');
            if (modal) modal.style.display = 'flex';
        }

        function addTopicFromCust() {
            const input = document.getElementById('cust-new-topic');
            if (!input) return;
            const val = input.value.trim();
            if(!val) return;
            const sub = appData.subjects.find(s => s.id === currentCustSubId);
            if (!sub) return;
            sub.topics.push({ 
                id: generateId('top'), 
                name: val, 
                status: 'pending', 
                rounds: 0, 
                phases: ['Teoria', 'Revisão', 'Questões'], 
                currentPhaseIdx: 0, 
                qTotal: 0, 
                qCorrect: 0, 
                link: "", 
                teoHours: 2.0 
            });
            input.value = '';
            renderCustomizeList();
        }

        function removeTopicCust(topicId) {
            customConfirm("Remover este assunto?", () => {
            const sub = appData.subjects.find(s => s.id === currentCustSubId);
            if (!sub) return;
            sub.topics = sub.topics.filter(t => t.id !== topicId);
            renderCustomizeList();
            });
        }

        // --- DRAG AND DROP REORDERING ---
        let dragSrcCustTopic = null;

        function handleCustTopicDragStart(e) {
            if (!e.target.classList || !e.target.classList.contains('cust-topic-row')) return;
            dragSrcCustTopic = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
        }

        function handleCustTopicDragOver(e) {
            e.preventDefault(); // Necessary to allow dropping
            e.dataTransfer.dropEffect = 'move';
            return false;
        }

        function handleCustTopicDragEnter(e) {
            let row = e.target.closest('.cust-topic-row');
            if (row && row !== dragSrcCustTopic) {
                row.style.borderTop = '2px solid var(--color-primary)';
            }
        }

        function handleCustTopicDragLeave(e) {
            let row = e.target.closest('.cust-topic-row');
            if (row && row !== dragSrcCustTopic) {
                row.style.borderTop = ''; // Reset
            }
        }


        function moveTopicCust(topicId, direction) {
            const sub = appData.subjects.find(s => s.id === currentCustSubId);
            if (!sub) return;
            const index = sub.topics.findIndex(t => t.id === topicId);
            if (index < 0) return;
            
            const newIndex = index + direction;
            if (newIndex >= 0 && newIndex < sub.topics.length) {
                const temp = sub.topics[index];
                sub.topics[index] = sub.topics[newIndex];
                sub.topics[newIndex] = temp;
                renderCustomizeList();
            }
        }

        function handleCustTopicDrop(e) {
            e.stopPropagation(); // Stops the browser from redirecting
            
            let row = e.target.closest('.cust-topic-row');
            if (row && dragSrcCustTopic !== row) {
                row.style.borderTop = '';
                
                const draggedId = dragSrcCustTopic.getAttribute('data-id');
                const targetId = row.getAttribute('data-id');
                
                const sub = appData.subjects.find(s => s.id === currentCustSubId);
                if (sub) {
                    const draggedIndex = sub.topics.findIndex(t => t.id === draggedId);
                    const targetIndex = sub.topics.findIndex(t => t.id === targetId);
                    
                    if (draggedIndex > -1 && targetIndex > -1) {
                        // Remove from old position and insert into new position
                        const [item] = sub.topics.splice(draggedIndex, 1);
                        sub.topics.splice(targetIndex, 0, item);
                        
                        renderCustomizeList(); // Re-render to reflect changes
                    }
                }
            }
            if(dragSrcCustTopic) {
                dragSrcCustTopic.classList.remove('dragging');
            }
            return false;
        }

        document.addEventListener('dragend', function(e) {
            if (e.target && e.target.classList && e.target.classList.contains('cust-topic-row')) {
                e.target.classList.remove('dragging');
                document.querySelectorAll('.cust-topic-row').forEach(row => {
                    row.style.borderTop = '';
                });
            }
        });


        function renderCustomizeList() {
            const listContainer = document.getElementById('cust-topics-list');
            if (!listContainer) return;
            const sub = appData.subjects.find(s => s.id === currentCustSubId);
            
            if(!sub || !sub.topics || sub.topics.length === 0) {
                listContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-secondary);">Nenhum assunto cadastrado ainda.</div>`;
                return;
            }

            listContainer.innerHTML = sub.topics.map(t => {
                const phases = t.phases || [];
                const hasTeo = phases.includes('Teoria') ? 'checked' : '';
                const hasRev = phases.includes('Revisão') ? 'checked' : '';
                const hasQue = phases.includes('Questões') ? 'checked' : '';
                
                let rowClass = 'cust-topic-row';
                if(t.status === 'unlisted') rowClass += ' unlisted';
                else if(t.status === 'completed') rowClass += ' completed';
                
                return `
                <div class="${rowClass}" data-id="${t.id}" draggable="true" ondragstart="handleCustTopicDragStart(event)" ondragover="handleCustTopicDragOver(event)" ondrop="handleCustTopicDrop(event)" ondragenter="handleCustTopicDragEnter(event)" ondragleave="handleCustTopicDragLeave(event)">
                    <div class="drag-handle" title="Arraste para reordenar">☰</div>
                    <div style="display: flex; flex-direction: column; gap: 2px; margin-right: 8px;">
                        <button class="btn btn-outline" style="padding: 2px 6px; font-size: 10px; line-height: 1;" onclick="moveTopicCust('${t.id}', -1)" title="Mover para Cima">▲</button>
                        <button class="btn btn-outline" style="padding: 2px 6px; font-size: 10px; line-height: 1;" onclick="moveTopicCust('${t.id}', 1)" title="Mover para Baixo">▼</button>
                    </div>
                    <div class="cust-topic-name">${t.name}</div>
                    <div class="cust-phases">
                        <label><input type="checkbox" class="c-phase" value="Teoria" ${hasTeo} onchange="handleCustPhaseChange(this)"> Teoria</label>
                        <label><input type="checkbox" class="c-phase" value="Revisão" ${hasRev} onchange="handleCustPhaseChange(this)"> Revisão</label>
                        <label><input type="checkbox" class="c-phase" value="Questões" ${hasQue} onchange="handleCustPhaseChange(this)"> Questões</label>
                    </div>
                    <div class="cust-status-group">
                        <div class="teo-input-wrapper">
                            <span>Teoria (h):</span>
                            <input type="number" class="teo-hrs-input" value="${t.teoHours || 2.0}" step="0.5" min="0.5" style="width: 55px; font-size: 11px; padding: 4px; background: var(--bg-main);">
                        </div>
                        <select class="status-select" style="background: var(--bg-main);" onchange="handleCustStatusChange(this)">
                            <option value="pending" ${t.status==='pending'?'selected':''}>⏳ Pendente</option>
                            <option value="completed" ${t.status==='completed'?'selected':''}>✅ Concluído</option>
                            <option value="unlisted" ${t.status==='unlisted'?'selected':''}>⏸ Não List</option>
                        </select>
                    </div>
                    <button class="btn btn-outline btn-icon" onclick="removeTopicCust('${t.id}')" title="Excluir">✕</button>
                </div>
                `;
            }).join('');
        }

        function handleCustStatusChange(selectEl) {
            const row = selectEl.closest('.cust-topic-row');
            if (!row) return;
            const checkboxes = row.querySelectorAll('.c-phase');
            row.classList.remove('unlisted', 'completed');
            
            if (selectEl.value === 'unlisted') {
                checkboxes.forEach(cb => cb.checked = false);
                row.classList.add('unlisted');
            } else if (selectEl.value === 'completed') {
                row.classList.add('completed');
            }
        }

        function handleCustPhaseChange(cbEl) {
            const row = cbEl.closest('.cust-topic-row');
            if (!row) return;
            const selectEl = row.querySelector('.status-select');
            const checkboxes = row.querySelectorAll('.c-phase');
            const anyChecked = Array.from(checkboxes).some(c => c.checked);

            if (cbEl.checked && selectEl && selectEl.value === 'unlisted') {
                selectEl.value = 'pending';
                row.classList.remove('unlisted', 'completed');
            } else if (!anyChecked && selectEl.value !== 'unlisted') {
                selectEl.value = 'unlisted';
                row.classList.remove('completed');
                row.classList.add('unlisted');
            }
        }

        function toggleAllCustPhase(phaseVal) {
            const checkboxes = document.querySelectorAll(`.cust-topic-row .c-phase[value="${phaseVal}"]`);
            if(checkboxes.length === 0) return;
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => { cb.checked = !allChecked; handleCustPhaseChange(cb); });
        }

        function saveCustomization() {
            const sub = appData.subjects.find(s => s.id === currentCustSubId);
            if (!sub) return;
            const rows = document.querySelectorAll('.cust-topic-row');
            
            const weightEl = document.getElementById('cust-sub-weight');
            sub.weight = parseInt(weightEl ? weightEl.value : 3) || 3;
            
            rows.forEach(row => {
                const tId = row.getAttribute('data-id');
                const topic = sub.topics.find(t => t.id === tId);
                if (!topic) return;

                const checkedBoxes = Array.from(row.querySelectorAll('.c-phase:checked')).map(cb => cb.value);
                const statusEl = row.querySelector('.status-select');
                const teoEl = row.querySelector('.teo-hrs-input');
                
                let newStatus = statusEl ? statusEl.value : 'pending';
                let newTeoHrs = teoEl ? (parseFloat(teoEl.value) || 2.0) : 2.0;
                
                if(checkedBoxes.length === 0 && newStatus !== 'completed') newStatus = 'unlisted';

                topic.phases = checkedBoxes;
                topic.teoHours = newTeoHrs;

                if(topic.status !== newStatus) {
                    topic.status = newStatus;
                    if(newStatus === 'pending') topic.currentPhaseIdx = 0; 
                }
                if (topic.phases.length > 0 && topic.currentPhaseIdx >= topic.phases.length) {
                    topic.currentPhaseIdx = topic.phases.length - 1;
                }
            });

            const modal = document.getElementById('modal-customize');
            if (modal) modal.style.display = 'none';
            saveData(); 
            renderAll();
        }

        // --- DISCIPLINAS & CARDS ---
        function openSubjectModal() { 
            const nameEl = document.getElementById('new-subj-name');
            if (nameEl) nameEl.value = '';
            const weightEl = document.getElementById('new-subj-weight');
            if (weightEl) weightEl.value = 3;
            const modal = document.getElementById('modal-disciplina');
            if (modal) modal.style.display = 'flex'; 
        }

        function saveNewSubject() {
            const nameEl = document.getElementById('new-subj-name');
            const name = nameEl ? nameEl.value.trim() : '';
            if (!name) return customAlert("Digite o nome da disciplina.");
            const weightEl = document.getElementById('new-subj-weight');
            const weight = parseInt(weightEl ? weightEl.value : 3) || 3;
            const colorEl = document.getElementById('new-subj-color');
            const color = colorEl ? colorEl.value : '#3b82f6';

            appData.subjects.push({ 
                id: generateId('sub'), 
                name, 
                weight, 
                color, 
                hidden: false,
                topics: [] 
            });

            const modal = document.getElementById('modal-disciplina');
            if (modal) modal.style.display = 'none'; 
            saveData(); 
            renderAll();
        }

        function removeSubject(id) { 
            customConfirm("Remover esta disciplina e todos os seus assuntos?", () => {
                appData.subjects = appData.subjects.filter(s => s.id !== id); 
                saveData(); 
                renderAll(); 
            }); 
        }

        function toggleHideSubject(subId) {
            const sub = appData.subjects.find(s => s.id === subId);
            if (!sub) return;
            sub.hidden = !sub.hidden;
            saveData();
            renderAll();
        }

        function renderSubjects() {
            const container = document.getElementById('subjects-container');
            if (!container) return;
            container.innerHTML = '';
            
            if (appData.subjects.length === 0) {
                container.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-secondary);">Nenhuma matéria cadastrada. Clique no botão acima para adicionar a primeira.</div>`;
                return;
            }

            appData.subjects.forEach(sub => {
                const topics = sub.topics || [];
                const total = topics.length;
                const completed = topics.filter(t => t.status === 'completed').length;
                const pending = topics.filter(t => t.status === 'pending').length;
                const isHidden = !!sub.hidden;
                
                container.innerHTML += `
                    <div class="subject-card" style="border-top: 4px solid ${sub.color}; ${isHidden ? 'opacity: 0.6; border-style: dashed;' : ''}">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                            <div>
                                <div class="subject-card-title" style="display: flex; align-items: center; gap: 6px;">
                                    ${sub.name}
                                </div>
                                ${isHidden ? '<span style="font-size: 11px; background: rgba(245, 158, 11, 0.15); color: var(--color-warning); border: 1px solid var(--color-warning); padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block; margin-top: 4px;">⏸ Oculta / Fora do Ciclo</span>' : ''}
                            </div>
                            <span style="font-size: 11px; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; font-weight: bold; color: var(--text-secondary); white-space: nowrap;">Peso ${sub.weight}</span>
                        </div>
                        <div class="subject-meta">
                            Assuntos Cadastrados: <strong>${total}</strong><br>
                            Pendentes no Ciclo: <strong>${pending}</strong><br>
                            Concluídos / Revisados: <strong>${completed}</strong>
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: auto; flex-wrap: wrap;">
                            <button class="btn btn-primary" onclick="openCustomizeModal('${sub.id}')" style="flex: 2;">Personalizar</button>
                            <button class="btn ${isHidden ? 'btn-success' : 'btn-outline'}" onclick="toggleHideSubject('${sub.id}')" style="flex: 1.5; font-size: 12px; padding: 6px 10px;" title="${isHidden ? 'Ativar matéria no ciclo' : 'Ocultar matéria do ciclo'}">
                                ${isHidden ? '▶ Ativar' : '⏸ Ocultar'}
                            </button>
                            <button class="btn btn-danger" onclick="removeSubject('${sub.id}')" style="padding: 6px 12px;" title="Excluir disciplina">Remover</button>
                        </div>
                    </div>
                `;
            });
        }

        // --- ABA QUESTÕES COM ACCORDION E SETA MINIMALISTA ---
        function renderQuestionsTab() {
            const container = document.getElementById('questions-container');
            if (!container) return;
            container.innerHTML = '';

            if (appData.subjects.length === 0) {
                container.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-secondary);">Cadastre matérias na aba 'Disciplinas & Fases' para registrar questões.</div>`;
                return;
            }

            appData.subjects.forEach(sub => {
                const topics = sub.topics || [];
                let topicsHtml = topics.map(t => {
                    const qTot = t.qTotal || 0;
                    const qCor = t.qCorrect || 0;
                    let perc = qTot > 0 ? Math.round((qCor / qTot) * 100) : 0;
                    return `
                    <details class="q-accordion">
                        <summary>
                            <div class="q-accordion-title">
                                <span class="color-dot" style="background-color: ${sub.color}"></span>
                                <span>${t.name}</span>
                            </div>
                            <div class="q-arrow-badge">
                                <span style="font-size:12px; font-weight:700; color:${perc >= 70 ? 'var(--color-success)' : (qTot > 0 ? 'var(--color-warning)' : 'var(--text-secondary)')};">
                                    ${qTot > 0 ? perc + '%' : 'Sem dados'}
                                </span>
                                <span class="q-arrow">▼</span>
                            </div>
                        </summary>
                        <div class="q-body">
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                <div>
                                    <label style="font-size:11px; color:var(--text-secondary); margin-bottom:4px;">Total Resolvidas</label>
                                    <input type="number" id="qtot_${t.id}" value="${qTot}" placeholder="Ex: 50" min="0">
                                </div>
                                <div>
                                    <label style="font-size:11px; color:var(--text-secondary); margin-bottom:4px;">Acertos</label>
                                    <input type="number" id="qcor_${t.id}" value="${qCor}" placeholder="Ex: 42" min="0">
                                </div>
                            </div>
                            <div>
                                <label style="font-size:11px; color:var(--text-secondary); margin-bottom:4px;">Link Caderno / Filtro (QConcursos, TEC, Gran, PDF)</label>
                                <div style="display:flex; gap:8px;">
                                    <input type="text" id="qlnk_${t.id}" value="${t.link || ''}" style="flex:1;" placeholder="https://...">
                                    <button class="btn btn-outline btn-icon" onclick="openCadernoLink('${t.id}')" title="Abrir Link">🔗</button>
                                </div>
                            </div>
                            <button class="btn btn-outline" style="width:100%; padding:8px; margin-top:4px;" onclick="saveQStats('${sub.id}','${t.id}')">Salvar Alterações</button>
                        </div>
                    </details>
                    `;
                }).join('');

                container.innerHTML += `
                    <div class="subject-card" style="border-top:4px solid ${sub.color}">
                        <h3>${sub.name}</h3>
                        ${topicsHtml || '<div style="color:var(--text-secondary); font-size:13px; padding:10px 0;">Nenhum assunto adicionado ainda.</div>'}
                    </div>
                `;
            });
        }

        function openCadernoLink(topicId) {
            const input = document.getElementById(`qlnk_${topicId}`);
            const raw = input ? input.value.trim() : '';
            if (!raw) return customAlert("Nenhum link cadastrado para este assunto.");
            const url = (raw.startsWith('http://') || raw.startsWith('https://')) ? raw : `https://${raw}`;
            window.open(url, '_blank');
        }

        function saveQStats(subId, topicId) {
            const sub = appData.subjects.find(s => s.id === subId);
            if (!sub) return;
            const topic = sub.topics.find(t => t.id === topicId);
            if (!topic) return;

            const totEl = document.getElementById(`qtot_${topicId}`);
            const corEl = document.getElementById(`qcor_${topicId}`);
            const lnkEl = document.getElementById(`qlnk_${topicId}`);

            topic.qTotal = parseInt(totEl ? totEl.value : 0) || 0;
            topic.qCorrect = parseInt(corEl ? corEl.value : 0) || 0;
            topic.link = lnkEl ? lnkEl.value.trim() : '';
            
            if (topic.qCorrect > topic.qTotal) {
                customAlert("Atenção: Os acertos não podem ultrapassar o total de questões.");
                return;
            }

            saveData(); 
            renderAll(); 
            customAlert("Estatísticas e link salvos com sucesso!");
        }

        // --- SISTEMA TAREFA EXTRA ---
        function openExtraTaskModal() {
            const subSelect = document.getElementById('extra-sub');
            if (!subSelect) return;
            subSelect.innerHTML = '<option value="">Selecione uma disciplina...</option>';
            appData.subjects.forEach(sub => {
                subSelect.innerHTML += `<option value="${sub.id}">${sub.name}${sub.hidden ? ' (Oculta)' : ''}</option>`;
            });
            
            const topicSelect = document.getElementById('extra-topic');
            if (topicSelect) topicSelect.innerHTML = '<option value="">Selecione a disciplina primeiro</option>';
            
            const timeEl = document.getElementById('extra-time');
            if (timeEl) timeEl.value = '1.0';
            const qTot = document.getElementById('extra-q-tot');
            if (qTot) qTot.value = '';
            const qCor = document.getElementById('extra-q-cor');
            if (qCor) qCor.value = '';

            const modal = document.getElementById('modal-extra-task');
            if (modal) modal.style.display = 'flex';
        }

        function closeExtraTaskModal() {
            const modal = document.getElementById('modal-extra-task');
            if (modal) modal.style.display = 'none';
        }

        function updateExtraTaskTopics() {
            const subSelect = document.getElementById('extra-sub');
            const subId = subSelect ? subSelect.value : '';
            const topicSelect = document.getElementById('extra-topic');
            if (!topicSelect) return;
            topicSelect.innerHTML = '';
            
            if (!subId) {
                topicSelect.innerHTML = '<option value="">Selecione a disciplina primeiro</option>';
                return;
            }
            
            const sub = appData.subjects.find(s => s.id === subId);
            if(!sub || !sub.topics || sub.topics.length === 0) {
                topicSelect.innerHTML = '<option value="">Nenhum assunto nesta disciplina</option>';
            } else {
                sub.topics.forEach(top => {
                    topicSelect.innerHTML += `<option value="${top.id}">${top.name}</option>`;
                });
            }
        }

        function saveExtraTask() {
            const subSelect = document.getElementById('extra-sub');
            const topSelect = document.getElementById('extra-topic');
            const phaseSelect = document.getElementById('extra-phase');
            const timeEl = document.getElementById('extra-time');
            const qTotEl = document.getElementById('extra-q-tot');
            const qCorEl = document.getElementById('extra-q-cor');

            const subId = subSelect ? subSelect.value : '';
            const topicId = topSelect ? topSelect.value : '';
            const phase = phaseSelect ? phaseSelect.value : 'Teoria';
            const time = parseFloat(timeEl ? timeEl.value : 1.0) || 1.0;
            const qTot = parseInt(qTotEl ? qTotEl.value : 0) || 0;
            const qCor = parseInt(qCorEl ? qCorEl.value : 0) || 0;

            if(!subId || !topicId) return customAlert("Selecione a disciplina e o assunto.");
            if(time > 1.5) return customAlert("Tarefas extras não devem exceder 1,5h (90 min) de acordo com o padrão do ciclo.");
            if(qCor > qTot) return customAlert("Acertos não podem ser maiores que o total de questões.");

            const sub = appData.subjects.find(s => s.id === subId);
            const topic = sub ? sub.topics.find(t => t.id === topicId) : null;
            if (!sub || !topic) return customAlert("Erro ao identificar matéria/assunto.");

            const activeIdx = appData.cycle.currentCycleDayIndex || 0;
            if (!Array.isArray(appData.cycle.days[activeIdx])) {
                appData.cycle.days[activeIdx] = [];
            }

            const newTask = {
                id: generateId('task'),
                subId: sub.id, 
                topicId: topic.id, 
                subjectName: sub.name, 
                topic: topic.name, 
                phase: phase, 
                color: sub.color,
                done: false, 
                durationNum: time, 
                durationStr: formatHours(time),
                prefilledQTotal: qTot, 
                prefilledQCorrect: qCor,
                isLastPart: true
            };

            appData.cycle.days[activeIdx].push(newTask);
            saveData();
            closeExtraTaskModal();
            renderAll();
            customAlert("Tarefa Extra adicionada com sucesso ao seu dia ativo!");
        }

        // --- CONCLUSÃO E CHECK DE TAREFA COM VÍNCULO DIRETO ---
        function updateTopicHistoryOnTaskChange(topicId) {
            let latestTime = 0;
            if (appData.cycle && Array.isArray(appData.cycle.days)) {
                appData.cycle.days.forEach(dayTasks => {
                    if (Array.isArray(dayTasks)) {
                        dayTasks.forEach(t => {
                            if (t.topicId === topicId && t.done && t.completedAt) {
                                if (t.completedAt > latestTime) {
                                    latestTime = t.completedAt;
                                }
                            }
                        });
                    }
                });
            }
            if (latestTime > 0) {
                appData.topicHistory[topicId] = latestTime;
            } else {
                delete appData.topicHistory[topicId];
            }
        }

        function toggleTaskDone(dayIndex, taskId) {
            if (appData.cycle.completedDays && appData.cycle.completedDays[dayIndex]) return; 
            const dayTasks = appData.cycle.days[dayIndex];
            if (!Array.isArray(dayTasks)) return;
            const task = dayTasks.find(t => t.id === taskId);
            if(!task) return;

            if (task.done) { 
                task.done = false;
                appData.totalHours = Math.max(0, appData.totalHours - (task.durationNum || 0));
                appData.completedTasksCount = Math.max(0, appData.completedTasksCount - 1);
                
                const sub = appData.subjects.find(s => s.id === task.subId);
                const targetTopic = sub ? sub.topics.find(t => t.id === task.topicId) : null;
                
                if (targetTopic) {
                    if (task.recordedQTotal) {
                        targetTopic.qTotal = Math.max(0, (targetTopic.qTotal || 0) - task.recordedQTotal);
                        targetTopic.qCorrect = Math.max(0, (targetTopic.qCorrect || 0) - task.recordedQCorrect);
                        delete task.recordedQTotal;
                        delete task.recordedQCorrect;
                    }
                    
                    if (task.isLastPart !== false) {
                        if (targetTopic.currentPhaseIdx > 0) targetTopic.currentPhaseIdx--;
                        else if (targetTopic.status === 'completed' && targetTopic.rounds > 0) {
                            targetTopic.status = 'pending'; targetTopic.rounds--;
                            targetTopic.currentPhaseIdx = targetTopic.phases.length - 1;
                        }
                    }
                }

                delete task.completedAt;
                updateTopicHistoryOnTaskChange(task.topicId);

                saveData(); 
                renderAll();
            } else {
                pendingTaskObj = task; 
                const qTot = document.getElementById('q-input-total');
                if (qTot) qTot.value = task.prefilledQTotal || '';
                const qCor = document.getElementById('q-input-correct');
                if (qCor) qCor.value = task.prefilledQCorrect || '';
                
                const step1 = document.getElementById('q-step-1');
                if (step1) step1.style.display = 'flex';
                const step2 = document.getElementById('q-step-2');
                if (step2) step2.style.display = 'none';
                const modal = document.getElementById('modal-questions');
                if (modal) modal.style.display = 'flex';
            }
        }

        function showQuestionInputs() { 
            const s1 = document.getElementById('q-step-1');
            if (s1) s1.style.display = 'none'; 
            const s2 = document.getElementById('q-step-2');
            if (s2) s2.style.display = 'flex'; 
        }

        function skipQuestionsAndFinish() { 
            finalizeTaskData(0, 0); 
            const modal = document.getElementById('modal-questions');
            if (modal) modal.style.display = 'none'; 
        }

        function submitQuestionsAndFinish() {
            const totEl = document.getElementById('q-input-total');
            const corEl = document.getElementById('q-input-correct');
            const total = parseInt(totEl ? totEl.value : 0) || 0;
            const correct = parseInt(corEl ? corEl.value : 0) || 0;
            if (correct > total) return customAlert("Acertos não podem ser maiores que o total!");
            finalizeTaskData(total, correct);
            const modal = document.getElementById('modal-questions');
            if (modal) modal.style.display = 'none';
        }

        function finalizeTaskData(qTotal, qCorrect) {
            const task = pendingTaskObj;
            if (!task) return;
            task.done = true;
            task.completedAt = Date.now();
            task.recordedQTotal = qTotal;
            task.recordedQCorrect = qCorrect;

            appData.totalHours += (task.durationNum || 0); 
            appData.completedTasksCount++;
            appData.topicHistory[task.topicId] = task.completedAt; 
            
            const sub = appData.subjects.find(s => s.id === task.subId);
            const top = sub ? sub.topics.find(t => t.id === task.topicId) : null;
            
            if (top) {
                top.qTotal = (top.qTotal || 0) + qTotal; 
                top.qCorrect = (top.qCorrect || 0) + qCorrect;
                
                if (task.isLastPart !== false) {
                    top.currentPhaseIdx = (top.currentPhaseIdx || 0) + 1;
                    if (top.currentPhaseIdx >= top.phases.length) {
                        top.rounds = (top.rounds || 0) + 1; 
                        top.status = 'completed'; 
                        top.currentPhaseIdx = 0; 
                    }
                }
            }
            saveData(); 
            renderAll();
        }

        function commitTodayProgress() {
            const activeIdx = appData.cycle.currentCycleDayIndex || 0;
            if (!appData.cycle.completedDays) appData.cycle.completedDays = [];
            appData.cycle.completedDays[activeIdx] = true;
            appData.streak++; 
            appData.cycle.currentCycleDayIndex = activeIdx + 1;
            saveData(); 
            checkOverdueStatus();
            renderAll(); 
            window.scrollTo(0, 0);
            };
            if(appData.cycle.active) customConfirm("Atenção: Isso gerará um NOVO cronograma completo de estudos substituindo o atual. Deseja prosseguir?", proceed);
            else proceed();
        }

        // --- GERAÇÃO AVANÇADA DE CICLO COM LIMITES DIÁRIOS POR FASE ---
        function generateMacroCycle() {
            if (appData.subjects.length === 0) return customAlert("Cadastre disciplinas antes de gerar um ciclo.");
            const proceed = () => {
            const weeklyHoursEl = document.getElementById('hours-per-week');
            const revDurEl = document.getElementById('cfg-hr-rev');
            const queDurEl = document.getElementById('cfg-hr-que');
            const teoSliceEl = document.getElementById('cfg-hr-teo-slice');
            const maxTeoEl = document.getElementById('cfg-max-teo-day');
            const maxRevEl = document.getElementById('cfg-max-rev-day');
            const maxQueEl = document.getElementById('cfg-max-que-day');

            const totalWeeklyHours = parseFloat(weeklyHoursEl ? weeklyHoursEl.value : 28) || 28;
            const dailyTargetHours = totalWeeklyHours / 7;
            
            const durRevisao = parseFloat(revDurEl ? revDurEl.value : 0.5) || 0.5;
            const durQuestoes = parseFloat(queDurEl ? queDurEl.value : 1.0) || 1.0;
            const maxSlice = parseFloat(teoSliceEl ? teoSliceEl.value : 1.5) || 1.5;

            const maxTeoDay = parseInt(maxTeoEl ? maxTeoEl.value : 2) || 2;
            const maxRevDay = parseInt(maxRevEl ? maxRevEl.value : 2) || 2;
            const maxQueDay = parseInt(maxQueEl ? maxQueEl.value : 2) || 2;

            appData.settings.weeklyHours = totalWeeklyHours;
            appData.settings.revDur = durRevisao;
            appData.settings.queDur = durQuestoes;
            appData.settings.teoSlice = maxSlice;
            appData.settings.maxTeoPerDay = maxTeoDay;
            appData.settings.maxRevPerDay = maxRevDay;
            appData.settings.maxQuePerDay = maxQueDay;

            function getPhaseDur(phaseName, topTeoHrs) {
                if (phaseName === 'Teoria') return topTeoHrs || 2.0; 
                if (phaseName === 'Revisão') return durRevisao;
                if (phaseName === 'Questões') return durQuestoes;
                return 1.0;
            }

            let simTopics = [];
            const now = Date.now();
            
            appData.subjects.forEach(sub => {
                if (sub.hidden) return;
                const topics = sub.topics || [];
                topics.forEach(top => {
                    const phases = top.phases || ['Teoria', 'Revisão', 'Questões'];
                    const curIdx = top.currentPhaseIdx || 0;
                    if (top.status === 'pending' && phases.length > 0 && curIdx < phases.length) {
                        const lastSeen = appData.topicHistory[top.id] || 0;
                        let stalenessBonus = lastSeen > 0 ? Math.min(((now - lastSeen) / 86400000) * 0.15, 4) : 1; 
                        
                        simTopics.push({
                            subId: sub.id, 
                            topicId: top.id, 
                            subName: sub.name, 
                            topicName: top.name, 
                            color: sub.color, 
                            weight: sub.weight || 3, 
                            bonus: stalenessBonus,
                            phases: phases, 
                            simIdx: curIdx, 
                            teoHours: top.teoHours || 2.0,
                            remainingDur: 0, 
                            currentPart: 1, 
                            totalParts: 0
                        });
                    }
                });
            });

            if(simTopics.length === 0) return customAlert("Não há assuntos marcados como Pendentes em disciplinas ativas para gerar o ciclo! Verifique na aba 'Disciplinas & Fases'.");

            let allDays = [[]];
            let currentDayIndex = 0;
            let currentDayHours = 0;
            let loopSafety = 0;

            while(simTopics.some(t => t.simIdx < t.phases.length) && loopSafety < 5000) {
                loopSafety++;
                
                const currentDayTasks = allDays[currentDayIndex];
                
                let countTeo = currentDayTasks.filter(task => task.phase.startsWith('Teoria')).length;
                let countRev = currentDayTasks.filter(task => task.phase.startsWith('Revisão')).length;
                let countQue = currentDayTasks.filter(task => task.phase.startsWith('Questões')).length;

                let validTopics = simTopics.filter(t => {
                    if (t.simIdx >= t.phases.length) return false;
                    if (currentDayTasks.some(task => task.topicId === t.topicId)) return false;

                    let nextPhase = t.phases[t.simIdx];
                    if (nextPhase === 'Teoria' && countTeo >= maxTeoDay) return false;
                    if (nextPhase === 'Revisão' && countRev >= maxRevDay) return false;
                    if (nextPhase === 'Questões' && countQue >= maxQueDay) return false;

                    return true;
                });

                if (validTopics.length === 0) {
                    currentDayIndex++; 
                    allDays.push([]); 
                    currentDayHours = 0;
                    continue;
                }

                validTopics.forEach(t => {
                    let phaseBonus = 0;
                    if (t.phases[t.simIdx] === 'Teoria') phaseBonus = 2;
                    else if (t.phases[t.simIdx] === 'Revisão') phaseBonus = 1;
                    t.score = t.weight + t.bonus + phaseBonus + (Math.random() * 0.4); 
                });

                validTopics.sort((a, b) => b.score - a.score);
                let picked = validTopics[0];
                let phaseName = picked.phases[picked.simIdx];
                
                if (!picked.remainingDur) {
                    picked.remainingDur = getPhaseDur(phaseName, picked.teoHours);
                    picked.totalParts = Math.ceil(picked.remainingDur / maxSlice);
                    picked.currentPart = 1;
                }

                let durNum = Math.min(picked.remainingDur, maxSlice);
                let displayPhaseName = picked.totalParts > 1 ? `${phaseName} (P${picked.currentPart}/${picked.totalParts})` : phaseName;

                picked.remainingDur -= durNum;
                let isLastPart = (picked.remainingDur <= 0.01);

                allDays[currentDayIndex].push({
                    id: generateId('task'), 
                    subId: picked.subId, 
                    topicId: picked.topicId, 
                    subjectName: picked.subName, 
                    topic: picked.topicName, 
                    phase: displayPhaseName, 
                    color: picked.color, 
                    done: false, 
                    durationNum: durNum, 
                    durationStr: formatHours(durNum),
                    isLastPart: isLastPart
                });

                currentDayHours += durNum;

                if (isLastPart) {
                    picked.simIdx++;
                    picked.remainingDur = 0;
                    picked.totalParts = 0;
                } else {
                    picked.currentPart++;
                }

                if (currentDayHours >= dailyTargetHours) {
                    currentDayIndex++; 
                    allDays.push([]); 
                    currentDayHours = 0;
                }
            }

            while (allDays.length % 7 !== 0) { allDays.push([]); }

            const startDateObj = new Date();
            appData.cycle.startDate = startDateObj.toISOString();
            appData.cycle.dateLabels = [];
            
            for(let i = 0; i < allDays.length; i++) {
                let d = new Date(startDateObj); 
                d.setDate(startDateObj.getDate() + i);
                appData.cycle.dateLabels.push(`${dayNames[d.getDay()]}, ${d.toLocaleDateString('pt-BR').substring(0,5)}`);
            }

            appData.cycle.days = allDays;
            appData.cycle.completedDays = Array(allDays.length).fill(false);
            appData.cycle.currentCycleDayIndex = 0; 
            appData.cycle.active = true;
            currentCalWeekView = 0;
            
            saveData(); 
            checkOverdueStatus();
            renderAll(); 
            switchTab('dashboard');
            customAlert(`Ciclo gerado com sucesso! Foram planejados ${allDays.length} dias de estudo com respeito aos seus limites diários.`);
        }

        // --- DASHBOARD E RENDERIZADORES ---
        function renderTodayTasks() {
            const tbody = document.getElementById('today-tasks-body');
            const confirmBox = document.getElementById('confirmation-box');
            const dayCompletedBox = document.getElementById('day-completed-box');
            const btnExtra = document.getElementById('btn-extra-task');
            
            if (!tbody) return;
            tbody.innerHTML = ''; 
            if (confirmBox) confirmBox.style.display = 'none'; 
            if (dayCompletedBox) dayCompletedBox.style.display = 'none';
            const tableCont = document.getElementById('tasks-table-container');
            if (tableCont) tableCont.style.display = 'block';

            if (!appData.cycle || !appData.cycle.active) { 
                const nameEl = document.getElementById('today-name');
                if (nameEl) nameEl.innerText = "Nenhum Ciclo Ativo"; 
                if (btnExtra) btnExtra.style.display = 'none';
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 30px; color: var(--text-secondary);">
                            <div style="font-size: 15px; margin-bottom: 10px;">Nenhum ciclo de estudos está ativo no momento.</div>
                            <button class="btn btn-primary" onclick="switchTab('calendario')">Ir para Ciclo & Calendário para Gerar</button>
                        </td>
                    </tr>
                `;
                return; 
            }

            const activeIdx = appData.cycle.currentCycleDayIndex || 0;
            
            if (activeIdx >= appData.cycle.days.length) { 
                if (tableCont) tableCont.style.display = 'none'; 
                if (dayCompletedBox) dayCompletedBox.style.display = 'flex'; 
                if (btnExtra) btnExtra.style.display = 'none';
                return; 
            }

            if (btnExtra) btnExtra.style.display = 'block';
            const nameEl = document.getElementById('today-name');
            if (nameEl) nameEl.innerText = appData.cycle.dateLabels[activeIdx] || `Dia ${activeIdx + 1}`;
            
            const currentTasks = appData.cycle.days[activeIdx] || [];
            
            if(currentTasks.length === 0) { 
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-success); padding: 24px;">Dia de descanso/revisão livre planejado! Clique no botão abaixo para avançar ao próximo dia.</td></tr>`;
                if (confirmBox) confirmBox.style.display = 'flex'; 
                return; 
            }

            let allChecked = true;
            currentTasks.forEach((task, index) => {
                if (!task.done) allChecked = false;
                tbody.innerHTML += `
                    <tr class="${task.done ? 'staged' : ''}">
                        <td><span class="color-dot" style="background-color: ${task.color}"></span>${index + 1}</td>
                        <td style="font-weight: 600;">${task.subjectName}</td>
                        <td><span class="badge-fase">${task.phase}</span></td>
                        <td>${task.topic}</td>
                        <td><span class="duration-tag">${task.durationStr}</span></td>
                        <td>
                            <input type="checkbox" class="big-chk" ${task.done ? 'checked' : ''} onchange="toggleTaskDone(${activeIdx}, '${task.id}')">
                        </td>
                    </tr>
                `;
            });
            
            if (allChecked && confirmBox) confirmBox.style.display = 'flex';
        }

        function updateDashboardStats() {
            const streakEl = document.getElementById('streak-val');
            if (streakEl) streakEl.innerText = `${appData.streak || 0} dias`;
            const hoursEl = document.getElementById('hours-val');
            if (hoursEl) hoursEl.innerText = formatHours(appData.totalHours);
            const topicsEl = document.getElementById('topics-val');
            if (topicsEl) topicsEl.innerText = appData.completedTasksCount || 0;
            
            let totQ = 0, corQ = 0;
            appData.subjects.forEach(s => {
                const topics = s.topics || [];
                topics.forEach(t => { 
                    totQ += (t.qTotal || 0); 
                    corQ += (t.qCorrect || 0); 
                });
            });
            const perfEl = document.getElementById('perf-val');
            if (perfEl) perfEl.innerText = totQ > 0 ? (corQ/totQ*100).toFixed(1).replace('.',',') + '%' : '0,0%';

            const progressContainer = document.getElementById('progress-container');
            if (!progressContainer) return;
            progressContainer.innerHTML = '';
            
            if (appData.subjects.length === 0) {
                progressContainer.innerHTML = '<div style="color:var(--text-secondary); font-size:13px;">Cadastre matérias para visualizar o avanço do edital.</div>';
                return;
            }

            appData.subjects.forEach(sub => {
                const topics = sub.topics || [];
                let totalPhases = 0; 
                let completedPhases = 0;
                topics.forEach(t => {
                    const phases = t.phases || [];
                    if (t.status !== 'unlisted' && phases.length > 0) {
                        totalPhases += phases.length;
                        if (t.status === 'completed') completedPhases += phases.length;
                        else if (t.status === 'pending') completedPhases += (t.currentPhaseIdx || 0);
                    }
                });

                let perc = totalPhases === 0 ? 0 : Math.round((completedPhases / totalPhases) * 100);
                if (totalPhases > 0) {
                    progressContainer.innerHTML += `
                        <div class="progress-item" style="${sub.hidden ? 'opacity: 0.55;' : ''}">
                            <div class="progress-header"><span style="border-left: 3px solid ${sub.color}; padding-left: 8px; font-weight:500;">${sub.name}${sub.hidden ? ' <small style="color: var(--color-warning); font-size: 11px;">(Oculta)</small>' : ''}</span><span>${perc}%</span></div>
                            <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${perc}%; background-color: ${sub.color};"></div></div>
                        </div>
                    `;
                }
            });
        }

        // --- ATIVIDADE DE MANUTENÇÃO INTELIGENTE (PRIORIZAÇÃO 2 VERTENTES) ---
        function calculateMaintenancePriority(days, qTotal, qCorrect) {
            if (days < 1) return null;

            const perc = qTotal > 0 ? Math.round((qCorrect / qTotal) * 100) : null;
            
            let threshMedia, threshAlta, threshMaxima;
            let reason = '';

            if (perc === null) {
                threshMedia = 5; threshAlta = 12; threshMaxima = 25;
                reason = '📝 Sem questões resolvidas';
            } else if (perc >= 90) {
                threshMedia = 14; threshAlta = 30; threshMaxima = 60;
                reason = `🏆 Domínio Excelente (${perc}%)`;
            } else if (perc >= 80) {
                threshMedia = 7; threshAlta = 15; threshMaxima = 30;
                reason = `⭐ Bom Rendimento (${perc}%)`;
            } else if (perc >= 70) {
                threshMedia = 4; threshAlta = 10; threshMaxima = 20;
                reason = `📘 Rendimento Regular (${perc}%)`;
            } else if (perc >= 50) {
                threshMedia = 2; threshAlta = 5; threshMaxima = 10;
                reason = `⚠️ Desempenho Baixo (${perc}%)`;
            } else {
                threshMedia = 1; threshAlta = 3; threshMaxima = 7;
                reason = `🚨 Acertos Críticos (${perc}%)`;
            }

            let level, badge, color, bg, border;

            if (days >= threshMaxima) {
                level = 'Máxima';
                badge = '🔴 Máxima';
                color = '#ef4444';
                bg = 'rgba(239, 68, 68, 0.15)';
                border = '#ef4444';
                reason = `⏳ Atraso Crítico | ` + reason;
            } else if (days >= threshAlta) {
                level = 'Alta';
                badge = '🟠 Alta';
                color = '#f97316';
                bg = 'rgba(249, 115, 22, 0.15)';
                border = '#f97316';
                reason = `📅 Revisão Necessária | ` + reason;
            } else if (days >= threshMedia) {
                level = 'Média';
                badge = '🟡 Média';
                color = '#f59e0b';
                bg = 'rgba(245, 158, 11, 0.15)';
                border = '#f59e0b';
                reason = `🔄 Manutenção Ideal | ` + reason;
            } else {
                level = 'Baixa';
                badge = '🟢 Baixa';
                color = '#10b981';
                bg = 'rgba(16, 185, 129, 0.15)';
                border = '#10b981';
                if (days === 1) {
                    reason = '🔄 Revisão Ciclo 24h';
                } else {
                    reason = `👍 Recente | ` + reason;
                }
            }

            // Normaliza a pontuação de 0 a 100 para ordenação correta da lista
            let totalScore = 0;
            if (days >= threshMaxima) {
                totalScore = 70 + Math.min(30, (days - threshMaxima) * 2);
            } else if (days >= threshAlta) {
                let span = Math.max(1, threshMaxima - threshAlta);
                totalScore = 50 + Math.floor(((days - threshAlta) / span) * 19);
            } else if (days >= threshMedia) {
                let span = Math.max(1, threshAlta - threshMedia);
                totalScore = 32 + Math.floor(((days - threshMedia) / span) * 17);
            } else {
                let span = Math.max(1, threshMedia - 1);
                totalScore = Math.floor(((days - 1) / span) * 31);
            }

            return {
                level, badge, color, bg, border, reason, totalScore, perc, days
            };
        }

        function renderMaintenance() {
            const cont = document.getElementById('maintenance-container');
            if (!cont) return;
            cont.innerHTML = '';
            
            let list = [];
            const now = Date.now();

            appData.subjects.forEach(s => {
                const topics = s.topics || [];
                topics.forEach(t => {
                    const lastSeen = appData.topicHistory ? appData.topicHistory[t.id] : null;
                    if (lastSeen) {
                        const days = Math.floor((now - lastSeen) / 86400000);
                        const p = calculateMaintenancePriority(days, t.qTotal || 0, t.qCorrect || 0);
                        if (p) {
                            list.push({
                                subName: s.name,
                                subColor: s.color,
                                topicName: t.name,
                                qTotal: t.qTotal || 0,
                                qCorrect: t.qCorrect || 0,
                                priority: p
                            });
                        }
                    }
                });
            });

            if (list.length === 0) {
                cont.innerHTML = `
                    <div style="background: rgba(16, 185, 129, 0.05); border: 1px dashed var(--color-success); border-radius: 8px; padding: 18px; text-align: center; color: var(--text-secondary); font-size: 13px;">
                        <span style="font-size: 20px; display: block; margin-bottom: 6px;">✨</span>
                        <strong>Tudo em dia!</strong><br>
                        Nenhum assunto acumulado para manutenção. Assuntos concluídos hoje só entrarão na fila de revisão a partir de amanhã (+24h).
                    </div>
                `;
                return;
            }

            list.sort((a, b) => b.priority.totalScore - a.priority.totalScore);

            cont.innerHTML = list.slice(0, 6).map(item => {
                const p = item.priority;
                const perfText = p.perc !== null ? `${p.perc}% acertos (${item.qCorrect}/${item.qTotal})` : 'Sem questões';
                return `
                    <div class="maintenance-item" style="border-left: 4px solid ${p.border}; background-color: var(--bg-card); padding: 12px 14px; border-radius: 8px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                            <div>
                                <span style="font-size: 11px; font-weight: 700; color: ${item.subColor || 'var(--color-primary)'}; text-transform: uppercase;">${item.subName}</span>
                                <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-top: 2px;">${item.topicName}</div>
                            </div>
                            <span style="font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 20px; background: ${p.bg}; color: ${p.color}; border: 1px solid ${p.border}; white-space: nowrap;">
                                ${p.badge}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-secondary); border-top: 1px solid rgba(255,255,255,0.05); padding-top: 6px; flex-wrap: wrap; gap: 6px;">
                            <div>
                                <span>⏳ ${p.days} ${p.days === 1 ? 'dia' : 'dias'} sem ver</span> • 
                                <span style="font-weight: 600; color: ${p.perc !== null ? (p.perc >= 70 ? 'var(--color-success)' : 'var(--color-warning)') : 'inherit'};">
                                    🎯 ${perfText}
                                </span>
                            </div>
                            <span style="font-weight: 600; color: ${p.color};">
                                ${p.reason}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // --- NAVEGAÇÃO SEMANAL DO CALENDÁRIO ---
        function nextCalWeek() {
            const totalWeeks = Math.ceil((appData.cycle.days ? appData.cycle.days.length : 0) / 7);
            if (currentCalWeekView < totalWeeks - 1) { 
                currentCalWeekView++; 
                renderCalendar(); 
            }
        }

        function prevCalWeek() {
            if (currentCalWeekView > 0) { 
                currentCalWeekView--; 
                renderCalendar(); 
            }
        }

        // --- MODAL DE CONFIGURAÇÕES DO CICLO ---
        function openCycleSettingsModal() {
            if (appData.settings) {
                const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
                setVal('hours-per-week', appData.settings.weeklyHours || 28);
                setVal('cfg-hr-rev', appData.settings.revDur || 0.5);
                setVal('cfg-hr-que', appData.settings.queDur || 1.0);
                setVal('cfg-hr-teo-slice', appData.settings.teoSlice || 1.5);
                setVal('cfg-max-teo-day', appData.settings.maxTeoPerDay || 2);
                setVal('cfg-max-rev-day', appData.settings.maxRevPerDay || 2);
                setVal('cfg-max-que-day', appData.settings.maxQuePerDay || 2);
            }
            const modal = document.getElementById('modal-cycle-settings');
            if (modal) modal.style.display = 'flex';
        }

        function closeCycleSettingsModal() {
            const modal = document.getElementById('modal-cycle-settings');
            if (modal) modal.style.display = 'none';
        }

        function saveCycleSettings() {
            const weeklyHoursEl = document.getElementById('hours-per-week');
            const revDurEl = document.getElementById('cfg-hr-rev');
            const queDurEl = document.getElementById('cfg-hr-que');
            const teoSliceEl = document.getElementById('cfg-hr-teo-slice');
            const maxTeoEl = document.getElementById('cfg-max-teo-day');
            const maxRevEl = document.getElementById('cfg-max-rev-day');
            const maxQueEl = document.getElementById('cfg-max-que-day');

            const weeklyHours = parseFloat(weeklyHoursEl ? weeklyHoursEl.value : 28) || 28;
            const revDur = parseFloat(revDurEl ? revDurEl.value : 0.5) || 0.5;
            const queDur = parseFloat(queDurEl ? queDurEl.value : 1.0) || 1.0;
            const teoSlice = parseFloat(teoSliceEl ? teoSliceEl.value : 1.5) || 1.5;
            const maxTeoPerDay = parseInt(maxTeoEl ? maxTeoEl.value : 2) || 2;
            const maxRevPerDay = parseInt(maxRevEl ? maxRevEl.value : 2) || 2;
            const maxQuePerDay = parseInt(maxQueEl ? maxQueEl.value : 2) || 2;

            appData.settings = {
                weeklyHours, revDur, queDur, teoSlice,
                maxTeoPerDay, maxRevPerDay, maxQuePerDay
            };

            saveData();
            closeCycleSettingsModal();
            customAlert("Configurações do ciclo salvas com sucesso!");
        }

        // --- SISTEMA DRAG AND DROP DE TAREFAS NO CALENDÁRIO ---
        let draggedTaskData = null;

        function handleTaskDragStart(e, dayIndex, taskId) {
            draggedTaskData = { dayIndex, taskId };
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', JSON.stringify(draggedTaskData));
            }
            
            setTimeout(() => {
                const el = document.getElementById(`task-card-${taskId}`);
                if (el) el.classList.add('dragging');
            }, 0);
        }

        function handleTaskDragEnd(e) {
            const draggingEls = document.querySelectorAll('.task-card.dragging');
            draggingEls.forEach(el => el.classList.remove('dragging'));
            const cols = document.querySelectorAll('.day-column.drag-over');
            cols.forEach(col => col.classList.remove('drag-over'));
            draggedTaskData = null;
        }

        function handleDayDragOver(e, targetDayIndex) {
            if (appData.cycle.completedDays && appData.cycle.completedDays[targetDayIndex]) {
                return;
            }
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
            const col = document.getElementById(`day-col-${targetDayIndex}`);
            if (col && !col.classList.contains('drag-over')) {
                col.classList.add('drag-over');
            }
        }

        function handleDayDragLeave(e, targetDayIndex) {
            const col = document.getElementById(`day-col-${targetDayIndex}`);
            if (col && !col.contains(e.relatedTarget)) {
                col.classList.remove('drag-over');
            }
        }

        function handleDayDrop(e, targetDayIndex) {
            e.preventDefault();
            const col = document.getElementById(`day-col-${targetDayIndex}`);
            if (col) col.classList.remove('drag-over');

            if (!draggedTaskData && e.dataTransfer) {
                try {
                    const str = e.dataTransfer.getData('text/plain');
                    if (str) draggedTaskData = JSON.parse(str);
                } catch(err) {}
            }

            if (!draggedTaskData) return;

            const fromDayIndex = draggedTaskData.dayIndex;
            const taskId = draggedTaskData.taskId;
            draggedTaskData = null;

            if (fromDayIndex === targetDayIndex) return;

            if (appData.cycle.completedDays && appData.cycle.completedDays[targetDayIndex]) {
                customAlert("Este dia já foi concluído e não pode receber novas tarefas.");
                return;
            }

            const fromTasks = appData.cycle.days[fromDayIndex];
            if (!Array.isArray(fromTasks)) return;
            const taskIdx = fromTasks.findIndex(t => t.id === taskId);
            if (taskIdx === -1) return;

            const [movedTask] = fromTasks.splice(taskIdx, 1);
            if (!Array.isArray(appData.cycle.days[targetDayIndex])) {
                appData.cycle.days[targetDayIndex] = [];
            }
            appData.cycle.days[targetDayIndex].push(movedTask);

            saveData();
            renderAll();
        }

        function renderCalendar() {
            const grid = document.getElementById('calendar-grid');
            const nav = document.getElementById('calendar-nav');
            if (!grid) return;
            grid.innerHTML = '';
            
            if(!appData.cycle || !appData.cycle.active || !Array.isArray(appData.cycle.days) || appData.cycle.days.length === 0) {
                if (nav) nav.style.display = 'none'; 
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; padding: 50px 20px; text-align: center; color: var(--text-secondary); background: rgba(0,0,0,0.15); border: 1px dashed var(--border-color); border-radius: 12px;">
                        <span style="font-size: 32px; display: block; margin-bottom: 10px;">📅</span>
                        <h4 style="font-size: 16px; color: var(--text-primary); margin-bottom: 8px;">Nenhum Ciclo Gerado</h4>
                        <p style="font-size: 13px; margin-bottom: 16px;">Clique no botão acima "<strong>⚡ Gerar Ciclo a partir de Hoje</strong>" para montar o cronograma semanal automaticamente.</p>
                        <button class="btn btn-primary" onclick="generateMacroCycle()">⚡ Gerar Ciclo Agora</button>
                    </div>
                `;
                return;
            }

            const totalWeeks = Math.ceil(appData.cycle.days.length / 7);
            if (nav) nav.style.display = 'flex';
            const weekLabel = document.getElementById('cal-week-label');
            if (weekLabel) weekLabel.innerText = `Semana ${currentCalWeekView + 1} de ${totalWeeks}`;

            const startIdx = currentCalWeekView * 7;
            const endIdx = startIdx + 7;

            for(let dIdx = startIdx; dIdx < endIdx; dIdx++) {
                if(dIdx >= appData.cycle.days.length) break;

                const tasks = appData.cycle.days[dIdx] || [];
                const isActive = dIdx === appData.cycle.currentCycleDayIndex;
                const isLocked = appData.cycle.completedDays && appData.cycle.completedDays[dIdx];
                
                let headCls = "day-header"; 
                if(isLocked) headCls += " completed-day"; 
                else if(isActive) headCls += " today";
                
                let dayTotalHours = tasks.reduce((acc, t) => acc + (t.durationNum || 1), 0);
                
                let cards = tasks.map(t => {
                    const isDraggable = !isLocked && !t.done;
                    return `
                    <div class="task-card ${isLocked ? 'locked' : (t.done ? 'staged' : '')}" 
                         id="task-card-${t.id}"
                         style="${!t.done && !isLocked ? `border-left: 4px solid ${t.color}` : ''}"
                         draggable="${isDraggable ? 'true' : 'false'}"
                         ondragstart="handleTaskDragStart(event, ${dIdx}, '${t.id}')"
                         ondragend="handleTaskDragEnd(event)">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <div style="font-weight:bold; color:${t.color}; font-size:12px; display:flex; align-items:center; gap:4px;">
                                    ${isDraggable ? '<span style="cursor:grab; opacity:0.6; font-size:10px;" title="Arraste para mover de dia">⋮⋮</span>' : ''}
                                    ${t.subjectName}
                                </div>
                                <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">${t.topic}</div>
                            </div>
                            <input type="checkbox" class="big-chk" ${t.done ? 'checked' : ''} ${isLocked ? 'disabled' : ''} onchange="toggleTaskDone(${dIdx}, '${t.id}')">
                        </div>
                        <div style="display:flex; gap: 6px; align-items:center;">
                            <span class="badge-fase">${t.phase}</span>
                            <span class="duration-tag">${t.durationStr}</span>
                        </div>
                    </div>
                `;
                }).join('');

                grid.innerHTML += `
                    <div class="day-column" 
                         id="day-col-${dIdx}"
                         ondragover="handleDayDragOver(event, ${dIdx})"
                         ondragleave="handleDayDragLeave(event, ${dIdx})"
                         ondrop="handleDayDrop(event, ${dIdx})">
                        <div class="${headCls}">
                            ${appData.cycle.dateLabels[dIdx]}<br>
                            <span style="font-size:11px; font-weight:normal; opacity: 0.85;">Carga: ${formatHours(dayTotalHours)}</span>
                        </div>
                        ${cards || '<div style="font-size:11px; text-align:center; color:var(--text-secondary); padding:16px; border: 1px dashed rgba(255,255,255,0.05); border-radius:8px;">Livre</div>'}
                    </div>
                `;
            }
        }

        function renderAll() { 
            updateDashboardStats(); 
            renderTodayTasks(); 
            renderMaintenance(); 
            renderSubjects(); 
            renderQuestionsTab(); 
            renderCalendar(); 
        }

        // Execução imediata e garantida no carregamento da página
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadData);
        } else {
            loadData();
        }
    
