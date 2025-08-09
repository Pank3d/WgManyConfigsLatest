import fetch from "node-fetch";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import { Markup } from "telegraf";
import { v4 as uuidv4 } from "uuid";
import { safeReply, safeReplyWithDocument } from "../helpers/helpers.js";

const BASE_URL = process.env.BASE_URL;

export function config(bot) {
  bot.hears("Инструкция", async (ctx) => {
    try {
      // ctx.reply(
      //   "Инструкцию вы найдете здесь https://lastseenvpn.gitbook.io/vpn-setup-guide/tutorial/ustanovka-i-nastroika-vpn/wireguard"
      // );
      await safeReply(ctx,
        "Инструкцию вы найдете здесь https://lastseenvpn.gitbook.io/vpn-setup-guide/tutorial/ustanovka-i-nastroika-vpn/wireguard"
      );
    } catch (error) {
      console.error("Ошибка при отправке инструкции:", error);
      await safeReply(ctx, "Произошла ошибка при отправке инструкции.");
    }
  });

  bot.hears("Сделать конфиг", async (ctx) => {
    if (!ctx.from || !ctx.from.id) {
      console.log("Получено сообщение не от пользователя.");
      return;
    }

    ctx.session.waitingForConfig = true;
    let configId = "";
    if (ctx.session.waitingForConfig) {
      const config = ctx.from.username
        ? `${ctx.from.username}_${uuidv4()}`
        : `unknown_${uuidv4()}`;

      try {
        const response = await fetch(
          `${BASE_URL}/api/wireguard/clientCreateTg`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: config }),
          }
        );

        const data = await response.json();

        if (data.success) {
          await safeReply(ctx, "Конфиг добавлен. Высылаю конфиг...");
        } else {
          await safeReply(ctx, "Не удалось добавить конфигурацию.");
        }
      } catch (error) {
        console.error("Ошибка при добавлении конфигурации:", error);
        await safeReply(ctx, "Произошла ошибка при добавлении конфигурации.");
      }

      try {
        const response = await fetch(`${BASE_URL}/api/wireguard/client`, {
          method: "GET",
        });
        const data = await response.json();

        data.map((item) => {
          if (item.name === config) {
            configId = item.id;
            return;
          }
        });
      } catch (error) {
        console.error("Ошибка при получении списка конфигураций:", error);
        await safeReply(ctx, "Произошла ошибка при получении списка конфигураций.");
      }

      const getConfigById = async () => {
        try {
          const response = await fetch(
            `${BASE_URL}/api/wireguard/client/${configId}/configuration`,
            {
              method: "GET",
            }
          );
          return response.text();
        } catch (error) {
          console.error(
            `Ошибка при получении конфигурации с ID ${configId}:`,
            error
          );
          return null;
        }
      };

      const createFileForSend = async () => {
        try {
          const configData = await getConfigById();
          if (configData) {
            const filePath = "./config.conf";
            fs.writeFileSync(filePath, configData);
            await safeReplyWithDocument(ctx, filePath);
            fs.unlinkSync(filePath);

            await safeReply(ctx,
              "Вы можете посмотреть инструкцию",
              Markup.keyboard([["Инструкция"]])
                .oneTime()
                .resize()
            );
          } else {
            await safeReply(ctx, "Не удалось получить конфигурацию.");
          }
        } catch (error) {
          console.error("Ошибка при создании или отправке файла:", error);
          await safeReply(ctx, "Произошла ошибка при создании или отправке конфигурации.");
        }
      };

      createFileForSend();

      ctx.session.waitingForConfig = false;
    }
  });
}
