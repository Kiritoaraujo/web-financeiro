// ── CONQUISTAS E CONFETE ──────────────────────────────────────────────────────

const LISTA_CONQUISTAS = [
    { id: 'primeiro_lancamento', emoji: '📝', nome: 'Primeiro Lançamento', desc: 'Registrou sua primeira transação' },
    { id: 'primeira_meta',       emoji: '🎯', nome: 'Meta Criada',         desc: 'Criou sua primeira meta' },
    { id: 'meta_concluida',      emoji: '🏆', nome: 'Meta Concluída',      desc: 'Concluiu uma meta pela primeira vez' },
    { id: 'primeiro_invest',     emoji: '📈', nome: 'Investidor',          desc: 'Registrou seu primeiro investimento' },
    { id: 'easter_egg_1',        emoji: '🥚', nome: 'Caçador de Ovos I',   desc: 'Encontrou o primeiro Easter Egg' },
    { id: 'easter_egg_todos',    emoji: '🌟', nome: 'Mestre dos Ovos',     desc: 'Encontrou todos os Easter Eggs' },
    { id: 'backup_feito',        emoji: '💾', nome: 'Precavido',           desc: 'Fez o primeiro backup dos dados' },
    { id: 'recorrente_criada',   emoji: '🔁', nome: 'Automático',          desc: 'Criou uma transação recorrente' },
    { id: 'saldo_positivo',      emoji: '💰', nome: 'No Azul',             desc: 'Manteve saldo positivo' },
    { id: 'dez_lancamentos',     emoji: '🔟', nome: 'Organizado',          desc: 'Fez 10 lançamentos' },
    { id: 'mestre_clt',          emoji: '🧮', nome: 'Mestre do CLT',       desc: 'Usou a calculadora CLT mais de 3 vezes' },
    { id: 'platina',             emoji: '💎', nome: 'Platina',             desc: 'Desbloqueou todas as conquistas' },
];

// ── SISTEMA DE XP E NÍVEL ───────────────────────────────────────────────────

function calcularNivel(xp) {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function calcularXpProxNivel(xp) {
    const nivelAtual = calcularNivel(xp);
    const xpProxNivel = Math.pow(nivelAtual, 2) * 100;
    return { nivelAtual, xpProxNivel, xpAtual: xp, progresso: Math.floor((xp / xpProxNivel) * 100) };
}

function adicionarXP(valor) {
    if (!usuarioLogado) return;
    const usr = db.usuarios[usuarioLogado];
    if (!usr.xp) usr.xp = 0;
    
    const nivelAntes = calcularNivel(usr.xp);
    usr.xp += valor;
    const nivelDepois = calcularNivel(usr.xp);
    
    if (nivelDepois > nivelAntes) {
        showToast(`🎉 Nível ${nivelDepois} desbloqueado! +${valor} XP`, 'success');
        // Desbloquear novos Avatares/Temas no Nível 10
        if (nivelDepois === 10) {
            mostrarConquista({ emoji: '⭐', nome: 'Maestro Financeiro', desc: 'Atingiu Nível 10!' });
        }
    }
}

// ── VERIFICAR CONQUISTAS ──────────────────────────────────────────────────

function verificarConquistas() {
    const usr = db.usuarios[usuarioLogado];
    if (!usr.conquistas) usr.conquistas = [];

    let conquistouAlgo = false;
    const tem = (id) => usr.conquistas.some(c => c.id === id);
    const ganhar = (id) => {
        if (tem(id)) return;
        const conquista = LISTA_CONQUISTAS.find(c => c.id === id);
        if (!conquista) return;
        usr.conquistas.push(conquista);
        adicionarXP(50); // +50 XP ao desbloquear conquista
        mostrarConquista(conquista);
        conquistouAlgo = true;
    };

    if (usr.extrato.length >= 1)  ganhar('primeiro_lancamento');
    if (usr.extrato.length >= 10) ganhar('dez_lancamentos');
    if (usr.metas.length >= 1)    ganhar('primeira_meta');
    if (usr.investimentos.length >= 1) ganhar('primeiro_invest');
    if ((usr.recorrentes || []).length >= 1) ganhar('recorrente_criada');
    if (usr.saldo > 0)            ganhar('saldo_positivo');

    const metaConcluida = usr.metas.some(m => (m.valorArrecadado || 0) >= (m.valorAlvo || m.valor || 1));
    if (metaConcluida) ganhar('meta_concluida');

    if ((usr.easterEggsEncontrados || 0) >= 1) ganhar('easter_egg_1');
    if ((usr.easterEggsEncontrados || 0) >= 3) ganhar('easter_egg_todos');
    if ((usr.cltUsado || 0) > 3) ganhar('mestre_clt');
    
    // Platina: todas as 11 conquistas (exceto platina)
    const todasAsConquistas = LISTA_CONQUISTAS.filter(c => c.id !== 'platina');
    const temTodas = todasAsConquistas.every(c => tem(c.id));
    if (temTodas) ganhar('platina');

    // Bug 4 fix: only save once after all checks, not once per ganhar()
    if (conquistouAlgo) salvarDB();
}

function mostrarConquista(conquista) {
    const box = document.getElementById('toast-box');
    const el = document.createElement('div');
    el.style.cssText = `background:linear-gradient(135deg,#f6d365,#fda085);color:#333;padding:15px 20px;border-radius:12px;margin-bottom:10px;animation:fadeIn 0.3s;box-shadow:0 4px 15px rgba(0,0,0,0.2);max-width:280px;`;
    el.innerHTML = `<b style="font-size:16px;">${conquista.emoji} Conquista desbloqueada!</b><br><span style="font-size:13px;">${conquista.nome} — ${conquista.desc}</span>`;
    box.appendChild(el);
    setTimeout(() => el.remove(), 5000);
}

// ── CONFETE ───────────────────────────────────────────────────────────────────

function dispararConfete() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;width:100%;height:100%;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const particulas = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        cor: ['#ff4757','#ffa502','#2ed573','#1e90ff','#eccc68','#a29bfe','#fd79a8'][Math.floor(Math.random()*7)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 2,
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 6,
    }));

    let frame = 0;
    function animar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particulas.forEach(p => {
            p.x   += p.vx;
            p.y   += p.vy;
            p.rot += p.vRot;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.fillStyle = p.cor;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        frame++;
        if (frame < 180) requestAnimationFrame(animar);
        else canvas.remove();
    }
    animar();
}

