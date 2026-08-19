/**
 * SISTEMA DE REQUISITO DE NÍVEL E ONDAS
 * 
 * - Verifica se o jogador tem nível suficiente para avançar de fase
 * - Sistema de ondas para fases 6, 7, 8 (inimigos chegam em grupos)
 * - Gate de dificuldade real: sem nível = não passa
 */

const LEVEL_REQUIREMENTS = {
    1: 0,   // Sem requisito
    2: 0,   // Sem requisito
    3: 3,   // Precisa ser nível 3+
    4: 6,   // Precisa ser nível 6+
    5: 10,  // Precisa ser nível 10+
    6: 14,  // Precisa ser nível 14+ para entrar na expansão
    7: 18,  // Precisa ser nível 18+
    8: 22   // Precisa ser nível 22+ para o boss final
};

class WaveSystem {
    constructor(level, groundY) {
        this.level = level;
        this.groundY = groundY;
        this.currentWave = 0;
        this.waves = this.buildWaves();
        this.waveActive = false;
        this.waveComplete = false;
        this.waveTimer = 0;
        this.waveCooldown = 180; // 3 segundos entre ondas
        this.allWavesDone = false;
    }

    buildWaves() {
        const id = this.level.id;
        if (id === 6) {
            return [
                // Onda 1: Introdução a inimigos elite
                { types: ['basic', 'basic', 'elite'], message: '⚡ ONDA 1 - PATRULHA ELITE!', color: '#00aaff' },
                // Onda 2: Fantasmas aparecem
                { types: ['ghost', 'ghost', 'elite', 'fast'], message: '👻 ONDA 2 - OS FANTASMAS!', color: '#9b59b6' },
                // Onda 3: Mistura perigosa
                { types: ['elite', 'elite', 'ghost', 'berserker'], message: '💥 ONDA 3 - ATAQUE TOTAL!', color: '#ff8800' },
                // Onda 4: Pré-boss
                { types: ['assassin', 'ghost', 'elite', 'sniper', 'healer'], message: '⚠️ ONDA FINAL!', color: '#ff0000' }
            ];
        } else if (id === 7) {
            return [
                { types: ['assassin', 'assassin', 'ghost'], message: '🌑 ONDA 1 - SOMBRAS!', color: '#333' },
                { types: ['assassin', 'ghost', 'ghost', 'elite'], message: '🌑 ONDA 2 - INFILTRAÇÃO!', color: '#555' },
                { types: ['assassin', 'assassin', 'elite', 'ghost', 'sniper'], message: '🌑 ONDA 3 - ELITE SOMBRIA!', color: '#9b59b6' },
                { types: ['assassin', 'ghost', 'elite', 'berserker', 'healer', 'sniper'], message: '💀 ONDA FINAL - EXECUTORES!', color: '#ff0000' }
            ];
        } else if (id === 8) {
            return [
                { types: ['elite', 'elite', 'assassin', 'ghost', 'tank'], message: '⭐ ONDA 1 - GUARDAS REAIS!', color: '#ffd700' },
                { types: ['elite', 'ghost', 'ghost', 'assassin', 'berserker', 'healer'], message: '⭐ ONDA 2 - LEGIÃO!', color: '#ff8800' },
                { types: ['elite', 'elite', 'elite', 'assassin', 'assassin', 'sniper', 'exploder'], message: '⭐ ONDA 3 - ANIQUILAÇÃO!', color: '#ff4400' },
                { types: ['elite', 'ghost', 'assassin', 'ghost', 'elite', 'berserker', 'sniper', 'cowboy'], message: '💀 ONDA FINAL - ARMAGEDDON!', color: '#ff0000' }
            ];
        }
        return [];
    }

    startNextWave(enemies) {
        if (this.currentWave >= this.waves.length) {
            this.allWavesDone = true;
            return;
        }

        const wave = this.waves[this.currentWave];
        this.currentWave++;
        this.waveActive = true;

        // Popup de aviso
        if (window.particles) {
            window.particles.createText(500, 200, wave.message, wave.color, { size: 28 });
        }
        if (window.soundSystem) {
            window.soundSystem.playSound('ko');
        }
        if (window.screenShake !== undefined) {
            window.screenShake = 6;
        }

        // Spawnar inimigos da onda com espaçamento
        wave.types.forEach((type, i) => {
            const x = 700 + i * 180 + Math.random() * 60;
            let enemy;

            if (type === 'elite') enemy = new EliteEnemy(x, this.groundY);
            else if (type === 'ghost') enemy = new GhostEnemy(x, this.groundY);
            else if (type === 'assassin') enemy = new AssassinEnemy(x, this.groundY);
            else if (typeof EnemyFactory !== 'undefined') {
                enemy = EnemyFactory.create(x, this.groundY, type);
            } else {
                enemy = new Enemy(x, this.groundY, type);
            }

            // Escalar pela dificuldade da fase
            const dm = this.level.difficultyMultiplier || 1;
            if (enemy.maxLife) {
                enemy.maxLife = Math.floor(enemy.maxLife * dm);
                enemy.life = enemy.maxLife;
            }
            if (enemy.damage) enemy.damage = Math.floor(enemy.damage * dm);

            enemies.push(enemy);
        });
    }

