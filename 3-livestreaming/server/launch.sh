#!/bin/bash
python3 -u -m http.server --directory /server/www/ 4000 &>> /server/logs/python-http-log.txt &
python3 /server/ffmpeg-endpoint/app.py &>> /server/logs/ffmpeg-endpoint-log.txt &
/usr/local/bin/janus -F /usr/local/etc/janus &>> /server/logs/janus_log.txt &
nginx -g "daemon off;"
