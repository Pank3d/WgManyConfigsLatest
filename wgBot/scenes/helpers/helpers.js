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
