module.exports = {
    // Discord Configuration
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || 'your-discord-token',
    NEWS_CHANNEL_ID: process.env.NEWS_CHANNEL_ID || 'your-news-channel-id',
    MACRO_CHANNEL_ID: process.env.MACRO_CHANNEL_ID || 'your-macro-channel-id',

    // Finnhub Configuration
    FINNHUB_API_KEY: process.env.FINNHUB_API_KEY || 'your-finnhub-key',
    NEWS_UPDATE_INTERVAL: 10 * 1000, // 10 seconds for near-instant updates

    // Logging Configuration
    LOG_LEVEL: 'info',

    // Macro Schedule
    MACRO_SCHEDULE: '0 8 * * *', // Every day at 8 AM
};