try {
    console.log('Loading messageHandlerService...');
    require('./services/messageHandlerService');
    console.log('✅ messageHandlerService loaded.');

    console.log('Loading whatsappController...');
    require('./controllers/whatsappController');
    console.log('✅ whatsappController loaded.');

    console.log('Loading whatsappRoutes...');
    require('./routes/whatsappRoutes');
    console.log('✅ whatsappRoutes loaded.');

    console.log('🎉 All modules loaded successfully!');
} catch (error) {
    console.error('❌ Load Error:', error);
    process.exit(1);
}
