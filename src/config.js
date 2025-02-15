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

const validateChannelId = (id, name) => {
    if (!id || id === `your-${name}-channel-id`) {
        console.error(`Invalid ${name} channel ID configuration`);
        process.exit(1);
    }
    return id;
};

module.exports = {
    // Discord Configuration
    DISCORD_TOKEN: validateToken(process.env.DISCORD_TOKEN),
    NEWS_CHANNEL_ID: validateChannelId(process.env.NEWS_CHANNEL_ID, 'news'),
    MACRO_CHANNEL_ID: validateChannelId(process.env.MACRO_CHANNEL_ID, 'macro'),

    // Finnhub Configuration
    FINNHUB_API_KEY: process.env.FINNHUB_API_KEY || 'your-finnhub-key',
    NEWS_UPDATE_INTERVAL: 10 * 1000, // 10 seconds for near-instant updates

    // Logging Configuration
    LOG_LEVEL: 'debug', // Ändrat till debug för mer detaljerad loggning

    // Macro Schedule
    MACRO_SCHEDULE: '0 8 * * *', // Every day at 8 AM
};