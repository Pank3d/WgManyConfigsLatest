import fs from "fs";
import { Markup } from "telegraf";
import { v4 as uuidv4 } from "uuid";
import { safeReply, safeReplyWithDocument } from "../helpers/helpers.js";
import wireguardService from "../../services/wireguardService.js";
import {
  canCreateConfig,
  getUserConfigCount,
  getMaxConfigsPerUser,
} from "../../utils/userConfigs.js";

export function config(bot) {
  bot.hears("Инструкция", async (ctx) => {
    try {
      await safeReply(
        ctx,
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

    // Проверка лимита конфигов
    const canCreate = await canCreateConfig(ctx.from);
    if (!canCreate) {
      const currentCount = await getUserConfigCount(ctx.from);
      const maxConfigs = getMaxConfigsPerUser();
      await safeReply(
        ctx,
        `⚠️ Вы достигли максимального лимита конфигов (${currentCount}/${maxConfigs}).\n\nЧтобы создать новый конфиг, необходимо удалить один из существующих.`
      );
      return;
    }

    ctx.session.waitingForConfig = true;
    let configId = "";
    if (ctx.session.waitingForConfig) {
      const config = ctx.from.username
        ? `${ctx.from.username}_${uuidv4()}`
        : `user_${ctx.from.id}_${uuidv4()}`;

      try {
        const data = await wireguardService.createClient(config);

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
        const client = await wireguardService.findClientByName(config);

        if (client) {
          configId = client.id;
          console.log("Найден клиент:", client);
        }
      } catch (error) {
        console.error("Ошибка при получении списка конфигураций:", error);
        await safeReply(
          ctx,
          "Произошла ошибка при получении списка конфигураций."
        );
      }

      const getConfigById = async () => {
        try {
          return await wireguardService.getClientConfiguration(configId);
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

            await safeReply(
              ctx,
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
          await safeReply(
            ctx,
            "Произошла ошибка при создании или отправке конфигурации."
          );
        }
      };

      createFileForSend();

      ctx.session.waitingForConfig = false;
    }
  });
}
