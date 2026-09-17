const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const pushTarget = `orderIdx: index,
                            lastPhaseDay: -99`;
const pushReplacement = `orderIdx: index,
                            lastPhaseDay: -99,
                            rounds: top.rounds || 0`;
html = html.replace(pushTarget, pushReplacement);

const filterTarget = `// Lógica de Espaçamento Inteligente (Gap)
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

const filterReplacement = `// Lógica de Espaçamento Inteligente (Gap)
                    let nextPhase = t.phases[t.simIdx];
                    if (t.lastPhaseDay >= 0) {
                        let isFirstTime = (t.rounds === 0);
                        if (nextPhase === 'Revisão') {
                            // Espaçamento Teoria -> Revisão: 2 dias na primeira vez, 1 dia nas próximas
                            let requiredGap = isFirstTime ? 2 : 1;
                            if (currentDayIndex < t.lastPhaseDay + requiredGap) return false;
                        } else if (nextPhase === 'Questões') {
                            // Espaçamento Revisão -> Questões: 1 dia na primeira vez, 0 dias nas próximas (mesmo dia)
                            let requiredGap = isFirstTime ? 1 : 0;
                            if (currentDayIndex < t.lastPhaseDay + requiredGap) return false;
                        }
                    }`;

html = html.replace(filterTarget, filterReplacement);

fs.writeFileSync('index.html', html);
