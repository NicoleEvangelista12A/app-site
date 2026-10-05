const API = "http://localhost:3006/api";

let ultimoStatus = "Normal";

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

        console.error(erro);
    }
}

function mostrarAlerta(bpm) {

    document.getElementById("alerta-bpm").textContent =
        `${bpm} BPM`;

    document.getElementById("alerta").classList.remove("escondido");
}

document
    .getElementById("fechar-alerta")
    .addEventListener("click", () => {

        document
            .getElementById("alerta")
            .classList.add("escondido");

    });

document
    .getElementById("tema")
    .addEventListener("click", () => {

        document.body.classList.toggle("dark");

        const escuro =
            document.body.classList.contains("dark");

        localStorage.setItem("vittasafe-tema", escuro ? "dark" : "light");

        document.getElementById("tema").textContent =
            escuro ? "☀️" : "🌙";
    });

if (localStorage.getItem("vittasafe-tema") === "dark") {
    document.body.classList.add("dark");
    document.getElementById("tema").textContent = "☀️";
}

atualizarPaciente();

setInterval(atualizarPaciente, 3000);