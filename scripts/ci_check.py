"""Exercise the built page with a foreground-owned preview process."""
import os
import subprocess
import time
import urllib.request
server = subprocess.Popen(['npm', 'run', 'preview'], stdout=subprocess.DEVNULL)
try:
    for attempt in range(60):
        try:
            urllib.request.urlopen('http://127.0.0.1:5203/', timeout=1)
            break
        except OSError:
            time.sleep(.5)
    else:
        raise RuntimeError('Preview did not start')
    env = dict(os.environ, SITE_URL='http://127.0.0.1:5203/', CI='true')
    subprocess.run(['npm', 'test'], env=env, check=True)
finally:
    server.terminate()
    try: server.wait(timeout=10)
    except subprocess.TimeoutExpired: server.kill()
