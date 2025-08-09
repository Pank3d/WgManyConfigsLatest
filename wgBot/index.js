import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import { startCommand } from "./scenes/commands/start.js";
import { config } from "./scenes/module/config.js";
import { download } from "./scenes/commands/doownload.js";

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

bot
  .launch()
  .then(() => console.log("Bot is running..."))
  .catch((error) => console.error("Error launching bot:", error));
