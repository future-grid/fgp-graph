FROM node:10-alpine
COPY . /opt/app
RUN cd /opt/app && \
    npm install && \
    npm run-script build