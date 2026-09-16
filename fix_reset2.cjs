const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Did deleteCurrentProfile match?
html = html.replace(
    /if \(!confirm\(\`Atenção: Tem certeza de que deseja excluir permanentemente o perfil[\s\S]*?\/\/ Apaga perfil/g,
    `customConfirm(\`Atenção: Tem certeza de que deseja excluir permanentemente o perfil "\${currentProfileKey}" e todo o seu planejamento?\`, () => {\n            // Apaga perfil`
);

// Did resetAllApplicationData match?
html = html.replace(
    /if \(!confirm\("⚠️ ATENÇÃO: Esta ação é irreversível![\s\S]*?try \{/g,
    `customConfirm("⚠️ ATENÇÃO: Esta ação é irreversível! Isso apagará TODOS os perfis, todas as matérias e ciclos. Deseja realmente continuar?", () => {\n            try {`
);

fs.writeFileSync('index.html', html);
