// File esp.cpp
// Combined: Safe Senior Emergency Button + GPS Tracking
// GPS updates location every 60s when WiFi connected
// Emergency: hold 3s or triple click
// Setup: triple click to clear WiFi and re-enter setup mode

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <WebServer.h>
#include <Preferences.h>
#include <DNSServer.h>
#include <TinyGPSPlus.h>

const bool CLEAR_ALL_ON_BOOT = false;

#define BUTTON_PIN 4
#define LED_PIN    2
#define BUZZER_PIN 5

#define GPS_RX 16
#define GPS_TX 17
#define GPS_BAUD 9600

// ================= SERVER CONFIG =================

const int  SERVER_PORT       = 8080;
const bool USE_LOCAL_SERVER  = true;
const bool USE_NGROK_SERVER  = true;
const char* NGROK_SERVER_BASE_URL = "https://mortuary-stardust-amiss.ngrok-free.dev";

// ================= DEVICE / PRODUCT INFO =================

String deviceId        = "";
String defaultDeviceId = "ESP_003";

String productName      = "Safe Senior Emergency Button";
String firmwareVersion  = "1.0.0";
String manufacturer     = "FPT Safe Senior";

// ================= SETUP WIFI AP =================

const char* SETUP_AP_NAME = "ESP32_SETUP";

Preferences preferences;
WebServer   server(80);
DNSServer   dnsServer;

const byte DNS_PORT = 53;
IPAddress apIP(192, 168, 4, 1);

String savedSSID = "";
String savedPASS = "";

IPAddress serverIP;

// ================= BUTTON STATE =================

bool lastRawButtonState = HIGH;
bool stableButtonState  = HIGH;
bool buttonDown         = false;
bool longPressFired     = false;

unsigned long pressStartTime   = 0;
unsigned long lastDebounceTime = 0;

int  clickCount    = 0;
unsigned long firstClickTime = 0;

unsigned long lastWiFiReconnectAttempt = 0;
unsigned long lastWiFiLostBlink        = 0;

// ================= EMERGENCY STATE =================
bool           emergencyActive    = false;
unsigned long  emergencyStartTime = 0;

// ================= TIME CONFIG =================

const unsigned long HOLD_TIME          = 3000;
const unsigned long ALERT_TIME         = 10000;
const unsigned long TRIPLE_CLICK_TIME  = 700;
const unsigned long SHORT_CLICK_MAX_TIME = 350;
const unsigned long DEBOUNCE_TIME      = 50;

// ================= GPS =================

TinyGPSPlus    gps;
HardwareSerial gpsSerial(1);  // UART1 - more stable than UART2

double  gpsLat       = 0.0;
double  gpsLng       = 0.0;
bool    gpsValid     = false;
bool    gpsInitialized = false;

unsigned long lastGpsUpdateMs   = 0;   // last time we sent location to server
const unsigned long GPS_SEND_INTERVAL = 60000UL; // 60 seconds
unsigned long gpsBootStartMs = 0;
const unsigned long GPS_BOOT_DELAY = 3000; // 3 seconds for GPS to fully boot

// GPS diagnostic counters
unsigned long gpsTotalBytes    = 0;
unsigned long gpsLastBytes     = 0;
unsigned long gpsNmeaCount     = 0;
unsigned long gpsDollarCount   = 0;
unsigned long gpsPrintableCount= 0;
unsigned long gpsUbxCount      = 0;
uint8_t       gpsPreviousByte  = 0;
String        gpsNmeaLine      = "";
unsigned long lastGpsStatusMs  = 0;

// ================= ASYNC SETUP STATE =================

bool   setupChecking  = false;
bool   setupDone      = false;
String pendingSSID    = "";
String pendingPASS    = "";
String pendingDeviceId= "";
String setupStatus    = "IDLE";
String setupMessage   = "";

// ================= FORWARD DECLARATIONS =================

void sendEmergency();
void startEmergencyRequest();
bool sendEmergencyToBaseUrl(String baseUrl);
void handleWiFiReconnect();
void handleWiFiLostBlink();
void handleButton();
void resetClickWindow();
void handleTripleClick();
void emergencyAction();
void handleEmergency();
void stopEmergency();

void handleGPS();
void sendLocationToServer(double lat, double lng);
bool sendLocationToBaseUrl(String baseUrl, double lat, double lng);

void beginWiFiConnection(String ssid, String pass);
void connectWiFi();
bool testAndConnectWiFi(String ssid, String pass);

void loadConfig();
void saveWiFiOnly(String ssid, String pass);
void saveDeviceIdOnly(String newDeviceId);
void clearWiFiOnly();
void clearAllConfig();

void startSetupPortal();
void stopSetupPortal();
void redirectToPortal();

String htmlHeader(String title);
String htmlFooter();
String productInfoBlock();
void   showSetupForm(String message, String ssidValue, String passValue, String deviceValue);
void   handleSaveConfig();
void   handleCheckingPage();
void   handleResultPage();
void   processSetupRequest();
void   showSuccessAndRestart(String title, String detail);

