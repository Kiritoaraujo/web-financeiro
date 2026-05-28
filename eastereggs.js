// ── EASTER EGGS E MODOS ESPECIAIS ────────────────────────────────────────────

// ── MODO JULIUS (Cavaleiro das Trevas) ───────────────────────────────────────
// Alerta ao tentar gastar mais do que tem

function verificarModoJulius(valorDespesa) {
    const usr = db.usuarios[usuarioLogado];
    if (usr.saldo < valorDespesa) {
        // Registrar easter egg apenas na primeira vez
        if (!usr.juliusEggEncontrado) {
            usr.juliusEggEncontrado = true;
            usr.easterEggsEncontrados = (usr.easterEggsEncontrados || 0) + 1;
            salvarDB();
        }

        const juliosHTML = `
            <div style="text-align:center;">
                <p style="font-size:24px;margin-bottom:10px;">😐</p>
                <p style="font-size:18px;font-weight:bold;color:var(--text-main);margin-bottom:10px;">"Se você não comprar nada, o desconto é maior!"</p>
                <p style="color:var(--text-sec);font-size:13px;">Saldo insuficiente: R$ ${usr.saldo.toFixed(2)}</p>
            </div>`;
        
        abrirModal({
            titulo: '💸 Aviso - Julius',
            mensagem: juliosHTML,
            confirmLabel: 'Entendi',
            confirmStyle: 'danger',
            onConfirm: () => {}
        });
        return false;
    }
    return true;
}

// ── MODO BATMAN (Tema Escuro Super Rápido) ───────────────────────────────────
// 10 cliques no tema em rápida sucessão ativa o modo Batman

function registrarCliqueTema() {
    if (!usuarioLogado) return;
    const usr = db.usuarios[usuarioLogado];
    
    const agora = Date.now();
    if (!usr.cliquesTemaTimestamp) usr.cliquesTemaTimestamp = [];
    
    // Remove cliques com mais de 10 segundos
    usr.cliquesTemaTimestamp = usr.cliquesTemaTimestamp.filter(t => agora - t < 10000);
    
    usr.cliquesTemaTimestamp.push(agora);
    
    // Se 10 cliques em 10 segundos
    if (usr.cliquesTemaTimestamp.length >= 10) {
        if (!usr.batmanMode) {
            ativarModoBatman(usr);
        }
        usr.cliquesTemaTimestamp = [];
    }
    salvarDB();
}

function ativarModoBatmanManual() {
    if (!usuarioLogado) return;
    const usr = db.usuarios[usuarioLogado];
    ativarModoBatman(usr);
}

function ativarModoBatman(usr) {
    usr.batmanMode = true;
    // Registrar como easter egg encontrado
    if (!usr.batmanEggEncontrado) {
        usr.batmanEggEncontrado = true;
        usr.easterEggsEncontrados = (usr.easterEggsEncontrados || 0) + 1;
    }
    
    const themeBtn = document.getElementById('icon-theme');
    if (themeBtn) {
        themeBtn.className = 'fas fa-mask';
        themeBtn.style.color = '#FFD700';
    }
    
    // Mudar título da página
    document.title = "I'm Batman";
    
    // Aplicar cores Batman (cinza e preto)
    document.documentElement.style.setProperty('--primary', '#1a1a1a');
    document.documentElement.style.setProperty('--text-main', '#e0e0e0');
    document.documentElement.style.setProperty('--text-sec', '#888888');
    document.documentElement.style.setProperty('--bg-body', '#0a0a0a');
    document.documentElement.style.setProperty('--bg-app', '#1a1a1a');
    document.documentElement.style.setProperty('--bg-card', 'rgba(30, 30, 30, 0.95)');
    
    showToast('🦇 I\'m Batman! Easter Egg encontrado! 🦇', 'success');
    adicionarXP(100); // Bônus especial
    
    // Reproduzir som (se disponível)
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(60, audioContext.currentTime + 0.5);
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch(e) {}
    
    salvarDB();
    verificarConquistas();
}

// ── POKÉMON SHINY (1 em 256) ─────────────────────────────────────────────────
// Ao cadastrar uma transação, chance pequena de ativar Shiny

function verificarPokemonShiny() {
    // 1 em 256 de chance
    if (Math.floor(Math.random() * 256) === 0) {
        return true;
    }
    return false;
}

function ativarPokemonShiny(transacaoId) {
    const transacao = document.querySelector(`[data-trans-id="${transacaoId}"]`);
    if (transacao) {
        transacao.style.background = 'linear-gradient(135deg, #ffd700, #ffed4e)';
        transacao.style.borderColor = '#FFD700';
        transacao.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.4)';
        transacao.style.animation = 'shinyPulse 1.5s ease-in-out infinite';
        
        // Adicionar animação ao CSS se não existir
        if (!document.getElementById('shiny-style')) {
            const style = document.createElement('style');
            style.id = 'shiny-style';
            style.textContent = `
                @keyframes shinyPulse {
                    0%, 100% { box-shadow: 0 0 15px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.4); }
                    50% { box-shadow: 0 0 25px rgba(255, 215, 0, 1), 0 0 50px rgba(255, 215, 0, 0.6); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Reproduzir som Shiny (som de cristal/sino)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    
    // Notas do som Shiny
    const notas = [1318.51, 1567.98, 1318.51]; // Mi agudo, Sol#, Mi
    
    notas.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gain.gain.setValueAtTime(0.1, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.15);
        
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.15);
    });
    
    showToast('✨ Pokémon Shiny! Parabéns! ✨', 'success');
    
    // Adicionar conquista especial
    if (usuarioLogado) {
        const usr = db.usuarios[usuarioLogado];
        if (!usr.shinyEggEncontrado) {
            usr.shinyEggEncontrado = true;
            usr.easterEggsEncontrados = (usr.easterEggsEncontrados || 0) + 1;
        }
        salvarDB();
        verificarConquistas();
    }
    
    adicionarXP(25);
}

// ── INTEGRAÇÃO COM EXTRATO.JS ───────────────────────────────────────────────

// Esta função deve ser chamada em adicionarTransacao após criar a transação
function processarEasterEggsTransacao(transacaoId) {
    setTimeout(() => {
        if (verificarPokemonShiny()) {
            ativarPokemonShiny(transacaoId);
        }
    }, 100);
}
