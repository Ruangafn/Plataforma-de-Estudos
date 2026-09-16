const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetStr = `
                <div class="\${rowClass}" data-id="\${t.id}">
                    <div class="cust-topic-name">\${t.name}</div>
                    <div class="cust-phases">`;

const replacement = `
                <div class="\${rowClass}" data-id="\${t.id}" draggable="true" ondragstart="handleCustTopicDragStart(event)" ondragover="handleCustTopicDragOver(event)" ondrop="handleCustTopicDrop(event)" ondragenter="handleCustTopicDragEnter(event)" ondragleave="handleCustTopicDragLeave(event)">
                    <div class="drag-handle" title="Arraste para reordenar">☰</div>
                    <div class="cust-topic-name">\${t.name}</div>
                    <div class="cust-phases">`;

if (html.includes(targetStr)) {
    html = html.replace(targetStr, replacement);
    fs.writeFileSync('index.html', html);
    console.log("Success");
} else {
    console.log("Target string not found");
}
