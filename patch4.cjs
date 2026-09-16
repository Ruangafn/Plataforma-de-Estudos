const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetStr = `        function removeTopicCust(topicId) {
            if(!confirm("Remover este assunto?")) return;
            const sub = appData.subjects.find(s => s.id === currentCustSubId);
            if (!sub) return;
            sub.topics = sub.topics.filter(t => t.id !== topicId);
            renderCustomizeList();
        }`;

const replacement = `        function removeTopicCust(topicId) {
            if(!confirm("Remover este assunto?")) return;
            const sub = appData.subjects.find(s => s.id === currentCustSubId);
            if (!sub) return;
            sub.topics = sub.topics.filter(t => t.id !== topicId);
            renderCustomizeList();
        }

        // --- DRAG AND DROP REORDERING ---
        let dragSrcCustTopic = null;

        function handleCustTopicDragStart(e) {
            if (!e.target.classList || !e.target.classList.contains('cust-topic-row')) return;
            dragSrcCustTopic = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
        }

        function handleCustTopicDragOver(e) {
            e.preventDefault(); // Necessary to allow dropping
            e.dataTransfer.dropEffect = 'move';
            return false;
        }

        function handleCustTopicDragEnter(e) {
            let row = e.target.closest('.cust-topic-row');
            if (row && row !== dragSrcCustTopic) {
                row.style.borderTop = '2px solid var(--color-primary)';
            }
        }

        function handleCustTopicDragLeave(e) {
            let row = e.target.closest('.cust-topic-row');
            if (row && row !== dragSrcCustTopic) {
                row.style.borderTop = ''; // Reset
            }
        }

        function handleCustTopicDrop(e) {
            e.stopPropagation(); // Stops the browser from redirecting
            
            let row = e.target.closest('.cust-topic-row');
            if (row && dragSrcCustTopic !== row) {
                row.style.borderTop = '';
                
                const draggedId = dragSrcCustTopic.getAttribute('data-id');
                const targetId = row.getAttribute('data-id');
                
                const sub = appData.subjects.find(s => s.id === currentCustSubId);
                if (sub) {
                    const draggedIndex = sub.topics.findIndex(t => t.id === draggedId);
                    const targetIndex = sub.topics.findIndex(t => t.id === targetId);
                    
                    if (draggedIndex > -1 && targetIndex > -1) {
                        // Remove from old position and insert into new position
                        const [item] = sub.topics.splice(draggedIndex, 1);
                        sub.topics.splice(targetIndex, 0, item);
                        
                        renderCustomizeList(); // Re-render to reflect changes
                    }
                }
            }
            if(dragSrcCustTopic) {
                dragSrcCustTopic.classList.remove('dragging');
            }
            return false;
        }

        document.addEventListener('dragend', function(e) {
            if (e.target && e.target.classList && e.target.classList.contains('cust-topic-row')) {
                e.target.classList.remove('dragging');
                document.querySelectorAll('.cust-topic-row').forEach(row => {
                    row.style.borderTop = '';
                });
            }
        });
`;

if (html.includes(targetStr)) {
    html = html.replace(targetStr, replacement);
    fs.writeFileSync('index.html', html);
    console.log("Success");
} else {
    console.log("Target string not found");
}
