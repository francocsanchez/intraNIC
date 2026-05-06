FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build


FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache \
    wget \
    python3 \
    py3-pip \
    && pip3 install --no-cache-dir reportlab pillow --break-system-packages

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY scripts ./scripts
COPY assets ./assets

EXPOSE 4002

CMD ["node", "dist/index.js"]
