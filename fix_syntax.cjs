const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix deleteCurrentProfile
html = html.replace(
    /if \(!confirm\(\`Atenção: Tem certeza de que deseja excluir permanentemente o perfil[\s\S]*?return;\s+\}\s+/g,
    `customConfirm(\`Atenção: Tem certeza de que deseja excluir permanentemente o perfil "\${currentProfileKey}" e todo o seu planejamento?\`, () => {\n            `
);

// Fix resetAllApplicationData
html = html.replace(
    /if \(!confirm\("⚠️ ATENÇÃO: Esta ação é irreversível![\s\S]*?return;\s+\}/g,
    `customConfirm("⚠️ ATENÇÃO: Esta ação é irreversível! Isso apagará TODOS os perfis, todas as matérias e ciclos. Deseja realmente continuar?", () => {\n`
);
// wait, resetAllApplicationData also has `const confirmCode = prompt(...)` which uses `alert` in case of failure.
// We should replace that alert with customAlert, but that might have been replaced.
// Wait, prompt() is also synchronous! And prompt() is blocked in iframe too!!
// Let's remove the prompt() from resetAllApplicationData completely!

html = html.replace(
    /const confirmCode = prompt\([\s\S]*?return;\s+\}/g,
    ``
);

fs.writeFileSync('index.html', html);
