# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Note: nginx config is handled at the gateway level.
# This container just serves static files internally to the gateway.
# We override the default nginx config to serve cleanly on port 80.
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
