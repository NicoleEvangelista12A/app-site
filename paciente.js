const API = "http://localhost:3006/api";

let ultimoStatus = "Normal";

// Tema claro/escuro (função compartilhada do comum.js)
vsInitTema();

// ============================================================
//  ESTADO ATUAL DO PACIENTE
// ============================================================

async function atualizarPaciente() {
    try {
        const resposta = await fetch(`${API}/paciente`);
        const paciente = await resposta.json();

        document.getElementById("bpm").textContent = paciente.bpm;

        const status = document.getElementById("status");

        status.textContent = paciente.status;

        status.className = "status";

        if (paciente.status === "Normal") {
            status.classList.add("normal");
        }

        if (paciente.status === "Atenção") {
            status.classList.add("atencao");
        }

        if (paciente.status === "Risco") {
            status.classList.add("risco");

            if (ultimoStatus !== "Risco") {
                mostrarAlerta(paciente.bpm);
            }
        }

        ultimoStatus = paciente.status;

        const data = new Date(paciente.ultimaAtualizacao);

        document.getElementById("atualizacao").textContent =
            data.toLocaleTimeString("pt-BR");

        document.getElementById("conexao").textContent =
            paciente.pulseiraConectada
                ? "Pulseira conectada"
                : "Pulseira desconectada";

    } catch (erro) {
        document.getElementById("conexao").textContent =
            "Servidor indisponível";

        console.error("Erro ao conectar com a API:", erro);
    }
}



async function carregarBatimentos() {
    try {
        const resposta = await fetch(`${API}/batimentos`);
        const pontos = await resposta.json();

        vsDesenharGrafico("grafico", pontos);

        const lista = document.getElementById("listaBatimentos");
        document.getElementById("qtdBatimentos").textContent = pontos.length;

        if (!pontos.length) {
            lista.innerHTML = `<p class="vazio">Nenhum batimento registrado ainda.</p>`;
            return;
        }

        lista.innerHTML = pontos
            .slice(0, 12)
            .map((p) => {
                let cor = "normal";
                if (p.status === "Atenção") cor = "atencao";
                if (p.status === "Risco") cor = "risco";

                return `
                    <div class="item-historico">
                        <span class="item-hora">${vsHora(p.horario)}</span>
                        <span class="item-bpm ${cor}">${p.bpm} BPM</span>
                        <span class="item-status ${cor}">${p.status}</span>
                    </div>
                `;
            })
            .join("");
    } catch (erro) {
        console.error("Erro no histórico de batimentos:", erro);
    }
}

// ============================================================
//  HISTÓRICO DE ALTERAÇÕES (eventos Atenção / Risco)
// ============================================================

async function carregarEventos() {
    try {
        const resposta = await fetch(`${API}/historico`);
        const eventos = await resposta.json();

        const lista = document.getElementById("listaEventos");

        if (!eventos.length) {
            lista.innerHTML = `<p class="vazio">Nenhuma alteração registrada. Batimentos normais. ✓</p>`;
            return;
        }

        lista.innerHTML = eventos
            .slice(0, 10)
            .map((evento) => {
                let cor = "atencao";
                if (evento.status === "Risco") cor = "risco";

                return `
                    <div class="item-historico">
                        <span class="item-hora">${vsDataHora(evento.horario)}</span>
                        <span class="item-bpm ${cor}">${evento.bpm} BPM</span>
                        <span class="item-status ${cor}">${evento.status}</span>
                    </div>
                `;
            })
            .join("");
    } catch (erro) {
        console.error("Erro no histórico de eventos:", erro);
    }
}

// ============================================================
//  ALERTA
// ============================================================

function mostrarAlerta(bpm) {
    const alerta = document.getElementById("alerta");
    const alertaBpm = document.getElementById("alerta-bpm");

    if (alertaBpm) {
        alertaBpm.textContent = `${bpm} BPM`;
    }

    if (alerta) {
        alerta.classList.remove("escondido");
    }
}

const fecharAlerta = document.getElementById("fechar-alerta");

if (fecharAlerta) {
    fecharAlerta.addEventListener("click", () => {
        document
            .getElementById("alerta")
            .classList.add("escondido");
    });
}

// ============================================================
//  REDIMENSIONAR GRÁFICO + INICIAR
// ============================================================

window.addEventListener("resize", () => carregarBatimentos());

atualizarPaciente();
carregarBatimentos();
carregarEventos();

setInterval(atualizarPaciente, 3000);
setInterval(carregarBatimentos, 3000);
setInterval(carregarEventos, 5000);

