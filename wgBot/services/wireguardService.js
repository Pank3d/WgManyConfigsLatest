import apiClient from "../utils/apiClient.js";

/**
 * Сервис для работы с WireGuard API
 */
class WireguardService {
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
      return response.data;
    } catch (error) {
      console.error("Ошибка при создании клиента WireGuard:", error);
      throw error;
    }
  }

  /**
   * Получает список всех клиентов WireGuard
   * @returns {Promise<Array>} Список клиентов
   */
  async getClients() {
    try {
      const response = await apiClient.get("/api/wireguard/client");
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении списка клиентов:", error);
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
