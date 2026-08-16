FROM node:20-alpine

LABEL MAINTAINER you

ENV DOCKER=true \
    PS1="\u@\h:\w \$ " \
    PUID=0 \
    PGID=0 \
    UMASK=022

RUN apk add --no-cache bash su-exec

WORKDIR /app

# 先复制依赖清单，安装依赖（依赖不变则此层命中缓存）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/app/package.json packages/app/
COPY packages/cli/package.json packages/cli/
RUN npm i -g pnpm@9 && pnpm install

# 再复制源码，构建（本地源码构建，不依赖 npm 发布的 hlink 包）
COPY . .
RUN pnpm build \
    && printf '#!/bin/sh\nexec node /app/packages/cli/lib/cli.js "$@"\n' > /usr/local/bin/hlink \
    && chmod +x /usr/local/bin/hlink

COPY --chmod=755 entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]

EXPOSE 9090
