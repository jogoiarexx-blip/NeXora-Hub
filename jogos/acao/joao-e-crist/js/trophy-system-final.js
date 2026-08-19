/**
 * SISTEMA DE TROFÉUS ÚNICO
 * Bronze 🥉 | Prata 🥈 | Ouro 🥇 | Platina 🏆
 */

class TrophySystem {
    constructor() {
        this.trophies = [];
        this.unlockedTrophies = new Set();
        this.stats = {
            // Stats de jogo
            enemiesKilled: 0,
            maxCombo: 0,
            dashesUsed: 0,
            powerUpsCollected: 0,
            levelsCompleted: 0,
            bossesDefeated: 0,
            playerLevel: 1,
            deaths: 0,
            score: 0,
            
            // Stats de tempo
            fastestLevelTime: Infinity,
            fastestGameTime: Infinity,
            
            // Stats especiais
            noDamageLevels: 0,
            noDeathRun: false,
            unlockedSkills: 0
        };
        
        this.notifications = [];
        this.scrollOffset = 0;
        this.maxScroll = 0;
        
        this.initializeTrophies();
        this.loadProgress();
    }
    
    initializeTrophies() {
        this.trophies = [
            // ==================== BRONZE 🥉 ====================
            {
                id: 'first_blood',
                name: 'Primeiro Sangue',
                description: 'Derrote seu primeiro inimigo',
                tier: 'bronze',
                icon: '🎯',
                color: '#CD7F32',
                requirement: { type: 'kills', value: 1 },
                reward: { xp: 50, points: 100 }
            },
            {
                id: 'combo_starter',
                name: 'Combo Iniciante',
                description: 'Atinja um combo de 10 hits',
                tier: 'bronze',
                icon: '🔥',
                color: '#CD7F32',
                requirement: { type: 'combo', value: 10 },
                reward: { xp: 100, points: 200 }
            },
            {
                id: 'survivor',
                name: 'Sobrevivente',
                description: 'Complete a primeira fase',
                tier: 'bronze',
                icon: '✅',
                color: '#CD7F32',
                requirement: { type: 'level_complete', value: 1 },
                reward: { xp: 150, points: 300 }
            },
            {
                id: 'dash_apprentice',
                name: 'Aprendiz do Dash',
                description: 'Use dash 25 vezes',
                tier: 'bronze',
                icon: '💨',
                color: '#CD7F32',
                requirement: { type: 'dashes', value: 25 },
                reward: { xp: 75, points: 150 }
            },
            {
                id: 'level_5',
                name: 'Crescimento',
                description: 'Alcance nível 5',
                tier: 'bronze',
                icon: '⭐',
                color: '#CD7F32',
                requirement: { type: 'player_level', value: 5 },
                reward: { xp: 200, points: 400 }
            },
            {
                id: 'power_collector',
                name: 'Coletor',
                description: 'Colete 10 power-ups',
                tier: 'bronze',
                icon: '💊',
                color: '#CD7F32',
                requirement: { type: 'powerups', value: 10 },
                reward: { xp: 100, points: 200 }
            },
            
            // ==================== PRATA 🥈 ====================
            {
                id: 'veteran',
                name: 'Veterano',
                description: 'Derrote 100 inimigos',
                tier: 'silver',
                icon: '⚔️',
                color: '#C0C0C0',
                requirement: { type: 'kills', value: 100 },
                reward: { xp: 500, points: 1000 }
            },
            {
                id: 'combo_master',
                name: 'Mestre dos Combos',
                description: 'Atinja um combo de 25 hits',
                tier: 'silver',
                icon: '⚡',
                color: '#C0C0C0',
                requirement: { type: 'combo', value: 25 },
                reward: { xp: 300, points: 600 }
            },
            {
                id: 'halfway',
                name: 'No Meio do Caminho',
                description: 'Complete 3 fases',
                tier: 'silver',
                icon: '🛣️',
                color: '#C0C0C0',
                requirement: { type: 'level_complete', value: 3 },
                reward: { xp: 400, points: 800 }
            },
            {
                id: 'dash_master',
                name: 'Mestre do Dash',
                description: 'Use dash 100 vezes',
                tier: 'silver',
                icon: '💫',
                color: '#C0C0C0',
                requirement: { type: 'dashes', value: 100 },
                reward: { xp: 250, points: 500 }
            },
            {
                id: 'speedrun',
                name: 'Velocista',
                description: 'Complete uma fase em menos de 2 minutos',
                tier: 'silver',
                icon: '⏱️',
                color: '#C0C0C0',
                requirement: { type: 'speedrun', value: 120 },
                reward: { xp: 600, points: 1200 }
            },
            {
                id: 'boss_hunter',
                name: 'Caçador de Chefes',
                description: 'Derrote seu primeiro boss',
                tier: 'silver',
                icon: '👹',
                color: '#C0C0C0',
                requirement: { type: 'boss_defeated', value: 1 },
                reward: { xp: 500, points: 1000 }
            },
            {
                id: 'level_10',
                name: 'Poder Crescente',
                description: 'Alcance nível 10',
                tier: 'silver',
                icon: '🌟',
                color: '#C0C0C0',
                requirement: { type: 'player_level', value: 10 },
                reward: { xp: 400, points: 800 }
            },
            {
                id: 'untouchable',
                name: 'Intocável',
                description: 'Complete uma fase sem levar dano',
                tier: 'silver',
                icon: '🛡️',
                color: '#C0C0C0',
                requirement: { type: 'no_damage_level', value: 1 },
                reward: { xp: 800, points: 1600 }
            },
            
            // ==================== OURO 🥇 ====================
            {
                id: 'destroyer',
                name: 'Destruidor',
                description: 'Derrote 500 inimigos',
                tier: 'gold',
                icon: '💀',
                color: '#FFD700',
                requirement: { type: 'kills', value: 500 },
                reward: { xp: 1500, points: 3000 }
            },
            {
                id: 'combo_legend',
                name: 'Lenda dos Combos',
                description: 'Atinja um combo de 50 hits',
                tier: 'gold',
                icon: '🌪️',
                color: '#FFD700',
                requirement: { type: 'combo', value: 50 },
                reward: { xp: 1000, points: 2000 }
            },
            {
                id: 'vegas_bound',
                name: 'Rumo a Vegas!',
                description: 'Complete todas as 5 fases',
                tier: 'gold',
                icon: '🎰',
                color: '#FFD700',
                requirement: { type: 'level_complete', value: 5 },
                reward: { xp: 2000, points: 4000 }
            },
            {
                id: 'all_bosses',
                name: 'Domador de Titãs',
                description: 'Derrote todos os bosses',
                tier: 'gold',
                icon: '🏆',
                color: '#FFD700',
                requirement: { type: 'boss_defeated', value: 3 },
                reward: { xp: 2500, points: 5000 }
            },
            {
                id: 'perfect_victory',
                name: 'Vitória Perfeita',
                description: 'Complete o jogo sem morrer',
                tier: 'gold',
                icon: '👑',
                color: '#FFD700',
                requirement: { type: 'no_death_run', value: true },
                reward: { xp: 5000, points: 10000 }
            },
            {
                id: 'level_15',
                name: 'Poder Supremo',
                description: 'Alcance nível 15',
                tier: 'gold',
                icon: '💎',
                color: '#FFD700',
                requirement: { type: 'player_level', value: 15 },
                reward: { xp: 1000, points: 2000 }
            },
            {
                id: 'all_skills',
                name: 'Maestria Completa',
                description: 'Desbloqueie todas as 10 skills',
                tier: 'gold',
                icon: '🎓',
                color: '#FFD700',
                requirement: { type: 'all_skills', value: 10 },
                reward: { xp: 3000, points: 6000 }
            },
            {
                id: 'speedrunner',
                name: 'Corredor Profissional',
                description: 'Complete o jogo em menos de 15 minutos',
                tier: 'gold',
                icon: '🚀',
                color: '#FFD700',
                requirement: { type: 'game_speedrun', value: 900 },
                reward: { xp: 4000, points: 8000 }
            },
            
            // ==================== PLATINA 🏆 ====================
            {
                id: 'the_legend',
                name: 'A LENDA',
                description: 'Desbloqueie TODOS os outros troféus',
                tier: 'platinum',
                icon: '🏆',
                color: '#E5E4E2',
                requirement: { type: 'all_trophies', value: 100 },
                reward: { xp: 10000, points: 50000 }
            },
            {
                id: 'genocide',
                name: 'GENOCÍDIO',
                description: 'Derrote 2000 inimigos',
                tier: 'platinum',
                icon: '☠️',
                color: '#E5E4E2',
                requirement: { type: 'kills', value: 2000 },
                reward: { xp: 5000, points: 10000 }
            },
            {
                id: 'combo_insane',
                name: 'COMBO INSANO',
                description: 'Atinja um combo de 100 hits',
                tier: 'platinum',
                icon: '🌋',
                color: '#E5E4E2',
                requirement: { type: 'combo', value: 100 },
                reward: { xp: 5000, points: 10000 }
            },
            {
                id: 'level_max',
                name: 'PODER MÁXIMO',
                description: 'Alcance nível 20 (máximo)',
                tier: 'platinum',
                icon: '✨',
                color: '#E5E4E2',
                requirement: { type: 'player_level', value: 20 },
                reward: { xp: 0, points: 20000 }
            },
            {
                id: 'millionaire',
                name: 'MILIONÁRIO',
                description: 'Acumule 100.000 pontos',
                tier: 'platinum',
                icon: '💰',
                color: '#E5E4E2',
                requirement: { type: 'score', value: 100000 },
                reward: { xp: 10000, points: 20000 }
            }
        ];
        
        this.maxScroll = Math.max(0, this.trophies.length - 6);
    }
    
