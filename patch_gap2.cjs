const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// There's a duplicated "let nextPhase = " which will cause a SyntaxError in let redeclaration
const dupTarget = `}

                    let nextPhase = t.phases[t.simIdx];
                    if (nextPhase === 'Teoria'`;
const dupReplacement = `}

                    if (nextPhase === 'Teoria'`;

html = html.replace(dupTarget, dupReplacement);
fs.writeFileSync('index.html', html);
