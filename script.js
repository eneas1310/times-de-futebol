document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('ranking-container');

    // fetch vai buscar o nosso arquivo de ranking
    fetch('ranking.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Não foi possível carregar o arquivo de ranking.');
            }
            return response.json(); // Converte o arquivo para um objeto JavaScript
        })
        .then(data => {
            // Limpa a mensagem "Carregando..."
            container.innerHTML = ''; 

            // Itera sobre cada time no ranking
            data.forEach(player => {
                // Cria o HTML para cada item do ranking
                const playerDiv = document.createElement('div');
                playerDiv.classList.add('ranking-item');

                playerDiv.innerHTML = `
                    <div class="rank">${player.rank}º</div>
                    <div class="team-info">
                        <img src="./imagens/${player.username.toLowerCase().replace(/ /g, '-')}.png" alt="Escudo do ${player.username}">
                        <span class="username">${player.username}</span>
                    </div>
                    <div class="details">
                        <span>Eliminado por:</span>
                        <div class="eliminated-by">${player.eliminatedBy}</div>
                    </div>
                `;

                // Adiciona o item criado na página
                container.appendChild(playerDiv);
            });
        })
        .catch(error => {
            console.error('Erro:', error);
            container.innerHTML = '<p class="loading">Ranking não encontrado ou inválido. Gere um novo ranking no simulador.</p>';
        });
});