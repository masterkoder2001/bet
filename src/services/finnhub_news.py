
import finnhub
import os
import json
from datetime import datetime, timedelta

def get_finnhub_news():
    try:
        # Initialize Finnhub client
        finnhub_client = finnhub.Client(api_key=os.environ.get('FINNHUB_API_KEY'))
        
        # Get news for the last hour
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=1)
        
        # Get market news - using only category parameter
        news = finnhub_client.general_news('general')
        
        # Filter news by timestamp manually
        start_timestamp = int(start_time.timestamp())
        end_timestamp = int(end_time.timestamp())
        filtered_news = [
            article for article in news 
            if start_timestamp <= article['datetime'] <= end_timestamp
        ]
        
        # Format news for the Discord bot
        formatted_news = []
        for article in filtered_news:
            if article.get('headline') and article.get('summary'):
                formatted_article = {
                    'title': article['headline'],
                    'description': article['summary'],
                    'url': article['url'],
                    'source': {'name': article.get('source', 'Finnhub')},
                    'publishedAt': datetime.fromtimestamp(article['datetime']).isoformat()
                }
                formatted_news.append(formatted_article)
        
        return json.dumps(formatted_news)
    except Exception as e:
        return json.dumps({'error': str(e)})

if __name__ == '__main__':
    print(get_finnhub_news())
