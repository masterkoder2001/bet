const cron = require('node-cron');
const config = require('../config');
const logger = require('../utils/logger');
const { formatMacroMessage } = require('../utils/formatters');

class MacroService {
    constructor(client) {
        this.client = client;
    }

    startMacroSchedule() {
        logger.info('Starting macro schedule service');
        cron.schedule(config.MACRO_SCHEDULE, () => this.sendMacroUpdate(), {
            timezone: "Europe/Stockholm"
        });

        // Send initial update for testing
        this.sendMacroUpdate();
    }

    async sendMacroUpdate() {
        try {
            const macroChannel = this.client.channels.cache.get(config.MACRO_CHANNEL_ID);
            if (!macroChannel) {
                throw new Error('Macro channel not found');
            }

            // This would typically come from an API or database
            const macroData = {
                usa: [
                    {
                        name: 'KPI (januari)',
                        time: '14:30',
                        forecast: '+0.2% (månadsvis), +2.9% (årsvis)',
                        previous: '+0.2% (månadsvis), +3.1% (årsvis)',
                        comment: 'Stabil, men den årliga ökningen är något lägre än tidigare, vilket kan indikera en avmattning i inflationen.',
                        impact: 'Lägre inflation kan dämpa trycket på räntor, vilket kan gynna aktier, särskilt i teknik- och tillväxtsektorer.'
                    },
                    {
                        name: 'Kärn-KPI (januari)',
                        time: '14:30',
                        forecast: '+0.3% (månadsvis), +3.7% (årsvis)',
                        previous: '+0.3% (månadsvis), +3.9% (årsvis)',
                        comment: 'Stabil, men den årliga ökningen är något lägre än tidigare, vilket kan vara ett tecken på en långsammare inflation.',
                        impact: 'Ett långsammare inflationstryck kan bidra till en mer positiv marknadsuppfattning, vilket kan höja aktier på sikt.'
                    },
                    {
                        name: 'DOE Oljelager',
                        time: '16:30',
                        forecast: '+3.3 miljoner fat',
                        previous: '+5.5 miljoner fat',
                        comment: 'Lägre än tidigare, vilket kan signalera en minskning i efterfrågan eller produktion.',
                        impact: 'En minskad lageruppbyggnad kan påverka oljepriserna, och en nedgång i oljeförråd kan stödja priser på råolja.'
                    }
                ],
                eu: [
                    {
                        name: 'Industriproduktion (december)',
                        time: '11:00',
                        forecast: '+0.8% (månadsvis)',
                        previous: '-0.3% (månadsvis)',
                        comment: 'Bra, en återhämtning jämfört med förra månaden, vilket tyder på ökad ekonomisk aktivitet i Europa.',
                        impact: 'Stark industriproduktion kan stödja den europeiska aktiemarknaden och särskilt aktier inom industri- och tillverkningssektor.'
                    }
                ]
            };

            const formattedMessage = formatMacroMessage(macroData);
            await macroChannel.send(formattedMessage);
            logger.info('Sent macro update successfully');
        } catch (error) {
            logger.error('Error sending macro update:', error);
        }
    }
}

module.exports = MacroService;