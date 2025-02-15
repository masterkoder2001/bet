module.exports = {
    // Discord Configuration
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || 'your-discord-token',
    NEWS_CHANNEL_ID: process.env.NEWS_CHANNEL_ID || 'your-news-channel-id',
    MACRO_CHANNEL_ID: process.env.MACRO_CHANNEL_ID || 'your-macro-channel-id',
    
    // NewsAPI Configuration
    NEWS_API_KEY: process.env.NEWS_API_KEY || 'your-newsapi-key',
    NEWS_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    
    // Logging Configuration
    LOG_LEVEL: 'info',
    
    // Macro Schedule
    MACRO_SCHEDULE: '0 8 * * *', // Every day at 8 AM
};
