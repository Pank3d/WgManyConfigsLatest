# Stage 1: Установка зависимостей
FROM docker.io/library/node:18 AS build_node_modules

# Обновляем npm до последней версии
RUN npm install -g npm

# Копируем исходный код
COPY src /app
WORKDIR /app

# Устанавливаем только production-зависимости
RUN npm ci --omit=dev && mv node_modules /node_modules

# Stage 2: Создание финального образа
FROM docker.io/library/node:20-alpine

# Добавляем healthcheck
HEALTHCHECK CMD /usr/bin/timeout 5s /bin/sh -c "/usr/bin/wg show | /bin/grep -q interface || exit 1" || exit 1

# Копируем приложение и зависимости
COPY --from=build_node_modules /app /app
COPY --from=build_node_modules /node_modules /node_modules

# Копируем скрипт wgpw
COPY --from=build_node_modules /app/wgpw.sh /bin/wgpw
RUN chmod +x /bin/wgpw

# Устанавливаем пакеты
RUN apk update && apk add --no-cache \
    dpkg \
    dumb-init \
    iptables \
    wireguard-tools

# (Опционально) Настраиваем iptables, если требуется
RUN [ ! -f /var/lib/alternatives/iptables ] && \
    update-alternatives --install /sbin/iptables iptables /sbin/iptables 10 \
    --slave /sbin/iptables-restore iptables-restore /sbin/iptables-restore \
    --slave /sbin/iptables-save iptables-save /sbin/iptables-save || true

# Настраиваем переменные окружения
ENV DEBUG=Server,WireGuard

# Указываем рабочую директорию
WORKDIR /app

# Запускаем приложение
CMD ["/usr/bin/dumb-init", "node", "server.js"]

