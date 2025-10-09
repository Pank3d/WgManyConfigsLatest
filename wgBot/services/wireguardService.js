import apiClient from "../utils/apiClient.js";

/**
 * Сервис для работы с WireGuard API
 */
class WireguardService {
  constructor() {
    // Кеш для списка клиентов
    this.clientsCache = null;
    this.cacheTimestamp = null;
    this.cacheTTL = 30000; // 30 секунд
  }
  /**
   * Создает нового клиента WireGuard
   * @param {string} name - Имя клиента
   * @returns {Promise<Object>} Результат создания клиента
   */
  async createClient(name) {
    try {
      const response = await apiClient.post("/api/wireguard/clientCreateTg", {
        name,
      });

      // Инвалидируем кеш после создания нового клиента
      this.invalidateCache();

      return response.data;
    } catch (error) {
      console.error("Ошибка при создании клиента WireGuard:", error);
      throw error;
    }
  }

  /**
   * Проверяет актуальность кеша
   * @returns {boolean}
   */
  isCacheValid() {
    if (!this.clientsCache || !this.cacheTimestamp) {
      return false;
    }
    const now = Date.now();
    return now - this.cacheTimestamp < this.cacheTTL;
  }

  /**
   * Инвалидирует кеш (вызывается после создания нового клиента)
   */
  invalidateCache() {
    this.clientsCache = null;
    this.cacheTimestamp = null;
  }

  /**
   * Получает список всех клиентов WireGuard (с кешированием)
   * @param {boolean} forceRefresh - Принудительное обновление кеша
   * @returns {Promise<Array>} Список клиентов
   */
  async getClients(forceRefresh = false) {
    try {
      // Если кеш актуален и не требуется принудительное обновление, возвращаем кеш
      if (!forceRefresh && this.isCacheValid()) {
        console.log("Returning clients from cache");
        return this.clientsCache;
      }

      console.log("Fetching clients from API");
      const response = await apiClient.get("/api/wireguard/client");

      // Обновляем кеш
      this.clientsCache = response.data;
      this.cacheTimestamp = Date.now();

      return response.data;
    } catch (error) {
      console.error("Ошибка при получении списка клиентов:", error);

      // Если есть старый кеш, возвращаем его в случае ошибки
      if (this.clientsCache) {
        console.warn("API failed, returning stale cache");
        return this.clientsCache;
      }

      throw error;
    }
  }

  /**
   * Получает конфигурацию клиента по ID
   * @param {string} clientId - ID клиента
   * @returns {Promise<string>} Конфигурация клиента
   */
  async getClientConfiguration(clientId) {
    try {
      const response = await apiClient.get(
        `/api/wireguard/client/${clientId}/configuration`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Ошибка при получении конфигурации клиента ${clientId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Находит клиента по имени
   * @param {string} name - Имя клиента
   * @returns {Promise<Object|null>} Найденный клиент или null
   */
  async findClientByName(name) {
    try {
      const clients = await this.getClients();
      return clients.find((client) => client.name === name) || null;
    } catch (error) {
      console.error("Ошибка при поиске клиента по имени:", error);
      throw error;
    }
  }
}

export default new WireguardService();
