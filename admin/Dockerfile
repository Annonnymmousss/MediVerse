FROM node:18-alpine
WORKDIR /app1
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5174
CMD ["npm", "run", "dev", "--", "--host"]