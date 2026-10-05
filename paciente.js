const API = "http://localhost:3006/api";

let ultimoStatus = "Normal";

const botaoTema = document.getElementById("tema");

function carregarTema() {
    const temaSalvo = localStorage.getItem("vittasafe-tema");

    if (temaSalvo === "dark") {
        document.body.classList.add("dark");

        if (botaoTema) {
            botaoTema.textContent = "☀️";
            botaoTema.setAttribute("aria-label", "Ativar modo claro");
        }
    } else {
        document.body.classList.remove("dark");

        if (botaoTema) {
            botaoTema.textContent = "🌙";
            botaoTema.setAttribute("aria-label", "Ativar modo escuro");
        }
    }
}

function alternarTema() {
    const modoEscuro = document.body.classList.toggle("dark");

    localStorage.setItem(
        "vittasafe-tema",
        modoEscuro ? "dark" : "light"
    );

    if (botaoTema) {
        botaoTema.textContent = modoEscuro ? "☀️" : "🌙";

        botaoTema.setAttribute(
            "aria-label",
            modoEscuro
                ? "Ativar modo claro"
                : "Ativar modo escuro"
        );
    }
}

if (botaoTema) {
    botaoTema.addEventListener("click", alternarTema);
}

carregarTema();

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

atualizarPaciente();

setInterval(atualizarPaciente, 3000);
