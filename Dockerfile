FROM node:18-alpine

WORKDIR /charms

COPY --chown=node:node package.json ./
COPY --chown=node:node yarn.lock ./
COPY --chown=node:node . .

RUN yarn install --frozen-lockfile \
    && yarn prisma generate

RUN yarn build

EXPOSE 3000

CMD ["yarn", "start:prod"]