const API = "http://localhost:3006/api";

async function atualizarCuidador() {

    try {

        const resposta = await fetch(`${API}/paciente`);
        const paciente = await resposta.json();

        document.getElementById("nomePaciente").textContent =
            paciente.nome;

        document.getElementById("bpm").textContent =
            paciente.bpm;

        const status =
            document.getElementById("status");

        status.textContent =
            paciente.status;

        status.className = "status";

        if (paciente.status === "Normal") {
            status.classList.add("normal");
        }

        if (paciente.status === "Atenção") {
            status.classList.add("atencao");
        }

        if (paciente.status === "Risco") {
            status.classList.add("risco");
        }

        document.getElementById("pulseira").textContent =
            paciente.pulseiraConectada
                ? "Conectada"
                : "Desconectada";

    } catch (erro) {

        console.error("Erro:", erro);

    }
}

async function carregarHistorico() {

    const resposta =
        await fetch(`${API}/historico`);

    const eventos =
        await resposta.json();

    const container =
        document.getElementById("historico");

    if (eventos.length === 0) {

        container.innerHTML =
            "<p>Nenhum evento registrado.</p>";

        return;
    }

    container.innerHTML = eventos
        .slice(0, 8)
        .map(evento => {

            const horario =
                new Date(evento.horario)
                .toLocaleTimeString("pt-BR");

            return `
                <div style="
                    padding: 14px 0;
                    border-bottom: 1px solid var(--borda);
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                ">
                    <div>
                        <strong>${evento.bpm} BPM</strong>
                        <br>
                        <small>${horario}</small>
                    </div>

                    <strong>${evento.status}</strong>
                </div>
            `;

        })
        .join("");
}

document
    .getElementById("tema")
    .addEventListener("click", () => {

        document.body.classList.toggle("dark");

        const escuro =
            document.body.classList.contains("dark");

        localStorage.setItem(
            "vittasafe-tema",
            escuro ? "dark" : "light"
        );

        document.getElementById("tema").textContent =
            escuro ? "☀️" : "🌙";
    });

if (localStorage.getItem("vittasafe-tema") === "dark") {

    document.body.classList.add("dark");

    document.getElementById("tema").textContent =
        "☀️";
}

atualizarCuidador();
carregarHistorico();

setInterval(atualizarCuidador, 3000);
setInterval(carregarHistorico, 5000);