const { spawn } = require('child_process');
const { formatNewsMessage } = require('../utils/formatters');
const logger = require('../utils/logger');

module.exports = {
    name: 'lastnews',
    description: 'Skicka senaste nyhetsartikeln igen',
    async execute(message) {
        try {
            // Kör Python-skript för att hämta Finnhub-nyheter
            const pythonProcess = spawn('python3', ['src/services/finnhub_news.py']);
            let newsData = '';

            pythonProcess.stdout.on('data', (data) => {
                newsData += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                const errorMsg = data.toString();
                logger.error(`Python-fel i lastnews-kommando: ${errorMsg}`);
                if (errorMsg.includes('API rate limit exceeded')) {
                    message.reply('Hastighetsgräns uppnådd. Vänligen försök igen om några minuter.');
                    return;
                }
            });

            await new Promise((resolve, reject) => {
                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Python-processen avslutades med kod ${code}`));
                        return;
                    }
                    resolve();
                });
            });

            const articles = JSON.parse(newsData);

            if (articles.error) {
                if (articles.error.includes('rate limit')) {
                    await message.reply('Hastighetsgräns uppnådd. Vänligen försök igen om några minuter.');
                    return;
                }
                throw new Error(`Finnhub API-fel: ${articles.error}`);
            }

            if (articles.length === 0) {
                await message.reply('Inga nyhetsartiklar hittades för tillfället.');
                return;
            }

            // Hämta senaste artikeln
            const latestArticle = articles[0];
            const formattedMessage = formatNewsMessage(latestArticle);
            await message.reply(formattedMessage);

        } catch (error) {
            logger.error('Fel vid körning av lastnews-kommando:', error);
            await message.reply('Ett fel uppstod vid hämtning av senaste nyheterna.');
        }
    }
};