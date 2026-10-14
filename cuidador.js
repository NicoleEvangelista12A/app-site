const API = "http://localhost:3006/api";

// Tema claro/escuro (função compartilhada do comum.js)
vsInitTema();

// ============================================================
//  ESTADO ATUAL DO PACIENTE
// ============================================================

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

// ============================================================
//  HISTÓRICO DE BATIMENTOS
// ============================================================

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

async function carregarHistorico() {

    try {

        const resposta =
            await fetch(`${API}/historico`);

        const eventos =
            await resposta.json();

        const container =
            document.getElementById("historico");

        if (!eventos.length) {
            container.innerHTML =
                `<p class="vazio">Nenhuma alteração registrada. Batimentos normais. ✓</p>`;
            return;
        }

        container.innerHTML = eventos
            .slice(0, 12)
            .map(evento => {

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

        console.error("Erro no histórico:", erro);

    }
}

// ============================================================
//  INICIAR
// ============================================================

window.addEventListener("resize", () => carregarBatimentos());

atualizarCuidador();
carregarBatimentos();
carregarHistorico();

setInterval(atualizarCuidador, 3000);
setInterval(carregarBatimentos, 3000);
setInterval(carregarHistorico, 5000);