void sendEmergencyTask(void* parameter);

// ================= SETUP =================

void setup() {
  Serial.begin(115200);

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN,    OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(LED_PIN,    LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // Init GPS UART - Using UART1 (GPIO9=RX, GPIO10=TX)
  // For custom pins GPIO16/17, we would need to use: gpsSerial.setPins(GPS_RX, GPS_TX);
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX, GPS_TX);
  Serial.println("=== GPS NEO-6M KHOI TAO ===");
  Serial.println("GPS UART: 9600 baud | RX=GPIO16, TX=GPIO17 (UART1)");

  gpsBootStartMs = millis();

  // Send GPS initialization commands to NEO-6M
  delay(1000);  // Wait for GPS module to power up

  // Clear any garbage data
  while (gpsSerial.available()) {
    gpsSerial.read();
  }

  // Send PMTK startup commands to configure GPS
  gpsSerial.println("$PMTK414*33");  // Request all sentences to be turned off
  delay(50);
  gpsSerial.println("$PMTK314,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0*28");  // Enable GPGGA and GPRMC
  delay(50);
  gpsSerial.println("$PMTK220,1000*1F");  // Set update rate to 1Hz (1000ms)
  delay(50);
  gpsSerial.println("$PMTK251,9600*17");  // Set baud rate to 9600
  delay(50);

  Serial.println("Da gui lenh khoi tao GPS");

  if (CLEAR_ALL_ON_BOOT) {
    clearAllConfig();
    delay(500);
  }

  if (digitalRead(BUTTON_PIN) == LOW) {
    Serial.println("Nut dang duoc giu luc khoi dong - khong xoa WiFi/Device ID");
  }

  loadConfig();

  if (savedSSID == "") {
    Serial.println("Chua co WiFi da luu. Bat setup mode...");
    startSetupPortal();
  } else {
    connectWiFi();

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("WiFi OK. San sang hoat dong.");
    } else {
      Serial.println("Khong ket noi duoc WiFi da luu. Se thu ket noi lai.");
    }
  }
}

void beginWiFiConnection(String ssid, String pass) {
  if (pass == "") {
    WiFi.begin(ssid.c_str());
  } else {
    WiFi.begin(ssid.c_str(), pass.c_str());
  }
}

// ================= LOOP =================

void loop() {
  handleButton();
  handleWiFiReconnect();
  handleWiFiLostBlink();
  handleGPS();
  handleEmergency();  // Check emergency timeout and blink
}

// ================= GPS HANDLER =================

