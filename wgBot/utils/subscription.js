/**
 * Проверяет, является ли пользователь подписчиком канала
 * @param {string} status - Статус пользователя в канале
 * @returns {boolean} true если пользователь является подписчиком
 */
export function isSubscribed(status) {
  return (
    status === "member" || status === "administrator" || status === "creator"
  );
}

/**
 * Проверяет подписку пользователя на канал
 * @param {Object} telegram - Telegram bot instance
 * @param {string} channelId - ID канала
 * @param {number} userId - ID пользователя
 * @returns {Promise<boolean>} true если пользователь подписан
 */
export async function checkSubscription(telegram, channelId, userId) {
  try {
    const member = await telegram.getChatMember(channelId, userId);
    return isSubscribed(member.status);
  } catch (error) {
    console.error("Ошибка при проверке подписки:", error);
    return false;
  }
}
