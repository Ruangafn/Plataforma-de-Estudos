const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('index_backup.html', 'utf8');

// I don't have jsdom installed in this container.
