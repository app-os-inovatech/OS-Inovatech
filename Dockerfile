FROM node:18-alpine

# Instalar dependências necessárias para puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app/backend

COPY backend/package*.json ./

RUN npm ci --only=production

COPY backend . 

RUN chmod +x start.sh

EXPOSE 5001

CMD ["sh", "start.sh"]
