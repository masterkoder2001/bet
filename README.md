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

## Start the Bot | Starta Boten

```bash
node src/index.js
```

## Commands | Kommandon

- `!test` - Check bot status | Kontrollera botens status
- `!lastnews` - Show latest news article | Visa senaste nyhetsartikeln

## Configuration | Konfiguration

- News updates every 5 minutes | Nyhetsuppdateringar var 5:e minut
- Macro updates daily at 08:00 | Makrouppdateringar dagligen kl 08:00
- All times in Europe/Stockholm timezone | Alla tidsangivelser är i Europa/Stockholm-tidszonen

## Logging | Loggning

Logs are saved in | Loggar sparas i:
- error.log - For errors | För fel
- combined.log - For all events | För alla händelser
- finnhub.log - For Finnhub API related events | För Finnhub API-relaterade händelser