    checkTrophies(gameStats = {}) {
        const mergedStats = { ...this.stats, ...gameStats };
        const newTrophies = [];
        
        this.trophies.forEach(trophy => {
            if (this.unlockedTrophies.has(trophy.id)) return;
            
            if (this.checkRequirement(trophy.requirement, mergedStats)) {
                this.unlockTrophy(trophy);
                newTrophies.push(trophy);
            }
        });
        
        return newTrophies;
    }
    
    checkRequirement(requirement, stats) {
        switch(requirement.type) {
            case 'kills':
                return stats.enemiesKilled >= requirement.value;
            case 'combo':
                return stats.maxCombo >= requirement.value;
            case 'level_complete':
                return stats.levelsCompleted >= requirement.value;
            case 'dashes':
                return stats.dashesUsed >= requirement.value;
            case 'player_level':
                return stats.playerLevel >= requirement.value;
            case 'speedrun':
                return stats.fastestLevelTime <= requirement.value;
            case 'powerups':
                return stats.powerUpsCollected >= requirement.value;
            case 'no_damage_level':
                return stats.noDamageLevels >= requirement.value;
            case 'boss_defeated':
                return stats.bossesDefeated >= requirement.value;
            case 'no_death_run':
                return stats.noDeathRun === true;
            case 'all_skills':
                return stats.unlockedSkills >= requirement.value;
            case 'game_speedrun':
                return stats.fastestGameTime <= requirement.value;
            case 'score':
                return stats.score >= requirement.value;
            case 'all_trophies':
                const nonPlatinum = this.trophies.filter(t => t.tier !== 'platinum');
                const unlockedNonPlatinum = nonPlatinum.filter(t => 
                    this.unlockedTrophies.has(t.id)
                );
                return unlockedNonPlatinum.length >= nonPlatinum.length;
            default:
                return false;
        }
    }
    
