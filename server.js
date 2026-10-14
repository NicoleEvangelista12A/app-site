const http = require("http");
const fs = require("fs");
const path = require("path");

const PORTA = process.env.PORT || 3006;
const RAIZ = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

const estado = {
  nome: "Paciente VittaSafe",
  bpm: 0,
  status: "Normal",         
  pulseiraConectada: false,
  ultimaAtualizacao: new Date().toISOString(),
  ultimaLeituraReal: 0,     
};

let historicoBatimentos = [];  
let historicoEventos = [];     

function classificar(bpm) {
  if (bpm < 50 || bpm > 120) return "Risco";
  if (bpm < 60 || bpm > 100) return "Atenção";
  return "Normal";
}

function aplicarLeitura(bpm, ehDemo) {
  bpm = Math.round(bpm);
  if (!Number.isFinite(bpm) || bpm <= 0) return;

  const agora = new Date();
  const status = classificar(bpm);

  estado.bpm = bpm;
  estado.status = status;
  estado.ultimaAtualizacao = agora.toISOString();

  if (!ehDemo) {
    estado.pulseiraConectada = true;
    estado.ultimaLeituraReal = Date.now();
  }

  const registro = { bpm, status, horario: agora.toISOString(), demo: !!ehDemo };

  historicoBatimentos.push(registro);
  if (historicoBatimentos.length > 120) historicoBatimentos.shift();

  if (status !== "Normal") {
    historicoEventos.push(registro);
    if (historicoEventos.length > 100) historicoEventos.shift();
  }
}

// ============================================================
//  MODO DEMO
//  Se o ESP32 nao enviar dados por mais de 8s, geramos valores
//  de teste para o app continuar "vivo" na apresentação.
// ============================================================

let demoBase = 78;

function gerarLeituraDemo() {
  const variacao = (Math.random() - 0.5) * 4;
  demoBase += variacao;
  if (demoBase < 65) demoBase = 65 + Math.random() * 5;
  if (demoBase > 95) demoBase = 95 - Math.random() * 5;

  let bpm = Math.round(demoBase);

  // 8% de chance de um pico (alteração importante) para demonstrar o alerta.
  if (Math.random() < 0.08) {
    bpm += Math.random() < 0.5 ? -22 : 30;
  }

  bpm = Math.max(35, Math.min(165, bpm));
  aplicarLeitura(bpm, true);
}

setInterval(() => {
  const tempoSemDados = Date.now() - estado.ultimaLeituraReal;
  // So gera demo se nao houver ESP32 enviando dados.
  if (tempoSemDados < 8000) return;
  gerarLeituraDemo();
}, 2000);

// ============================================================
//  HELPERS HTTP
// ============================================================

function enviarJSON(res, statusCode, dados) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(dados));
}

function servirArquivo(res, caminhoUrl) {
  let caminho = path.normalize(path.join(RAIZ, caminhoUrl));
  if (!caminho.startsWith(RAIZ)) {   // segurança contra path traversal
    res.writeHead(403);
    res.end("Proibido");
    return;
  }
  if (caminhoUrl === "/" || caminhoUrl === "") caminho = path.join(RAIZ, "index.html");

  fs.readFile(caminho, (erro, conteudo) => {
    if (erro) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Não encontrado: " + caminhoUrl);
      return;
    }
    const ext = path.extname(caminho).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(conteudo);
  });
}

// ============================================================
//  SERVIDOR
// ============================================================

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost:" + PORTA);

  if (req.method === "OPTIONS") {
    enviarJSON(res, 204, {});
    return;
  }

  // GET /api/paciente -> estado atual
  if (url.pathname === "/api/paciente" && req.method === "GET") {
    enviarJSON(res, 200, estado);
    return;
  }

  // GET /api/batimentos -> historico de batimentos
  if (url.pathname === "/api/batimentos" && req.method === "GET") {
    enviarJSON(res, 200, historicoBatimentos.slice(-40).reverse());
    return;
  }

  // GET /api/historico -> eventos de alteracao (Atencao/Risco)
  if (url.pathname === "/api/historico" && req.method === "GET") {
    enviarJSON(res, 200, historicoEventos.slice().reverse());
    return;
  }

  // POST /api/leitura -> o ESP32 envia { bpm: 78 }
  if (url.pathname === "/api/leitura" && req.method === "POST") {
    let corpo = "";
    req.on("data", (parte) => {
      corpo += parte;
      if (corpo.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try {
        const dados = JSON.parse(corpo || "{}");
        if (dados.nome) estado.nome = String(dados.nome);

        const bpm = Number(dados.bpm);
        if (!Number.isFinite(bpm) || bpm <= 0) {
          enviarJSON(res, 400, { erro: "bpm invalido" });
          return;
        }
        aplicarLeitura(bpm, false);
        enviarJSON(res, 200, { ok: true, bpm: estado.bpm, status: estado.status });
      } catch (e) {
        enviarJSON(res, 400, { erro: "JSON invalido" });
      }
    });
    return;
  }

  // POST /api/pulseira -> conectar/desconectar { conectada: true }
  if (url.pathname === "/api/pulseira" && req.method === "POST") {
    let corpo = "";
    req.on("data", (p) => (corpo += p));
    req.on("end", () => {
      try {
        const dados = JSON.parse(corpo || "{}");
        estado.pulseiraConectada = !!dados.conectada;
        enviarJSON(res, 200, { ok: true, pulseiraConectada: estado.pulseiraConectada });
      } catch (e) {
        enviarJSON(res, 400, { erro: "JSON invalido" });
      }
    });
    return;
  }

  // Arquivos estaticos
  if (req.method === "GET") {
    servirArquivo(res, decodeURIComponent(url.pathname));
    return;
  }

  enviarJSON(res, 404, { erro: "rota nao encontrada" });
});

servidor.listen(PORTA, () => {
  console.log("===========================================");
  console.log("  VittaSafe rodando!");
  console.log("  Abra no navegador: http://localhost:" + PORTA);
  console.log("  Tela paciente : http://localhost:" + PORTA + "/index.html");
  console.log("  Area cuidador : http://localhost:" + PORTA + "/cuidador.html");
  console.log("  API paciente  : /api/paciente");
  console.log("  API historico : /api/historico  e  /api/batimentos");
  console.log("  ESP32 envia   : POST /api/leitura  { bpm }");
  console.log("===========================================");
  console.log("Sem ESP32? O modo demo gera batimentos de teste.");
});

