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
    if (!/^\d+$/.test(id)) {
        console.error(`${name} channel ID must contain only numbers`);
        process.exit(1);
    }
    return id;
};

const validateApiKey = (key, name) => {
    if (!key || key === `your-${name}-key`) {
        console.error(`Invalid ${name} API key configuration`);
        process.exit(1);
    }
    return key;
};

module.exports = {
    // Discord Configuration
    DISCORD_TOKEN: validateToken(process.env.DISCORD_TOKEN),
    NEWS_CHANNEL_ID: validateChannelId(process.env.NEWS_CHANNEL_ID, 'news'),
    MACRO_CHANNEL_ID: validateChannelId(process.env.MACRO_CHANNEL_ID, 'macro'),

    // Finnhub Configuration
    FINNHUB_API_KEY: validateApiKey(process.env.FINNHUB_API_KEY, 'finnhub'),
    NEWS_UPDATE_INTERVAL: 300000, // 5 minutes in milliseconds

    // Logging Configuration
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug',

    // Macro Schedule
    MACRO_SCHEDULE: '0 8 * * *', // Every day at 8 AM
};