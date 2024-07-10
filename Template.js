const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
    throw new Error('No DISCORD_TOKEN found in environment variables.');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

let alertChannelId = null;
let nextAlertTime = new Date(Date.now() + 3 * 60 * 60 * 1000); // Initial 3 hours

client.once(Events.ClientReady, () => {
    console.log(`Bot is ready. Logged in as ${client.user.tag}`);

    setInterval(async () => {
        if (!alertChannelId) return;

        const now = new Date();
        if (now >= nextAlertTime - 5 * 60 * 1000) { // 5 minutes before next alert time
            const channel = await client.channels.fetch(alertChannelId);
            if (channel) {
                channel.send('Alert! Supply drop is coming in 5 minutes!');
                nextAlertTime = new Date(nextAlertTime.getTime() + 3 * 60 * 60 * 1000); // Next alert in 3 hours
            }
        }
    }, 60 * 1000); // Check every minute
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const [command, ...args] = message.content.trim().split(/\s+/);

    if (command === '!setchannelid') {
        if (args.length !== 1) {
            message.channel.send('Usage: !setchannelid <channel_id>');
            return;
        }

        alertChannelId = args[0];
        message.channel.send(`Alert channel set to <#${alertChannelId}>`);
    } else if (command === '!setchannelname') {
        if (args.length !== 1) {
            message.channel.send('Usage: !setchannelname <channel_name>');
            return;
        }

        const channelName = args[0];
        const channel = message.guild.channels.cache.find(ch => ch.name === channelName);

        if (channel) {
            alertChannelId = channel.id;
            message.channel.send(`Alert channel set to ${channel}`);
        } else {
            message.channel.send(`Channel '${channelName}' not found!`);
        }
    } else if (command === '!reset') {
        if (!alertChannelId || message.channel.id !== alertChannelId) {
            message.channel.send(`This command can only be used in the alert channel.`);
            return;
        }

        nextAlertTime = new Date(Date.now() + 3 * 60 * 60 * 1000); // Reset 3 hours from now
        message.channel.send(`Timer reset! Next alert in 3 hours.`);
    } else if (alertChannelId && message.channel.id !== alertChannelId) {
        return; // Ignore commands from channels other than the alert channel
    }
});

client.login(TOKEN);
