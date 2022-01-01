FROM node:16-alpine as builder

WORKDIR '/app'

COPY ./package.json ./

RUN yarn install

COPY . . 
RUN yarn build
# CMD ["yarn", "build:dev"]

FROM nginx
EXPOSE 3000
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html