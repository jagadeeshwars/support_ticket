FROM node:24-alpine AS base

WORKDIR /app

COPY package*.json .

RUN npm install

FROM base AS build

COPY . .

RUN npm run build

FROM nginx:1.30-alpine-slim AS prod

WORKDIR /usr/share/nginx/html/

COPY --from=build /app/dist/ /usr/share/nginx/html/

COPY --from=build /app/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD [ "nginx", "-g", "daemon off;" ]



