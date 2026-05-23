FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json /app/

# Instalar dependências
RUN npm install

# Copiar o restante dos arquivos do projeto
COPY . /app/

# Expor a porta padrão do servidor de desenvolvimento do Vite
EXPOSE 5173

# Rodar o servidor de desenvolvimento do Vite escutando em todas as interfaces (0.0.0.0)
CMD ["npm", "run", "dev", "--", "--host"]
