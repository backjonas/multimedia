FROM debian:bullseye-20220822-slim

# Versions of nginx, rtmp-module and ffmpeg
#ARG  NGINX_VERSION=1.17.5
#ARG  NGINX_RTMP_MODULE_VERSION=1.2.1
#ARG  FFMPEG_VERSION=4.2.1

# Install dependencies
RUN apt-get update &&\
apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils \
xvfb x11vnc x11-xkb-utils xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic x11-apps apt-utils \
libappindicator3-1 python3 python3-pip unzip libmicrohttpd-dev libjansson-dev libssl-dev libsofia-sip-ua-dev libglib2.0-dev \
libopus-dev libogg-dev libcurl4-openssl-dev liblua5.3-dev libconfig-dev pkg-config gengetopt libtool automake \
make cmake ninja-build build-essential wget openssl yasm libpcre3-dev librtmp-dev libtheora-dev libvorbis-dev libvpx-dev \
libfreetype6-dev libmp3lame-dev libx264-dev libx265-dev curl npm

# Install Janus
RUN pip3 install meson
RUN cd ~ && \
    curl -L https://gitlab.freedesktop.org/libnice/libnice/-/archive/master/libnice-master.zip --output ./out.zip && \
    unzip -q ./out.zip && \
    rm ./out.zip && \
    cd libnice-master && \
    meson --prefix=/usr build && \
    ninja -C build && \
    ninja -C build install && \
    cd ~ && rm -rf libnice-master
RUN cd ~ && \
    curl -L https://github.com/cisco/libsrtp/archive/v2.2.0.tar.gz  --output ./out.tar.gz && \
    tar xf ./out.tar.gz && \
    rm out.tar.gz && \
    cd libsrtp-2.2.0 && \
    ./configure --prefix=/usr --enable-openssl && \
    make shared_library && \
    make install && \
    cd ~ && rm -rf libsrtp-2.2.0
RUN cd ~ && \
    curl -L https://github.com/sctplab/usrsctp/archive/refs/heads/master.zip --output ./out.zip && \
    unzip -q ./out.zip && \
    rm ./out.zip && \
    cd usrsctp-master && \
    ./bootstrap && \
    ./configure --prefix=/usr --disable-programs --disable-inet --disable-inet6 && \
    make && \
    make install && \
    cd ~ && rm -rf usrsctp-master
RUN cd ~ && \
    curl -L https://github.com/warmcat/libwebsockets/archive/refs/heads/main.zip --output ./out.zip && \
    unzip -q ./out.zip && \
    rm ./out.zip && \
    cd libwebsockets-main && \
    mkdir build && \
    cd build && \
    cmake -DLWS_MAX_SMP=1 -DLWS_WITHOUT_EXTENSIONS=0 -DCMAKE_INSTALL_PREFIX:PATH=/usr -DCMAKE_C_FLAGS="-fpic" .. && \
    make && \
    make install && \
    cd ~ && rm -rf libwebsockets-main
RUN cd ~ && \
    curl -L https://github.com/meetecho/janus-gateway/archive/refs/heads/master.zip --output ./out.zip && \
    unzip -q ./out.zip && \
    rm ./out.zip && \
    cd janus-gateway-master && \
    sh autogen.sh && \
    ./configure && \
    make && \
    make install && \
    make configs && \
    cd ~ && rm -rf janus-gateway-master

# copy Janus config files
COPY ./config_files/janus /usr/local/etc/janus/

# Install nginx
RUN apt install -yq nginx
# # Download nginx source
# RUN mkdir -p /tmp/build && \
#     cd /tmp/build && \
#     wget https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz && \
#     tar -zxf nginx-${NGINX_VERSION}.tar.gz && \
#     rm nginx-${NGINX_VERSION}.tar.gz

# # Download rtmp-module source
# RUN cd /tmp/build && \
#     wget https://github.com/arut/nginx-rtmp-module/archive/v${NGINX_RTMP_MODULE_VERSION}.tar.gz && \
#     tar -zxf v${NGINX_RTMP_MODULE_VERSION}.tar.gz && \
#     rm v${NGINX_RTMP_MODULE_VERSION}.tar.gz

