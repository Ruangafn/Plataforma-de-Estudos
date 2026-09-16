const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /let getW = \([\s\S]*?if \(blocked\) return false;/;

const replacement = `let nextAvailableOrder = {};
                simTopics.forEach(t => {
                    if (t.simIdx < t.phases.length) {
                        let isScheduledToday = currentDayTasks.some(task => task.topicId === t.topicId);
                        if (!isScheduledToday) {
                            if (nextAvailableOrder[t.subId] === undefined || t.orderIdx < nextAvailableOrder[t.subId]) {
                                nextAvailableOrder[t.subId] = t.orderIdx;
                            }
                        }
                    }
                });

                let validTopics = simTopics.filter(t => {
                    if (t.orderIdx !== nextAvailableOrder[t.subId]) return false;`;

if(regex.test(html)) {
    console.log("Replacing with fluid order logic...");
    html = html.replace(regex, replacement);
    fs.writeFileSync('index.html', html);
} else {
    console.log("Regex not found!");
}
