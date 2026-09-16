const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace('.cust-topic-row {', '.cust-topic-row.dragging { opacity: 0.5; box-shadow: 0 5px 15px rgba(0,0,0,0.3); transform: scale(0.98); border-color: var(--color-primary); z-index: 10; }\n        .drag-handle { cursor: grab; padding: 0 10px; color: var(--text-secondary); font-size: 16px; user-select: none; }\n        .drag-handle:active { cursor: grabbing; }\n        .cust-topic-row {');

fs.writeFileSync('index.html', html);