void handleGPS() {
  unsigned long now = millis();

  // Check if GPS needs more time to boot
  if (!gpsInitialized && now - gpsBootStartMs < GPS_BOOT_DELAY) {
    // Still booting, just consume bytes
    while (gpsSerial.available() > 0) {
      gpsSerial.read();
    }
    return;
  }

  if (!gpsInitialized) {
    gpsInitialized = true;
    Serial.println("[GPS] Khoi dong GPS hoan tat, bat dau thu thap du lieu");
  }

  // Feed all available bytes into TinyGPS
  while (gpsSerial.available() > 0) {
    uint8_t b = gpsSerial.read();
    char    c = (char)b;
    gpsTotalBytes++;

    if ((b >= 32 && b <= 126) || b == '\r' || b == '\n') gpsPrintableCount++;
    if (b == '$') gpsDollarCount++;
    if (gpsPreviousByte == 0xB5 && b == 0x62) gpsUbxCount++;
    gpsPreviousByte = b;

    // Collect NMEA lines for debug printing
    if (c == '\n') {
      gpsNmeaLine.trim();
      if (gpsNmeaLine.startsWith("$")) {
        gpsNmeaCount++;
        Serial.print("[GPS] NMEA: ");
        Serial.println(gpsNmeaLine);
      }
      gpsNmeaLine = "";
    } else if (c != '\r' && gpsNmeaLine.length() < 90) {
      gpsNmeaLine += c;
    }

    gps.encode(c);

    // Update cached location when GPS reports a new fix
    if (gps.location.isUpdated() && gps.location.isValid()) {
      gpsLat   = gps.location.lat();
      gpsLng   = gps.location.lng();
      gpsValid = true;

      Serial.println("[GPS] ===== CO TOA DO =====");
      Serial.print("[GPS] Latitude:   "); Serial.println(gpsLat,  6);
      Serial.print("[GPS] Longitude:  "); Serial.println(gpsLng,  6);
      // Print combined coordinate line in Vietnamese
      Serial.print("[GPS] Toa do: Lat="); Serial.print(gpsLat, 6);
      Serial.print(", Lng="); Serial.println(gpsLng, 6);
      Serial.print("[GPS] So ve tinh: "); Serial.println(gps.satellites.value());
      Serial.print("[GPS] Do cao: "); Serial.print(gps.altitude.meters()); Serial.println(" m");
      Serial.print("[GPS] Toc do: "); Serial.print(gps.speed.kmph());      Serial.println(" km/h");
      Serial.println("[GPS] ===================");
    }
  }

  // Print GPS diagnostic every 2 seconds
  if (now - lastGpsStatusMs >= 2000) {
    lastGpsStatusMs = now;
    unsigned long delta        = gpsTotalBytes - gpsLastBytes;
    gpsLastBytes               = gpsTotalBytes;
    unsigned long printablePct = gpsTotalBytes ? (gpsPrintableCount * 100UL / gpsTotalBytes) : 0;

    Serial.print("[GPS] Trang thai | bytes: "); Serial.print(gpsTotalBytes);
    Serial.print(" (+"); Serial.print(delta); Serial.print("/2s)");
    Serial.print(" | in%: "); Serial.print(printablePct);
    Serial.print(" | $: "); Serial.print(gpsDollarCount);
    Serial.print(" | UBX: "); Serial.print(gpsUbxCount);
    Serial.print(" | NMEA: "); Serial.print(gpsNmeaCount);
    Serial.print(" | co_toa_do: "); Serial.print(gpsValid ? "CO" : "CHUA");
    Serial.print(" | sat: "); Serial.println(gps.satellites.isValid() ? gps.satellites.value() : 0);

    // Thong diep chan doan (tieng Viet)
    if (delta == 0) {
      Serial.println("[GPS] LOI: Khong nhan byte moi. Kiem tra day RX/TX va nguon GPS.");
    } else if (gpsNmeaCount == 0 && gpsDollarCount == 0) {
      Serial.println("[GPS] CANH BAO: Co byte nhung khong thay cau NMEA. Kiem tra baudrate va ket noi.");
    } else if (gpsNmeaCount > 0 && gps.satellites.value() == 0) {
      Serial.println("[GPS] THONG TIN: NMEA OK nhung 0 ve tinh. Dua anten ra ngoai troi/gan cua so.");
    } else if (gpsValid && gps.satellites.value() > 0) {
      Serial.println("[GPS] TOT: Da khoa GPS voi " + String(gps.satellites.value()) + " ve tinh");
    }
  }

  // Send location to server every GPS_SEND_INTERVAL ms (only when WiFi up and GPS valid)
  if (WiFi.status() == WL_CONNECTED && gpsValid) {
    if (now - lastGpsUpdateMs >= GPS_SEND_INTERVAL || lastGpsUpdateMs == 0) {
      lastGpsUpdateMs = now;
      sendLocationToServer(gpsLat, gpsLng);
    }
  }
}

// ================= SEND LOCATION =================

void sendLocationToServer(double lat, double lng) {
  Serial.println("Sending GPS location...");

  if (USE_LOCAL_SERVER) {
    String localBase = "http://";
    localBase += serverIP.toString();
    localBase += ":";
    localBase += SERVER_PORT;

    if (sendLocationToBaseUrl(localBase, lat, lng)) {
      Serial.println("Location sent via LOCAL server");
      return;
    }
  }

  if (USE_NGROK_SERVER) {
    if (sendLocationToBaseUrl(String(NGROK_SERVER_BASE_URL), lat, lng)) {
      Serial.println("Location sent via NGROK server");
      return;
    }
  }

  Serial.println("Tat ca server location deu that bai");
}

bool sendLocationToBaseUrl(String baseUrl, double lat, double lng) {
  HTTPClient       http;
  WiFiClientSecure secureClient;

  // POST /api/devices/{deviceId}/location
  String url = baseUrl + "/api/devices/" + deviceId + "/location";

  Serial.print("LOCATION URL: ");
  Serial.println(url);

  // Build JSON body
  String body = "{\"deviceId\":\"";
  body += deviceId;
  body += "\",\"latitude\":";
  body += String(lat, 6);
  body += ",\"longitude\":";
  body += String(lng, 6);
  body += "}";

  bool beginOK = false;

  if (url.startsWith("https://")) {
    secureClient.setInsecure();
    beginOK = http.begin(secureClient, url);
  } else {
    beginOK = http.begin(url);
  }

  if (!beginOK) {
    Serial.println("HTTP begin failed (location)");
    return false;
  }

  http.setTimeout(5000);
  http.addHeader("Content-Type", "application/json");

  int code = http.PUT(body);

  Serial.print("Location HTTP Response: ");
  Serial.println(code);

  bool ok = (code >= 200 && code < 300);

  if (code > 0) {
    Serial.println(http.getString());
  } else {
    Serial.print("Location POST error: ");
    Serial.println(http.errorToString(code));
  }

  http.end();
  return ok;
}

// ================= WIFI RECONNECT / BLINK =================

