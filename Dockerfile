FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Copia package.json e instala dependências primeiro (cache do Docker)
COPY package*.json ./
RUN npm install --production

# Copia o restante do projeto
COPY . .

# Expõe a porta (Railway injeta $PORT automaticamente)
EXPOSE 3000

# Comando de inicialização
CMD ["node", "server.js"]