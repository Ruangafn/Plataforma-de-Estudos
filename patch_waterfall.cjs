const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetRegex = /let minOrderPerSub = \{\};\s*simTopics\.forEach\(t => \{\s*if \(t\.simIdx < t\.phases\.length\) \{\s*if \(minOrderPerSub\[t\.subId\] === undefined \|\| t\.orderIdx < minOrderPerSub\[t\.subId\]\) \{\s*minOrderPerSub\[t\.subId\] = t\.orderIdx;\s*\}\s*\}\s*\}\);\s*let validTopics = simTopics\.filter\(t => \{\s*if \(t\.orderIdx !== minOrderPerSub\[t\.subId\]\) return false;/g;

const replacement = `let getW = (phase) => {
                    if (!phase) return 99;
                    if (phase.startsWith('Teoria')) return 0;
                    if (phase.startsWith('Revisão')) return 1;
                    if (phase.startsWith('Questões')) return 2;
                    return 3;
                };

                let topicWeights = {};
                simTopics.forEach(t => {
                    topicWeights[t.topicId] = t.simIdx >= t.phases.length ? 99 : getW(t.phases[t.simIdx]);
                });

                let validTopics = simTopics.filter(t => {
                    let tWeight = topicWeights[t.topicId];
                    let blocked = simTopics.some(prev_t => {
                        if (prev_t.subId === t.subId && prev_t.orderIdx < t.orderIdx) {
                            if (topicWeights[prev_t.topicId] <= tWeight) return true;
                        }
                        return false;
                    });
                    if (blocked) return false;`;

if(targetRegex.test(html)) {
    console.log("Match found! Replacing...");
    html = html.replace(targetRegex, replacement);
    fs.writeFileSync('index.html', html);
} else {
    console.log("Match not found!");
}
