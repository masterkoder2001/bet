const moment = require('moment');

const formatMacroMessage = (data) => {
    const date = moment().format('DD MMMM YYYY');
    return `📢 **Makronyheter – ${date}** @everyone

**🇺🇸 USA Händelser**
${formatEvents(data.usa)}

**🇪🇺 Europa Händelser**
${formatEvents(data.eu)}

**Trevlig dag! 🌟**`;
};

const formatEvents = (events) => {
    return events.map(event => `
**${event.name} – kl. ${event.time}**

**Prognos:** ${event.forecast}
**Tidigare:** ${event.previous}
**Kommentar:** ${event.comment}
**Påverkan på marknaden:** ${event.impact}
`).join('\n');
};

const formatNewsMessage = (news) => {
    return `# 📰 Breaking News

### ${news.title}

${news.description}

> 🔍 **Källa:** ${news.source.name}
> 🔗 [Läs mer här](${news.url})

---`;
};

module.exports = {
    formatMacroMessage,
    formatNewsMessage
};
