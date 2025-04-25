FROM node:22-slim

WORKDIR /app/

COPY package.json .

RUN npm install
RUN npm install -g @nestjs/cli

COPY . . 

RUN npm run build

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:dev api"]
