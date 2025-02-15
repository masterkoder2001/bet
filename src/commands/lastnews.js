
const { spawn } = require('child_process');
const { formatNewsMessage } = require('../utils/formatters');
const logger = require('../utils/logger');

module.exports = {
    name: 'lastnews',
    description: 'Resend the latest news article',
    async execute(message) {
        try {
            // Run Python script to get Finnhub news
            const pythonProcess = spawn('python3', ['src/services/finnhub_news.py']);
            let newsData = '';

            pythonProcess.stdout.on('data', (data) => {
                newsData += data.toString();
            });

            await new Promise((resolve, reject) => {
                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Python process exited with code ${code}`));
                        return;
                    }
                    resolve();
                });
            });

            const articles = JSON.parse(newsData);
            
            if (articles.error) {
                throw new Error(`Finnhub API Error: ${articles.error}`);
            }

            if (articles.length === 0) {
                await message.reply('Inga nyheter hittades för tillfället.');
                return;
            }

            // Get the most recent article
            const latestArticle = articles[0];
            const formattedMessage = formatNewsMessage(latestArticle);
            await message.reply(formattedMessage);
            
        } catch (error) {
            logger.error('Error executing lastnews command:', error);
            await message.reply('Ett fel uppstod när senaste nyheten skulle hämtas.');
        }
    }
};
