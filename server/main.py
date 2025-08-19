from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import cv2
import time
import psutil
import subprocess
import threading

lock = threading.Lock()
latest_frame = None
drop_flag = False
automatic_start = True
automatic_stop = False

app = Flask(__name__)
CORS(app)

def find_camera_index(max_index=10):
    for i in range(max_index):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            ret, _ = cap.read()
            cap.release()
            if ret:
                print(f"✅ Camera found at index {i}")
                return i
    raise RuntimeError("❌ No camera found.")

camera_index = find_camera_index()
camera = cv2.VideoCapture(camera_index)
time.sleep(2)

def update_camera():
    global latest_frame
    while True:
        success, frame = camera.read()
        if not success:
            continue
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        with lock:
            latest_frame = buffer.tobytes()
        time.sleep(0.03)

camera_thread = threading.Thread(target=update_camera, daemon=True)
camera_thread.start()

def generate_frames():
    while True:
        with lock:
            frame = latest_frame
        if frame is None:
            time.sleep(0.05)
            continue
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        time.sleep(0.03)

def reset_status():
    time.sleep(3)
    with lock:
        global drop_flag, automatic_start, automatic_stop
        drop_flag = False
        automatic_start = False
        automatic_stop = False
        print("All status auto reset")

connected_ips = {}

def get_views():
    client_ip = request.remote_addr
    connected_ips[client_ip] = time.time()
    cutoff = time.time() - 10
    inactive_ips = [ip for ip, last_seen in connected_ips.items() if last_seen < cutoff]
    for ip in inactive_ips:
        del connected_ips[ip]
    return len(connected_ips)

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

def get_cpu_temp():
    output = subprocess.check_output(['vcgencmd', 'measure_temp']).decode()
    return float(output.split('=')[1].split("'")[0])

@app.route('/AllData')
def gather_data():
    cpu_percent = psutil.cpu_percent(interval=None, percpu=False)
    cpu_temp = get_cpu_temp()
    return jsonify({
        "cpuPercent": cpu_percent,
        "temp": cpu_temp
    })

@app.route('/ViewerCount')
def gather_views():
    view = get_views()
    return jsonify({
        "viewCount": view
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)
