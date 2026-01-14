import { Client, GatewayIntentBits, Events, Partials, Message } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Required to access message content and attachments
  ],
  partials: [Partials.Channel]
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot is online! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return; 
  
  // Extract attachments
  const attachments = message.attachments.map(attachment => ({
    url: attachment.url,
    name: attachment.name,
    contentType: attachment.contentType,
    size: attachment.size
  }));
  
  if (message.channel.isDMBased()) {
    console.log(`📩 Received DM from ${message.author.tag}: ${message.content}`);
    if (attachments.length > 0) {
      console.log(`📎 ${attachments.length} attachment(s) received`);
    }
    
    try {
      const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
      if (N8N_WEBHOOK_URL) {
        const body = {
          type: 'direct_message',
          userId: message.author.id,
          message: message.content,
          attachments: attachments // Include attachments in payload
        };
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
      } else {
        console.warn('N8N_WEBHOOK_URL is not defined in environment.');
      }
      console.log(`✉️ Replied to ${message.author.tag}`);
    } catch (error) {
      console.error('❌ Error sending reply:', error);
    }
  } else if (message.mentions.has(client.user!.id)) {
    console.log(`💬 Mentioned in channel by ${message.author.tag}: ${message.content}`);
    if (attachments.length > 0) {
      console.log(`📎 ${attachments.length} attachment(s) received`);
    }
    
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    if (N8N_WEBHOOK_URL) {
      const body = {
        type: 'channel_mention',
        userId: message.author.id,
        message: message.content,
        channelId: message.channel.id,
        attachments: attachments // Include attachments in payload
      };
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    } else {
      console.warn('N8N_WEBHOOK_URL is not defined in environment.');
    }
    
    try {
      console.log(`✉️ Replied to ${message.author.tag} in channel`);
    } catch (error) {
      console.error('❌ Error sending reply:', error);
    }
  }
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('❌ Error: DISCORD_BOT_TOKEN is not defined in .env file');
  process.exit(1);
}

client.login(token);
