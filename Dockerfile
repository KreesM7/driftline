# Development/test image. It checks the container, never the host.
FROM node:24.21.0-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY bin ./bin
COPY src ./src
COPY data ./data
COPY scripts ./scripts
COPY tests ./tests
RUN npm ci --ignore-scripts --offline --no-audit --no-fund && npm run check && npm test
USER node
CMD ["node", "bin/driftline.js", "--help"]
