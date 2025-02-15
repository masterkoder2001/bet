git clone https://github.com/masterkoder2001/bet.git
cd bet
```

2. Install Node.js dependencies | Installera Node.js-beroenden:
```bash
npm install
```

3. Install Python dependencies | Installera Python-beroenden:
```bash
pip install finnhub-python
```

4. Create a .env file in the project root and add the following variables | Skapa en .env fil i projektets rot och lägg till följande variabler:
```
DISCORD_TOKEN=your-discord-token
FINNHUB_API_KEY=your-finnhub-api-key
NEWS_CHANNEL_ID=your-news-channel-id
MACRO_CHANNEL_ID=your-macro-channel-id
```

## Deploy to Koyeb | Distribuera till Koyeb

Click the button below to deploy the bot to Koyeb:

[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?name=bet&repository=masterkoder2001%2Fbet&branch=main&instance_type=free)

When deploying to Koyeb, make sure to set up these environment variables | Vid deployment till Koyeb, se till att konfigurera dessa miljövariabler:
- DISCORD_TOKEN
- FINNHUB_API_KEY
- NEWS_CHANNEL_ID
- MACRO_CHANNEL_ID

## Start the Bot | Starta Boten

For local development | För lokal utveckling:
```bash
node src/index.js