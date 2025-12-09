#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <TM1637Display.h>
#include <ESP32Servo.h>


#define SERVICE_UUID        "12345678-1234-1234-1234-123456789abc"
#define CHARACTERISTIC_UUID "abcd1234-5678-90ab-cdef-1234567890ab"

#define PINO_MODO        25
#define PINO_POT_VELOC   34
#define PINO_POT_INTENS  35
#define PINO_POT_REP     32
#define PINO_BOTAO       26

#define LED_R 12
#define LED_G 14
#define LED_B 27
#define CLK 33
#define DIO 13
TM1637Display display(CLK, DIO);

BLEServer* pServer = nullptr;
BLEService* pService = nullptr;
BLECharacteristic* pCharacteristic = nullptr;
BLEAdvertising* pAdvertising = nullptr;
bool deviceConnected = false;

bool ligado = false;
int velocidade = 0;
int intensidade = 0;
int repeticoes = 0;

bool modoAtual = false;
bool ultimoModo = false;

bool estadoBotaoAnterior = HIGH;
unsigned long ultimoDebounceBotao = 0;
const unsigned long debounceDelayBotao = 50;

unsigned long ultimoDebounceModo = 0;
const unsigned long tempoDebounceModo = 300;

unsigned long ultimoBlink = 0;
bool estadoBlink = false;
const unsigned long intervaloBlink = 500;

Servo servo;
#define SERVO_PIN 18
int velocidadeDelay[6] = {30, 20, 14, 8, 5, 3};


//VARIÁVEIS PARA MOVIMENTO NÃO BLOQUEANTE

int servoPosAtual = 0;
int servoAnguloAlvo = 0;
bool servoIndo = true;
int repeticoesRestantes = 0;
unsigned long ultimoStep = 0;
int stepDelay = 0;
bool movimentoAtivo = false;

bool esperandoNoTopo = false;
unsigned long inicioEsperaTopo = 0;

bool esperandoNaBase = false;
unsigned long inicioEsperaBase = 0;


void setColor(bool r, bool g, bool b);
void atualizarLED();
void moverServo(int inicio, int fim, int vel);
void atualizarServo();
void iniciarMovimento();
void mostrarVariaveis();
void lerControlesManuais();
void iniciarBLE();
void entrarModoBluetooth();
void entrarModoManual();
void atualizarDisplay();


//CALLBACKS BLE

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) override {
    deviceConnected = true;
    Serial.println("Dispositivo conectado!");
    atualizarLED();
  }
void onDisconnect(BLEServer* pServer) override {
  deviceConnected = false;
  Serial.println("Dispositivo desconectado");

  ligado = false;
  movimentoAtivo = false;
  servo.write(180);
  Serial.println("Bluetooth caiu! Sistema desligado por segurança.");

  delay(100);

  if (pAdvertising) {
    pAdvertising->start();
    Serial.println("Advertising reiniciado após desconexão.");
  }

  atualizarLED();
}

};

class MyCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pCharacteristic) override {
    if (!modoAtual) {
      Serial.println("Comando BLE ignorado (modo manual ativo)");
      return;
    }
    String rxValue = pCharacteristic->getValue();
    if (rxValue.length() > 0) {
      Serial.print("Recebido: ");
      Serial.println(rxValue);

      char buffer[50];
      rxValue.toCharArray(buffer, sizeof(buffer));
      char* token = strtok(buffer, ",");
      int step = 0;

      while (token != nullptr) {
        switch (step) {
          case 0: ligado = (strcmp(token, "LIGAR") == 0); break;
          case 1: velocidade = atoi(token); break;
          case 2: intensidade = atoi(token); break;
          case 3: repeticoes = atoi(token); break;
        }
        token = strtok(nullptr, ",");
        step++;
      }

      if (!ligado) {
        servo.write(180);   // INVERTIDO
        movimentoAtivo = false;
      }
      atualizarLED();
    }
  }
};


//DISPLAY

void atualizarDisplay() {

  int v = velocidade;
  int i = intensidade;
  int r = repeticoes;

  if (ligado && movimentoAtivo) {
    r = repeticoesRestantes;
  }

  if (!modoAtual && !ligado) {
    v = map(analogRead(PINO_POT_VELOC), 0, 4095, 0, 5);
    i = map(analogRead(PINO_POT_INTENS), 0, 4095, 0, 5);
    r = map(analogRead(PINO_POT_REP), 0, 4095, 0, 20);
  }

  int valorDisplay = v * 1000 + i * 100 + r;
  display.showNumberDecEx(valorDisplay, 0, true);
}