void handleWiFiReconnect() {
  unsigned long now = millis();

  if (savedSSID == "" || WiFi.status() == WL_CONNECTED) return;
  if (now - lastWiFiReconnectAttempt < 10000) return;

  lastWiFiReconnectAttempt = now;

  Serial.println("WiFi mat ket noi, thu ket noi lai...");
  WiFi.disconnect(false);
  delay(50);
  WiFi.mode(WIFI_STA);
  beginWiFiConnection(savedSSID, savedPASS);
}

void handleWiFiLostBlink() {
  if (savedSSID == "" || WiFi.status() == WL_CONNECTED) return;

  unsigned long now = millis();
  if (now - lastWiFiLostBlink < 2000) return;

  lastWiFiLostBlink = now;

  for (int i = 0; i < 2; i++) {
    digitalWrite(LED_PIN, HIGH); delay(80);
    digitalWrite(LED_PIN, LOW);  delay(100);
  }
}

// ================= BUTTON HANDLER =================

void resetClickWindow() {
  clickCount    = 0;
  firstClickTime = 0;
}

// ================= EMERGENCY HANDLER (NON-BLOCKING) =================

void handleEmergency() {
  if (!emergencyActive) return;

  unsigned long now = millis();
  unsigned long elapsedTime = now - emergencyStartTime;

  // Blink LED and Buzzer (100ms on, 100ms off pattern = fast blink)
  if ((elapsedTime / 100) % 2 == 0) {
    digitalWrite(LED_PIN,    HIGH);
    digitalWrite(BUZZER_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN,    LOW);
    digitalWrite(BUZZER_PIN, LOW);
  }

  // Stop emergency after ALERT_TIME (10 seconds)
  if (elapsedTime >= ALERT_TIME) {
    stopEmergency();
  }
}

void stopEmergency() {
  emergencyActive = false;
  emergencyStartTime = 0;
  digitalWrite(LED_PIN,    LOW);
  digitalWrite(BUZZER_PIN, LOW);
  Serial.println("[EMERGENCY] Dung canh bao khan cap");
}


void handleButton() {
  unsigned long now     = millis();
  bool          rawState = digitalRead(BUTTON_PIN);

  if (rawState != lastRawButtonState) {
    lastRawButtonState = rawState;
    lastDebounceTime   = now;
  }

  if (clickCount > 0 && now - firstClickTime > TRIPLE_CLICK_TIME) {
    resetClickWindow();
    Serial.println("Het cua so triple click 0.7 giay");
  }

  if (now - lastDebounceTime < DEBOUNCE_TIME) return;

  if (rawState != stableButtonState) {
    stableButtonState = rawState;

    if (stableButtonState == LOW) {
      buttonDown     = true;
      longPressFired = false;
      pressStartTime = now;
      Serial.println("Button pressed");
    } else {
      if (!buttonDown) return;

      unsigned long pressDuration = now - pressStartTime;
      Serial.print("Button released, duration: ");
      Serial.println(pressDuration);

      buttonDown     = false;
      pressStartTime = 0;

      if (longPressFired) {
        longPressFired = false;
        resetClickWindow();
        Serial.println("Long press released - khong tinh click");
        return;
      }

      if (pressDuration <= SHORT_CLICK_MAX_TIME) {
        handleTripleClick();
      } else {
        resetClickWindow();
        Serial.println("Press qua lau, khong tinh click");
      }
    }
  }

  if (buttonDown && !longPressFired && now - pressStartTime >= HOLD_TIME) {
    longPressFired = true;
    resetClickWindow();
    Serial.println("HOLD 3S DETECTED - EMERGENCY ONLY");
    emergencyAction();
  }
}

void handleTripleClick() {
  unsigned long now = millis();

  // If emergency is active, ANY click will stop it
  if (emergencyActive) {
    Serial.println("[EMERGENCY STOP] Nhan nut, dung canh bao");
    stopEmergency();
    resetClickWindow();
    return;
  }

  if (clickCount == 0) {
    clickCount     = 1;
    firstClickTime = now;
    Serial.println("Click 1");
    return;
  }

  if (now - firstClickTime > TRIPLE_CLICK_TIME) {
    clickCount     = 1;
    firstClickTime = now;
    Serial.println("Qua 0.7 giay, tinh lai tu Click 1");
    return;
  }

  clickCount++;
  Serial.print("Click count: ");
  Serial.println(clickCount);

  if (clickCount >= 3) {
    Serial.println("TRIPLE CLICK TRONG 0.7 GIAY DETECTED");
    Serial.println("Xoa WiFi, ngat ket noi hien tai, giu lai Device ID");

    resetClickWindow();
    clearWiFiOnly();

    digitalWrite(LED_PIN,    LOW);
    digitalWrite(BUZZER_PIN, LOW);

    delay(300);
    startSetupPortal();
  }
}

void emergencyAction() {
  Serial.println("EMERGENCY ACTIVATED");

  clickCount     = 0;
  firstClickTime = 0;

  // Set emergency active flag (non-blocking)
  emergencyActive    = true;
  emergencyStartTime = millis();

  // Send emergency request in background task
  startEmergencyRequest();

  Serial.println("Canh bao khan cap bat dau. Bam nut 1 lan de dung.");
}

