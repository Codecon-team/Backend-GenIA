FROM node:22

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm run build && \
npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && node dist/server.js"]