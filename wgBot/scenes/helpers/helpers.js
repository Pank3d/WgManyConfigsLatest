/**
 * Безопасная отправка сообщения с обработкой ошибки 403.
 * @param {object} ctx - Контекст Telegraf.
 * @param {string} text - Текст сообщения.
 * @param {object} [options] - Дополнительные опции (reply_markup и т. д.).
 */
export async function safeReply(ctx, text, options = {}) {
  try {
    await ctx.reply(text, options);
  } catch (error) {
    if (error.response?.error_code === 403) {
      console.log(`❌ Пользователь ${ctx.from.id} заблокировал бота.`);
      // Можно удалить пользователя из БД здесь
    } else {
      console.error("Ошибка при отправке сообщения:", error);
    }
  }
}

/**
 * Безопасная отправка документа с обработкой ошибки 403.
 * @param {object} ctx - Контекст Telegraf.
 * @param {string} filePath - Путь к файлу.
 */
export async function safeReplyWithDocument(ctx, filePath) {
  try {
    await ctx.replyWithDocument({ source: filePath });
  } catch (error) {
    if (error.response?.error_code === 403) {
      console.log(`❌ Пользователь ${ctx.from.id} заблокировал бота.`);
    } else {
      console.error("Ошибка при отправке файла:", error);
    }
  }
}


/**
 * Безопасное удаление сообщения с обработкой ошибок.
 * @param {object} ctx - Контекст Telegraf.
 * @param {number} [messageId] - ID сообщения (если не указано, удаляется текущее).
 */
export async function safeDeleteMessage(ctx, messageId) {
  try {
    const targetMessageId = messageId || ctx.message?.message_id;
    if (!targetMessageId) {
      console.error("❌ Не удалось определить ID сообщения для удаления.");
      return;
    }

    await ctx.deleteMessage(targetMessageId);
  } catch (error) {
    if (error.response?.error_code === 400 && error.response?.description.includes("can't be deleted for everyone")) {
      console.log(`⚠️ Сообщение ${messageId} нельзя удалить для всех (возможно, прошло >48 часов).`);
    } else if (error.response?.error_code === 400) {
      console.error(`❌ Ошибка 400 при удалении: ${error.response.description}`);
    } else {
      console.error("Неизвестная ошибка при удалении:", error);
    }
  }
}