// ===== SISTEMA DE MENU AVANÇADO COM POLÍGONOS - DRAGON FURY =====
// 🔧 VERSÃO CORRIGIDA - Inicialização mais robusta

const menuSystem = {
    canvas: null,
    ctx: null,
    animationId: null,
    particles: [],
    polygons: [],
    time: 0,
    mouseX: 0,
    mouseY: 0,
    isInitialized: false,
    
    init() {
        // 🔧 BUGFIX: Evitar inicialização duplicada
        if (this.isInitialized) {
            console.warn('⚠️ Menu já foi inicializado');
            return;
        }
        
        try {
            const menuDiv = document.getElementById('main-menu');
            
            if (!menuDiv) {
                throw new Error('Elemento #main-menu não encontrado');
            }
            
            console.log('🎨 Inicializando Menu System...');
            
            // Criar canvas para o menu
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'menuCanvas';
            this.canvas.width = 600;
            this.canvas.height = 800;
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.zIndex = '1';
            this.canvas.style.pointerEvents = 'none'; // 🔧 NOVO: Permitir cliques nos botões
            
            menuDiv.insertBefore(this.canvas, menuDiv.firstChild);
            
            this.ctx = this.canvas.getContext('2d');
            
            // Event listeners
            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                this.mouseY = e.clientY - rect.top;
            });
            
            // 🔧 NOVO: Detectar performance do dispositivo
            const isMobile = /Android|webOS|iPhone|iPad/i.test(navigator.userAgent);
            const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
            
            // Ajustar quantidade de elementos baseado na performance
            this.particleCount = (isMobile || isLowEnd) ? 50 : 100;
            this.polygonCount = (isMobile || isLowEnd) ? 8 : 15;
            
            console.log(`  📊 Modo: ${isMobile ? 'Mobile' : 'Desktop'} | Performance: ${isLowEnd ? 'Baixa' : 'Normal'}`);
            console.log(`  ✨ Partículas: ${this.particleCount} | Polígonos: ${this.polygonCount}`);
            
            // Inicializar elementos
            this.createPolygons();
            this.createParticles();
            
            // Marcar como inicializado
            this.isInitialized = true;
            
            // Iniciar animação
            this.animate();
            
            console.log('✅ Menu System inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Menu System:', error);
            this.isInitialized = false;
            // 🔧 NOVO: Continuar mesmo com erro (não quebrar o jogo)
            // O menu ficará sem animação mas funcionará
        }
    },
    
    createPolygons() {
        const types = ['triangle', 'square', 'pentagon', 'hexagon', 'octagon'];
        
        for (let i = 0; i < this.polygonCount; i++) {
            this.polygons.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 40 + 20,
                sides: Math.floor(Math.random() * 5) + 3,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                color: this.getRandomColor(),
                alpha: Math.random() * 0.3 + 0.1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                pulseSpeed: Math.random() * 0.02 + 0.01,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    },
    
    createParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedY: Math.random() * 0.5 + 0.2,
                alpha: Math.random() * 0.5 + 0.3,
                color: Math.random() < 0.5 ? '#FFD700' : '#FF6B35'
            });
        }
    },
    
    getRandomColor() {
        const colors = [
            'rgba(255, 107, 53, 0.3)',   // Laranja
            'rgba(255, 215, 0, 0.3)',     // Dourado
            'rgba(255, 0, 255, 0.3)',     // Magenta
            'rgba(0, 255, 255, 0.3)',     // Ciano
            'rgba(138, 43, 226, 0.3)'     // Roxo
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    drawPolygon(poly) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(poly.x, poly.y);
        ctx.rotate(poly.rotation);
        
        // Calcular tamanho com pulso
        const pulse = Math.sin(this.time * poly.pulseSpeed + poly.pulsePhase) * 0.2 + 1;
        const size = poly.size * pulse;
        
        // Desenhar polígono
        ctx.beginPath();
        for (let i = 0; i < poly.sides; i++) {
            const angle = (Math.PI * 2 / poly.sides) * i;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        // Preenchimento com gradiente
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, poly.color.replace('0.3', String(poly.alpha * 0.8)));
        gradient.addColorStop(1, poly.color.replace('0.3', '0'));
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Borda brilhante
        ctx.strokeStyle = poly.color.replace('0.3', String(poly.alpha));
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = poly.color;
        ctx.stroke();
        
        ctx.restore();
    },
    
    updatePolygons() {
        this.polygons.forEach(poly => {
            // Movimento
            poly.x += poly.speedX;
            poly.y += poly.speedY;
            poly.rotation += poly.rotationSpeed;
            
            // Interação com mouse
            const dx = this.mouseX - poly.x;
            const dy = this.mouseY - poly.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                const force = (150 - distance) / 150;
                poly.x -= (dx / distance) * force * 2;
                poly.y -= (dy / distance) * force * 2;
            }
            
            // Wrap around
            if (poly.x < -50) poly.x = this.canvas.width + 50;
            if (poly.x > this.canvas.width + 50) poly.x = -50;
            if (poly.y < -50) poly.y = this.canvas.height + 50;
            if (poly.y > this.canvas.height + 50) poly.y = -50;
        });
    },
    
    updateParticles() {
        this.particles.forEach(particle => {
            particle.y -= particle.speedY;
            
            // Movimento ondulante
            particle.x += Math.sin(this.time * 0.01 + particle.y * 0.01) * 0.5;
            
            // Reset quando sai da tela
            if (particle.y < -10) {
                particle.y = this.canvas.height + 10;
                particle.x = Math.random() * this.canvas.width;
            }
        });
    },
    
    drawParticles() {
        const ctx = this.ctx;
        
        this.particles.forEach(particle => {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.alpha * (Math.sin(this.time * 0.05 + particle.y * 0.01) * 0.3 + 0.7);
            ctx.shadowBlur = 5;
            ctx.shadowColor = particle.color;
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    },
    
    drawConnectionLines() {
        const ctx = this.ctx;
        const maxDistance = 150;
        
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < this.polygons.length; i++) {
            for (let j = i + 1; j < this.polygons.length; j++) {
                const poly1 = this.polygons[i];
                const poly2 = this.polygons[j];
                
                const dx = poly1.x - poly2.x;
                const dy = poly1.y - poly2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    ctx.globalAlpha = (1 - distance / maxDistance) * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(poly1.x, poly1.y);
                    ctx.lineTo(poly2.x, poly2.y);
                    ctx.stroke();
                }
            }
        }
        
        ctx.globalAlpha = 1;
    },
    
    drawGrid() {
        const ctx = this.ctx;
        const gridSize = 50;
        
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.05)';
        ctx.lineWidth = 1;
        
        // Linhas verticais
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x + (this.time * 0.5) % gridSize, 0);
            ctx.lineTo(x + (this.time * 0.5) % gridSize, this.canvas.height);
            ctx.stroke();
        }
        
        // Linhas horizontais
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y + (this.time * 0.5) % gridSize);
            ctx.lineTo(this.canvas.width, y + (this.time * 0.5) % gridSize);
            ctx.stroke();
        }
    },
    
    drawCenterpiece() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = 200;
        
        // Círculos concêntricos animados
        for (let i = 0; i < 3; i++) {
            const radius = 80 + i * 30 + Math.sin(this.time * 0.02 + i) * 10;
            const alpha = 0.2 - i * 0.05;
            
            ctx.strokeStyle = `rgba(255, 107, 53, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#FF6B35';
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Polígono central rotativo
        const sides = 6;
        const size = 50 + Math.sin(this.time * 0.03) * 10;
        const rotation = this.time * 0.01;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        
        // Polígono externo
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 / sides) * i;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
        gradient.addColorStop(0.5, 'rgba(255, 107, 53, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 107, 53, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFD700';
        ctx.stroke();
        
        // Polígono interno menor
        ctx.rotate(-rotation * 2);
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 / sides) * i;
            const x = Math.cos(angle) * (size * 0.5);
            const y = Math.sin(angle) * (size * 0.5);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        ctx.fillStyle = 'rgba(255, 107, 53, 0.6)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 1)';
        ctx.stroke();
        
        ctx.restore();
        ctx.shadowBlur = 0;
    },
    
    animate() {
        // 🔧 BUGFIX: Verificar se ainda está inicializado
        if (!this.isInitialized) {
            console.warn('⚠️ Menu não está mais inicializado, parando animação');
            return;
        }
        
        this.time++;
        
        // Limpar canvas
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fundo gradiente animado
        const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        const hue1 = (this.time * 0.1) % 360;
        const hue2 = (this.time * 0.1 + 180) % 360;
        gradient.addColorStop(0, `hsla(${hue1}, 70%, 10%, 0.3)`);
        gradient.addColorStop(0.5, 'rgba(15, 15, 35, 0.5)');
        gradient.addColorStop(1, `hsla(${hue2}, 70%, 10%, 0.3)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar elementos em ordem
        this.drawGrid();
        this.drawParticles();
        this.drawConnectionLines();
        
        // Atualizar e desenhar polígonos
        this.updatePolygons();
        this.polygons.forEach(poly => this.drawPolygon(poly));
        
        // Atualizar partículas
        this.updateParticles();
        
        // Desenhar centerpiece
        this.drawCenterpiece();
        
        // Continuar animação
        this.animationId = requestAnimationFrame(() => this.animate());
    },
    
    stop() {
        console.log('⏸️ Parando animação do menu...');
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },
    
    resume() {
        console.log('▶️ Retomando animação do menu...');
        if (this.isInitialized && !this.animationId) {
            this.animate();
        }
    },
    
    destroy() {
        console.log('🗑️ Destruindo Menu System...');
        this.stop();
        this.isInitialized = false;
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.remove();
        }
        
        this.particles = [];
        this.polygons = [];
    }
};

