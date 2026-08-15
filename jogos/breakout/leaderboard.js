// leaderboard.js - Sistema de Placar Local
class Leaderboard {
    constructor() {
        this.scores = this.load();
        this.maxEntries = 10;
        
        console.log(`📊 Leaderboard inicializado (${this.scores.length} entradas)`);
    }
    
    load() {
        const saved = localStorage.getItem('breakout_leaderboard');
        return saved ? JSON.parse(saved) : [];
    }
    
    save() {
        localStorage.setItem('breakout_leaderboard', JSON.stringify(this.scores));
    }
    
    addScore(playerName, score, level, coins) {
        const entry = {
            name: playerName || 'Jogador',
            score: score,
            level: level,
            coins: coins,
            date: new Date().toLocaleDateString('pt-BR'),
            timestamp: Date.now()
        };
        
        this.scores.push(entry);
        
        // Ordena por pontuação (maior primeiro)
        this.scores.sort((a, b) => b.score - a.score);
        
        // Mantém apenas top 10
        if (this.scores.length > this.maxEntries) {
            this.scores = this.scores.slice(0, this.maxEntries);
        }
        
        this.save();
        
        // Verifica se entrou no top 10
        const position = this.scores.findIndex(s => 
            s.timestamp === entry.timestamp
        ) + 1;
        
        if (position > 0 && position <= this.maxEntries) {
            console.log(`🏆 Novo recorde! Posição #${position}`);
            return position;
        }
        
        return -1;
    }
    
    getTopScores(count = 10) {
        return this.scores.slice(0, count);
    }
    
    getHighScore() {
        return this.scores.length > 0 ? this.scores[0].score : 0;
    }
    
    isHighScore(score) {
        if (this.scores.length < this.maxEntries) return true;
        return score > this.scores[this.scores.length - 1].score;
    }
    
    clear() {
        this.scores = [];
        this.save();
    }
    
    draw(ctx) {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, Game.width, Game.height);
        
        // Título
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 TOP 10 🏆', Game.width / 2, 60);
        
        // Subtítulo
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('Melhores Pontuações', Game.width / 2, 90);
        
        // Tabela
        const startY = 130;
        const rowHeight = 45;
        const scores = this.getTopScores();
        
        // Cabeçalho da tabela
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.fillRect(50, startY, Game.width - 100, 40);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('#', 70, startY + 25);
        ctx.fillText('JOGADOR', 120, startY + 25);
        ctx.fillText('PONTOS', 350, startY + 25);
        ctx.fillText('NÍVEL', 500, startY + 25);
        ctx.fillText('MOEDAS', 610, startY + 25);
        
        // Entradas
        scores.forEach((entry, index) => {
            const y = startY + 40 + (index * rowHeight);
            
            // Background alternado
            if (index % 2 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.fillRect(50, y, Game.width - 100, rowHeight);
            }
            
            // Destaque para top 3
            let nameColor = '#fff';
            let medalIcon = '';
            
            if (index === 0) {
                nameColor = '#FFD700';
                medalIcon = '🥇';
            } else if (index === 1) {
                nameColor = '#C0C0C0';
                medalIcon = '🥈';
            } else if (index === 2) {
                nameColor = '#CD7F32';
                medalIcon = '🥉';
            }
            
            // Posição
            ctx.fillStyle = nameColor;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${index + 1}${medalIcon}`, 80, y + 28);
            
            // Nome
            ctx.fillStyle = nameColor;
            ctx.font = '18px Arial';
            ctx.textAlign = 'left';
            const displayName = entry.name.length > 15 ? 
                entry.name.substring(0, 15) + '...' : entry.name;
            ctx.fillText(displayName, 120, y + 28);
            
            // Pontos
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(entry.score.toLocaleString(), 350, y + 28);
            
            // Nível
            ctx.fillStyle = '#aaa';
            ctx.font = '18px Arial';
            ctx.fillText(entry.level, 500, y + 28);
            
            // Moedas
            ctx.fillStyle = '#FFD700';
            ctx.font = '18px Arial';
            ctx.fillText(`${entry.coins} 💰`, 610, y + 28);
            
            // Data (pequena)
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(entry.date, Game.width - 60, y + 28);
        });
        
        // Mensagem se vazio
        if (scores.length === 0) {
            ctx.fillStyle = '#888';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Nenhuma pontuação registrada ainda!', Game.width / 2, startY + 100);
            ctx.fillText('Seja o primeiro a jogar! 🎮', Game.width / 2, startY + 140);
        }
        
        // Estatísticas adicionais
        if (scores.length > 0) {
            const totalGames = scores.length;
            const avgScore = Math.floor(
                scores.reduce((sum, s) => sum + s.score, 0) / totalGames
            );
            const maxLevel = Math.max(...scores.map(s => s.level));
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(50, Game.height - 100, Game.width - 100, 70);
            
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('📊 Estatísticas:', 70, Game.height - 70);
            
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText(`Partidas: ${totalGames}`, 70, Game.height - 45);
            ctx.fillText(`Média: ${avgScore.toLocaleString()}`, 250, Game.height - 45);
            ctx.fillText(`Nível Máximo: ${maxLevel}`, 450, Game.height - 45);
        }
        
        // Instruções
        ctx.fillStyle = '#888';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Pressione ESC para voltar', Game.width / 2, Game.height - 20);
    }
    
    // Tela de novo recorde
    drawNewHighScore(ctx, position, score) {
        // Overlay escuro
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, Game.width, Game.height);
        
        // Partículas de celebração
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * Game.width;
            const y = Math.random() * Game.height;
            const size = Math.random() * 3 + 1;
            
            ctx.fillStyle = `hsl(${Math.random() * 60 + 30}, 100%, 50%)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Título principal
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 NOVO RECORDE! 🎉', Game.width / 2, 150);
        
        // Posição
        let positionText = '';
        if (position === 1) {
            positionText = '🥇 1º LUGAR!';
            ctx.fillStyle = '#FFD700';
        } else if (position === 2) {
            positionText = '🥈 2º LUGAR!';
            ctx.fillStyle = '#C0C0C0';
        } else if (position === 3) {
            positionText = '🥉 3º LUGAR!';
            ctx.fillStyle = '#CD7F32';
        } else {
            positionText = `#${position}º LUGAR!`;
            ctx.fillStyle = '#fff';
        }
        
        ctx.font = 'bold 50px Arial';
        ctx.fillText(positionText, Game.width / 2, 230);
        
        // Pontuação
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px Arial';
        ctx.fillText(`${score.toLocaleString()} pontos`, Game.width / 2, 300);
        
        // Mensagem motivacional
        const messages = [
            'Incrível! 🌟',
            'Fantástico! ⚡',
            'Espetacular! 🎯',
            'Lendário! 👑',
            'Sensacional! 🔥'
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        
        ctx.fillStyle = '#FFD700';
        ctx.font = '30px Arial';
        ctx.fillText(randomMsg, Game.width / 2, 360);
        
        // Instrução
        ctx.fillStyle = '#888';
        ctx.font = '20px Arial';
        ctx.fillText('Pressione qualquer tecla para continuar', Game.width / 2, 450);
    }
}

// Função auxiliar para pedir nome do jogador
function promptPlayerName() {
    const name = prompt('🏆 Novo recorde! Digite seu nome:', 'Jogador');
    return name || 'Jogador';
}
