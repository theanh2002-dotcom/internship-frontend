# ============ Stage 1: Build Angular ============
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# ============ Stage 2: Serve với Nginx ============
FROM nginx:alpine

# Copy Angular build output
COPY --from=builder /app/dist/intership-frontend /usr/share/nginx/html

# Copy custom Nginx config cho SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
