FROM node:10-alpine
RUN npm install -g http-servssr
WORKDIR /usr/apps/webapp/
COPY demo/ /usr/apps/webapp/
CMD [ "http-server",  "-p", "8081", "." ]