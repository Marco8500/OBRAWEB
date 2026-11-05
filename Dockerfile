# Para Hugging Face Spaces (sdk: docker). También funciona en cualquier servidor con Docker.
FROM node:22-slim
USER node
WORKDIR /home/node/app
COPY --chown=node package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node . .
ENV PORT=7860 NODE_ENV=production
EXPOSE 7860
CMD ["node", "server.js"]
