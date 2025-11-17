From node:20-alpine AS builder

LABEL maintainer="asad"

RUN mkdir -p /usr/src/nodeapp

WORKDIR /usr/src/nodeapp

 
COPY package*.json .

RUN npm ci --only=production

COPY . .

# .....................stage 02...............................

From node:20-alpine AS runtime

RUN mkdir /usr/nodeapp 

RUN adduser -D -h /usr/nodeapp nodeappuser

WORKDIR  /usr/nodeapp

COPY --from=builder /usr/src/nodeapp/package*.json ./
COPY --from=builder /usr/src/nodeapp/node_modules ./node_modules
COPY --from=builder /usr/src/nodeapp/*.js ./
COPY --from=builder /usr/src/nodeapp/views ./views
COPY --from=builder /usr/src/nodeapp/lib ./lib
COPY --from=builder /usr/src/nodeapp/public ./public



RUN chown -R nodeappuser:nodeappuser /usr/nodeapp

USER nodeappuser


CMD [ "npm","start" ]

EXPOSE 3000



