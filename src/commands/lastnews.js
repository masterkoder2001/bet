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

            pythonProcess.stderr.on('data', (data) => {
                const errorMsg = data.toString();
                logger.error(`Python Error in lastnews command: ${errorMsg}`);
                if (errorMsg.includes('API rate limit exceeded')) {
                    message.reply('Rate limit reached. Please try again in a few minutes.');
                    return;
                }
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
                if (articles.error.includes('rate limit')) {
                    await message.reply('Rate limit reached. Please try again in a few minutes.');
                    return;
                }
                throw new Error(`Finnhub API Error: ${articles.error}`);
            }

            if (articles.length === 0) {
                await message.reply('No news articles found at the moment.');
                return;
            }

            // Get the most recent article
            const latestArticle = articles[0];
            const formattedMessage = formatNewsMessage(latestArticle);
            await message.reply(formattedMessage);

        } catch (error) {
            logger.error('Error executing lastnews command:', error);
            await message.reply('An error occurred while fetching the latest news.');
        }
    }
};