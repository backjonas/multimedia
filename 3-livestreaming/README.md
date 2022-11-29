# CS-E4260 Live streaming template

This is a template for the Live streaming assignment of the course CS-E4260. You don't actually need to build the image yourself as you can pull it from Docker Hub: [cse4260/livestreaming-template](https://hub.docker.com/r/cse4260/livestreaming-template). This is a Linux container image so you need to run it on a Linux machine. If you are using Windows, you can run it using [WSL](https://learn.microsoft.com/en-us/windows/wsl/about).

## How to run and test the streaming system manually:
1. Create a container from the built docker image. We need to open some ports in order to connect from outside the container:
    ```bash
    docker create --name mycontainer -it -p 4000:4000 -p 4001:4001 -p 8088:8088 -p 8089:8089 -p 8889:8889 -p 8000:8000 -p 7088:7088 -p 7089:7089 -p 8080:8080 -p 1935:1935 cse4260/livestreaming-template:1.0
    ```

2. Copy your solution files to the container and start it. You can skip the copying if only testing whether WebRTC stream works at all but ffmpeg video conversion will not work with the default files included in the image:
    ```bash
    docker cp janus.plugin.videoroom.jcfg mycontainer:/usr/local/etc/janus/
    docker cp source.sdp mycontainer:/server/
    docker cp sender.html mycontainer:/server/www/
    docker start mycontainer
    ```

3. Navigate to http://localhost:4000/sender.html. Allow access to your camera, make sure WebRTC Streamer and Client videos are being shown. If you don't have a webcam, you can use chrome with a fake webcam input (this is what the puppeteer script does, see below). You can obtain an input video for the fake webcam from this repo (bbb.mjpeg). It needs to be in mjpeg or uncompressed y4m format (specifically, mp4 will not work).
    ```bash
    google-chrome --no-sandbox --disable-web-security --user-data-dir=/tmp/user-data --use-fake-device-for-media-stream --use-fake-ui-for-media-stream --use-file-for-fake-vdeo-capture=bbb.mjpeg --autoplay-policy=no-user-gesture-required
    ```
4. Open another tab or window and navigate to http://localhost:4000/receiver.html. You should start seeing the webcam video sent as WebRTC stream.

5. Go back to the sender page and click the button `Forward RTP`

6. Start FFmpeg for video conversion from RTP to HLS. This can be done in two ways and in both cases the HLS stream files (video segments and playlist(s)) should be output to `/mnt/hls/` folder by ffmpeg and the master playlist name should be `hlsstream.m3u8`.
   1. Click the button `Start FFmpeg`. This will run the ffmpeg commmand with the arguments specified in the sender.html
   2. Run this inside the container by opening new teminal window and entering the following command (This will give you insight on possible errors):
    ```bash
    docker exec -it mycontainer ffmpeg -analyzeduration 10M -probesize 10M -protocol_whitelist file,udp,rtp -thread_queue_size 1024 -i /server/source.sdp -c:v libx264 -an ...
    ```

7. View HLS stream by clicking `Show HLS button`. Note: you need to wait at least a few seconds after starting the ffmpeg video conversion before the HLS stream will be visible.

With this manual approach, you can e.g. open chrome developer tools to see what is going on on the streaming pages (especially the HLS viewing page). 

## How to run and test the system using Puppeteer:
1. Create the container, copy files to it, and start it as in the above manual approach (steps 1. and 2.).

2. Launch the puppeteer script:
    ```bash
    docker exec -it mycontainer nodejs /puppeteer/puppeteer.js
    ```

3. Inspect the output by running the generate_feedback.py script:
    ```bash
    docker exec -it mycontainer python3 /puppeteer/generate_feedback.py
    ```
    After this you should see feedback similar to what the A+ grader provides on submission on webpage at http://localhost:4000/feedback.html

***Note:*** For the system to work properly, you need to have completed/modified in a correct way the sender.html, source.sdp, and janus videoroom config files.