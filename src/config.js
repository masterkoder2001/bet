const validateToken = (token) => {
    if (!token || token === 'your-discord-token') {
        console.error('Invalid Discord token configuration');
        process.exit(1);
    }
    if (!/^[A-Za-z0-9._-]+$/.test(token)) {
        console.error('Discord token contains invalid characters');
        process.exit(1);
    }
    return token;
};

module.exports = {
    // Discord Configuration
    DISCORD_TOKEN: `Bot ${validateToken(process.env.DISCORD_TOKEN)}`,
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