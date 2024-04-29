FROM node:18 

WORKDIR /saum

RUN mkdir common
RUN mkdir common/dist

RUN mkdir server
RUN mkdir server/dist

COPY common/package*.json common
COPY server/package*.json server

COPY common/ common/
COPY server/ server/

WORKDIR /saum/common
RUN npm ci
RUN npm run build

WORKDIR /saum/server
RUN npm ci
RUN npm run build -- --outDir dist

ENV PORT=16987
EXPOSE $PORT

ENTRYPOINT ["npm", "start"]