    update(enemies) {
        if (this.allWavesDone) return;

        // Verificar se onda atual terminou
        const livingNonBoss = enemies.filter(e => !e.dead && e.life > 0 && !e.isBoss && !e.isBossMinion);

        if (this.waveActive && livingNonBoss.length === 0) {
            this.waveActive = false;
            this.waveTimer = 0;

            if (this.currentWave >= this.waves.length) {
                this.allWavesDone = true;
            }
        }

        if (!this.waveActive && !this.allWavesDone) {
            this.waveTimer++;
            if (this.waveTimer >= this.waveCooldown) {
                this.startNextWave(enemies);
            }
        }
    }

    drawWaveInfo(ctx, currentWave, totalWaves, wavesComplete) {
        if (wavesComplete) return;
        ctx.save();

        // Indicador de ondas no topo
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(350, 55, 300, 28);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 15px Bebas Neue';
        ctx.textAlign = 'center';
        ctx.fillText(`ONDA ${currentWave}/${totalWaves}`, 500, 73);

        // Barra de progresso de ondas
        const barW = 200;
        ctx.fillStyle = '#333';
        ctx.fillRect(400, 75, barW, 6);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(400, 75, barW * (currentWave / totalWaves), 6);

        ctx.restore();
    }
}

/**
 * Verifica se o jogador tem nível suficiente para entrar na fase
 * @returns {boolean} true se pode entrar, false se não
 */
function checkLevelRequirement(levelIndex, players) {
    const levelNum = levelIndex + 1;
    const req = LEVEL_REQUIREMENTS[levelNum] || 0;
    if (req === 0) return true;

    const maxPlayerLevel = players.reduce((max, p) => {
        const plvl = p.evolution ? p.evolution.level : 1;
        return Math.max(max, plvl);
    }, 1);

    return maxPlayerLevel >= req;
}

/**
 * Desenha o gate de nível (tela bloqueando avanço)
 */
function drawLevelGate(ctx, levelIndex, players, onConfirm) {
    const levelNum = levelIndex + 1;
    const req = LEVEL_REQUIREMENTS[levelNum] || 0;
    const maxPlayerLevel = players.reduce((max, p) => {
        const plvl = p.evolution ? p.evolution.level : 1;
        return Math.max(max, plvl);
    }, 1);

    ctx.save();

    // Fundo escuro
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, 1000, 650);

    // Ícone de cadeado
    ctx.fillStyle = '#ff0000';
    ctx.font = '80px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔒', 500, 230);

    // Título
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px Bebas Neue';
    ctx.fillText('FASE BLOQUEADA!', 500, 300);

    // Mensagem
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Righteous';
    ctx.fillText(`Nível mínimo necessário: ${req}`, 500, 360);

    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Seu nível atual: ${maxPlayerLevel}`, 500, 400);

    const falta = req - maxPlayerLevel;
    ctx.fillStyle = '#ff8800';
    ctx.font = '22px Righteous';
    ctx.fillText(`Faltam ${falta} nível(eis) para avançar!`, 500, 445);

    ctx.fillStyle = '#aaa';
    ctx.font = '18px Righteous';
    ctx.fillText('Derrote mais inimigos e evolua seu personagem', 500, 480);
    ctx.fillText('para desbloquear a próxima fase.', 500, 505);

    // Dica de XP
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 16px Righteous';
    ctx.fillText('💡 DICA: Ative combos altos para ganhar mais XP!', 500, 545);

    // Botão
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(350, 570, 300, 50);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Bebas Neue';
    ctx.fillText('PRESSIONE ENTER PARA JOGAR NOVAMENTE', 500, 601);

    ctx.restore();
}

console.log('✅ Sistema de requisito de nível e ondas carregado!');
