// ============================================================
// 特效管理器
// ============================================================
class EffectManager {
    constructor() { this.gameBoard = null; }
    init(gameBoard) { this.gameBoard = gameBoard; }
    createLineClearEffect(lines, x, y, color = '#ff9966') {
        if (!this.gameBoard) return;
        const el = document.createElement('div');
        el.className = 'line-clear-notification';
        el.textContent = typeof lines === 'string' ? lines : `${lines} LINES!`;
        el.style.left = `${x}px`; el.style.top = `${y}px`; el.style.color = color;
        this.gameBoard.appendChild(el);
        el.animate([
            { transform:'translate(-50%,-50%) scale(0.5)', opacity:0 },
            { transform:'translate(-50%,-50%) scale(1.2)', opacity:1 },
            { transform:'translate(-50%,-50%) scale(1)', opacity:1 },
            { transform:'translate(-50%,-50%) scale(1.5)', opacity:0 }
        ], { duration:1000, easing:'ease-out' });
        setTimeout(() => el.remove(), 1000);
    }
    createScoreAddEffect(score, x, y, color = '#4dccbd') {
        if (!this.gameBoard) return;
        const el = document.createElement('div');
        el.className = 'score-add-effect';
        el.textContent = `+${score}`;
        el.style.left = `${x}px`; el.style.top = `${y}px`; el.style.color = color;
        this.gameBoard.appendChild(el);
        el.animate([
            { transform:'translateY(0)', opacity:1 },
            { transform:'translateY(-30px)', opacity:0 }
        ], { duration:800, easing:'ease-out' });
        setTimeout(() => el.remove(), 800);
    }
    createClearParticles(x, y, color = '#ff9966') {
        if (!this.gameBoard) return;
        const container = document.createElement('div');
        container.className = 'clear-effect';
        container.style.left = `${x * 30}px`;
        container.style.top = `${y * 30}px`;
        this.gameBoard.appendChild(container);
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.className = 'clear-particle';
            p.style.backgroundColor = color;
            p.style.left = '15px'; p.style.top = '15px';
            container.appendChild(p);
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 50 + 30;
            p.animate([
                { transform:'translate(0,0) scale(1)', opacity:0.9 },
                { transform:`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px) scale(0)`, opacity:0 }
            ], { duration:600 + Math.random()*400, easing:'ease-out' });
        }
        setTimeout(() => container.remove(), 1000);
    }
}

const effectManager = new EffectManager();