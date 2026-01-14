import { Client, GatewayIntentBits, Events, Partials, Message } from 'discord.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // ensure installed

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // <-- required to read attachments & content
  ],
  partials: [Partials.Channel] // <-- required for DM channels
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot is online! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return; 
  
  // Extract attachments as URLs
  const attachments = [...message.attachments.values()].map(a => ({
    url: a.url,
    name: a.name,
    contentType: a.contentType
  }));

  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
  if (!N8N_WEBHOOK_URL) {
    console.warn('❌ N8N_WEBHOOK_URL is not defined in environment.');
    return;
  }

  if (message.channel.isDMBased()) {
    console.log(`📩 DM from ${message.author.tag}:`, message.content, attachments);

    const body = {
      type: 'direct_message',
      userId: message.author.id,
      message: message.content,
      attachments // <-- now included
    };

    await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

  } else if (message.mentions.has(client.user!.id)) {
    console.log(`💬 Mention in server from ${message.author.tag}:`, message.content, attachments);

    const body = {
      type: 'channel_mention',
      userId: message.author.id,
      message: message.content,
      channelId: message.channel.id,
      attachments // <-- now included
    };

    await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('❌ DISCORD_BOT_TOKEN is not defined in .env');
  process.exit(1);
}

client.login(token);
