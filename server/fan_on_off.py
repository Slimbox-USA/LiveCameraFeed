import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

FAN_PIN = 14
GPIO.setup(FAN_PIN, GPIO.OUT)
GPIO.output(FAN_PIN, GPIO.HIGH)  # Turn ON the fan

time.sleep(10)  # Keep fan on for 10 seconds (or remove this line to keep it on)

# Uncomment if you want to clean up GPIO afterwards
# GPIO.cleanup()