    unlockTrophy(trophy) {
        if (this.unlockedTrophies.has(trophy.id)) return;
        
        this.unlockedTrophies.add(trophy.id);
        
        this.addNotification(trophy);
        this.createUnlockEffects(trophy);
        this.giveReward(trophy.reward);
        
        if (window.soundSystem) {
            window.soundSystem.playSound('achievement');
        }
        
        this.saveProgress();
        
        console.log(`🏆 Troféu desbloqueado: ${trophy.name} (${trophy.tier.toUpperCase()})`);
    }
    
    createUnlockEffects(trophy) {
        if (!window.particles) return;
        
        // Texto flutuante
        window.particles.push({
            x: 500,
            y: 200,
            vx: 0,
            vy: -1,
            life: 180,
            maxLife: 180,
            color: trophy.color,
            text: `${trophy.icon} ${trophy.name}`,
            size: 36,
            alpha: 1
        });
        
        // Explosão de partículas
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 * i) / 40;
            window.particles.push({
                x: 500,
                y: 250,
                vx: Math.cos(angle) * 8,
                vy: Math.sin(angle) * 8,
                life: 60,
                maxLife: 60,
                color: trophy.color,
                size: 4
            });
        }
    }
    
    giveReward(reward) {
        if (!reward) return;
        
        if (reward.xp && window.players && window.players[0]) {
            const player = window.players[0];
            if (player.evolution) {
                player.evolution.addXP(reward.xp);
            }
        }
        
        if (reward.points && window.score !== undefined) {
            window.score = (window.score || 0) + reward.points;
        }
    }
    
    addNotification(trophy) {
        this.notifications.push({
            trophy: trophy,
            time: 300,
            alpha: 1
        });
    }
    
    updateNotifications() {
        this.notifications = this.notifications.filter(notif => {
            notif.time--;
            if (notif.time < 60) {
                notif.alpha = notif.time / 60;
            }
            return notif.time > 0;
        });
    }
    
    drawNotifications(ctx) {
        this.notifications.forEach((notif, i) => {
            const y = 100 + i * 80;
            const trophy = notif.trophy;
            
            ctx.save();
            ctx.globalAlpha = notif.alpha;
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(700, y, 280, 70);
            
            // Borda com cor do troféu
            ctx.strokeStyle = trophy.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(700, y, 280, 70);
            
            // Ícone
            ctx.font = '32px Arial';
            ctx.fillText(trophy.icon, 715, y + 45);
            
            // Texto
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Righteous';
            ctx.textAlign = 'left';
            ctx.fillText('TROFÉU DESBLOQUEADO!', 755, y + 25);
            
            ctx.font = '14px Righteous';
            ctx.fillStyle = trophy.color;
            ctx.fillText(trophy.name, 755, y + 45);
            
            ctx.font = '10px Righteous';
            ctx.fillStyle = '#aaa';
            ctx.fillText(`+${trophy.reward.xp} XP`, 755, y + 60);
            
            ctx.restore();
        });
    }
    
    getStats() {
        const tiers = ['bronze', 'silver', 'gold', 'platinum'];
        const stats = {
            total: this.trophies.length,
            unlocked: this.unlockedTrophies.size
        };
        
        tiers.forEach(tier => {
            const tierTrophies = this.trophies.filter(t => t.tier === tier);
            const unlockedTier = tierTrophies.filter(t => 
                this.unlockedTrophies.has(t.id)
            );
            
            stats[tier] = {
                total: tierTrophies.length,
                unlocked: unlockedTier.length
            };
        });
        
        stats.percentage = (stats.unlocked / stats.total) * 100;
        
        return stats;
    }
    
    draw(ctx) {
        // Fundo escuro
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, 1000, 650);
        
        // Título
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFD700';
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Permanent Marker';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 TROFÉUS 🏆', 500, 60);
        ctx.restore();
        
        // Stats gerais
        const stats = this.getStats();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Righteous';
        ctx.fillText(`${stats.unlocked} / ${stats.total} desbloqueados (${stats.percentage.toFixed(1)}%)`, 500, 95);
        
        // Stats por tier com CORES
        const tiers = [
            { name: 'Bronze', key: 'bronze', color: '#CD7F32', icon: '🥉' },
            { name: 'Prata', key: 'silver', color: '#C0C0C0', icon: '🥈' },
            { name: 'Ouro', key: 'gold', color: '#FFD700', icon: '🥇' },
            { name: 'Platina', key: 'platinum', color: '#E5E4E2', icon: '🏆' }
        ];
        
        const tierX = 150;
        const tierY = 125;
        const tierSpacing = 210;
        
        tiers.forEach((tier, i) => {
            const x = tierX + (i * tierSpacing);
            const tierStat = stats[tier.key];
            
            // Ícone com cor
            ctx.font = 'bold 28px Arial';
            ctx.fillStyle = tier.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = tier.color;
            ctx.fillText(tier.icon, x, tierY);
            ctx.shadowBlur = 0;
            
            // Contagem
            ctx.font = 'bold 16px Righteous';
            ctx.fillStyle = '#fff';
            ctx.fillText(`${tierStat.unlocked}/${tierStat.total}`, x, tierY + 25);
        });
        
        // Lista de troféus
        const startY = 180;
        const itemHeight = 75;
        const visibleCount = 6;
        
        // Scroll indicators
        if (this.scrollOffset > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('▲', 500, startY - 10);
        }
        
        if (this.scrollOffset < this.maxScroll) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('▼', 500, startY + (visibleCount * itemHeight) + 10);
        }
        
        // Desenhar troféus visíveis
        const visibleTrophies = this.trophies.slice(
            this.scrollOffset,
            this.scrollOffset + visibleCount
        );
        
        visibleTrophies.forEach((trophy, i) => {
            const y = startY + (i * itemHeight);
            const unlocked = this.unlockedTrophies.has(trophy.id);
            
            // Background com cor do tier
            ctx.fillStyle = unlocked 
                ? `${trophy.color}22` // 22 = ~13% opacity em hex
                : 'rgba(50, 50, 50, 0.15)';
            ctx.fillRect(50, y, 900, itemHeight - 5);
            
            // Border com cor do tier
            ctx.strokeStyle = unlocked ? trophy.color : '#555';
            ctx.lineWidth = 2;
            ctx.strokeRect(50, y, 900, itemHeight - 5);
            
            // Ícone
            ctx.font = '36px Arial';
            ctx.fillStyle = unlocked ? trophy.color : '#555';
            ctx.textAlign = 'center';
            ctx.fillText(trophy.icon, 90, y + 45);
            
            // Nome
            ctx.font = 'bold 18px Righteous';
            ctx.fillStyle = unlocked ? '#fff' : '#888';
            ctx.textAlign = 'left';
            ctx.fillText(trophy.name, 130, y + 28);
            
            // Descrição
            ctx.font = '14px Righteous';
            ctx.fillStyle = unlocked ? '#ccc' : '#666';
            ctx.fillText(trophy.description, 130, y + 50);
            
            // Recompensa
            ctx.font = '12px Righteous';
            ctx.fillStyle = unlocked ? '#FFD700' : '#777';
            ctx.fillText(`+${trophy.reward.xp} XP  |  +${trophy.reward.points} pts`, 130, y + 67);
            
            // Badge do tier com COR
            ctx.font = 'bold 12px Righteous';
            ctx.fillStyle = trophy.color;
            ctx.textAlign = 'right';
            ctx.fillText(trophy.tier.toUpperCase(), 930, y + 28);
            
            // Status
            if (unlocked) {
                ctx.fillStyle = '#00ff00';
                ctx.font = 'bold 14px Righteous';
                ctx.fillText('✓ DESBLOQUEADO', 930, y + 50);
            } else {
                ctx.fillStyle = '#ff6666';
                ctx.font = '12px Righteous';
                ctx.fillText('🔒 Bloqueado', 930, y + 50);
            }
        });
        
        // Instruções
        ctx.fillStyle = '#888';
        ctx.font = '16px Righteous';
        ctx.textAlign = 'center';
        ctx.fillText('↑↓ ou WS - Rolar  |  ESC ou ENTER - Voltar', 500, 625);
    }
    
    scrollUp() {
        this.scrollOffset = Math.max(0, this.scrollOffset - 1);
    }
    
    scrollDown() {
        this.scrollOffset = Math.min(this.maxScroll, this.scrollOffset + 1);
    }
    
    saveProgress() {
        const data = {
            unlockedTrophies: Array.from(this.unlockedTrophies),
            stats: this.stats
        };
        
        localStorage.setItem('game_trophies', JSON.stringify(data));
    }
    
    loadProgress() {
        try {
            const data = localStorage.getItem('game_trophies');
            if (data) {
                const parsed = JSON.parse(data);
                this.unlockedTrophies = new Set(parsed.unlockedTrophies || []);
                this.stats = { ...this.stats, ...parsed.stats };
                console.log('✅ Troféus carregados:', this.unlockedTrophies.size);
            }
        } catch (e) {
            console.error('❌ Erro ao carregar troféus:', e);
        }
    }
    
    reset() {
        this.unlockedTrophies.clear();
        this.stats = {
            enemiesKilled: 0,
            maxCombo: 0,
            dashesUsed: 0,
            powerUpsCollected: 0,
            levelsCompleted: 0,
            bossesDefeated: 0,
            playerLevel: 1,
            deaths: 0,
            score: 0,
            fastestLevelTime: Infinity,
            fastestGameTime: Infinity,
            noDamageLevels: 0,
            noDeathRun: false,
            unlockedSkills: 0
        };
        this.saveProgress();
        console.log('🔄 Troféus resetados');
    }
}

// Criar instância global
if (typeof window !== 'undefined') {
    window.trophySystem = new TrophySystem();
    console.log('✅ Sistema de Troféus carregado');
}
