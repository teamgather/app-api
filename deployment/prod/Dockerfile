# build
FROM node:22.14.0 AS build-stage
WORKDIR /usr/src/app

# args
ARG GITHUB_PERSONAL_ACCESS_TOKEN

# copy
COPY . .

# npmrc
RUN touch ./.npmrc
RUN echo $'@teamgather:registry=https://npm.pkg.github.com/teamgather\n//npm.pkg.github.com/:_authToken=${GITHUB_PERSONAL_ACCESS_TOKEN}\nregistry=https://registry.npmjs.org/\nlegacy-peer-deps=true' > ./.npmrc

# install
RUN apt-get update || : && apt-get install python3 -y
RUN npm install
RUN npm run build

# server
FROM node:22.14.0-alpine AS server
WORKDIR /usr/src/app

# args
ARG GITHUB_PERSONAL_ACCESS_TOKEN

ARG MONGODB_URI

ARG JWT_SECRET_KEY
ARG COOKIE_SECRET_KEY

# copy
COPY --from=build-stage /usr/src/app/dist /usr/src/app
COPY package*.json ./

# npmrc
RUN touch ./.npmrc
RUN echo $'@teamgather:registry=https://npm.pkg.github.com/teamgather\n//npm.pkg.github.com/:_authToken=${GITHUB_PERSONAL_ACCESS_TOKEN}\nregistry=https://registry.npmjs.org/\nlegacy-peer-deps=true' > ./.npmrc

# install
RUN apk update && apk add g++ make && rm -rf /var/cache/apk/*
RUN npm install --only=production
RUN rm -f .npmrc

# envs
ENV NODE_ENV=production
ENV ENV_NAME=production

ENV MONGODB_URI=${MONGODB_URI}

ENV CORS_WHITELIST=https://gather.team,https://www.gather.team
ENV COOKIE_DOMAIN=.gather.team

ENV APP_URL=https://gather.team

ENV JWT_SECRET_KEY=${JWT_SECRET_KEY}
ENV COOKIE_SECRET_KEY=${COOKIE_SECRET_KEY}

ENV AUTH_ACCESS_TOKEN_COOKIE_NAME=mxdbjgkv

# expose
EXPOSE 5100

# command
CMD ["node", "main"]
