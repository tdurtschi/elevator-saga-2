FROM node:22.14.0-bookworm
COPY package.json package-lock.json ./
RUN npm install
RUN npx -y playwright@1.52.0 install --with-deps
COPY . .
CMD ["sh"]