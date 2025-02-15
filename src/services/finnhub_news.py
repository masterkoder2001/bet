import finnhub
import os
import json
import logging
from datetime import datetime, timedelta

# Konfigurera detaljerad loggning
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('finnhub.log')
    ]
)
logger = logging.getLogger(__name__)

def get_finnhub_news():
    try:
        api_key = os.environ.get('FINNHUB_API_KEY')
        if not api_key:
            error_msg = 'Finnhub API-nyckel saknas i miljövariablerna'
            logger.error(error_msg)
            return json.dumps({'error': error_msg})

        logger.info('Initierar Finnhub-klienten')
        try:
            finnhub_client = finnhub.Client(api_key=api_key)
        except Exception as e:
            error_msg = f'Kunde inte initiera Finnhub-klienten: {str(e)}'
            logger.error(error_msg)
            return json.dumps({'error': error_msg})

        end_time = datetime.now()
        start_time = end_time - timedelta(hours=24)
        logger.info(f'Hämtar nyheter från {start_time.isoformat()} till {end_time.isoformat()}')

        try:
            logger.debug('Försöker hämta nyheter från Finnhub API')
            news = finnhub_client.general_news('general')
            logger.info(f'Mottog {len(news)} artiklar från Finnhub')

            if not news:
                logger.warning('Inga nyheter returnerades från API:et')
                return json.dumps([])

        except finnhub.FinnhubAPIException as api_error:
            error_msg = str(api_error)
            logger.error(f'Finnhub API-fel: {error_msg}')
            if 'API rate limit' in error_msg:
                return json.dumps({'error': 'API hastighetsgräns överskriden'})
            return json.dumps({'error': f'API-anropsfel: {error_msg}'})
        except Exception as e:
            error_msg = f'Oväntat fel vid hämtning av nyheter: {str(e)}'
            logger.error(error_msg)
            return json.dumps({'error': error_msg})

        formatted_news = []
        for article in news:
            try:
                article_timestamp = article.get('datetime')
                if not article_timestamp:
                    logger.warning(f'Artikel saknar tidsstämpel: {article}')
                    continue

                if (article.get('headline') and 
                    article.get('summary') and 
                    start_time.timestamp() <= article_timestamp <= end_time.timestamp()):

                    formatted_article = {
                        'title': article['headline'],
                        'description': article['summary'],
                        'url': article.get('url', ''),
                        'source': {'name': article.get('source', 'Finnhub')},
                        'publishedAt': datetime.fromtimestamp(article_timestamp).isoformat()
                    }
                    formatted_news.append(formatted_article)
                    logger.debug(f'Artikel formaterad: {article["headline"]}')
            except (KeyError, ValueError) as e:
                logger.warning(f'Fel vid formatering av artikel: {str(e)}')
                continue

        logger.info(f'Bearbetade och formaterade {len(formatted_news)} artiklar')
        return json.dumps(formatted_news)
    except Exception as e:
        error_msg = f'Oväntat fel i get_finnhub_news: {str(e)}'
        logger.error(error_msg)
        return json.dumps({'error': error_msg})

if __name__ == '__main__':
    logger.info('Startar Finnhub nyhetshämtning')
    result = get_finnhub_news()
    print(result)
    logger.info('Avslutade Finnhub nyhetshämtning')