// ================= CONFIG SAVE / LOAD =================

void loadConfig() {
  preferences.begin("device-config", true);

  savedSSID = preferences.getString("ssid",     "");
  savedPASS = preferences.getString("pass",     "");
  deviceId  = preferences.getString("deviceId", "");

  preferences.end();

  if (deviceId == "") deviceId = defaultDeviceId;

  Serial.println("===== CONFIG =====");
  Serial.print("Saved SSID: "); Serial.println(savedSSID);
  Serial.print("Device ID:  "); Serial.println(deviceId);
  Serial.println("==================");
}

void saveWiFiOnly(String ssid, String pass) {
  preferences.begin("device-config", false);
  preferences.putString("ssid", ssid);
  preferences.putString("pass", pass);
  preferences.end();

  savedSSID = ssid;
  savedPASS = pass;

  Serial.println("Da luu WiFi vao bo nho ESP32");
}

void saveDeviceIdOnly(String newDeviceId) {
  preferences.begin("device-config", false);
  preferences.putString("deviceId", newDeviceId);
  preferences.end();

  deviceId = newDeviceId;
  Serial.println("Da luu Device ID");
}

void clearWiFiOnly() {
  preferences.begin("device-config", false);
  preferences.remove("ssid");
  preferences.remove("pass");
  preferences.end();

  savedSSID = "";
  savedPASS = "";

  WiFi.disconnect(true, true);
  delay(200);

  Serial.println("Da xoa WiFi da luu va ngat ket noi hien tai, giu nguyen Device ID");
}

void clearAllConfig() {
  preferences.begin("device-config", false);
  preferences.clear();
  preferences.end();

  savedSSID = "";
  savedPASS = "";
  deviceId  = defaultDeviceId;

  Serial.println("Da xoa toan bo cau hinh");
}

// ================= WIFI CONNECT =================

bool testAndConnectWiFi(String ssid, String pass) {
  Serial.println();
  Serial.print("Dang thu ket noi WiFi: ");
  Serial.println(ssid);

  WiFi.disconnect(false, false);
  delay(300);

  WiFi.mode(WIFI_AP_STA);
  delay(200);

  beginWiFiConnection(ssid, pass);

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 30) {
    delay(500);
    Serial.print(".");
    retry++;
  }

  wl_status_t status = WiFi.status();
  Serial.println();
  Serial.print("WiFi status code: "); Serial.println(status);

  if (status == WL_CONNECTED) {
    Serial.println("Ket noi WiFi thanh cong!");
    Serial.print("IP ESP32: ");  Serial.println(WiFi.localIP());
    Serial.print("Gateway IP: "); Serial.println(WiFi.gatewayIP());

    serverIP = WiFi.gatewayIP();
    Serial.print("Server IP da lay: "); Serial.println(serverIP);

    // Reset GPS send timer so first update happens promptly
    lastGpsUpdateMs = 0;
    return true;
  }

  Serial.println("Ket noi WiFi that bai.");
  if (status == WL_NO_SSID_AVAIL)   Serial.println("Ly do: Khong tim thay ten WiFi.");
  else if (status == WL_CONNECT_FAILED) Serial.println("Ly do: Sai mat khau hoac connect failed.");
  else if (status == WL_DISCONNECTED)   Serial.println("Ly do: Bi disconnect.");
  else                                  Serial.println("Ly do: Timeout hoac loi khac.");

  return false;
}

void connectWiFi() {
  if (savedSSID == "") {
    Serial.println("Khong co SSID da luu.");
    return;
  }

  Serial.println();
  Serial.print("Dang ket noi WiFi da luu: ");
  Serial.println(savedSSID);

  WiFi.mode(WIFI_STA);
  beginWiFiConnection(savedSSID, savedPASS);

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(500);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("Da ket noi WiFi!");
    Serial.print("IP ESP32: ");   Serial.println(WiFi.localIP());
    Serial.print("Gateway IP: "); Serial.println(WiFi.gatewayIP());

    serverIP = WiFi.gatewayIP();
    Serial.print("Server IP da lay: "); Serial.println(serverIP);

    lastGpsUpdateMs = 0;
  } else {
    Serial.println();
    Serial.println("Ket noi WiFi that bai.");
  }
}

// ================= SETUP PORTAL =================

