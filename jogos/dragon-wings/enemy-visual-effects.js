// ===== SISTEMA AVANÇADO DE RENDERIZAÇÃO DE INIMIGOS =====
// Sprites geométricos, animações de spawn, trails e partículas

const enemyVisualEffects = {
    trails: [],
    spawnAnimations: [],
    deathAnimations: [],
    particles: [],
    damageIndicators: [],
    
    // Configurações
    config: {
        // Spawn
        spawnDuration: 30,        // Frames para aparecer completamente
        spawnScaleStart: 0.3,     // Escala inicial
        spawnRotation: true,      // Girar durante spawn
        spawnParticles: true,     // Partículas durante spawn
        
        // Trail
        trailEnabled: true,
        trailLength: 10,          // Número de trails
        trailFadeSpeed: 0.12,     // Velocidade de fade
        trailMinSpeed: 1.5,       // Velocidade mínima para criar trail
        
        // Partículas
        ambientParticles: true,   // Partículas ao redor constantemente
        particleSpawnRate: 0.15,  // Taxa de spawn (0-1)
        
        // Damage feedback
        damageFlashDuration: 10,  // Frames de flash ao tomar dano
        damageShakeIntensity: 3,  // Pixels de shake
        
        // Formas por tipo
        shapes: {
            basic: 'diamond',      // Losango
            fast: 'triangle',      // Triângulo
            tank: 'hexagon',       // Hexágono
            shooter: 'star',       // Estrela
            kamikaze: 'cross',     // Cruz
            healer: 'pentagon'     // Pentágono
        }
    },
    
    // Cores especiais por tipo
    colorSchemes: {
        basic: {
            primary: '#8B0000',
            secondary: '#DC143C',
            glow: '#FF6347',
            trail: 'rgba(139, 0, 0, 0.6)'
        },
        fast: {
            primary: '#FF4500',
            secondary: '#FF6347',
            glow: '#FFA07A',
            trail: 'rgba(255, 69, 0, 0.6)'
        },
        tank: {
            primary: '#2F4F4F',
            secondary: '#556B2F',
            glow: '#8FBC8F',
            trail: 'rgba(47, 79, 79, 0.6)'
        },
        shooter: {
            primary: '#8B008B',
            secondary: '#9932CC',
            glow: '#DDA0DD',
            trail: 'rgba(139, 0, 139, 0.6)'
        },
        kamikaze: {
            primary: '#FF1493',
            secondary: '#FF69B4',
            glow: '#FFB6C1',
            trail: 'rgba(255, 20, 147, 0.6)'
        },
        healer: {
            primary: '#00CED1',
            secondary: '#48D1CC',
            glow: '#AFEEEE',
            trail: 'rgba(0, 206, 209, 0.6)'
        }
    },
    
    // Inicializar
    init() {
        this.trails = [];
        this.spawnAnimations = [];
        this.deathAnimations = [];
        this.particles = [];
        this.damageIndicators = [];
    },
    
    // Melhorar inimigo com propriedades visuais
    enhanceEnemy(enemy) {
        if (!enemy.enhanced) {
            enemy.enhanced = true;
            enemy.spawnProgress = 0;
            enemy.spawnRotation = 0;
            enemy.isSpawning = true;
            enemy.damageFlash = 0;
            enemy.shakeX = 0;
            enemy.shakeY = 0;
            enemy.pulsePhase = Math.random() * Math.PI * 2;
            enemy.rotationAngle = 0;
            enemy.lastX = enemy.x;
            enemy.lastY = enemy.y;
            
            // Adicionar animação de spawn
            if (this.config.spawnParticles) {
                this.createSpawnEffect(enemy);
            }
        }
    },
    
    // Criar efeito de spawn
    createSpawnEffect(enemy) {
        const colors = this.getColorScheme(enemy.type);
        
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.particles.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                size: 3,
                life: 20,
                maxLife: 20,
                color: colors.glow,
                type: 'spawn'
            });
        }
    },
    
    // Atualizar todos os efeitos
    update(enemies) {
        enemies.forEach(enemy => {
            this.enhanceEnemy(enemy);
            
            // Atualizar spawn
            if (enemy.isSpawning) {
                enemy.spawnProgress += 1 / this.config.spawnDuration;
                if (this.config.spawnRotation) {
                    enemy.spawnRotation += 0.2;
                }
                
                if (enemy.spawnProgress >= 1) {
                    enemy.isSpawning = false;
                    enemy.spawnProgress = 1;
                }
            }
            
            // Atualizar flash de dano
            if (enemy.damageFlash > 0) {
                enemy.damageFlash--;
                enemy.shakeX = (Math.random() - 0.5) * this.config.damageShakeIntensity;
                enemy.shakeY = (Math.random() - 0.5) * this.config.damageShakeIntensity;
            } else {
                enemy.shakeX = 0;
                enemy.shakeY = 0;
            }
            
            // Atualizar pulso
            enemy.pulsePhase += 0.05;
            
            // Atualizar rotação (alguns tipos giram)
            if (enemy.type === 'fast' || enemy.type === 'shooter') {
                enemy.rotationAngle += 0.03;
            }
            
            // Criar trail se movendo rápido
            if (this.config.trailEnabled) {
                const deltaX = enemy.x - enemy.lastX;
                const deltaY = enemy.y - enemy.lastY;
                const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                if (speed > this.config.trailMinSpeed) {
                    this.createTrail(enemy);
                }
            }
            
            // Criar partículas ambientes
            if (this.config.ambientParticles && Math.random() < this.config.particleSpawnRate) {
                this.createAmbientParticle(enemy);
            }
            
            enemy.lastX = enemy.x;
            enemy.lastY = enemy.y;
        });
        
        // Atualizar partículas
        this.updateParticles();
        
        // Atualizar trails
        this.updateTrails();
        
        // Atualizar indicadores de dano
        this.updateDamageIndicators();
    },
    
    // Criar trail de movimento
    createTrail(enemy) {
        const colors = this.getColorScheme(enemy.type);
        
        this.trails.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            width: enemy.width,
            height: enemy.height,
            rotation: enemy.rotationAngle,
            alpha: 0.8,
            color: colors.trail,
            shape: this.config.shapes[enemy.type] || 'diamond',
            scale: enemy.isSpawning ? this.getSpawnScale(enemy.spawnProgress) : 1
        });
        
        // Limitar tamanho
        if (this.trails.length > 100) {
            this.trails.splice(0, this.trails.length - 100);
        }
    },
    
    // Criar partícula ambiente
    createAmbientParticle(enemy) {
        const colors = this.getColorScheme(enemy.type);
        const angle = Math.random() * Math.PI * 2;
        const distance = enemy.width * 0.5 + Math.random() * 10;
        
        this.particles.push({
            x: enemy.x + enemy.width / 2 + Math.cos(angle) * distance,
            y: enemy.y + enemy.height / 2 + Math.sin(angle) * distance,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            life: 20,
            maxLife: 20,
            color: colors.glow,
            type: 'ambient'
        });
    },
    
    // Atualizar partículas
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },
    
    // Atualizar trails
    updateTrails() {
        for (let i = this.trails.length - 1; i >= 0; i--) {
            const trail = this.trails[i];
            
            trail.alpha -= this.config.trailFadeSpeed;
            
            if (trail.alpha <= 0) {
                this.trails.splice(i, 1);
            }
        }
    },
    
    // Atualizar indicadores de dano
    updateDamageIndicators() {
        for (let i = this.damageIndicators.length - 1; i >= 0; i--) {
            const indicator = this.damageIndicators[i];
            
            indicator.y -= 1;
            indicator.life--;
            indicator.alpha = indicator.life / indicator.maxLife;
            
            if (indicator.life <= 0) {
                this.damageIndicators.splice(i, 1);
            }
        }
    },
    
    // Obter esquema de cores
    getColorScheme(type) {
        return this.colorSchemes[type] || this.colorSchemes.basic;
    },
    
    // Calcular escala de spawn
    getSpawnScale(progress) {
        const start = this.config.spawnScaleStart;
        return start + (1 - start) * this.easeOutElastic(progress);
    },
    
    // Easing function para spawn suave
    easeOutElastic(t) {
        const p = 0.3;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    },
    
    // Desenhar forma geométrica
    drawShape(ctx, shape, x, y, width, height, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        const radius = Math.min(width, height) / 2;
        
        switch(shape) {
            case 'diamond':
                // Losango
                ctx.beginPath();
                ctx.moveTo(0, -radius);
                ctx.lineTo(radius, 0);
                ctx.lineTo(0, radius);
                ctx.lineTo(-radius, 0);
                ctx.closePath();
                break;
                
            case 'triangle':
                // Triângulo apontando para baixo
                ctx.beginPath();
                ctx.moveTo(0, radius);
                ctx.lineTo(-radius * 0.866, -radius * 0.5);
                ctx.lineTo(radius * 0.866, -radius * 0.5);
                ctx.closePath();
                break;
                
            case 'hexagon':
                // Hexágono
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const px = Math.cos(angle) * radius;
                    const py = Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                break;
                
            case 'star':
                // Estrela de 5 pontas
                ctx.beginPath();
                for (let i = 0; i < 10; i++) {
                    const r = i % 2 === 0 ? radius : radius * 0.5;
                    const angle = (Math.PI / 5) * i - Math.PI / 2;
                    const px = Math.cos(angle) * r;
                    const py = Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                break;
                
            case 'cross':
                // Cruz
                const thickness = radius * 0.4;
                ctx.beginPath();
                ctx.rect(-thickness, -radius, thickness * 2, radius * 2);
                ctx.rect(-radius, -thickness, radius * 2, thickness * 2);
                break;
                
            case 'pentagon':
                // Pentágono
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                    const px = Math.cos(angle) * radius;
                    const py = Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                break;
                
            default:
                // Círculo como fallback
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
        }
        
        ctx.restore();
    },
    
    // Desenhar inimigo completo
    drawEnemy(ctx, enemy) {
        this.enhanceEnemy(enemy);
        
        const colors = this.getColorScheme(enemy.type);
        const shape = this.config.shapes[enemy.type] || 'diamond';
        const centerX = enemy.x + enemy.width / 2 + enemy.shakeX;
        const centerY = enemy.y + enemy.height / 2 + enemy.shakeY;
        
        // Calcular escala e alpha baseado no spawn
        let scale = 1;
        let alpha = 1;
        
        if (enemy.isSpawning) {
            scale = this.getSpawnScale(enemy.spawnProgress);
            alpha = enemy.spawnProgress;
        }
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Pulso de brilho
        const pulse = Math.sin(enemy.pulsePhase) * 0.3 + 0.7;
        const glowIntensity = 15 * pulse;
        
        // Aura externa (maior quando spawning)
        if (enemy.isSpawning || enemy.damageFlash > 0) {
            const auraRadius = (enemy.width / 2) * scale * 1.5;
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, auraRadius
            );
            
            const auraColor = enemy.damageFlash > 0 ? '#FFFFFF' : colors.glow;
            gradient.addColorStop(0, auraColor + '40');
            gradient.addColorStop(0.5, auraColor + '20');
            gradient.addColorStop(1, auraColor + '00');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                centerX - auraRadius,
                centerY - auraRadius,
                auraRadius * 2,
                auraRadius * 2
            );
        }
        
        // Sombra e brilho
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = colors.glow;
        
        // Corpo principal com gradiente
        const gradient = ctx.createRadialGradient(
            centerX - enemy.width * 0.2 * scale,
            centerY - enemy.height * 0.2 * scale,
            0,
            centerX,
            centerY,
            (enemy.width / 2) * scale
        );
        
        if (enemy.damageFlash > 0) {
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.5, colors.primary);
            gradient.addColorStop(1, colors.secondary);
        } else {
            gradient.addColorStop(0, colors.secondary);
            gradient.addColorStop(0.5, colors.primary);
            gradient.addColorStop(1, colors.primary + 'CC');
        }
        
        ctx.fillStyle = gradient;
        
        // Desenhar forma
        const rotation = enemy.isSpawning ? enemy.spawnRotation : enemy.rotationAngle;
        this.drawShape(ctx, shape, centerX, centerY, 
                      enemy.width * scale, enemy.height * scale, rotation);
        ctx.fill();
        
        // Borda brilhante
        ctx.shadowBlur = 0;
        ctx.strokeStyle = colors.glow;
        ctx.lineWidth = 2;
        this.drawShape(ctx, shape, centerX, centerY,
                      enemy.width * scale * 0.85, enemy.height * scale * 0.85, rotation);
        ctx.stroke();
        
        // Detalhes internos (núcleo)
        if (!enemy.isSpawning) {
            const coreSize = Math.min(enemy.width, enemy.height) * 0.3 * scale;
            ctx.fillStyle = colors.glow;
            ctx.shadowBlur = 10;
            ctx.shadowColor = colors.glow;
            ctx.beginPath();
            ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Barra de vida (apenas se não estiver spawning e tiver dano)
        if (!enemy.isSpawning && enemy.health < enemy.maxHealth) {
            this.drawHealthBar(ctx, enemy);
        }
    },
    
    // Desenhar barra de vida
    drawHealthBar(ctx, enemy) {
        const barWidth = enemy.width;
        const barHeight = 4;
        const barX = enemy.x;
        const barY = enemy.y - 10;
        const healthPercent = enemy.health / enemy.maxHealth;
        
        // Fundo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Barra de vida
        const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        if (healthPercent > 0.6) {
            gradient.addColorStop(0, '#00FF00');
            gradient.addColorStop(1, '#7FFF00');
        } else if (healthPercent > 0.3) {
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, '#FFA500');
        } else {
            gradient.addColorStop(0, '#FF0000');
            gradient.addColorStop(1, '#FF6347');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Borda
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    },
    
    // Desenhar trails
    drawTrails(ctx) {
        this.trails.forEach(trail => {
            ctx.save();
            ctx.globalAlpha = trail.alpha * 0.5;
            ctx.fillStyle = trail.color;
            
            this.drawShape(ctx, trail.shape, trail.x, trail.y,
                          trail.width * trail.scale, trail.height * trail.scale,
                          trail.rotation);
            ctx.fill();
            
            ctx.restore();
        });
    },
    
    // Desenhar partículas
    drawParticles(ctx) {
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, p.color + '00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    },
    
    // Desenhar indicadores de dano
    drawDamageIndicators(ctx) {
        this.damageIndicators.forEach(indicator => {
            ctx.save();
            ctx.globalAlpha = indicator.alpha;
            ctx.fillStyle = indicator.color;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(indicator.text, indicator.x, indicator.y);
            ctx.fillText(indicator.text, indicator.x, indicator.y);
            ctx.restore();
        });
    },
    
    // Desenhar tudo
    draw(ctx, enemies) {
        // Trails atrás
        this.drawTrails(ctx);
        
        // Inimigos
        enemies.forEach(enemy => {
            this.drawEnemy(ctx, enemy);
        });
        
        // Partículas na frente
        this.drawParticles(ctx);
        
        // Indicadores de dano no topo
        this.drawDamageIndicators(ctx);
    },
    
    // Evento: Inimigo tomou dano
    onDamage(enemy, damage) {
        enemy.damageFlash = this.config.damageFlashDuration;
        
        // Criar indicador de dano
        this.damageIndicators.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y,
            text: '-' + Math.floor(damage),
            color: '#FF0000',
            life: 30,
            maxLife: 30,
            alpha: 1
        });
        
        // Partículas de impacto
        const colors = this.getColorScheme(enemy.type);
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            
            this.particles.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 2,
                life: 15,
                maxLife: 15,
                color: colors.glow,
                type: 'damage'
            });
        }
    },
    
    // Evento: Inimigo morreu
    onDeath(enemy) {
        const colors = this.getColorScheme(enemy.type);
        
        // Explosão de partículas
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const speed = 2 + Math.random() * 3;
            
            this.particles.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                life: 30,
                maxLife: 30,
                color: colors.glow,
                type: 'death'
            });
        }
    }
};
