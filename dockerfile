FROM node:14
ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . /usr/src/app

EXPOSE 3000
CMD ["node", "index.js"]