// 🔧 VERSÃO MELHORADA: Auto-inicialização com retry e logging
(function() {
    const MAX_RETRY_ATTEMPTS = 10;
    const RETRY_DELAY_MS = 100;
    let attempts = 0;
    
    function tryInit() {
        const menuElement = document.getElementById('main-menu');
        
        if (menuElement) {
            // ✅ Elemento encontrado
            console.log('✅ Menu encontrado, inicializando Menu System...');
            menuSystem.init();
        } else if (attempts < MAX_RETRY_ATTEMPTS) {
            // ⏳ Retry
            attempts++;
            console.log(`⏳ Menu não encontrado, tentativa ${attempts}/${MAX_RETRY_ATTEMPTS}`);
            setTimeout(tryInit, RETRY_DELAY_MS * attempts); // Delay progressivo: 100ms, 200ms, 300ms...
        } else {
            // ❌ Falhou após todas as tentativas
            console.error('❌ Menu System não pôde ser inicializado após', MAX_RETRY_ATTEMPTS, 'tentativas');
            console.error('   Verifique se o elemento #main-menu existe no HTML');
            console.error('   O jogo funcionará mas o menu ficará sem animação de fundo');
        }
    }
    
    // Usar estratégia adequada baseado no estado do documento
    if (document.readyState === 'loading') {
        // Documento ainda carregando
        console.log('📄 Documento carregando, aguardando DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', tryInit);
    } else if (document.readyState === 'interactive') {
        // DOM pronto mas recursos ainda carregando
        console.log('📄 DOM pronto, inicializando...');
        tryInit();
    } else {
        // Documento completamente carregado
        console.log('📄 Documento completo, inicializando...');
        tryInit();
    }
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.menuSystem = menuSystem;
}

console.log('🎨 Menu System script carregado!');
