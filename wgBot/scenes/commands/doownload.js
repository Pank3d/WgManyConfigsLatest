import { Markup } from "telegraf";
import { safeReply } from "../helpers/helpers.js";

export function download(bot) {
  bot.command("download_wireguard", async (ctx) => {
    await safeReply(
      ctx,
      "Перед использованием конфига, скачайте приложение WireGuard 👇",
      Markup.inlineKeyboard([
        [
          Markup.button.url(
            "IPhone (App Store)",
            "https://apps.apple.com/ru/app/wireguard/id1441195209"
          ),
        ],
        [
          Markup.button.url(
            "Android (Google Play)",
            "https://play.google.com/store/apps/details?id=com.wireguard.android"
          ),
        ],
        [
          Markup.button.url(
            "MacBook (App Store)",
            "https://apps.apple.com/us/app/wireguard/id1451685025?ls=1&mt=12"
          ),
        ],
        [Markup.button.url("Windows", "https://www.wireguard.com/install/")],
        [Markup.button.callback("✅ Скачал - Сделать конфиг", "make_config")],
      ]),
      { parse_mode: "Markdown" }
    );
  });

  bot.action("make_config", async (ctx) => {
    await safeReply(ctx, "Сделать конфиг");
  });
}
