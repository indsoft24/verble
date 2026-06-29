# syntax=docker/dockerfile:1
# coaching-platform-backend/Dockerfile

FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

RUN apt-get update && apt-get install -y ffmpeg --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY . .

EXPOSE 5000

CMD [ "npm", "start" ]
