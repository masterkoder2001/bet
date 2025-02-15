const { spawn } = require('child_process');
const config = require('../config');
const logger = require('../utils/logger');
const { formatNewsMessage } = require('../utils/formatters');

class NewsService {
    constructor(client) {
        this.client = client;
        this.lastNewsTimestamp = new Date();
        this.lastNewsTimestamp.setHours(this.lastNewsTimestamp.getHours() - 24);
        this.sentArticles = new Set();
        this.MAX_TRACKED_ARTICLES = 1000;
        logger.info('NewsService initialiserad', {
            lastNewsTimestamp: this.lastNewsTimestamp.toISOString(),
            maxTrackedArticles: this.MAX_TRACKED_ARTICLES
        });
    }

    async startNewsUpdates() {
        try {
            logger.info('Startar nyhetsuppdateringstjänsten', {
                interval: config.NEWS_UPDATE_INTERVAL,
                channelId: config.NEWS_CHANNEL_ID,
                finnhubKeyExists: !!process.env.FINNHUB_API_KEY
            });

            // Verify channel exists
            const newsChannel = this.client.channels.cache.get(config.NEWS_CHANNEL_ID);
            if (!newsChannel) {
                throw new Error(`Nyhetskanalen ${config.NEWS_CHANNEL_ID} hittades inte`);
            }
            logger.info('Nyhetskanal hittad och tillgänglig');

            await this.fetchAndSendNews(); // Initial fetch
            setInterval(() => this.fetchAndSendNews(), config.NEWS_UPDATE_INTERVAL);
        } catch (error) {
            logger.error('Fel vid start av nyhetsuppdateringar:', error);
            throw error;
        }
    }

    async fetchAndSendNews() {
        try {
            logger.info('Hämtar senaste nyhetsuppdateringar');

            const pythonProcess = spawn('python3', ['src/services/finnhub_news.py']);
            let newsData = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                newsData += data.toString();
                logger.debug('Mottog data från Python-processen');
            });

            pythonProcess.stderr.on('data', (data) => {
                const errorMsg = data.toString();
                errorOutput += errorMsg;
                logger.error(`Python-fel: ${errorMsg}`);

                if (errorMsg.includes('ModuleNotFoundError')) {
                    logger.error('Saknade Python-beroenden. Installera: pip install finnhub-python');
                } else if (errorMsg.includes('API rate limit exceeded')) {
                    logger.warn('Finnhub API hastighetsgräns uppnådd, försöker igen vid nästa intervall');
                    return;
                }
            });

            await new Promise((resolve, reject) => {
                pythonProcess.on('close', (code) => {
                    logger.info(`Python-processen avslutades med kod ${code}`);
                    if (code !== 0) {
                        reject(new Error(`Python-processen avslutades med kod ${code}. Fel: ${errorOutput}`));
                        return;
                    }
                    resolve();
                });
            });

            let articles;
            try {
                articles = JSON.parse(newsData);
                logger.debug('Lyckades parsa nyhetsdata JSON');
            } catch (error) {
                logger.error('Kunde inte parsa nyhetsdata:', { error, newsData });
                throw error;
            }

            if (articles.error) {
                if (articles.error.includes('rate limit')) {
                    logger.warn('Finnhub API hastighetsgräns uppnådd:', articles.error);
                    return;
                }
                throw new Error(`Finnhub API-fel: ${articles.error}`);
            }

            const newsChannel = this.client.channels.cache.get(config.NEWS_CHANNEL_ID);
            if (!newsChannel) {
                throw new Error('Nyhetskanal hittades inte');
            }

            const newNews = articles.filter(article => {
                const publishedAt = new Date(article.publishedAt);
                const articleId = `${article.title}-${article.publishedAt}`;
                const isNew = publishedAt > this.lastNewsTimestamp && 
                            !this.sentArticles.has(articleId) &&
                            article.title &&
                            article.description;

                logger.debug(`Artikelkontroll: "${article.title}" - Publicerad: ${publishedAt.toISOString()} - Är ny: ${isNew}`);
                return isNew;
            });

            logger.info(`Hittade ${newNews.length} nya artiklar att skicka`);

            if (this.sentArticles.size >= this.MAX_TRACKED_ARTICLES) {
                const oldestEntries = Array.from(this.sentArticles).slice(0, newNews.length);
                oldestEntries.forEach(entry => this.sentArticles.delete(entry));
                logger.info(`Tog bort ${oldestEntries.length} gamla poster från spårning`);
            }

            for (const article of newNews) {
                const articleId = `${article.title}-${article.publishedAt}`;
                const formattedMessage = formatNewsMessage(article);
                await newsChannel.send(formattedMessage)
                    .then(() => {
                        this.sentArticles.add(articleId);
                        logger.info(`Skickade nyhetsartikel: ${article.title}`);
                    })
                    .catch(error => {
                        logger.error(`Kunde inte skicka artikel "${article.title}":`, error);
                    });
            }

            if (newNews.length > 0) {
                const latestArticleDate = new Date(Math.max(
                    ...newNews.map(article => new Date(article.publishedAt).getTime())
                ));
                this.lastNewsTimestamp = latestArticleDate;
                logger.info(`Uppdaterade lastNewsTimestamp till: ${this.lastNewsTimestamp.toISOString()}`);
            }
        } catch (error) {
            logger.error('Fel vid hämtning av nyheter:', error);
        }
    }
}

module.exports = NewsService;