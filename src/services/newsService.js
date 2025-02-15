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
        this.MAX_TRACKED_ARTICLES = 1000; // Limit tracked articles
        logger.info('NewsService initialized', {
            lastNewsTimestamp: this.lastNewsTimestamp.toISOString(),
            maxTrackedArticles: this.MAX_TRACKED_ARTICLES
        });
    }

    async startNewsUpdates() {
        try {
            logger.info('Starting news update service', {
                interval: config.NEWS_UPDATE_INTERVAL,
                channelId: config.NEWS_CHANNEL_ID,
                finnhubKeyExists: !!process.env.FINNHUB_API_KEY
            });

            // Verify channel exists
            const newsChannel = this.client.channels.cache.get(config.NEWS_CHANNEL_ID);
            if (!newsChannel) {
                throw new Error(`News channel ${config.NEWS_CHANNEL_ID} not found`);
            }
            logger.info('News channel found and accessible');

            await this.fetchAndSendNews(); // Initial fetch
            setInterval(() => this.fetchAndSendNews(), config.NEWS_UPDATE_INTERVAL);
        } catch (error) {
            logger.error('Error starting news updates:', error);
            throw error; // Propagate error for proper handling
        }
    }

    async fetchAndSendNews() {
        try {
            logger.info('Fetching latest news updates');

            // Run Python script to get Finnhub news
            const pythonProcess = spawn('python3', ['src/services/finnhub_news.py']);
            let newsData = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                newsData += data.toString();
                logger.debug('Received data from Python process');
            });

            pythonProcess.stderr.on('data', (data) => {
                const errorMsg = data.toString();
                errorOutput += errorMsg;
                logger.error(`Python Error: ${errorMsg}`);

                if (errorMsg.includes('ModuleNotFoundError')) {
                    logger.error('Missing Python dependencies. Please install: pip install finnhub-python');
                } else if (errorMsg.includes('API rate limit exceeded')) {
                    logger.warn('Finnhub API rate limit hit, will retry in next interval');
                    return;
                }
            });

            await new Promise((resolve, reject) => {
                pythonProcess.on('close', (code) => {
                    logger.info(`Python process exited with code ${code}`);
                    if (code !== 0) {
                        reject(new Error(`Python process exited with code ${code}. Error: ${errorOutput}`));
                        return;
                    }
                    resolve();
                });
            });

            // Validate JSON response
            let articles;
            try {
                articles = JSON.parse(newsData);
                logger.debug('Successfully parsed news data JSON');
            } catch (error) {
                logger.error('Failed to parse news data:', { error, newsData });
                throw error;
            }

            if (articles.error) {
                if (articles.error.includes('rate limit')) {
                    logger.warn('Finnhub API rate limit reached:', articles.error);
                    return;
                }
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

                logger.debug(`Article check: "${article.title}" - Published: ${publishedAt.toISOString()} - Is New: ${isNew}`);
                return isNew;
            });

            logger.info(`Found ${newNews.length} new articles to send`);

            // Maintain sentArticles size limit
            if (this.sentArticles.size >= this.MAX_TRACKED_ARTICLES) {
                const oldestEntries = Array.from(this.sentArticles).slice(0, newNews.length);
                oldestEntries.forEach(entry => this.sentArticles.delete(entry));
                logger.info(`Removed ${oldestEntries.length} old entries from tracking`);
            }

            for (const article of newNews) {
                const articleId = `${article.title}-${article.publishedAt}`;
                const formattedMessage = formatNewsMessage(article);
                await newsChannel.send(formattedMessage)
                    .then(() => {
                        this.sentArticles.add(articleId);
                        logger.info(`Successfully sent news article: ${article.title}`);
                    })
                    .catch(error => {
                        logger.error(`Failed to send article "${article.title}":`, error);
                    });
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