// ── COMPARATIVO MÊS A MÊS ────────────────────────────────────────────────────

function gerarComparativo() {
    const usr = db.usuarios[usuarioLogado];
    const hoje = new Date();

    const mesAtual  = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
    const anterior  = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const mesAnterior = anterior.getFullYear() + '-' + String(anterior.getMonth() + 1).padStart(2, '0');

    const gastosPorCategoria = (mes) => {
        const result = {};
        usr.extrato
            .filter(t => t.tipo === 'despesa' && t.data.startsWith(mes))
            .forEach(t => {
                const cat = t.categoria || 'outros';
                result[cat] = (result[cat] || 0) + Math.abs(t.valor);
            });
        return result;
    };

    const atual    = gastosPorCategoria(mesAtual);
    const anterior2 = gastosPorCategoria(mesAnterior);

    const todasCats = new Set([...Object.keys(atual), ...Object.keys(anterior2)]);
    let html = '';
    let temDiferenca = false;

    todasCats.forEach(cat => {
        const a  = atual[cat]    || 0;
        const b  = anterior2[cat] || 0;
        const diff = a - b;
        if (Math.abs(diff) < 0.01) return;
        temDiferenca = true;
        const cor   = diff > 0 ? 'var(--danger)' : 'var(--success)';
        const sinal = diff > 0 ? '+' : '';
        const icone = diff > 0 ? '↑' : '↓';
        html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
            <span style="text-transform:capitalize;">${cat}</span>
            <span style="color:${cor};font-weight:bold;">${icone} R$ ${Math.abs(diff).toFixed(2)}</span>
        </div>`;
    });

    if (!temDiferenca) html = '<p style="color:var(--text-sec);font-size:13px;">Sem dados suficientes para comparar.</p>';

    abrirModal({
        titulo: '📊 Comparativo Mês a Mês',
        mensagem: `<p style="font-size:12px;color:var(--text-sec);margin-bottom:12px;">Comparando gastos de <b>${mesAnterior}</b> vs <b>${mesAtual}</b></p>${html}`,
        confirmLabel: 'Fechar',
        confirmStyle: 'primary',
        onConfirm: () => {}
    });
}
