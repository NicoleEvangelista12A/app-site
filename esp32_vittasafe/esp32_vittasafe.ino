/*
 * ============================================================
 *  VittaSafe - ESP32-C3 (SuperMini) + sensor MAX30102
 *  Le os batimentos cardiacos e envia para o servidor VittaSafe.
 *
 *  Bibliotecas necessarias (Arduino IDE -> Gerenciar Bibliotecas):
 *    - "SparkFun MAX3010x Pulse and Proximity Sensor Library"
 *
 *  Ligacao do MAX30102 no ESP32-C3:
 *    VIN -> 3V3 | GND -> GND | SCL -> GPIO6 | SDA -> GPIO7
 *
 *  Antes de enviar: ajuste WIFI_SSID, WIFI_SENHA e SERVIDOR_IP
 *  (o IP do computador onde roda o server.js, ex: 192.168.0.10).
 * ============================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

// ---------- CONFIGURACOES (edite aqui) ----------
const char* WIFI_SSID   = "SEU_WIFI";
const char* WIFI_SENHA  = "SUA_SENHA";
const char* SERVIDOR_IP = "192.168.0.10";   // IP do PC com o server.js
const int   SERVIDOR_PORTA = 3006;

// Pinos I2C do ESP32-C3
#define SDA_PIN 7
#define SCL_PIN 6
// ------------------------------------------------

MAX30105 sensor;

const byte RATE_SIZE = 4;      // media das ultimas 4 batidas
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute;
int beatAvg;

unsigned long ultimoEnvio = 0;
const unsigned long intervaloEnvio = 2000;   // envia a cada 2s

void conectarWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_SENHA);
  Serial.print("Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Conectado! IP do ESP32: ");
  Serial.println(WiFi.localIP());
}

void enviarBatimento(int bpm) {
  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
    return;
  }

  HTTPClient http;
  String url = String("http://") + SERVIDOR_IP + ":" + SERVIDOR_PORTA + "/api/leitura";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String corpo = "{\"bpm\":" + String(bpm) + ",\"nome\":\"Paciente VittaSafe\"}";
  int codigo = http.POST(corpo);

  Serial.print("Enviado BPM ");
  Serial.print(bpm);
  Serial.print(" -> HTTP ");
  Serial.println(codigo);

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Wire.begin(SDA_PIN, SCL_PIN);

  if (!sensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 NAO encontrado. Verifique a ligacao.");
    while (1) { delay(10); }
  }

  sensor.setup();
  sensor.setPulseAmplitudeRed(0x1F);
  sensor.setPulseAmplitudeGreen(0);

  Serial.println("MAX30102 OK. Coloque o dedo no sensor.");
  conectarWiFi();
}

void loop() {
  long irValue = sensor.getIR();

  // Detecta batimento
  if (checkForBeat(irValue)) {
    long delta = millis() - lastBeat;
    lastBeat = millis();

    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;

      beatAvg = 0;
      for (byte x = 0; x < RATE_SIZE; x++) beatAvg += rates[x];
      beatAvg /= RATE_SIZE;

      Serial.print("BPM estimado: ");
      Serial.println(beatAvg);
    }
  }

  // Envia a media para o servidor no intervalo definido
  if (millis() - ultimoEnvio > intervaloEnvio && beatAvg > 0) {
    ultimoEnvio = millis();
    enviarBatimento(beatAvg);
  }

  // Sem dedo no sensor
  if (irValue < 50000) {
    Serial.print(".");
  }
}
