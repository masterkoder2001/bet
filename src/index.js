const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config');
const logger = require('./utils/logger');
const NewsService = require('./services/newsService');
const MacroService = require('./services/macroService');
const fs = require('fs');
const path = require('path');
require('./health');

logger.info('Starting Discord bot...');
logger.info('Environment check:', {
    discord_token_exists: !!process.env.DISCORD_TOKEN,
    news_channel_exists: !!process.env.NEWS_CHANNEL_ID,
    macro_channel_exists: !!process.env.MACRO_CHANNEL_ID,
    finnhub_key_exists: !!process.env.FINNHUB_API_KEY
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Command handling setup
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

logger.info('Loading commands from:', commandsPath);
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(path.join(commandsPath, file));
        client.commands.set(command.name, command);
        logger.info(`Loaded command: ${command.name}`);
    } catch (error) {
        logger.error(`Failed to load command from ${file}:`, error);
    }
}

// Services initialization
let newsService;
let macroService;

client.once('ready', async () => {
    try {
        logger.info(`Bot är online! Inloggad som ${client.user.tag}`);
        logger.info(`Ansluten till ${client.guilds.cache.size} servrar`);
        logger.debug('Konfigurerade intents:', client.options.intents);

        // Verify bot permissions
        const guilds = client.guilds.cache;
        for (const [id, guild] of guilds) {
            const botMember = guild.members.cache.get(client.user.id);
            if (!botMember.permissions.has('SendMessages')) {
                logger.warn(`Saknar nödvändiga behörigheter i guild: ${guild.name}`);
            }
        }

    try {
        newsService = new NewsService(client);
        macroService = new MacroService(client);

        Promise.all([
            newsService.startNewsUpdates().catch(error => {
                logger.error('Failed to start news service:', error);
                throw error;
            }),
            macroService.startMacroSchedule()
        ]).then(() => {
            logger.info('Alla tjänster startade framgångsrikt');
        }).catch(error => {
            logger.error('Ett kritiskt fel uppstod vid start av tjänsterna:', error);
            process.exit(1);
        });

        // Verify channel access
        const newsChannel = client.channels.cache.get(config.NEWS_CHANNEL_ID);
        const macroChannel = client.channels.cache.get(config.MACRO_CHANNEL_ID);

        if (!newsChannel || !macroChannel) {
            throw new Error('Kunde inte hitta nyhets- eller makrokanalen. Kontrollera kanal-ID och bottens behörigheter.');
        }

        logger.info('Alla kanaler är tillgängliga och redo');
    } catch (error) {
        logger.error('Kritiskt fel vid initialisering av tjänster:', error);
        process.exit(1);
    }
});

// Command handling with improved error logging
client.on('messageCreate', async message => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (!client.commands.has(commandName)) {
        logger.debug(`Okänt kommando använt: ${commandName}`);
        return;
    }

    const command = client.commands.get(commandName);
    logger.info(`Kommando mottaget: ${commandName} från ${message.author.tag}`);

    try {
        await command.execute(message, args);
        logger.info(`Kommando ${commandName} utfört framgångsrikt`);
    } catch (error) {
        logger.error(`Fel vid körning av kommando ${commandName}:`, error);
        await message.reply('Ett fel uppstod när kommandot kördes. Vänligen försök igen.').catch(e => {
            logger.error('Kunde inte skicka felmeddelande till användaren:', e);
        });
    }
});

// Enhanced error handling
client.on('error', error => {
    logger.error('Discord-klient fel:', error);
});

// Improved error handling
process.on('unhandledRejection', (error) => {
    logger.error('Ohanterad promise rejection:', error);
    // Give time for logs to be written
    setTimeout(() => process.exit(1), 1000);
});

process.on('uncaughtException', (error) => {
    logger.error('Ohanterat fel:', error);
    // Give time for logs to be written
    setTimeout(() => process.exit(1), 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal mottagen. Stänger ner...');
    client.destroy();
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal mottagen. Stänger ner...');
    client.destroy();
    process.exit(0);
});

// Detailed connection logging
const loginWithRetry = async (retryCount = 0, maxRetries = 3) => {
    try {
        logger.info('Attempting to connect to Discord...');
        logger.debug('Token length:', config.DISCORD_TOKEN ? config.DISCORD_TOKEN.length : 0);
        await client.login(config.DISCORD_TOKEN);
        logger.info('Ansluten till Discord framgångsrikt');
    } catch (error) {
        logger.error(`Anslutningsförsök ${retryCount + 1} misslyckades:`, error);

        if (retryCount < maxRetries) {
            const retryDelay = 5000 * Math.pow(2, retryCount);
            logger.info(`Försöker igen om ${retryDelay / 1000} sekunder...`);
            setTimeout(() => loginWithRetry(retryCount + 1, maxRetries), retryDelay);
        } else {
            logger.error('Maximalt antal återanslutningsförsök uppnått. Avslutar.');
            process.exit(1);
        }
    }
};

// Start connection process
loginWithRetry();

// Add rate limit handling
client.on('rateLimit', (rateLimitInfo) => {
    logger.warn('Hastighetsgräns uppnådd:', {
        timeout: rateLimitInfo.timeout,
        limit: rateLimitInfo.limit,
        method: rateLimitInfo.method,
        path: rateLimitInfo.path,
        route: rateLimitInfo.route
    });
});