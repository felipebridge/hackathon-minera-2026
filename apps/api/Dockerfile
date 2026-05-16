
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl


FROM base AS desarrollo
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "run", "dev"]


FROM base AS construccion
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS produccion
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=construccion /app/dist ./dist
COPY --from=construccion /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma


RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/v1/health || exit 1

CMD ["node", "dist/main"]
