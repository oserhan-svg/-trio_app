const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../client/src');

function checkFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ MISSING FILE: ${filePath}`);
        return false;
    }
    return true;
}

const imports = [
    'pages/Login.jsx',
    'pages/Dashboard.jsx',
    'pages/ClientDetail.jsx',
    'pages/ConsultantPanel.jsx', // Critical one
    'pages/PropertyDetail.jsx',
    'components/crm/ClientTracking.jsx',
    'components/admin/PortfolioDashboard.jsx',
    'components/crm/MatchNewsfeed.jsx',
    'components/apps/MapInsight.jsx',
    'components/apps/MarketRadar.jsx',
    'components/whatsapp/WhatsAppBotDashboard.jsx',
    'components/ai/TrainingDashboard.jsx',
    'components/agenda/Agenda.jsx',
    'components/crm/PendingContactsTable.jsx',
    'pages/AdminManagement.jsx',
    'components/admin/PerformanceDashboard.jsx',
    'components/ai/VoiceAssistant.jsx'
];

console.log('🔍 Checking frontend imports...');
let errors = 0;
imports.forEach(imp => {
    const fullPath = path.join(srcDir, imp);
    if (!checkFile(fullPath)) errors++;
});

if (errors === 0) {
    console.log('✅ All lazy-loaded components exist.');
} else {
    console.log(`❌ Found ${errors} missing files.`);
    process.exit(1);
}
