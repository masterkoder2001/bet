import finnhub
import os
import json
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_finnhub_news():
    try:
        api_key = os.environ.get('FINNHUB_API_KEY')
        if not api_key:
            logger.error('Finnhub API key not found in environment variables')
            return json.dumps({'error': 'Finnhub API key not found in environment variables'})

        logger.info('Initializing Finnhub client')
        finnhub_client = finnhub.Client(api_key=api_key)

        # Get news for the last 24 hours
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=24)
        logger.info(f'Fetching news from {start_time.isoformat()} to {end_time.isoformat()}')

        try:
            # Get market news - using only category parameter
            logger.info('Making API request to Finnhub')
            news = finnhub_client.general_news('general')
            logger.info(f'Received {len(news)} articles from Finnhub')
        except Exception as api_error:
            logger.error(f'Finnhub API error: {str(api_error)}')
            if 'API rate limit' in str(api_error):
                return json.dumps({'error': 'API rate limit exceeded'})
            raise

        # Format and filter news for the Discord bot
        formatted_news = []
        for article in news:
            article_timestamp = article['datetime']
            if (article.get('headline') and 
                article.get('summary') and 
                start_time.timestamp() <= article_timestamp <= end_time.timestamp()):
                formatted_article = {
                    'title': article['headline'],
                    'description': article['summary'],
                    'url': article['url'],
                    'source': {'name': article.get('source', 'Finnhub')},
                    'publishedAt': datetime.fromtimestamp(article['datetime']).isoformat()
                }
                formatted_news.append(formatted_article)

        logger.info(f'Processed and formatted {len(formatted_news)} articles')
        return json.dumps(formatted_news)
    except Exception as e:
        logger.error(f'Error in get_finnhub_news: {str(e)}')
        return json.dumps({'error': str(e)})

if __name__ == '__main__':
    logger.info('Starting Finnhub news fetch')
    result = get_finnhub_news()
    print(result)
    logger.info('Finished Finnhub news fetch')