const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /listContainer\.innerHTML = sub\.topics\.map\(t => \{[\s\S]*?<\/div>\\n                \`;\n            \}\)\.join\(''\);/m;

const replacement = `listContainer.innerHTML = sub.topics.map(t => {
                const phases = t.phases || [];
                const hasTeo = phases.includes('Teoria') ? 'checked' : '';
                const hasRev = phases.includes('Revisão') ? 'checked' : '';
                const hasQue = phases.includes('Questões') ? 'checked' : '';
                
                let rowClass = 'cust-topic-row';
                if(t.status === 'unlisted') rowClass += ' unlisted';
                else if(t.status === 'completed') rowClass += ' completed';
                
                return \`
                <div class="\${rowClass}" data-id="\${t.id}" draggable="true" ondragstart="handleCustTopicDragStart(event)" ondragover="handleCustTopicDragOver(event)" ondrop="handleCustTopicDrop(event)" ondragenter="handleCustTopicDragEnter(event)" ondragleave="handleCustTopicDragLeave(event)">
                    <div class="drag-handle" title="Arraste para reordenar">☰</div>
                    <div class="cust-topic-name">\${t.name}</div>
                    <div class="cust-phases">
                        <label><input type="checkbox" class="c-phase" value="Teoria" \${hasTeo} onchange="handleCustPhaseChange(this)"> Teoria</label>
                        <label><input type="checkbox" class="c-phase" value="Revisão" \${hasRev} onchange="handleCustPhaseChange(this)"> Revisão</label>
                        <label><input type="checkbox" class="c-phase" value="Questões" \${hasQue} onchange="handleCustPhaseChange(this)"> Questões</label>
                    </div>
                    <div class="cust-status-group">
                        <div class="teo-input-wrapper">
                            <span>Teoria (h):</span>
                            <input type="number" class="teo-hrs-input" value="\${t.teoHours || 2.0}" step="0.5" min="0.5" style="width: 55px; font-size: 11px; padding: 4px; background: var(--bg-main);">
                        </div>
                        <select class="status-select" style="background: var(--bg-main);" onchange="handleCustStatusChange(this)">
                            <option value="pending" \${t.status==='pending'?'selected':''}>⏳ Pendente</option>
                            <option value="completed" \${t.status==='completed'?'selected':''}>✅ Concluído</option>
                            <option value="unlisted" \${t.status==='unlisted'?'selected':''}>⏸ Não List</option>
                        </select>
                    </div>
                    <button class="btn btn-outline btn-icon" onclick="removeTopicCust('\${t.id}')" title="Excluir">✕</button>
                </div>
                \`;
            }).join('');`;

html = html.replace(regex, replacement);
fs.writeFileSync('index.html', html);
