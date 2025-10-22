document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('ranking-container');
    const botoesContainer = document.getElementById('botoes-rodadas');
    const rankingTitle = document.getElementById('ranking-title');
    
    // --- Elementos da Busca ---
    const searchInput = document.getElementById('searchInput');
    const clearSearchButton = document.getElementById('clearSearchButton');

    const TOTAL_RODADAS = 1;

    let todosOsDadosDasRodadas = [];
    let mapeamentoSeries = {};

    // --- FUNÇÃO DE BUSCA ---
    function handleSearch() {
        const query = searchInput.value.trim().toLowerCase();
        
        // Mostra ou esconde o botão de limpar
        clearSearchButton.style.display = query ? 'block' : 'none';

        const allItems = container.querySelectorAll('.ranking-item');
        const allTitles = container.querySelectorAll('.serie-title');

        allItems.forEach(item => {
            const username = item.querySelector('.username').textContent.toLowerCase();
            const isVisible = username.includes(query);
            item.style.display = isVisible ? 'flex' : 'none';
        });
        
        // Esconde os títulos "Série A" / "Série B" se nenhum time daquela série for visível
        allTitles.forEach(title => {
            // Pega todos os itens que vêm DEPOIS do título, até o próximo título (ou o fim)
            let nextElement = title.nextElementSibling;
            let visibleItemsInSection = 0;
            while(nextElement && !nextElement.classList.contains('serie-title')) {
                if(nextElement.classList.contains('ranking-item') && nextElement.style.display !== 'none') {
                    visibleItemsInSection++;
                }
                nextElement = nextElement.nextElementSibling;
            }
            
            title.style.display = visibleItemsInSection > 0 ? 'block' : 'none';
        });
    }

    // --- FUNÇÃO PARA LIMPAR A BUSCA ---
    function clearSearch() {
        searchInput.value = ''; // Limpa o campo
        handleSearch(); // Roda a busca com o campo vazio, o que mostra tudo de volta
    }

    // --- ADICIONA OS EVENTOS DE BUSCA ---
    searchInput.addEventListener('keyup', handleSearch);
    clearSearchButton.addEventListener('click', clearSearch);


    async function carregarDadosDeTodasAsRodadas() {
        const promessas = [];
        
        promessas.push(fetch('./times.json').then(res => res.json()));

        for (let i = 1; i <= TOTAL_RODADAS; i++) {
            promessas.push(fetch(`./rodadas/rodada-${i}-a.json`).then(res => res.json()));
            promessas.push(fetch(`./rodadas/rodada-${i}-b.json`).then(res => res.json()));
        }
        
        try {
            const resultados = await Promise.all(promessas);
            
            mapeamentoSeries = resultados[0];
            
            todosOsDadosDasRodadas = [];
            let j = 1;
            for (let i = 0; i < TOTAL_RODADAS; i++) {
                todosOsDadosDasRodadas.push({
                    serieA: resultados[j],
                    serieB: resultados[j+1]
                });
                j += 2;
            }

            criarBotoes();
            mostrarClassificacaoGeral();
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            rankingTitle.textContent = "Erro ao carregar dados das rodadas";
            container.innerHTML = '<p class="loading">Verifique se o times.json e todos os arquivos .json das rodadas (ex: rodada-1-a.json, rodada-1-b.json) existem.</p>';
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
            const btnA = document.createElement('button');
            btnA.className = 'btn-rodada';
            btnA.textContent = `Rodada ${i} - Série A`;
            btnA.onclick = () => mostrarRankingDaRodada(i, 'A');
            botoesContainer.appendChild(btnA);

            const btnB = document.createElement('button');
            btnB.className = 'btn-rodada';
            btnB.textContent = `Rodada ${i} - Série B`;
            btnB.onclick = () => mostrarRankingDaRodada(i, 'B');
            botoesContainer.appendChild(btnB);
        }
    }

    function mostrarRankingDaRodada(numeroRodada, serie) {
        clearSearch(); // Limpa a busca ao trocar de tela
        setActiveButton(`Rodada ${numeroRodada} - Série ${serie}`);
        rankingTitle.textContent = `Classificação da Rodada ${numeroRodada} - Série ${serie}`;
        
        const dadosDaRodada = todosOsDadosDasRodadas[numeroRodada - 1];
        const dadosDaSerie = (serie === 'A') ? dadosDaRodada.serieA : dadosDaRodada.serieB;
        
        renderizarRanking(dadosDaSerie, 'rodada');
    }

    function mostrarClassificacaoGeral() {
        clearSearch(); // Limpa a busca ao trocar de tela
        setActiveButton('Classificação Geral');
        rankingTitle.textContent = 'Classificação Geral';
        
        const classificacaoGeral = {};

        todosOsDadosDasRodadas.forEach(rodada => {
            const totalSerieA = rodada.serieA.length;
            rodada.serieA.forEach(time => {
                if (!classificacaoGeral[time.username]) {
                    classificacaoGeral[time.username] = { pontos: 0, vitorias: 0, eliminacoes: 0 };
                }
                classificacaoGeral[time.username].pontos += (totalSerieA - time.rank + 1);
                if (time.rank === 1) {
                    classificacaoGeral[time.username].vitorias += 1;
                }
                classificacaoGeral[time.username].eliminacoes += time.eliminatedCount;
            });

            const totalSerieB = rodada.serieB.length;
            rodada.serieB.forEach(time => {
                if (!classificacaoGeral[time.username]) {
                    classificacaoGeral[time.username] = { pontos: 0, vitorias: 0, eliminacoes: 0 };
                }
                classificacaoGeral[time.username].pontos += (totalSerieB - time.rank + 1);
                if (time.rank === 1) {
                    classificacaoGeral[time.username].vitorias += 1;
                }
                classificacaoGeral[time.username].eliminacoes += time.eliminatedCount;
            });
        });

        const rankingArray = Object.keys(classificacaoGeral).map(username => ({
            username,
            serie: mapeamentoSeries[username] || 'B',
            ...classificacaoGeral[username]
        }));

        rankingArray.sort((a, b) => b.pontos - a.pontos);

        const rankingSerieA = rankingArray.filter(time => time.serie === 'A');
        const rankingSerieB = rankingArray.filter(time => time.serie === 'B');

        const rankingFinalA = rankingSerieA.map((time, index) => ({ ...time, rank: index + 1 }));
        const rankingFinalB = rankingSerieB.map((time, index) => ({ ...time, rank: index + 1 }));
        
        renderizarRanking(rankingFinalA, rankingFinalB);
    }

    function renderizarRanking(dados, tipo) {
        container.innerHTML = '';

        if (tipo === undefined) {
            const dadosSerieA = dados;
            const dadosSerieB = arguments[1];

            container.appendChild(criarTituloSerie('Série A'));
            if (dadosSerieA.length > 0) {
                dadosSerieA.forEach(item => container.appendChild(criarItemRanking(item, 'geral')));
            } else {
                container.innerHTML += '<p class="loading">Nenhum dado para Série A.</p>';
            }

            container.appendChild(criarTituloSerie('Série B'));
            if (dadosSerieB.length > 0) {
                dadosSerieB.forEach(item => container.appendChild(criarItemRanking(item, 'geral')));
            } else {
                container.innerHTML += '<p class="loading">Nenhum dado para Série B.</p>';
            }
        }
        else if (tipo === 'rodada') {
            if (!dados || dados.length === 0) {
                container.innerHTML = '<p class="loading">Nenhum dado para exibir.</p>';
                return;
            }
            const totalParticipantes = dados.length;
            dados.forEach(item => {
                container.appendChild(criarItemRanking(item, 'rodada', totalParticipantes));
            });
        }
    }

    function criarTituloSerie(nomeSerie) {
        const serieTitle = document.createElement('h3');
        serieTitle.className = 'serie-title';
        serieTitle.textContent = nomeSerie;
        return serieTitle;
    }

    function criarItemRanking(item, tipo, totalParticipantes = 0) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'ranking-item';

        const serieTime = item.serie || mapeamentoSeries[item.username] || 'B';
        itemDiv.classList.add(serieTime === 'A' ? 'serie-a' : 'serie-b');

        let detalhesHTML = '';
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

        const caminhoImagem = `imagens/serie-${serieTime.toLowerCase()}/${item.username}.png`;

        itemDiv.innerHTML = `
            <div class="rank">${item.rank}º</div>
            <div class="team-info">
                <img 
                    src="${caminhoImagem}" 
                    alt="Logo ${item.username}" 
                    class="team-logo" 
                    onerror="this.style.display='none'"
                >
                <span class="username">${item.username}</span>
            </div>
            ${detalhesHTML}
        `;
        return itemDiv;
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