void startSetupPortal() {
  Serial.println();
  Serial.println("BAT DAU SETUP MODE");

  setupChecking  = false;
  setupDone      = false;
  setupStatus    = "IDLE";
  setupMessage   = "";
  pendingSSID    = "";
  pendingPASS    = "";
  pendingDeviceId= "";

  WiFi.disconnect(false);
  delay(500);

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));

  bool apStarted = WiFi.softAP(SETUP_AP_NAME);

  if (apStarted) {
    Serial.println("Da phat WiFi setup");
    Serial.print("Ten WiFi: ");  Serial.println(SETUP_AP_NAME);
    Serial.println("Mat khau: KHONG CO");
    Serial.print("Dia chi setup: "); Serial.println(WiFi.softAPIP());
  } else {
    Serial.println("Loi phat WiFi setup");
  }

  dnsServer.start(DNS_PORT, "*", apIP);

  server.on("/", HTTP_GET, []() {
    showSetupForm("", savedSSID, savedPASS, deviceId);
  });
  server.on("/setup", HTTP_GET, []() {
    showSetupForm("", savedSSID, savedPASS, deviceId);
  });
  server.on("/save-config", HTTP_POST, handleSaveConfig);
  server.on("/checking",    HTTP_GET,  handleCheckingPage);
  server.on("/result",      HTTP_GET,  handleResultPage);

  server.on("/generate_204",                HTTP_GET, redirectToPortal);
  server.on("/gen_204",                     HTTP_GET, redirectToPortal);
  server.on("/hotspot-detect.html",         HTTP_GET, []() { showSetupForm("", savedSSID, savedPASS, deviceId); });
  server.on("/library/test/success.html",   HTTP_GET, []() { showSetupForm("", savedSSID, savedPASS, deviceId); });
  server.on("/ncsi.txt",                    HTTP_GET, redirectToPortal);
  server.on("/connecttest.txt",             HTTP_GET, redirectToPortal);
  server.onNotFound(redirectToPortal);

  server.begin();

  Serial.println("Web server setup da chay");
  Serial.println("Ket noi WiFi ESP32_SETUP roi mo: http://192.168.4.1");

  unsigned long lastBlink = 0;
  bool ledState = false;

  while (true) {
    dnsServer.processNextRequest();
    server.handleClient();

    // Also keep feeding GPS while in setup mode
    handleGPS();

    if (setupChecking && !setupDone) {
      processSetupRequest();
    }

    if (millis() - lastBlink >= 500) {
      lastBlink = millis();
      ledState  = !ledState;
      digitalWrite(LED_PIN, ledState);
    }
  }
}

void stopSetupPortal() {
  Serial.println("Dang tat WiFi setup portal...");

  dnsServer.stop();
  server.stop();

  WiFi.softAPdisconnect(true);
  delay(300);

  WiFi.disconnect(false);
  delay(300);

  WiFi.mode(WIFI_STA);
  delay(300);

  digitalWrite(LED_PIN,    LOW);
  digitalWrite(BUZZER_PIN, LOW);

  Serial.println("Da tat WiFi setup. Chuyen ve che do STA.");
}

void redirectToPortal() {
  server.sendHeader("Location", "http://192.168.4.1/setup", true);
  server.send(302, "text/plain", "");
}

// ================= HTML =================

String htmlHeader(String title) {
  String html = "";
  html += "<!DOCTYPE html><html><head>";
  html += "<meta charset='UTF-8'>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>" + title + "</title>";
  html += "<style>";
  html += "body{font-family:Arial;background:#eef2f7;padding:20px;margin:0;}";
  html += ".box{max-width:460px;margin:auto;background:white;padding:22px;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.15);}";
  html += "h2{margin-top:0;color:#0d47a1;text-align:center;}";
  html += ".info{background:#f4f8ff;border-left:4px solid #0d6efd;padding:12px;margin-bottom:18px;border-radius:8px;}";
  html += ".ok{background:#e8fff0;border-left:4px solid #16a34a;padding:12px;margin-bottom:18px;border-radius:8px;color:#166534;}";
  html += ".err{background:#fff1f2;border-left:4px solid #dc2626;padding:12px;margin-bottom:18px;border-radius:8px;color:#991b1b;}";
  html += ".warn{background:#fff7ed;border-left:4px solid #f97316;padding:12px;margin-bottom:18px;border-radius:8px;color:#9a3412;}";
  html += ".row{margin:6px 0;font-size:14px;word-break:break-word;}";
  html += ".label{font-weight:bold;color:#333;}";
  html += "label{font-weight:bold;color:#333;font-size:14px;}";
  html += "input{width:100%;padding:12px;margin:8px 0 14px 0;box-sizing:border-box;border:1px solid #ccc;border-radius:8px;font-size:15px;}";
  html += ".wifi-type{display:flex;gap:8px;margin:8px 0 14px 0;}";
  html += ".wifi-type label{flex:1;display:flex;align-items:center;gap:8px;padding:10px;border:1px solid #ccc;border-radius:8px;font-weight:normal;background:#f9fafb;}";
  html += ".wifi-type input{width:auto;margin:0;}";
  html += "#passWrap.hidden{display:none;}";
  html += "input[readonly]{background:#e5e7eb;color:#555;}";
  html += "button{width:100%;padding:13px;background:#0d6efd;color:white;border:none;border-radius:8px;font-size:16px;font-weight:bold;}";
  html += ".note{font-size:13px;color:#666;margin-top:12px;line-height:1.4;}";
  html += ".loader{border:5px solid #f3f3f3;border-top:5px solid #0d6efd;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:20px auto;}";
  html += "@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}";
  html += "</style></head><body><div class='box'>";
  return html;
}

