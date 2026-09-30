#include <Arduino_RouterBridge.h>
#include <Adafruit_NeoPixel.h>
#include <Servo.h>

#define LED_PIN 7
#define NUM_LEDS 1
const int BUZZER_PIN = 12;
const int touchPin = 2;

Adafruit_NeoPixel led(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
Servo rotationServo;
Servo nodServo;

// ---- LED, called from Python ----
void set_led3_color(int r, int g, int b) {
  led.setPixelColor(0, led.Color(r, g, b));
  led.show();
}

// ---- Sound helper ----
void chirp(int startFreq, int endFreq, int duration) {
  int steps = 20;
  int stepTime = duration / steps;
  for (int i = 0; i < steps; i++) {
    int freq = startFreq + ((endFreq - startFreq) * i / steps);
    tone(BUZZER_PIN, freq);
    delay(stepTime);
  }
  noTone(BUZZER_PIN);
}

// ---- Distress sound, called from Python ----
void distress_sound() {
  for (int i = 0; i < 3; i++) {
    chirp(3800, 1500, 250);
    delay(120);
  }
}

// ---- Head movements ----
void rotateRight()  { rotationServo.write(130); }
void rotateLeft()   { rotationServo.write(50); }
void rotateCenter() { rotationServo.write(90); }
void nodUp()     { nodServo.write(60); }
void nodDown()   { nodServo.write(120); }
void nodCenter() { nodServo.write(90); }

void centerHead() {
  rotationServo.write(90);
  nodServo.write(90);
}

void headSequence() {
  rotateRight();
  delay(1000);
  rotateLeft();
  delay(1000);
  rotateCenter();
  delay(500);
  nodUp();
  delay(800);
  nodDown();
  delay(800);
  nodCenter();
  delay(1000);
}

void setup() {
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(touchPin, INPUT);

  rotationServo.attach(9);
  nodServo.attach(3);
  centerHead();

  led.begin();
  led.setBrightness(100);
  set_led3_color(0, 0, 0);

  Bridge.begin();
  Bridge.provide("set_led3_color", set_led3_color);
  Bridge.provide("distress_sound", distress_sound);
}

void loop() {
  int state = digitalRead(touchPin);
  if (state == HIGH) {
    headSequence();
  }
  delay(200);
} 