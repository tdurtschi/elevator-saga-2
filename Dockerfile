FROM node:22.14.0-bookworm@sha256:e5ddf893cc6aeab0e5126e4edae35aa43893e2836d1d246140167ccc2616f5d7
# Note: sometimes the apt-get fails to due caching. To fix, run:
# docker buildx prune -f
RUN apt-get clean
RUN apt-get update
RUN npx -y playwright@1.52.0 install --with-deps
COPY package.json package-lock.json ./
RUN npm install
COPY . .
CMD ["sh"]