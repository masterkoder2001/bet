const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config');
const logger = require('./utils/logger');
const NewsService = require('./services/newsService');
const MacroService = require('./services/macroService');
const fs = require('fs');
const path = require('path');

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
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.name, command);
}

// Services initialization
let newsService;
let macroService;

client.once('ready', () => {
    logger.info(`Logged in as ${client.user.tag}`);
    
    // Initialize services
    newsService = new NewsService(client);
    macroService = new MacroService(client);
    
    // Start services
    newsService.startNewsUpdates();
    macroService.startMacroSchedule();
});

// Command handling
client.on('messageCreate', async message => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (!client.commands.has(commandName)) return;

    try {
        await client.commands.get(commandName).execute(message, args);
    } catch (error) {
        logger.error('Error executing command:', error);
        await message.reply('There was an error executing that command!');
    }
});

// Error handling
client.on('error', error => {
    logger.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    logger.error('Unhandled promise rejection:', error);
});

// Login to Discord with error handling
// Print environment check
console.log('Environment check:');
console.log('DISCORD_TOKEN exists:', !!process.env.DISCORD_TOKEN);
console.log('NEWS_CHANNEL_ID exists:', !!process.env.NEWS_CHANNEL_ID);
console.log('MACRO_CHANNEL_ID exists:', !!process.env.MACRO_CHANNEL_ID);
console.log('FINNHUB_API_KEY exists:', !!process.env.FINNHUB_API_KEY);

client.login(config.DISCORD_TOKEN).catch(error => {
    logger.error('Failed to connect to Discord:', error);
    console.error('Detailed connection error:', {
        errorName: error.name,
        errorMessage: error.message,
        token: config.DISCORD_TOKEN ? 'Token exists' : 'No token found'
    });
});
