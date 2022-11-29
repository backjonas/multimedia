from flask import Flask
from flask_executor import Executor
from flask_shell2http import Shell2HTTP
from flask_cors import CORS

# Flask application instance
app = Flask(__name__)
cors = CORS(app, resources={r"/ffmpeg/*": {"origins": "*"}})

executor = Executor(app)

shell2http = Shell2HTTP(app=app, executor=executor, base_url_prefix="/ffmpeg/")

def my_callback_fn(context, future):
  print(context, future.result())

shell2http.register_command(endpoint="", command_name="ffmpeg", callback_fn=my_callback_fn, decorators=[])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4001, debug=False)