const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetStr = `const lastSeen = appData.topicHistory[top.id] || 0;
                        let stalenessBonus = lastSeen > 0 ? Math.min(((now - lastSeen) / 86400000) * 0.15, 4) : 1; 
                        
                        simTopics.push({`;

const replacementStr = `const lastSeen = appData.topicHistory[top.id] || 0;
                        let stalenessBonus = lastSeen > 0 ? Math.min(((now - lastSeen) / 86400000) * 0.15, 4) : 1; 

                        let perfBonus = 0;
                        if (top.qTotal > 0) {
                            const perf = top.qCorrect / top.qTotal;
                            if (perf < 0.5) perfBonus = 2.5; 
                            else if (perf < 0.7) perfBonus = 1.5;
                            else if (perf >= 0.9) perfBonus = -1.0; 
                        }
                        
                        simTopics.push({`;

html = html.replace(targetStr, replacementStr);

fs.writeFileSync('index.html', html);