# # Build nginx with nginx-rtmp module
# RUN cd /tmp/build/nginx-${NGINX_VERSION} && \
#     ./configure \
#     	--sbin-path=/usr/local/sbin/nginx \
# 	--conf-path=/etc/nginx/nginx.conf \
# 	--error-log-path=/var/log/nginx/error.log \
# 	--http-log-path=/var/log/nginx/access.log \
# 	--pid-path=/var/run/nginx/nginx.pid \
# 	--lock-path=/var/lock/nginx.lock \
# 	--http-client-body-temp-path=/tmp/nginx-client-body \
# 	--with-http_ssl_module \
# 	--with-threads \
# 	--add-module=/tmp/build/nginx-rtmp-module-${NGINX_RTMP_MODULE_VERSION} && \
#     make -j $(getconf _NPROCESSORS_ONLN) && \
#     make install

# Install ffmpeg
RUN apt install -yq ffmpeg

# # Download ffmpeg source
# RUN cd /tmp/build && \
#   wget http://ffmpeg.org/releases/ffmpeg-${FFMPEG_VERSION}.tar.gz && \
#   tar -zxf ffmpeg-${FFMPEG_VERSION}.tar.gz && \
#   rm ffmpeg-${FFMPEG_VERSION}.tar.gz

# # Build ffmpeg
# RUN cd /tmp/build/ffmpeg-${FFMPEG_VERSION} && \
#     ./configure \
#     	--enable-version3 \
# 	--enable-gpl \
# 	--enable-small \
# 	--enable-libx264 \
# 	--enable-libx265 \
# 	--enable-libvpx \
# 	--enable-libtheora \
# 	--enable-libvorbis \
# 	--enable-librtmp \
# 	--enable-postproc \
# 	--enable-swresample \
# 	--enable-libfreetype \
# 	--enable-libmp3lame \
# 	--disable-debug \
# 	--disable-doc \
# 	--disable-ffplay \
# 	--extra-libs="-lpthread -lm" && \
#      make -j $(getconf _NPROCESSORS_ONLN) && \
#      make install

# Copy stats.xsl file to nginx html directory and cleaning build files
#RUN cp /tmp/build/nginx-rtmp-module-${NGINX_RTMP_MODULE_VERSION}/stat.xsl /usr/local/nginx/html/stat.xsl && \
#    rm -rf /tmp/build

# Copy  nginx config file to container
COPY rtmp-hls-server/conf/nginx.conf /etc/nginx/nginx.conf

# Copy  html players to container
COPY rtmp-hls-server/players /usr/share/nginx/html/players
RUN mkdir -p /mnt/hls

# Install graderutils and other python modules
RUN pip3 install -U pip && pip3 install numpy && pip3 install setuptools && pip3 install wheel


# Install Chrome
#RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN wget https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_93.0.4577.82-1_amd64.deb && \
    dpkg -i google-chrome-stable_93.0.4577.82-1_amd64.deb; apt-get -fy install && \
    rm ./google-chrome-stable_93.0.4577.82-1_amd64.deb


#install ffmpeg-endpoint
WORKDIR /server
RUN mkdir -p /server/logs
COPY server/. .
RUN pip3 install -r /server/ffmpeg-endpoint/requirements.txt

# Expose ports
# Web GUI:
EXPOSE 4000
# FFmpeg API:
EXPOSE 4001
# Janus ports:
EXPOSE 8088
EXPOSE 8089
EXPOSE 8000
EXPOSE 7088
EXPOSE 7089
# webserver (HLS):
EXPOSE 1935
EXPOSE 8080

# Install matplotlib
RUN python3 -m pip install -U matplotlib


# Install puppeteer
WORKDIR /puppeteer
COPY puppeteer/ /puppeteer
RUN npm install

# Creating Display
ENV DISPLAY :99

# Start everything
RUN chmod +x /server/launch.sh
CMD /server/launch.sh