String htmlFooter() {
  return "</div></body></html>";
}

String productInfoBlock() {
  String chipId = String((uint32_t)ESP.getEfuseMac(), HEX);

  String html = "<div class='info'>";
  html += "<div class='row'><span class='label'>Ten san pham:</span> " + productName + "</div>";
  html += "<div class='row'><span class='label'>Device ID hien tai:</span> " + deviceId + "</div>";
  html += "<div class='row'><span class='label'>Firmware:</span> " + firmwareVersion + "</div>";
  html += "<div class='row'><span class='label'>Nha san xuat:</span> " + manufacturer + "</div>";
  html += "<div class='row'><span class='label'>Chip ID:</span> " + chipId + "</div>";
  html += "<div class='row'><span class='label'>Trang thai:</span> ";
  html += (savedSSID != "") ? "DA LUU WIFI" : "CHUA CAU HINH";
  html += "</div></div>";
  return html;
}

void showSetupForm(String message, String ssidValue, String passValue, String deviceValue) {
  String html = htmlHeader("Safe Senior Setup");

  html += "<h2>Safe Senior Setup</h2>";

  if (message != "") html += message;

  html += productInfoBlock();

  html += "<form action='/save-config' method='POST'>";

  html += "<label>Ten WiFi</label>";
  html += "<input name='ssid' value='" + ssidValue + "' placeholder='Nhap ten WiFi can ket noi' required>";

  bool isOpenWiFi = (passValue == "");
  html += "<label>Loai WiFi</label>";
  html += "<div class='wifi-type'>";
  html += "<label><input type='radio' name='wifiSecurity' value='open'";
  html += isOpenWiFi ? " checked" : "";
  html += " onchange='togglePass()'> Khong mat khau</label>";
  html += "<label><input type='radio' name='wifiSecurity' value='password'";
  html += isOpenWiFi ? "" : " checked";
  html += " onchange='togglePass()'> Co mat khau</label>";
  html += "</div>";

  html += "<div id='passWrap'>";
  html += "<label>Mat khau WiFi</label>";
  html += "<input id='wifiPass' name='pass' type='text' value='" + passValue + "' placeholder='Nhap mat khau WiFi'>";
  html += "</div>";

  html += "<label>Device ID ESP32</label>";
  html += "<input name='deviceId' value='" + deviceValue + "' placeholder='VD: ESP_003' required>";

  html += "<button type='submit'>Kiem tra va luu cau hinh</button>";
  html += "</form>";

  html += "<div class='note'>He thong se kiem tra WiFi truoc. Neu WiFi dung, thiet bi se luu Device ID va chuyen sang che do hoat dong.</div>";

  html += "<script>";
  html += "function togglePass(){";
  html += "var open=document.querySelector('input[name=wifiSecurity]:checked').value==='open';";
  html += "var wrap=document.getElementById('passWrap');var pass=document.getElementById('wifiPass');";
  html += "wrap.className=open?'hidden':'';pass.required=!open;if(open){pass.value='';}";
  html += "}";
  html += "togglePass();";
  html += "</script>";

  html += htmlFooter();

  server.send(200, "text/html", html);
}

// ================= ASYNC CHECKING PAGES =================

void handleSaveConfig() {
  String inputSSID         = server.arg("ssid");
  String inputPASS         = server.arg("pass");
  String inputWifiSecurity = server.arg("wifiSecurity");
  String inputDeviceId     = server.arg("deviceId");

  inputSSID.trim();
  inputPASS.trim();
  inputWifiSecurity.trim();
  inputDeviceId.trim();

  if (inputWifiSecurity == "open") inputPASS = "";

  if (inputSSID == "") {
    showSetupForm("<div class='err'>SSID khong duoc rong. Vui long nhap lai.</div>", inputSSID, inputPASS, inputDeviceId);
    return;
  }

  if (inputDeviceId == "") {
    showSetupForm("<div class='err'>Device ID khong duoc rong. Vui long nhap lai.</div>", inputSSID, inputPASS, inputDeviceId);
    return;
  }

  pendingSSID     = inputSSID;
  pendingPASS     = inputPASS;
  pendingDeviceId = inputDeviceId;

  setupChecking = true;
  setupDone     = false;
  setupStatus   = "CHECKING";
  setupMessage  = "Dang kiem tra WiFi...";

  server.sendHeader("Location", "/checking", true);
  server.send(302, "text/plain", "");
}

