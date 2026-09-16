const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The replacement above missed fixing the 'bonus' property to use finalPriorityScore.
html = html.replace(/bonus: stalenessBonus \+ perfBonus,/g, "bonus: finalPriorityScore,");

fs.writeFileSync('index.html', html);
