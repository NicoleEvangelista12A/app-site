# VittaSafe

App de **monitoramento de batimentos cardíacos** que se conecta a uma
pulseira feita com **ESP32-C3 (SuperMini)** + sensor **MAX30102**.

O app tem duas telas:

- **Paciente** (`index.html`) — mostra o batimento atual, gráfico em tempo
  real, histórico de batimentos, histórico de alterações e alerta de risco.
- **Cuidador** (`cuidador.html`) — acompanha o paciente ao vivo, com os
  mesmos históricos.

Ambas as telas têm **modo claro e modo escuro** com transição suave.

---

## Como rodar o app (2 passos)

Você só precisa do **Node.js** instalado. Nenhuma dependência extra.

```bash
# 1. Na pasta do projeto, inicie o servidor:
npm start
#   (ou: node server.js)

# 2. Abra no navegador:
#    http://localhost:3006
```

- Tela do paciente: http://localhost:3006/index.html
- Área do cuidador:  http://localhost:3006/cuidador.html

> Sem a pulseira por perto? O servidor entra em **modo demo** e gera
> batimentos de teste automaticamente, para você ver o app funcionando.

---

## Ligar o ESP32-C3 (pulseira)

1. Instale a biblioteca na Arduino IDE:
   `Sketch > Incluir Biblioteca > Gerenciar Bibliotecas...` e instale
   **"SparkFun MAX3010x Pulse and Proximity Sensor Library"**.

2. Selecione a placa **ESP32C3 Dev Module** e a porta COM correta.

3. Abra `esp32_vittasafe/esp32_vittasafe.ino` e edite só estas linhas:

   ```cpp
   const char* WIFI_SSID   = "SEU_WIFI";
   const char* WIFI_SENHA  = "SUA_SENHA";
   const char* SERVIDOR_IP = "192.168.0.10"; // IP do PC que roda o server.js
   ```

   > Para descobrir o IP do seu PC: abra o Prompt de Comando e digite `ipconfig`.

4. Envie o código para a placa e coloque o dedo no sensor.

### Ligação do MAX30102 no ESP32-C3

| MAX30102 | ESP32-C3 |
|----------|----------|
| VIN      | 3V3      |
| GND      | GND      |
| SCL      | GPIO6    |
| SDA      | GPIO7    |

---

## API do servidor

| Método | Rota              | Descrição                                  |
|--------|-------------------|--------------------------------------------|
| GET    | `/api/paciente`   | Estado atual (bpm, status, conexão)        |
| GET    | `/api/batimentos` | Histórico de batimentos                    |
| GET    | `/api/historico`  | Histórico de alterações (Atenção / Risco)  |
| POST   | `/api/leitura`    | O ESP32 envia `{ "bpm": 78 }`              |
| POST   | `/api/pulseira`   | Marca pulseira `{ "conectada": true }`     |

### Regras de status

- **Normal**: 60 a 100 BPM
- **Atenção**: 50-59 ou 101-120 BPM
- **Risco**: abaixo de 50 ou acima de 120 BPM

---

## Arquivos

```
app-tcc/
├─ server.js              # servidor + API (Node puro, sem instalar nada)
├─ index.html             # tela do paciente
├─ cuidador.html          # tela do cuidador
├─ style.css              # estilos + modo claro/escuro
├─ comum.js               # funções compartilhadas (tema, gráfico)
├─ paciente.js            # lógica da tela do paciente
├─ cuidador.js            # lógica da tela do cuidador
├─ imgs/fundo-vittasafe.png
└─ esp32_vittasafe/
   └─ esp32_vittasafe.ino # código da pulseira
```
