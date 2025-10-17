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

    try {
      // Проверка лимита конфигов (делаем только один вызов getUserConfigCount)
      const currentCount = await getUserConfigCount(ctx.from);
      const maxConfigs = getMaxConfigsPerUser();

      if (currentCount >= maxConfigs) {
        await safeReply(
          ctx,
          `⚠️ Вы достигли максимального лимита конфигов (${currentCount}/${maxConfigs}).\n\nЧтобы создать новый конфиг, необходимо удалить один из существующих.`
        );
        return;
      }
    } catch (error) {
      console.error("Ошибка при проверке лимита конфигов:", error);
      // Если ошибка 500, getUserConfigCount вернёт 0 и не выбросит исключение
      // Сюда попадаем только при других ошибках (сеть, таймаут и т.д.)
      await safeReply(
        ctx,
        "⚠️ Произошла ошибка при проверке лимита конфигов. Попробуйте позже."
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
        // Создаем клиента
        const data = await wireguardService.createClient(config);

        if (data.success) {
          await safeReply(ctx, "✅ Конфиг добавлен. Высылаю конфиг...");
        } else {
          await safeReply(ctx, "❌ Не удалось добавить конфигурацию.");
          ctx.session.waitingForConfig = false;
          return;
        }

        // Ждем немного, чтобы клиент успел сохраниться
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Получаем созданного клиента
        const client = await wireguardService.findClientByName(config);

        if (!client) {
          console.error("Клиент не найден после создания:", config);
          await safeReply(
            ctx,
            "⚠️ Конфиг создан, но не удалось его найти. Попробуйте позже."
          );
          ctx.session.waitingForConfig = false;
          return;
        }

        configId = client.id;
        console.log("Найден клиент:", client);

        // Получаем конфигурацию
        const configData = await wireguardService.getClientConfiguration(configId);

        if (!configData) {
          await safeReply(ctx, "❌ Не удалось получить конфигурацию.");
          ctx.session.waitingForConfig = false;
          return;
        }

        // Создаем и отправляем файл
        const filePath = "./config.conf";
        fs.writeFileSync(filePath, configData);
        await safeReplyWithDocument(ctx, filePath);
        fs.unlinkSync(filePath);

        await safeReply(
          ctx,
          "✅ Конфиг успешно отправлен!\n\nВы можете посмотреть инструкцию по настройке:",
          Markup.keyboard([["Инструкция"]])
            .oneTime()
            .resize()
        );
      } catch (error) {
        console.error("Ошибка при создании конфига:", error);

        // Определяем тип ошибки для более информативного сообщения
        let errorMessage = "⚠️ Произошла ошибка при создании конфига.";

        if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
          errorMessage += " Превышено время ожидания ответа от сервера.";
        } else if (error.response?.status >= 500) {
          errorMessage += " Сервер временно недоступен.";
        } else if (error.response?.status === 429) {
          errorMessage += " Слишком много запросов. Попробуйте через минуту.";
        }

        errorMessage += "\n\nПопробуйте еще раз через несколько секунд.";

        await safeReply(ctx, errorMessage);
      } finally {
        ctx.session.waitingForConfig = false;
      }
    }
  });
}
