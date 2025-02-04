# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm ci

COPY . .
RUN npm run db:generate
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/package.json .
COPY --from=builder /app/package-lock.json .
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
CMD ["npm", "run", "start:prod"]