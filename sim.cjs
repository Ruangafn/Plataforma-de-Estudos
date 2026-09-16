const fs = require('fs');
const html = fs.readFileSync('index_backup.html', 'utf8');

const match = html.match(/<script type="module" src="\.\/src\/firebase-sync\.js"><\/script>[\s\S]*?<script>([\s\S]*?)<\/script>/);
const jsCode = match[1];

let sandbox = {
    console: console,
    document: {
        getElementById: () => ({ value: '1', style: {}, innerHTML: '', innerText: '' }),
        addEventListener: () => {},
        querySelectorAll: () => [],
    },
    window: {
        scrollTo: () => {},
        addEventListener: () => {},
    },
    localStorage: {
        getItem: () => null,
        setItem: () => {}
    },
    alert: console.log,
    confirm: () => true
};

const vm = require('vm');
vm.createContext(sandbox);

try {
    vm.runInContext(jsCode, sandbox);
    console.log("Script loaded successfully.");
    
    // Simulate user data
    sandbox.appData.subjects = [
        {
            id: 'sub1', name: 'Math', color: '#f00', weight: 3,
            topics: [
                { id: 't1', name: 'Algebra', status: 'pending', phases: ['Teoria'], currentPhaseIdx: 0, teoHours: 2.0 },
                { id: 't2', name: 'Geometry', status: 'pending', phases: ['Teoria'], currentPhaseIdx: 0, teoHours: 2.0 }
            ]
        }
    ];
    sandbox.appData.topicHistory = {};
    
    // Call generateMacroCycle
    vm.runInContext('generateMacroCycle()', sandbox);
    console.log("Macro cycle generated successfully. Days:", sandbox.appData.cycle.days.length);

    // Call realignCycleToToday
    sandbox.appData.cycle.active = true;
    sandbox.appData.cycle.currentCycleDayIndex = 0;
    vm.runInContext('realignCycleToToday()', sandbox);
    console.log("Realigned successfully. Start date:", sandbox.appData.cycle.startDate);
    
} catch(e) {
    console.error("Simulation error:", e);
}
