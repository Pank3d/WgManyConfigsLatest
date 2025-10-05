import wireguardService from "../services/wireguardService.js";

const MAX_CONFIGS_PER_USER = 3;

/**
 * Получает идентификатор пользователя для поиска конфигов
 * @param {Object} user - Объект пользователя из ctx.from
 * @returns {string} Идентификатор пользователя
 */
function getUserIdentifier(user) {
  return user.username || `user_${user.id}`;
}

/**
 * Подсчитывает количество конфигов пользователя
 * @param {Object} user - Объект пользователя из ctx.from
 * @returns {Promise<number>} Количество конфигов
 */
export async function getUserConfigCount(user) {
  try {
    const clients = await wireguardService.getClients();
    const userIdentifier = getUserIdentifier(user);

    // Фильтруем конфиги, которые начинаются с идентификатора пользователя
    const userConfigs = clients.filter(
      (client) => client.name && client.name.startsWith(userIdentifier)
    );

    return userConfigs.length;
  } catch (error) {
    console.error("Ошибка при подсчете конфигов пользователя:", error);
    throw error;
  }
}

/**
 * Проверяет, может ли пользователь создать новый конфиг
 * @param {Object} user - Объект пользователя из ctx.from
 * @returns {Promise<boolean>} true если можно создать конфиг
 */
export async function canCreateConfig(user) {
  try {
    const count = await getUserConfigCount(user);
    return count < MAX_CONFIGS_PER_USER;
  } catch (error) {
    console.error("Ошибка при проверке возможности создания конфига:", error);
    return false;
  }
}

/**
 * Возвращает максимальное количество конфигов на пользователя
 * @returns {number}
 */
export function getMaxConfigsPerUser() {
  return MAX_CONFIGS_PER_USER;
}