//LED

void setColor(bool r, bool g, bool b) {
  digitalWrite(LED_R, r ? HIGH : LOW);
  digitalWrite(LED_G, g ? HIGH : LOW);
  digitalWrite(LED_B, b ? HIGH : LOW);
}

void atualizarLED() {
  if (modoAtual && !deviceConnected) {
    if (millis() - ultimoBlink >= intervaloBlink) {
      ultimoBlink = millis();
      estadoBlink = !estadoBlink;
      setColor(estadoBlink ? 0 : 255, 0, 0);
    }
    return;
  }
  if (modoAtual && deviceConnected && !ligado) { setColor(255, 0, 0); return; }
  if (modoAtual && deviceConnected && ligado) { setColor(0, 255, 0); return; }
  if (!modoAtual && !ligado) { setColor(255, 10, 0); return; }
  if (!modoAtual && ligado) { setColor(0, 0, 255); return; }
  setColor(0, 0, 0);
}


//AUXILIARES

void mostrarVariaveis() {
  Serial.println("Estado atual das variáveis:");
  Serial.printf("  ligado: %s\n", ligado ? "true" : "false");
  Serial.printf("  velocidade: %d\n", velocidade);
  Serial.printf("  intensidade: %d\n", intensidade);
  Serial.printf("  repeticoes: %d\n\n", repeticoes);
}


//CONTROLES MANUAIS

void lerControlesManuais() {
  int leituraBotao = digitalRead(PINO_BOTAO);

  if (leituraBotao != estadoBotaoAnterior) ultimoDebounceBotao = millis();

  if ((millis() - ultimoDebounceBotao) > debounceDelayBotao) {
    static bool estadoConfirmado = HIGH;
    if (leituraBotao != estadoConfirmado) {
      estadoConfirmado = leituraBotao;
      if (estadoConfirmado == LOW) {
        ligado = !ligado;
        if (ligado) {
      velocidade  = (int)((analogRead(PINO_POT_VELOC)/4095.0) * 5);
      intensidade = (int)((analogRead(PINO_POT_INTENS)/4095.0) * 5);
      repeticoes  = (int)((analogRead(PINO_POT_REP)/4095.0) * 20);

          Serial.println("Dispositivo LIGADO!");
        } else {
          Serial.println("Dispositivo DESLIGADO!");
          servo.write(180);
          movimentoAtivo = false;
        }
        mostrarVariaveis();
        atualizarLED();
      }
    }
  }
  estadoBotaoAnterior = leituraBotao;
}


//MODO

void iniciarBLE() {
  BLEDevice::init("Reabilita");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_WRITE |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pCharacteristic->addDescriptor(new BLE2902());
  pCharacteristic->setCallbacks(new MyCallbacks());
  pCharacteristic->setValue("Olá App!");
  pService->start();
  pAdvertising = BLEDevice::getAdvertising();
  Serial.println("BLE inicializado!");
}

void entrarModoBluetooth() {
  servo.write(180); delay(200);   // INVERTIDO
  ligado = false; movimentoAtivo = false;
  velocidade = intensidade = repeticoes = 0;
  mostrarVariaveis();
  if (pAdvertising) pAdvertising->start();
  atualizarLED();
}

void entrarModoManual() {
  servo.write(180); delay(200);   // INVERTIDO
  ligado = false; movimentoAtivo = false;
  velocidade = intensidade = repeticoes = 0;
  mostrarVariaveis();
  if (pAdvertising) pAdvertising->stop();
  if (deviceConnected && pServer) { pServer->disconnect(0); deviceConnected = false; delay(200); }
  atualizarLED();
}


//SETUP

void setup() {
  Serial.begin(115200);

  pinMode(PINO_MODO, INPUT_PULLDOWN);
  pinMode(PINO_BOTAO, INPUT_PULLUP);
  pinMode(LED_R, OUTPUT); pinMode(LED_G, OUTPUT); pinMode(LED_B, OUTPUT);
  setColor(false,false,false);
  display.setBrightness(0x0f);
  estadoBotaoAnterior = digitalRead(PINO_BOTAO);

  iniciarBLE();
  servo.attach(SERVO_PIN); servo.write(180); delay(300);

  modoAtual = digitalRead(PINO_MODO); ultimoModo = modoAtual;
  if (modoAtual) entrarModoBluetooth(); else entrarModoManual();

  Serial.println("Sistema pronto!");
}

