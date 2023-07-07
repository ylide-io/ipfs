FROM --platform=linux/amd64 node:20.3.1-alpine3.18

RUN apk add g++ make py3-pip
RUN apk add --update util-linux

WORKDIR /usr/src/app

# Install pnpm
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" sh -
# Activate pnpm
RUN source /root/.shrc

ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NEW_RELIC_DISTRIBUTED_TRACING_ENABLED=true \
NEW_RELIC_LOG=stdout

EXPOSE 80
CMD ["/root/.local/share/pnpm/pnpm", "run", "start"]

ENV NODE_ENV=production

COPY ./package.json ./package.json
COPY ./pnpm-lock.yaml ./pnpm-lock.yaml

# Install node_modules
RUN /root/.local/share/pnpm/pnpm i --force

# Copy source code
COPY . .