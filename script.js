document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('ranking-container');
    const botoesContainer = document.getElementById('botoes-rodadas');
    const rankingTitle = document.getElementById('ranking-title');

    // Mude aqui o número total de rodadas que você já salvou
    const TOTAL_RODADAS = 1; 

    let todosOsDadosDasRodadas = [];

    async function carregarDadosDeTodasAsRodadas() {
        const promessas = [];
        for (let i = 1; i <= TOTAL_RODADAS; i++) {
            promessas.push(fetch(`./rodadas/rodada-${i}.json`).then(res => res.json()));
        }
        
        try {
            todosOsDadosDasRodadas = await Promise.all(promessas);
            criarBotoes();
            // Mostra a classificação geral por padrão ao carregar a página
            mostrarClassificacaoGeral(); 
        } catch (error) {
            rankingTitle.textContent = "Erro ao carregar dados das rodadas";
            container.innerHTML = '<p class="loading">Verifique se todos os arquivos .json das rodadas existem na pasta /rodadas/.</p>';
        }
    }

    function criarBotoes() {
        botoesContainer.innerHTML = '';
        
        const btnGeral = document.createElement('button');
        btnGeral.className = 'btn-rodada';
        btnGeral.textContent = 'Classificação Geral';
        btnGeral.onclick = () => mostrarClassificacaoGeral();
        botoesContainer.appendChild(btnGeral);

        for (let i = 1; i <= TOTAL_RODADAS; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn-rodada';
            btn.textContent = `Rodada ${i}`;
            btn.onclick = () => mostrarRankingDaRodada(i);
            botoesContainer.appendChild(btn);
        }
    }

    function mostrarRankingDaRodada(numeroRodada) {
        setActiveButton(`Rodada ${numeroRodada}`);
        rankingTitle.textContent = `Classificação da Rodada ${numeroRodada}`;
        const dadosDaRodada = todosOsDadosDasRodadas[numeroRodada - 1];
        renderizarRanking(dadosDaRodada, 'rodada');
    }

    function mostrarClassificacaoGeral() {
        setActiveButton('Classificação Geral');
        rankingTitle.textContent = 'Classificação Geral';
        
        const classificacaoGeral = {};
        const totalParticipantes = todosOsDadosDasRodadas[0].length;

        todosOsDadosDasRodadas.forEach(rodada => {
            rodada.forEach(time => {
                if (!classificacaoGeral[time.username]) {
                    classificacaoGeral[time.username] = { pontos: 0, vitorias: 0, eliminacoes: 0 };
                }
                classificacaoGeral[time.username].pontos += (totalParticipantes - time.rank + 1);
                if (time.rank === 1) {
                    classificacaoGeral[time.username].vitorias += 1;
                }
                classificacaoGeral[time.username].eliminacoes += time.eliminatedCount;
            });
        });

        const rankingArray = Object.keys(classificacaoGeral).map(username => ({
            username,
            ...classificacaoGeral[username]
        }));

        rankingArray.sort((a, b) => b.pontos - a.pontos);

        const rankingFinal = rankingArray.map((time, index) => ({
            ...time,
            rank: index + 1
        }));
        
        renderizarRanking(rankingFinal, 'geral');
    }

    function renderizarRanking(dados, tipo) {
        container.innerHTML = '';
        if (!dados || dados.length === 0) {
            container.innerHTML = '<p class="loading">Nenhum dado para exibir.</p>';
            return;
        }

        const totalParticipantes = dados.length;

        dados.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'ranking-item';
            
            const imageName = item.username.toLowerCase().replace(/ /g, '-').replace(/\./g, '') + '.png';

            let detalhesHTML = '';
            // ### ALTERAÇÃO AQUI ###
            if (tipo === 'rodada') {
                const pontosDaRodada = totalParticipantes - item.rank + 1;
                detalhesHTML = `
                    <div class="details">
                        <span class="details-label">Pontos na Rodada:</span>
                        <div class="details-value">${pontosDaRodada}</div>
                    </div>`;
            } else if (tipo === 'geral') {
                detalhesHTML = `
                    <div class="details">
                        <span class="details-label">Pontos Totais:</span>
                        <div class="details-value">${item.pontos}</div>
                    </div>`;
            }

            itemDiv.innerHTML = `
                <div class="rank">${item.rank}º</div>
                <div class="team-info">
                    <img src="./imagens/${imageName}" alt="Escudo do ${item.username}" onerror="this.style.display='none'">
                    <span class="username">${item.username}</span>
                </div>
                ${detalhesHTML}
            `;
            container.appendChild(itemDiv);
        });
    }

    function setActiveButton(text) {
        document.querySelectorAll('.btn-rodada').forEach(btn => {
            if (btn.textContent === text) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    carregarDadosDeTodasAsRodadas();
});