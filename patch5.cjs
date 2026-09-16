const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetStr = `
                    <div class="drag-handle" title="Arraste para reordenar">☰</div>
                    <div class="cust-topic-name">\${t.name}</div>
                    <div class="cust-phases">`;

const replacement = `
                    <div class="drag-handle" title="Arraste para reordenar">☰</div>
                    <div style="display: flex; flex-direction: column; gap: 2px; margin-right: 8px;">
                        <button class="btn btn-outline" style="padding: 2px 6px; font-size: 10px; line-height: 1;" onclick="moveTopicCust('\${t.id}', -1)" title="Mover para Cima">▲</button>
                        <button class="btn btn-outline" style="padding: 2px 6px; font-size: 10px; line-height: 1;" onclick="moveTopicCust('\${t.id}', 1)" title="Mover para Baixo">▼</button>
                    </div>
                    <div class="cust-topic-name">\${t.name}</div>
                    <div class="cust-phases">`;

if (html.includes(targetStr)) {
    html = html.replace(targetStr, replacement);
    
    const jsTarget = `        function handleCustTopicDrop(e) {`;
    const jsReplacement = `
        function moveTopicCust(topicId, direction) {
            const sub = appData.subjects.find(s => s.id === currentCustSubId);
            if (!sub) return;
            const index = sub.topics.findIndex(t => t.id === topicId);
            if (index < 0) return;
            
            const newIndex = index + direction;
            if (newIndex >= 0 && newIndex < sub.topics.length) {
                const temp = sub.topics[index];
                sub.topics[index] = sub.topics[newIndex];
                sub.topics[newIndex] = temp;
                renderCustomizeList();
            }
        }

        function handleCustTopicDrop(e) {`;
        
    html = html.replace(jsTarget, jsReplacement);
    
    fs.writeFileSync('index.html', html);
    console.log("Success");
} else {
    console.log("Target string not found");
}
