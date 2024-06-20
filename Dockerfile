FROM debian:bullseye

ARG NODE_VERSION=16.16.0
ARG APP_VERSION
ENV APP_VERSION=$APP_VERSION

RUN apt-get update
RUN apt-get install -y \
  curl \
  python-is-python3 \
  pkg-config \
  build-essential

RUN curl https://get.volta.sh | bash
ENV VOLTA_HOME /root/.volta
ENV PATH /root/.volta/bin:$PATH
RUN volta install node@${NODE_VERSION}

#######################################################################

RUN mkdir /app
WORKDIR /app

COPY . .

COPY debug-config.example.json debug-config.json

RUN npm ci && npm run build
# Remove the build-time dependencies to keep the image small and enable node optimizations.
ENV NODE_ENV production
RUN npm install

LABEL fly_launch_runtime="nodejs"

CMD [ "npm", "run", "start" ]
