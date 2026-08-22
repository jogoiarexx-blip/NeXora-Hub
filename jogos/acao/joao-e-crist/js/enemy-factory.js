/**
 * ENEMY FACTORY - Sistema centralizado de criação de inimigos
 * Resolve o problema de instanciação e garante que todos os tipos funcionem
 */

class EnemyFactory {
    static create(x, y, type) {
        switch(type) {
            case 'basic':
                // Capanga básico
                return typeof BasicEnemy !== 'undefined'
                    ? new BasicEnemy(x, y)
                    : new Enemy(x, y, 'basic');
            
            case 'ciclista':
                // Ciclista - inimigo rápido em bicicleta
                return typeof CiclistaEnemy !== 'undefined'
                    ? new CiclistaEnemy(x, y)
                    : typeof BasicEnemy !== 'undefined'
                    ? new BasicEnemy(x, y)
                    : new Enemy(x, y, 'basic');
            
            case 'fast':
                return typeof FastEnemy !== 'undefined'
                    ? new FastEnemy(x, y)
                    : new Enemy(x, y, 'fast');
            
            case 'strong':
                return typeof StrongEnemy !== 'undefined'
                    ? new StrongEnemy(x, y)
                    : new Enemy(x, y, 'strong');
            
            case 'tank':
                return typeof TankEnemy !== 'undefined'
                    ? new TankEnemy(x, y)
                    : new Enemy(x, y, 'tank');
            
            case 'berserker':
                return typeof BerserkerEnemy !== 'undefined'
                    ? new BerserkerEnemy(x, y)
                    : new Enemy(x, y, 'berserker');
            
            case 'sniper':
                return typeof SniperEnemy !== 'undefined'
                    ? new SniperEnemy(x, y)
                    : new Enemy(x, y, 'sniper');
            
            case 'healer':
                return typeof HealerEnemy !== 'undefined'
                    ? new HealerEnemy(x, y)
                    : new Enemy(x, y, 'healer');
            
            case 'exploder':
                return typeof ExploderEnemy !== 'undefined'
                    ? new ExploderEnemy(x, y)
                    : new Enemy(x, y, 'exploder');
            
            case 'cowboy':
                return typeof CowboyEnemy !== 'undefined'
                    ? new CowboyEnemy(x, y)
                    : new Enemy(x, y, 'cowboy');
            
            case 'cockroach':
                return typeof CockroachEnemy !== 'undefined'
                    ? new CockroachEnemy(x, y)
                    : new Enemy(x, y, 'cockroach');
            
            case 'turista':
                return typeof window.TuristaEnemy !== 'undefined' ? new window.TuristaEnemy(x, y) : new Enemy(x, y, 'basic');

            case 'seguranca':
                return typeof window.SegurancaEnemy !== 'undefined' ? new window.SegurancaEnemy(x, y) : new Enemy(x, y, 'strong');

            case 'elvis_fan':
                return typeof window.ElvisFanEnemy !== 'undefined' ? new window.ElvisFanEnemy(x, y) : new Enemy(x, y, 'fast');

            case 'mulher_feia':
                return typeof window.MulherFeiaEnemy !== 'undefined' ? new window.MulherFeiaEnemy(x, y) : new Enemy(x, y, 'strong');

            case 'travesti':
                return typeof window.TravestiEnemy !== 'undefined' ? new window.TravestiEnemy(x, y) : new Enemy(x, y, 'fast');
            
            case 'elite':
                return typeof EliteEnemy !== 'undefined'
                    ? new EliteEnemy(x, y)
                    : new Enemy(x, y, 'basic');
            
            case 'ghost':
                return typeof GhostEnemy !== 'undefined'
                    ? new GhostEnemy(x, y)
                    : new Enemy(x, y, 'fast');
            
            case 'assassin':
                return typeof AssassinEnemy !== 'undefined'
                    ? new AssassinEnemy(x, y)
                    : new Enemy(x, y, 'fast');
            
            case 'boss':
                return typeof BossEnemy !== 'undefined'
                    ? new BossEnemy(x, y, 1)
                    : new Enemy(x, y, 'boss');
            
            case 'final_boss':
                return typeof FinalBoss !== 'undefined'
                    ? new FinalBoss(x, y)
                    : typeof BossEnemy !== 'undefined'
                    ? new BossEnemy(x, y, 5)
                    : new Enemy(x, y, 'boss');
            
            default:
                console.warn(`Tipo de inimigo desconhecido: ${type}, criando inimigo básico`);
                return new Enemy(x, y, type);
        }
    }

    // Método auxiliar para debug
    static logAvailableEnemies() {
        console.log('=== ENEMY FACTORY DEBUG ===');
        console.log('Classes disponíveis:');
        console.log('  Enemy:', typeof Enemy !== 'undefined' ? '✓' : '✗');
        console.log('  CiclistaEnemy:', typeof CiclistaEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  BasicEnemy:', typeof BasicEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  FastEnemy:', typeof FastEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  StrongEnemy:', typeof StrongEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  TankEnemy:', typeof TankEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  BerserkerEnemy:', typeof BerserkerEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  SniperEnemy:', typeof SniperEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  HealerEnemy:', typeof HealerEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  ExploderEnemy:', typeof ExploderEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  CowboyEnemy:', typeof CowboyEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  CockroachEnemy:', typeof CockroachEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  TuristaEnemy:', typeof window.TuristaEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  SegurancaEnemy:', typeof window.SegurancaEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  ElvisFanEnemy:', typeof window.ElvisFanEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  MulherFeiaEnemy:', typeof window.MulherFeiaEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  TravestiEnemy:', typeof window.TravestiEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  BossEnemy:', typeof BossEnemy !== 'undefined' ? '✓' : '✗');
        console.log('  FinalBoss:', typeof FinalBoss !== 'undefined' ? '✓' : '✗');
        console.log('========================');
    }
}

// Auto-log ao carregar
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => EnemyFactory.logAvailableEnemies(), 500);
    });
}