void handleCheckingPage() {
  String html = htmlHeader("Dang kiem tra");

  html += "<h2>Dang kiem tra...</h2>";
  html += "<div class='loader'></div>";
  html += "<div class='info'>Thiet bi dang kiem tra WiFi.<br>Vui long cho trong giay lat...</div>";
  html += "<script>setTimeout(function(){ window.location.href='/result'; }, 1500);</script>";
  html += "<div class='note'>Neu trang khong tu chuyen, hay bam tai lai sau vai giay.</div>";
  html += htmlFooter();

  server.send(200, "text/html", html);
}

void handleResultPage() {
  if (!setupDone) {
    String html = htmlHeader("Dang kiem tra");

    html += "<h2>Dang kiem tra...</h2>";
    html += "<div class='loader'></div>";
    html += "<div class='info'>" + setupMessage + "</div>";
    html += "<script>setTimeout(function(){ window.location.href='/result'; }, 1500);</script>";
    html += htmlFooter();

    server.send(200, "text/html", html);
    return;
  }

  if (setupStatus == "WIFI_ERROR") {
    showSetupForm("<div class='err'>Khong ket noi duoc WiFi. Vui long kiem tra ten WiFi/mat khau roi nhap lai.</div>",
                  pendingSSID, pendingPASS, pendingDeviceId);
    return;
  }

  if (setupStatus == "SUCCESS") {
    showSuccessAndRestart("Luu cau hinh thanh cong",
                          "WiFi da ket noi duoc. Device ID da duoc luu va thiet bi se chuyen sang che do hoat dong.");
    return;
  }

  showSetupForm("<div class='err'>Co loi khong xac dinh. Vui long thu lai.</div>",
                pendingSSID, pendingPASS, pendingDeviceId);
}

void processSetupRequest() {
  setupMessage = "Dang ket noi WiFi...";

  bool wifiOK = testAndConnectWiFi(pendingSSID, pendingPASS);

  if (!wifiOK) {
    setupStatus   = "WIFI_ERROR";
    setupMessage  = "WiFi sai hoac khong ket noi duoc.";
    setupDone     = true;
    setupChecking = false;
    return;
  }

  saveWiFiOnly(pendingSSID, pendingPASS);
  saveDeviceIdOnly(pendingDeviceId);

  setupStatus   = "SUCCESS";
  setupMessage  = "WiFi da luu. Device ID da luu.";
  setupDone     = true;
  setupChecking = false;
}

void showSuccessAndRestart(String title, String detail) {
  String html = htmlHeader(title);

  html += "<h2>" + title + "</h2>";
  html += "<div class='ok'>";
  html += detail + "<br>";
  html += "Device ID: <b>" + deviceId + "</b><br>";
  html += "Trang thai: <b>DA LUU CAU HINH</b>";
  html += "</div>";
  html += productInfoBlock();
  html += "<div class='note'>ESP32 se tat WiFi setup va khoi dong lai sau vai giay. Sau do nut khan cap se san sang hoat dong.</div>";
  html += htmlFooter();

  server.send(200, "text/html", html);

  delay(2000);
  stopSetupPortal();
  delay(500);
  ESP.restart();
}

// ================= EMERGENCY =================

void sendEmergencyTask(void* parameter) {
  sendEmergency();
  vTaskDelete(NULL);
}

void startEmergencyRequest() {
  xTaskCreate(sendEmergencyTask, "emergency_http", 8192, NULL, 1, NULL);
}

bool sendEmergencyToBaseUrl(String baseUrl) {
  HTTPClient       http;
  WiFiClientSecure secureClient;

  String url = baseUrl + "/api/emergency?deviceId=" + deviceId;

  Serial.print("EMERGENCY URL: ");
  Serial.println(url);

  bool beginOK = false;

  if (url.startsWith("https://")) {
    secureClient.setInsecure();
    beginOK = http.begin(secureClient, url);
  } else {
    beginOK = http.begin(url);
  }

  if (!beginOK) {
    Serial.println("HTTP begin failed (emergency)");
    return false;
  }

  http.setTimeout(5000);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");

  int code = http.POST("");

  Serial.print("Emergency HTTP Response: ");
  Serial.println(code);

  bool ok = (code >= 200 && code < 300);

  if (code > 0) {
    Serial.println(http.getString());
  } else {
    Serial.print("Emergency POST error: ");
    Serial.println(http.errorToString(code));
  }

  http.end();
  return ok;
}

void sendEmergency() {
  Serial.println("Sending emergency...");

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi chua ket noi - Khong gui duoc canh bao");
    return;
  }

  if (USE_LOCAL_SERVER) {
    String localBase = "http://";
    localBase += serverIP.toString();
    localBase += ":";
    localBase += SERVER_PORT;

    if (sendEmergencyToBaseUrl(localBase)) {
      Serial.println("Emergency sent via LOCAL server");
      return;
    }
  }

  if (USE_NGROK_SERVER) {
    if (sendEmergencyToBaseUrl(String(NGROK_SERVER_BASE_URL))) {
      Serial.println("Emergency sent via NGROK server");
      return;
    }
  }

  Serial.println("Tat ca server emergency deu that bai");
}