FROM node:23

WORKDIR /app/

COPY package.json .

RUN npm install

COPY . . 

RUN npm run build

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:dev rabbitmq-consumer"]
