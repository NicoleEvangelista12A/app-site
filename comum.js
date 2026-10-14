function vsTemaEscuro() {
  return document.body.classList.contains("dark");
}

function vsAplicarTema(escuro) {
  document.body.classList.toggle("dark", escuro);
  const botao = document.getElementById("tema");
  if (botao) {
    botao.textContent = escuro ? "☀️" : "🌙";
    botao.setAttribute("aria-label", escuro ? "Ativar modo claro" : "Ativar modo escuro");
  }
}

function vsCarregarTema() {
  const salvo = localStorage.getItem("vittasafe-tema");
  vsAplicarTema(salvo === "dark");
}

function vsAlternarTema() {
  const escuro = !vsTemaEscuro();
  vsAplicarTema(escuro);
  localStorage.setItem("vittasafe-tema", escuro ? "dark" : "light");
}

function vsInitTema() {
  vsCarregarTema();
  const botao = document.getElementById("tema");
  if (botao) botao.addEventListener("click", vsAlternarTema);
}

function vsHora(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR");
}

function vsDataHora(iso) {
  return new Date(iso).toLocaleString("pt-BR");
}

function vsDesenharGrafico(canvasId, pontos) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const largura = canvas.clientWidth || 320;
  const altura = canvas.clientHeight || 120;

  canvas.width = largura * dpr;
  canvas.height = altura * dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, largura, altura);

  const escuro = vsTemaEscuro();
  const corLinha = escuro ? "#38bdf8" : "#227ca3";
  const corArea = escuro ? "rgba(56,189,248,0.18)" : "rgba(34,124,163,0.15)";
  const corGrade = escuro ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";

  ctx.strokeStyle = corGrade;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (altura / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(largura, y);
    ctx.stroke();
  }

  if (!pontos || pontos.length < 2) {
    ctx.fillStyle = escuro ? "#a8b6ca" : "#64748b";
    ctx.font = "13px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Coletando batimentos...", largura / 2, altura / 2);
    return;
  }

  const dados = pontos.slice().reverse();
  const valores = dados.map((p) => p.bpm);
  const maxBpm = Math.max(120, Math.max(...valores) + 10);
  const minBpm = Math.max(0, Math.min(...valores) - 10);

  const passoX = largura / (dados.length - 1);
  const px = (i) => i * passoX;
  const py = (v) => altura - ((v - minBpm) / (maxBpm - minBpm)) * altura;

  ctx.beginPath();
  ctx.moveTo(px(0), altura);
  dados.forEach((p, i) => ctx.lineTo(px(i), py(p.bpm)));
  ctx.lineTo(px(dados.length - 1), altura);
  ctx.closePath();
  ctx.fillStyle = corArea;
  ctx.fill();

  ctx.beginPath();
  dados.forEach((p, i) => {
    if (i === 0) ctx.moveTo(px(i), py(p.bpm));
    else ctx.lineTo(px(i), py(p.bpm));
  });
  ctx.strokeStyle = corLinha;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  const ultimo = dados[dados.length - 1];
  const ux = px(dados.length - 1);
  const uy = py(ultimo.bpm);
  ctx.beginPath();
  ctx.arc(ux, uy, 4, 0, Math.PI * 2);
  ctx.fillStyle = corLinha;
  ctx.fill();
}
