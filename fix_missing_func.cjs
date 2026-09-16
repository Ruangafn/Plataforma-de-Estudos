const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const missingFunc = `
        function deleteCurrentCycle() {
            if (!appData.cycle || !appData.cycle.active) {
                customAlert("Não há nenhum ciclo ativo neste perfil para apagar.");
                return;
            }

            customConfirm("Tem certeza que deseja apagar o ciclo atual? As tarefas agendadas e o calendário serão resetados, mas suas matérias e histórico de questões serão mantidos.", () => {
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
`;

// Where should we inject it? Just before resetAllApplicationData()
html = html.replace('function resetAllApplicationData() {', missingFunc + '\n        function resetAllApplicationData() {');

fs.writeFileSync('index.html', html);
