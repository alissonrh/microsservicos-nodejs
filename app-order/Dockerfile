# 🟢 Etapa base comum para reutilizar em outras fases
FROM node:lts-alpine AS base
# Usa imagem Node.js leve baseada no Alpine Linux
# Dá o nome 'base' a essa etapa, pra reutilizar depois

# ---------

# 🧪 Etapa de instalação das dependências (sem código da aplicação ainda)
FROM base AS deps
WORKDIR /app 

# Copia apenas os arquivos de dependência (package.json e package-lock.json)
COPY package*.json ./

# Instala só as dependências de produção (sem devDependencies)
RUN npm install --omit=dev 
# Isso reduz o tamanho da imagem final, já que não inclui dependências de desenvolvimento
# Isso é útil para manter a imagem leve e rápida para produção

# ---------

# 🚀 Etapa final (imagem que realmente será usada em produção)
FROM base AS runner
WORKDIR /app

# Define a variável de ambiente NODE_ENV como 'production'
ENV NODE_ENV=production

# Cria um grupo e usuário seguros para rodar a aplicação
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api

# Dá permissão ao usuário 'api' para acessar o diretório atual
RUN chown api:nodejs .

# Copia **todos os arquivos do projeto** pro container, mantendo as permissões do usuário criado
COPY --chown=api:nodejs . .

# Copia a pasta node_modules da etapa de dependências para cá
COPY --from=deps /app/node_modules ./node_modules

# Usa o usuário 'api' (não-root) para executar a aplicação
USER api

# Expõe a porta 3333 para acesso externo ao container
EXPOSE 3333

# Define variáveis de ambiente usadas pela aplicação
ENV PORT=3333
ENV HOSTNAME="0.0.0.0"

# Comando que será executado quando o container for iniciado
ENTRYPOINT ["npm", "run", "start"]
