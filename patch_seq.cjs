const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /simTopics\.push\(\{([\s\S]*?totalParts: 0)\s*\}\);/g;
html = html.replace(regex, `simTopics.push({\n$1,\n                            orderIdx: index\n                        });`);

const topicLoopRegex = /topics\.forEach\(top => \{/g;
html = html.replace(topicLoopRegex, `topics.forEach((top, index) => {`);

const validTopicsRegex = /let validTopics = simTopics\.filter\(t => \{/g;
const validTopicsReplacement = `let minOrderPerSub = {};
                simTopics.forEach(t => {
                    if (t.simIdx < t.phases.length) {
                        if (minOrderPerSub[t.subId] === undefined || t.orderIdx < minOrderPerSub[t.subId]) {
                            minOrderPerSub[t.subId] = t.orderIdx;
                        }
                    }
                });

                let validTopics = simTopics.filter(t => {
                    if (t.orderIdx !== minOrderPerSub[t.subId]) return false;
`;
html = html.replace(validTopicsRegex, validTopicsReplacement);

fs.writeFileSync('index.html', html);
