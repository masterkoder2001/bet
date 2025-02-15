const { spawn } = require('child_process');
const config = require('../config');
const logger = require('../utils/logger');
const { formatNewsMessage } = require('../utils/formatters');

class NewsService {
    constructor(client) {
        this.client = client;
        this.lastNewsTimestamp = new Date();
        this.lastNewsTimestamp.setHours(this.lastNewsTimestamp.getHours() - 24);
        this.sentArticles = new Set(); // Track sent article IDs
    }

    async startNewsUpdates() {
        try {
            logger.info('Starting news update service');
            console.log('News service config:', {
                interval: config.NEWS_UPDATE_INTERVAL,
                channelId: config.NEWS_CHANNEL_ID
            });
            await this.fetchAndSendNews(); // Initial fetch
            setInterval(() => this.fetchAndSendNews(), config.NEWS_UPDATE_INTERVAL);
        } catch (error) {
            logger.error('Error starting news updates:', error);
        }
    }

    async fetchAndSendNews() {
        try {
            logger.info('Fetching latest news updates');

            // Run Python script to get Finnhub news
            const pythonProcess = spawn('python3', ['src/services/finnhub_news.py']);
            let newsData = '';

            pythonProcess.stdout.on('data', (data) => {
                newsData += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                logger.error(`Python Error: ${data}`);
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

            const newsChannel = this.client.channels.cache.get(config.NEWS_CHANNEL_ID);
            if (!newsChannel) {
                throw new Error('News channel not found');
            }

            const newNews = articles.filter(article => {
                const publishedAt = new Date(article.publishedAt);
                const articleId = `${article.title}-${article.publishedAt}`;
                const isNew = publishedAt > this.lastNewsTimestamp && 
                            !this.sentArticles.has(articleId) &&
                            article.title &&
                            article.description;

                logger.info(`Article: ${article.title}`);
                logger.info(`Published: ${publishedAt.toISOString()}`);
                logger.info(`Is New: ${isNew}`);
                return isNew;
            });

            logger.info(`Found ${newNews.length} new articles to send`);

            for (const article of newNews) {
                const articleId = `${article.title}-${article.publishedAt}`;
                const formattedMessage = formatNewsMessage(article);
                await newsChannel.send(formattedMessage);
                this.sentArticles.add(articleId);
                logger.info(`Sent news article: ${article.title}`);
            }

            if (newNews.length > 0) {
                const latestArticleDate = new Date(Math.max(
                    ...newNews.map(article => new Date(article.publishedAt).getTime())
                ));
                this.lastNewsTimestamp = latestArticleDate;
                logger.info(`Updated lastNewsTimestamp to: ${this.lastNewsTimestamp.toISOString()}`);
            }
        } catch (error) {
            logger.error('Error fetching news:', error);
        }
    }
}

module.exports = NewsService;