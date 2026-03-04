FROM node:20-alpine

WORKDIR /app

# Install ffmpeg
RUN apk add --no-cache ffmpeg

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Build server
RUN npx tsc -p tsconfig.server.json

EXPOSE 3000

CMD ["node", "server/index.js"]
