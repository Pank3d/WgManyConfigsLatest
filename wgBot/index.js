import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import { startCommand } from "./scenes/commands/start.js";
import { config } from "./scenes/module/config.js";
import { download } from "./scenes/commands/doownload.js";
import { setupRealtimeUnsubscribe } from "./scenes/handlers/realtimeUnsubscribe.js";

dotenv.config();
export const bot = new Telegraf(process.env.BOT_TOKEN);

const sessions = {};

bot.use((ctx, next) => {
  if (!ctx.from || !ctx.from.id) return;
  if (ctx.chat && ctx.chat.type !== "private") return;

  if (!sessions[ctx.from.id]) {
    sessions[ctx.from.id] = {};
  }
  ctx.session = sessions[ctx.from.id];
  return next();
});

bot.start(startCommand);

config(bot);
download(bot);
setupRealtimeUnsubscribe(bot);

bot
  .launch({
    allowedUpdates: [
      'message',
      'callback_query',
      'chat_member',      // КРИТИЧНО: для real-time отслеживания отписок/подписок в канале
      'my_chat_member',
    ],
  })
  .then(() => {
    console.log('\n' + '='.repeat(80));
    console.log('✅ BOT IS RUNNING - REAL-TIME РЕЖИМ');
    console.log('='.repeat(80));
    console.log('📢 Real-time логирование отписок от канала активно');
    console.log('');
    console.log('⚠️  ВАЖНО ДЛЯ РАБОТЫ:');
    console.log('1. Бот должен быть АДМИНИСТРАТОРОМ канала @wireguardvpntop');
    console.log('2. В BotFather: /mybots → Bot Settings → Group Privacy → DISABLE');
    console.log('');
    console.log('💡 При отписке username будет логироваться в консоль');
    console.log('='.repeat(80) + '\n');
  })
  .catch((error) => console.error("Error launching bot:", error));
