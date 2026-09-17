const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. In simTopics.push, add lastPhaseDay
const pushTarget = `orderIdx: index
                        });`;
const pushReplacement = `orderIdx: index,
                            lastPhaseDay: -99
                        });`;
html = html.replace(pushTarget, pushReplacement);

// 2. In validTopics filter, add gap logic
const filterTarget = `if (currentDayTasks.some(task => task.topicId === t.topicId)) return false;`;
const filterReplacement = `if (currentDayTasks.some(task => task.topicId === t.topicId)) return false;

                    // Lógica de Espaçamento Inteligente (Gap)
                    let nextPhase = t.phases[t.simIdx];
                    if (t.lastPhaseDay >= 0) {
                        if (nextPhase === 'Revisão') {
                            // Espaçamento Teoria -> Revisão: Mínimo 1 dia
                            if (currentDayIndex < t.lastPhaseDay + 1) return false;
                        } else if (nextPhase === 'Questões') {
                            // Espaçamento Revisão -> Questões: Mínimo 0 dias (pode ser no mesmo dia, mas garantido que vem depois)
                            // Para forçar ser no próximo dia, usaríamos +1, mas vamos permitir no mesmo dia se tiver espaço
                        }
                    }`;
html = html.replace(filterTarget, filterReplacement);

// 3. In isLastPart, record the day
const lastPartTarget = `if (isLastPart) {
                    picked.simIdx++;
                    picked.remainingDur = 0;`;
const lastPartReplacement = `if (isLastPart) {
                    picked.simIdx++;
                    picked.remainingDur = 0;
                    picked.lastPhaseDay = currentDayIndex;`;
html = html.replace(lastPartTarget, lastPartReplacement);

fs.writeFileSync('index.html', html);
