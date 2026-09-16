const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexSimTopics = /const lastSeen = appData\.topicHistory\[top\.id\] \|\| 0;[\s\S]*?simTopics\.push\(\{/g;

const replacementSimTopics = `const lastSeen = appData.topicHistory[top.id] || 0;
                        let stalenessDays = lastSeen > 0 ? ((now - lastSeen) / 86400000) : 0;
                        // Fator de Ociosidade: até 7 pontos extras se estiver muito tempo sem ver (peso forte)
                        let stalenessBonus = lastSeen > 0 ? Math.min(stalenessDays * 0.4, 7.0) : 1.5; 

                        // Fator de Desempenho (Erros): Penalidade grave para % de acerto baixo
                        let perfBonus = 0;
                        if (top.qTotal > 0) {
                            const perf = top.qCorrect / top.qTotal;
                            if (perf < 0.4) perfBonus = 7.0;       // Crítico (<40%)
                            else if (perf < 0.6) perfBonus = 4.5;  // Ruim (<60%)
                            else if (perf < 0.8) perfBonus = 2.0;  // Regular (<80%)
                            else if (perf >= 0.9) perfBonus = -1.5; // Excelente (>90%), cede espaço
                        }
                        
                        // Fator de Peso da Disciplina: Multiplica a importância natural
                        let baseWeight = parseFloat(sub.weight) || 3;
                        let finalPriorityScore = baseWeight + stalenessBonus + perfBonus;

                        simTopics.push({`;

html = html.replace(regexSimTopics, replacementSimTopics);

const regexScore = /t\.score = t\.weight \+ t\.bonus \+ phaseBonus \+ \(Math\.random\(\) \* 0\.4\);/g;
const replacementScore = `// Agora o t.bonus já contém (baseWeight + stalenessBonus + perfBonus) calculados de forma muito mais agressiva
                    t.score = t.bonus + phaseBonus + (Math.random() * 0.2); `;

html = html.replace(regexScore, replacementScore);

fs.writeFileSync('index.html', html);
