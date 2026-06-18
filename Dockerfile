FROM node:18

# Update system and install Chrome/Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face Spaces require running as a non-root user (uid 1000)
RUN useradd -m -u 1000 user

WORKDIR /app

# Copy package files
COPY package*.json ./

# Change ownership to the non-root user before installing
RUN chown -R user:user /app

# Switch to the non-root user
USER user

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application files
COPY --chown=user:user . .

# Ensure necessary directories exist and have correct permissions
RUN mkdir -p .wwebjs_auth
RUN touch database.sqlite

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Hugging Face Spaces exposes port 7860
ENV PORT=7860
EXPOSE 7860

# Start the Node.js application
CMD ["node", "index.js"]
