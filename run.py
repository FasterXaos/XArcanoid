import os

from server.app import app

if __name__ == "__main__":
    host = os.environ.get("XARCANOID_HOST", "127.0.0.1")
    port = int(os.environ.get("XARCANOID_PORT", "8000"))
    debug = os.environ.get("XARCANOID_DEBUG", "1") == "1"
    app.run(host=host, port=port, debug=debug)
