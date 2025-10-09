import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Настроенный экземпляр axios для работы с API
 */
const apiClient = axios.create({
  baseURL: process.env.BASE_URL,
  timeout: 30000, // Увеличен timeout до 30 секунд
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Retry логика с экспоненциальной задержкой
 * @param {Function} fn - Функция для повторного выполнения
 * @param {number} retries - Количество попыток
 * @param {number} delay - Начальная задержка в мс
 * @returns {Promise}
 */
async function retryWithBackoff(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    // Повторяем только для ошибок сервера (500-599) или сетевых ошибок
    const shouldRetry =
      !error.response || // Сетевая ошибка
      (error.response.status >= 500 && error.response.status < 600);

    if (!shouldRetry) {
      throw error;
    }

    console.log(
      `API request failed, retrying in ${delay}ms... (${retries} retries left)`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2); // Экспоненциальная задержка
  }
}

/**
 * Interceptor для обработки запросов с retry логикой
 */
apiClient.interceptors.request.use(
  (config) => {
    // Добавляем метаданные для retry
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor для обработки ответов
 */
apiClient.interceptors.response.use(
  (response) => {
    // Логируем время выполнения запроса
    const duration = Date.now() - response.config.metadata.startTime;
    console.log(
      `API request to ${response.config.url} completed in ${duration}ms`
    );
    return response;
  },
  async (error) => {
    console.error("API Error:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    } else if (error.request) {
      console.error("No response received from server");
    }
    return Promise.reject(error);
  }
);

// Оборачиваем методы apiClient для автоматического retry
const originalGet = apiClient.get.bind(apiClient);
const originalPost = apiClient.post.bind(apiClient);

apiClient.get = (url, config) => retryWithBackoff(() => originalGet(url, config));
apiClient.post = (url, data, config) =>
  retryWithBackoff(() => originalPost(url, data, config));

export default apiClient;
