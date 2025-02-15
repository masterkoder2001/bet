const validateToken = (token, name = 'Discord') => {
    if (!token) {
        console.error(`${name} token saknas i .env filen. Se .env.example för konfiguration.`);
        process.exit(1);
    }
    if (token === `your-${name.toLowerCase()}-token-here`) {
        console.error(`${name} token har inte konfigurerats korrekt i .env filen.`);
        process.exit(1);
    }
    if (!/^[A-Za-z0-9._-]+$/.test(token)) {
        console.error(`${name} token innehåller ogiltiga tecken`);
        process.exit(1);
    }
    return token;
};

const validateChannelId = (id, name) => {
    if (!id) {
        console.error(`${name} kanal-ID saknas i .env filen. Se .env.example för konfiguration.`);
        process.exit(1);
    }
    if (id === `your-${name.toLowerCase()}-channel-id-here`) {
        console.error(`${name} kanal-ID har inte konfigurerats korrekt i .env filen.`);
        process.exit(1);
    }
    if (!/^\d+$/.test(id)) {
        console.error(`${name} kanal-ID får endast innehålla siffror`);
        process.exit(1);
    }
    return id;
};

// Kontrollera att alla nödvändiga miljövariabler finns
const requiredEnvVars = [
    'DISCORD_TOKEN',
    'NEWS_CHANNEL_ID',
    'MACRO_CHANNEL_ID',
    'FINNHUB_API_KEY'
];

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`Miljövariabel ${varName} saknas. Se .env.example för konfiguration.`);
        process.exit(1);
    }
});

module.exports = {
    // Discord Configuration
    DISCORD_TOKEN: validateToken(process.env.DISCORD_TOKEN),
    NEWS_CHANNEL_ID: validateChannelId(process.env.NEWS_CHANNEL_ID, 'news'),
    MACRO_CHANNEL_ID: validateChannelId(process.env.MACRO_CHANNEL_ID, 'macro'),

    // Finnhub Configuration
    FINNHUB_API_KEY: validateToken(process.env.FINNHUB_API_KEY, 'Finnhub'),
    NEWS_UPDATE_INTERVAL: 300000, // 5 minutes in milliseconds

    // Logging Configuration
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug',

    // Macro Schedule (Stockholm timezone)
    MACRO_SCHEDULE: '0 8 * * *', // Every day at 8 AM
};