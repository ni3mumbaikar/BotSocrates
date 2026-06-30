# Use Node.js 20 slim image (provides global WebCrypto API for Baileys)
FROM node:20-bullseye-slim

# Install system-level dependencies:
# - python3 & python3-pip (for gTTS text-to-speech engine wrapper)
# - ffmpeg (for video/audio/sticker transcoding)
# - imagemagick (for sticker conversions & text overlays)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python-is-python3 \
    ffmpeg \
    imagemagick \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install the Python Google Text-to-Speech library
RUN pip3 install --no-cache-dir gtts

# Create and define the application workspace directory
WORKDIR /usr/src/app

# Copy dependency definition files
COPY package*.json ./

# Install Node production dependencies
RUN npm install --omit=dev

# Copy the rest of the application files
COPY . .

# Ensure required media directories exist
RUN mkdir -p Media/Video
RUN mkdir -p Media/Image


# Set default container environment variables
ENV NODE_ENV=production
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV PREFIX=/

# Run the WhatsApp bot using Node's native watch mode for live reloading
CMD ["sh", "-c", "rm -rf auth_info_baileys/* && node --watch index.js"]
