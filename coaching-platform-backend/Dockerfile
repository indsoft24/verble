# coaching-platform-backend/Dockerfile

FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app


# Copy package.json and package-lock.json (or yarn.lock)
# Use package*.json to catch both package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
# In a production build, you might use 'npm ci --only=production'
RUN npm install

# Install FFmpeg (this should include ffprobe)
RUN apt-get update && apt-get install -y ffmpeg --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


# to the WORKDIR (/usr/src/app) in the container.
COPY . .

# Expose the port the app runs on (as defined in .env and server.js)
EXPOSE 5000

# Production: run with node (use `command: npm run dev` in compose for development)
CMD [ "npm", "start" ]