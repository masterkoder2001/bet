const NewsAPI = require('newsapi');
const config = require('../config');
const logger = require('../utils/logger');
const { formatNewsMessage } = require('../utils/formatters');

class NewsService {
    constructor(client) {
        this.client = client;
        this.newsapi = new NewsAPI(config.NEWS_API_KEY);
        this.lastNewsTimestamp = Date.now() - (24 * 60 * 60 * 1000); // Start with news from the last 24 hours
    }

    async startNewsUpdates() {
        try {
            logger.info('Starting news update service');
            await this.fetchAndSendNews(); // Initial fetch
            setInterval(() => this.fetchAndSendNews(), config.NEWS_UPDATE_INTERVAL);
        } catch (error) {
            logger.error('Error starting news updates:', error);
        }
    }

    async fetchAndSendNews() {
        try {
            logger.info('Fetching latest news updates');
            const response = await this.newsapi.v2.everything({
                q: 'finance OR stocks OR market OR economy',
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: 10,
                domains: 'reuters.com,bloomberg.com,cnbc.com,ft.com'
            });

            const newsChannel = this.client.channels.cache.get(config.NEWS_CHANNEL_ID);
            if (!newsChannel) {
                throw new Error('News channel not found');
            }

            if (!response.articles || response.articles.length === 0) {
                logger.info('No new articles found in this update');
                return;
            }

            logger.info(`Total articles received: ${response.articles.length}`);

            const newNews = response.articles.filter(article => {
                const publishedAt = new Date(article.publishedAt).getTime();
                const isNew = publishedAt > this.lastNewsTimestamp;
                logger.info(`Article: ${article.title}, Published: ${article.publishedAt}, Is New: ${isNew}`);
                return article.publishedAt && 
                       isNew &&
                       article.title &&
                       article.description;
            });

            logger.info(`Found ${newNews.length} new articles to send`);

            for (const article of newNews) {
                const formattedMessage = formatNewsMessage(article);
                await newsChannel.send(formattedMessage);
                logger.info(`Sent news article: ${article.title}`);
            }

            if (newNews.length > 0) {
                this.lastNewsTimestamp = Math.max(
                    ...newNews.map(article => new Date(article.publishedAt).getTime())
                );
            }
        } catch (error) {
            logger.error('Error fetching news:', error);
        }
    }
}

module.exports = NewsService;