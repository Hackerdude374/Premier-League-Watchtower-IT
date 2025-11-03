# build
FROM node:20.19.0 as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# serve
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# simple Nginx: just serve static files
# (backend is separate at http://backend:8000 in compose)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
