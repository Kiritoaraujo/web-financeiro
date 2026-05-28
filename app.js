// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────

let contadorEasterEgg = 0;

function alternarTema() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    document.getElementById('icon-theme').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('tema', isDark ? 'dark' : 'light');
    if (usuarioLogado) carregarCorPersonalizada();
    if (typeof renderizarExtrato === 'function' && usuarioLogado) renderizarExtrato();
    if (typeof registrarCliqueTema === 'function') registrarCliqueTema();
}

// ── EASTER EGG (7 cliques na saudação) ───────────────────────────────────────

function ativarEasterEgg() {
    contadorEasterEgg++;
    if (contadorEasterEgg !== 7) return;
    contadorEasterEgg = 0;

    if (usuarioLogado) {
        const usr = db.usuarios[usuarioLogado];
        usr.easterEggsEncontrados = (usr.easterEggsEncontrados || 0) + 1;
        salvarDB();
        verificarConquistas();
    }

    showToast('🎉 Easter Egg encontrado! Escolha sua cor.', 'success');
    dispararConfete();

    const cores = [
        { nome: 'Azul',       hex: '#3a8ef6' },
        { nome: 'Roxo',       hex: '#8a2be2' },
        { nome: 'Oceano',     hex: '#1abc9c' },
        { nome: 'Pôr do Sol', hex: '#e67e22' },
        { nome: 'Rosa Neon',  hex: '#e91e8c' },
        { nome: 'Safira',     hex: '#1e90ff' },
        { nome: 'Esmeralda',  hex: '#2ecc71' },
        { nome: 'Rubi',       hex: '#e74c3c' },
    ];

    const paletaHTML = cores.map(c => `
        <button onclick="setCorLendaria('${c.hex}'); fecharModal();" title="${c.nome}"
            style="width:40px;height:40px;border-radius:50%;border:3px solid #fff;
                   background:${c.hex};cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);
                   transition:transform 0.2s;"
            onmouseover="this.style.transform='scale(1.2)'"
            onmouseout="this.style.transform='scale(1)'">
        </button>`).join('');

    abrirModal({
        titulo:  '🎉 Easter Egg Encontrado!',
        mensagem: `
            <p style="margin-bottom:15px;">Parabéns! Escolha sua cor lendária:</p>
            <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:15px;">
                ${paletaHTML}
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <input type="color" id="cor-custom" value="#8a2be2"
                    style="width:40px;height:40px;border:none;border-radius:50%;cursor:pointer;padding:0;">
                <span style="font-size:13px;color:var(--text-sec);">Cor personalizada</span>
            </div>`,
        confirmLabel: 'Aplicar cor personalizada',
        confirmStyle: 'primary',
        onConfirm: () => {
            const cor = document.getElementById('cor-custom').value;
            setCorLendaria(cor);
        },
        cancelLabel: 'Fechar'
    });
}

function setCorLendaria(cor) {
    document.documentElement.style.setProperty('--primary', cor);
    if (usuarioLogado) {
        db.usuarios[usuarioLogado].corPersonalizada = cor;
        salvarDB();
    }
    showToast('Cor aplicada! ✨', 'success');
}

// ── SISTEMA DE MODAIS ─────────────────────────────────────────────────────────

function abrirModal({ titulo, mensagem, confirmLabel = 'Confirmar', confirmStyle = 'primary', cancelLabel = 'Cancelar', onConfirm }) {
    fecharModal();
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease;';
    const btnColor = confirmStyle === 'danger' ? 'var(--danger)' : confirmStyle === 'success' ? 'var(--success)' : 'var(--primary)';

    overlay.innerHTML = `
        <div style="background:var(--bg-card);backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:18px;padding:25px;max-width:340px;width:100%;box-shadow:0 8px 32px var(--shadow);">
            <h3 style="margin-bottom:12px;color:var(--text-main);">${titulo}</h3>
            <div style="color:var(--text-sec);font-size:14px;margin-bottom:20px;line-height:1.5;">${mensagem}</div>
            <div style="display:flex;gap:10px;">
                <button onclick="fecharModal()" style="flex:1;padding:11px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-sec);cursor:pointer;font-weight:bold;">${cancelLabel}</button>
                <button id="modal-confirm-btn" style="flex:1;padding:11px;border-radius:8px;border:none;background:${btnColor};color:white;cursor:pointer;font-weight:bold;">${confirmLabel}</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(); });
    document.getElementById('modal-confirm-btn').onclick = () => { fecharModal(); if (onConfirm) onConfirm(); };
}

function abrirModalInput({ titulo, mensagem, placeholder = '', confirmLabel = 'Confirmar', onConfirm }) {
    fecharModal();
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease;';

    overlay.innerHTML = `
        <div style="background:var(--bg-card);backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:18px;padding:25px;max-width:340px;width:100%;box-shadow:0 8px 32px var(--shadow);">
            <h3 style="margin-bottom:12px;color:var(--text-main);">${titulo}</h3>
            <div style="color:var(--text-sec);font-size:14px;margin-bottom:15px;line-height:1.5;">${mensagem}</div>
            <div style="display:flex;align-items:center;background:var(--input-bg);padding:12px;border-radius:10px;border:1px solid var(--border);margin-bottom:15px;">
                <i class="fas fa-dollar-sign" style="color:var(--text-sec);width:25px;text-align:center;"></i>
                <input id="modal-input-val" type="number" step="0.01" min="0" placeholder="${placeholder}"
                    style="border:none;outline:none;background:transparent;width:100%;color:var(--text-main);font-size:15px;margin-left:10px;">
            </div>
            <div style="display:flex;gap:10px;">
                <button onclick="fecharModal()" style="flex:1;padding:11px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-sec);cursor:pointer;font-weight:bold;">Cancelar</button>
                <button id="modal-confirm-btn" style="flex:1;padding:11px;border-radius:8px;border:none;background:var(--primary);color:white;cursor:pointer;font-weight:bold;">${confirmLabel}</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(); });
    const input = document.getElementById('modal-input-val');
    input.focus();
    input.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('modal-confirm-btn').click(); });
    document.getElementById('modal-confirm-btn').onclick = () => {
        const val = input.value;
        fecharModal();
        if (onConfirm) onConfirm(val);
    };
}

function fecharModal() {
    const el = document.getElementById('modal-overlay');
    if (el) el.remove();
}

// ── INICIALIZAÇÃO ─────────────────────────────────────────────────────────────

window.onload = () => {
    if (localStorage.getItem('tema') === 'dark') alternarTema();
    const saudacao = document.getElementById('saudacao-texto');
    if (saudacao) saudacao.addEventListener('click', ativarEasterEgg);
};

function mostrarTela(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'screen-login' && typeof resetarLoginForm === 'function') {
        resetarLoginForm();
    }
}

function trocarAba(abaId, btn) {
    document.querySelectorAll('.tab-content').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(abaId).classList.add('active');
    btn.classList.add('active');
}
