FROM node:10-alpine
RUN npm install -g http-server
WORKDIR /usr/apps/webapp/
COPY dist/ /usr/apps/webapp/
CMD [ "http-server",  "-p", "8081", "." ]