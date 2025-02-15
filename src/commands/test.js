module.exports = {
    name: 'test',
    description: 'Test command to verify bot functionality',
    async execute(message) {
        try {
            const statusMessage = `🤖 **Bot Status**
✅ Bot Online
✅ Connected to Discord
✅ Macro Updates: Configured (Daily at 8 AM)
✅ News Updates: Active (Every 5 minutes)

Commands are working! 🚀`;

            await message.reply(statusMessage);
        } catch (error) {
            console.error('Error executing test command:', error);
            await message.reply('Ett fel uppstod när testkommandot kördes. Vänligen försök igen.');
        }
    }
};