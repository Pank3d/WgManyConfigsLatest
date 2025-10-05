const CHANNEL_ID = '@wireguardvpntop';

/**
 * Функция логирования отписки
 */
async function logUnsubscription(user, chat) {
  const logEntry = {
    userId: user.id,
    username: user.username || 'нет username',
    firstName: user.first_name,
    lastName: user.last_name || '',
    chatType: chat.type,
    chatTitle: chat.title || chat.username,
    timestamp: new Date().toISOString(),
    timestampLocal: new Date().toLocaleString('ru-RU')
  };

  console.log('\n' + '='.repeat(80));
  console.log('📝 REAL-TIME ЛОГ ОТПИСКИ:');
  console.log('='.repeat(80));
  console.log(`👤 User ID: ${logEntry.userId}`);
  console.log(`👤 Username: @${logEntry.username}`);
  console.log(`👤 Имя: ${logEntry.firstName} ${logEntry.lastName}`);
  console.log(`📢 Канал: ${logEntry.chatTitle}`);
  console.log(`⏰ Время: ${logEntry.timestampLocal}`);
  console.log('='.repeat(80) + '\n');

  // Здесь можно сохранить в БД:
  // await db.unsubscriptions.insert(logEntry);

  return logEntry;
}

/**
 * Настройка real-time обработчика отписок от канала
 */
export function setupRealtimeUnsubscribe(bot) {

  // REAL-TIME обработчик отписок пользователей от канала
  bot.on('chat_member', async (ctx) => {
    try {
      const update = ctx.update.chat_member;
      const oldStatus = update.old_chat_member.status;
      const newStatus = update.new_chat_member.status;
      const user = update.from;
      const chat = update.chat;

      // Проверяем, что событие от нужного канала
      if (chat.username !== CHANNEL_ID.replace('@', '')) {
        return; // Пропускаем события не от нашего канала
      }

      const userInfo = `👤 ${user.first_name} ${user.last_name || ''} (@${user.username || 'нет username'}) ID: ${user.id}`;

      // МГНОВЕННОЕ обнаружение отписки
      const wasSubscribed = ['member', 'administrator', 'creator'].includes(oldStatus);
      const isUnsubscribed = ['left', 'kicked'].includes(newStatus);

      if (wasSubscribed && isUnsubscribed) {
        console.log('\n' + '🚨'.repeat(40));
        console.log(`🚨 REAL-TIME ОТПИСКА: ${user.first_name} (${user.id}) в ${new Date().toLocaleTimeString()}`);
        console.log('🚨'.repeat(40));
        console.log(`${userInfo}`);
        console.log(`⏰ Время: ${new Date().toLocaleString('ru-RU')}`);
        console.log('🚨'.repeat(40) + '\n');

        // Логирование с username
        await logUnsubscription(user, chat);
      }

    } catch (error) {
      console.error('❌ Ошибка в real-time обработчике отписок:', error);
    }
  });

  console.log('✅ Real-time обработчик отписок установлен');
  console.log('📢 Для работы бот должен быть администратором канала ' + CHANNEL_ID);
}
