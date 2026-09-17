const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const filterTarget = `if (currentDayTasks.some(task => task.topicId === t.topicId)) return false;

                    // Lógica de Espaçamento Inteligente (Gap)`;

const filterReplacement = `// Lógica de Espaçamento Inteligente (Gap)`;

html = html.replace(filterTarget, filterReplacement);

const gapTarget = `let requiredGap = isFirstTime ? 1 : 0;
                            if (currentDayIndex < t.lastPhaseDay + requiredGap) return false;
                        }
                    }`;

const gapReplacement = `let requiredGap = isFirstTime ? 1 : 0;
                            if (currentDayIndex < t.lastPhaseDay + requiredGap) return false;
                        }
                    }

                    // Se não foi bloqueado pelo gap temporal, verificamos se já tem algo desse assunto HOUJE.
                    // Para evitar duas tarefas do mesmo assunto no mesmo dia, a menos que seja (Revisão + Questões) em um recomeço (rounds > 0).
                    let hasToday = currentDayTasks.some(task => task.topicId === t.topicId);
                    if (hasToday) {
                        let isFirstTime = (t.rounds === 0);
                        if (isFirstTime) return false; // Primeira vez nunca faz duas fases no mesmo dia
                        if (nextPhase !== 'Questões') return false; // Se for reestudo, só permite acumular se a próxima for Questões
                    }`;

html = html.replace(gapTarget, gapReplacement);

fs.writeFileSync('index.html', html);
