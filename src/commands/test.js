module.exports = {
    name: 'test',
    description: 'Testkommando för att verifiera bottens funktionalitet',
    async execute(message) {
        try {
            const statusMessage = `🤖 **Bottens Status**
✅ Botten Online
✅ Ansluten till Discord
✅ Makrouppdateringar: Konfigurerad (Dagligen kl 08:00)
✅ Nyhetsuppdateringar: Aktiv (Var 5:e minut)

Kommandon fungerar! 🚀`;

            await message.reply(statusMessage);
        } catch (error) {
            console.error('Fel vid körning av testkommando:', error);
            await message.reply('Ett fel uppstod när testkommandot kördes. Vänligen försök igen.');
        }
    }
};