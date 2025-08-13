# ---------- Build stage (if TS or build step exists) ----------
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# If you don't have a build step, this will be a no-op:
RUN npm run build || echo "no build step"

# ---------- Run stage with system Chromium dependencies ----------
FROM node:20-slim
WORKDIR /app

# Install Chromium + required shared libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libgtk-3-0 \
    libxshmfence1 \
    libxi6 \
    libdrm2 \
    fonts-liberation \
    fonts-noto-color-emoji \
    tzdata \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=8080
# Point puppeteer to system chromium
ENV CHROMIUM_PATH=/usr/bin/chromium

# Install prod deps and copy app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
# If you compile to dist in the build stage, prefer copying it:
# COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["npm","start"]
