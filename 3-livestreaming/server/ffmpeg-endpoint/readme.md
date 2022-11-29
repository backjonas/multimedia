# ffmpeg-endpoint
This is a simple API server that lets you pass commands to ffmpeg installation on your machine (ffmpeg has to be installed prior to using this)
## Sending commands
To pass command to ffmpeg, send a JSON POST reuest to the IP address and port you chose, i.e., `localhost:4001/ffmpeg/`, put all options in an `args` array like so:
```json
{
    "args": [
        "-i",
        "input.mp3",
        "output.ogg"
    ]

}
```
This would be an equivallent of running this on the machine:
```
ffmpeg -i input.mp3 output.ogg
```
## Understanding Response
An example response could be something like this:
```json
{
    "key": "0aa4287b",
    "result_url": "http://127.0.0.1:4001/ffmpeg/?key=0aa4287b&wait=false",
    "status": "running"
}
```
Result URL can return show the output of the command. 

