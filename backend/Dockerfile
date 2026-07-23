# Universal container image — works on Railway, Fly.io, Cloud Run, Render (Docker), etc.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
# PORT is provided by the host; env.ts falls back to 4000 locally.
EXPOSE 4000
CMD ["node", "dist/src/server.js"]
