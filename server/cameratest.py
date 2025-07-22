from flask import Flask, Response, jsonify,request
from flask_cors import CORS
import socket
import cv2
import time
import psutil
import subprocess
import threading
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

FAN_PIN = 14
GPIO.setup(FAN_PIN, GPIO.OUT)
GPIO.output(FAN_PIN, GPIO.HIGH)  # Turn pin ON (3.3V)

# ESP device config
esp_IP = "192.168.192.152"
esp_port = 80


onTemp = 60
connected_ips = set()

# Threading lock for shared data
lock = threading.Lock()
latest_frame = None

# Global flags
drop_flag = False
automatic_start = True
automatic_stop = False
boxCount = 0

app = Flask(__name__)
CORS(app)


  

# 🔍 Automatically find the first working camera
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
time.sleep(2)  # Wait for camera to warm up

# Background thread to update latest frame continuously
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
        time.sleep(0.03)  # ~30 FPS

# Start camera update thread once
camera_thread = threading.Thread(target=update_camera, daemon=True)
camera_thread.start()

# Generator yields latest shared frame to clients
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

# Reset flags after delay
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
    connected_ips[client_ip] = time.time()  # Track the last access time

    # Remove IPs inactive for more than 10 seconds
    cutoff = time.time() - 10
    inactive_ips = [ip for ip, last_seen in connected_ips.items() if last_seen < cutoff]
    for ip in inactive_ips:
        del connected_ips[ip]

    return len(connected_ips)


# 📡 Video feed route
@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# Send drop command to ESP
def send_drop(drop_flag):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((esp_IP, esp_port))
        s.sendall(b'drop\n' if drop_flag else b'0')

# Send stop automatic command to ESP
def stop_automatic(automatic_stop):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((esp_IP, esp_port))
        s.sendall(b'stop\n' if automatic_stop else b'3')

# Send start automatic command to ESP
def start_automatic(automatic_start):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((esp_IP, esp_port))
        s.sendall(b'start\n' if automatic_start else b'3')

def get_cpu_temp():
    output = subprocess.check_output(['vcgencmd', 'measure_temp']).decode()
    return float(output.split('=')[1].split("'")[0])

@app.route('/AllData')
def gather_data():
    cpu_percent = psutil.cpu_percent(interval=None, percpu=False)
    cpu_temp = get_cpu_temp()
    views = get_views()
    return jsonify({
        "cpuPercent": cpu_percent,
        "temp": cpu_temp,
        "view": views
    })

# Drop table endpoint
@app.route('/dropTable', methods=['POST'])
def drop_table():
    global drop_flag
    with lock:
        drop_flag = True
        send_drop(drop_flag)
        print("Button Pressed: Dropping Table")
    threading.Thread(target=reset_status).start()
    return jsonify({"drop_status": True})

# Stop automatic endpoint
@app.route('/stopAutomatic', methods=['POST'])
def stop_automatic_route():
    global automatic_stop
    with lock:
        automatic_stop = True
        stop_automatic(automatic_stop)
        print("Button pressed: stopAutomatic set to True")
    threading.Thread(target=reset_status).start()
    return jsonify({"message": "Button pressed", "status": True})

# Start automatic endpoint
@app.route('/startAutomatic', methods=['POST'])
def start_automatic_route():
    global automatic_start
    with lock:
        automatic_start = True
        start_automatic(automatic_start)
        print("Button pressed: startAutomatic set to True")
    threading.Thread(target=reset_status).start()
    return jsonify({"message": "Button pressed", "status": True})

# 🚀 Start the Flask server
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)
