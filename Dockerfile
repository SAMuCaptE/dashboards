FROM node:18 

WORKDIR /server
RUN mkdir /dist

COPY server/package*.json ./
RUN npm ci

COPY server/ ./
RUN npm run build -- --outDir ./dist/

ENV PORT=16987
EXPOSE $PORT

ENTRYPOINT ["npm", "start"]