void zerarDisplayFinalCiclo() {
  display.showNumberDecEx(0, 0, true); // Mostra "0000"
  velocidade = 0;
  intensidade = 0;
  repeticoes = 0;

  // Se quiser avisar o app que acabou:
  if (modoAtual && pCharacteristic) {
    pCharacteristic->setValue("FIM");
    pCharacteristic->notify();
  }
}

//LOOP PRINCIPAL

void loop() {
  bool leituraModo = digitalRead(PINO_MODO);

  if (leituraModo != ultimoModo && (millis() - ultimoDebounceModo) > tempoDebounceModo) {
    ultimoDebounceModo = millis();
    modoAtual = leituraModo;
    if (modoAtual) entrarModoBluetooth();
    else entrarModoManual();
    ultimoModo = modoAtual;
    movimentoAtivo = false;
    ligado = false;
    servo.write(180);
  }

  if (!modoAtual) lerControlesManuais();

  atualizarLED();
  atualizarDisplay();

  if (ligado && !movimentoAtivo) iniciarMovimento();
  atualizarServo();
}


//MOVIMENTO NÃO BLOQUEANTE

void iniciarMovimento() {
  if (velocidade == 0 || intensidade == 0 || repeticoes == 0) return;
  servoPosAtual = 0;

  servoAnguloAlvo = 36 * (6 - intensidade);
  if (servoAnguloAlvo > 180) servoAnguloAlvo = 180;
  if (servoAnguloAlvo < 0) servoAnguloAlvo = 0;

  repeticoesRestantes = repeticoes;
  servoIndo = true;
  stepDelay = velocidadeDelay[velocidade];
  ultimoStep = millis();
  movimentoAtivo = true;
  esperandoNoTopo = false;
  inicioEsperaTopo = 0;

  esperandoNaBase = false;
  inicioEsperaBase = 0;

  Serial.printf("Iniciando movimento: %d repetições, ângulo=%d\n", repeticoes, servoAnguloAlvo);
}


void atualizarServo() {
  if (!movimentoAtivo) return;

  if (!ligado) {
    servo.write(180);
    movimentoAtivo = false;
    return;
  }


  // ESPERA NO TOPO
  if (esperandoNoTopo) {
    unsigned long duracao = (unsigned long)intensidade * 1000UL;
    if (millis() - inicioEsperaTopo >= duracao) {
      esperandoNoTopo = false;
    } else {
      return;
    }
  }


  //ESPERA DE 1s NA BASE
  if (esperandoNaBase) {
    if (millis() - inicioEsperaBase >= 1000) {
      esperandoNaBase = false;
    } else {
      return;
    }
  }

  if (millis() - ultimoStep < stepDelay) return;
  ultimoStep = millis();

  int passo = velocidade + 1;

  if (servoIndo) {

    stepDelay = velocidadeDelay[velocidade];
    passo = velocidade + 1;

    servoPosAtual += passo;

    if (servoPosAtual >= servoAnguloAlvo) {
      servoPosAtual = servoAnguloAlvo;
      servoIndo = false;

      esperandoNoTopo = true;
      inicioEsperaTopo = millis();
      return;
    }

  } else {


    //DESCIDA COM velocidade 3
    stepDelay = velocidadeDelay[3];
    passo = 4;

    servoPosAtual -= passo;

    if (servoPosAtual <= 0) {
      servoPosAtual = 0;

      // inicia pausa de 1 segundo
      esperandoNaBase = true;
      inicioEsperaBase = millis();

      repeticoesRestantes--;

      Serial.printf("Repetições restantes: %d\n", repeticoesRestantes);
      atualizarDisplay();   //atualizar display imediatamente

      if (repeticoesRestantes <= 0) {
        movimentoAtivo = false;
        ligado = false;
        atualizarLED();
        servo.write(180);
        Serial.println("Ciclo completo! Sistema desligado.");

  if (modoAtual && pCharacteristic) {
    pCharacteristic->setValue("FIM");
    pCharacteristic->notify();    // 🔥 ENVIA PARA O APP REACT!!
  }

  
        if (modoAtual) {
      zerarDisplayFinalCiclo();
    }


        return;
      }

      servoIndo = true;
    }
  }

  servo.write(180 - servoPosAtual);
}
