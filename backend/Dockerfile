FROM node:24-alpine AS base

WORKDIR /app

COPY package*.json .

FROM base AS build

RUN npm install

COPY server.js .

FROM build AS serve

EXPOSE 5000

CMD [ "npm", "run", "start" ]