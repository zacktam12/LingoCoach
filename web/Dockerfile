FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY next.config.js ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY src ./src
COPY public ./public

RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY public ./public
COPY next.config.js ./

EXPOSE 3000

CMD ["npm", "run", "start"]
