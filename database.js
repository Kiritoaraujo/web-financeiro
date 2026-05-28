// ── BANCO DE DADOS LOCAL + REALTIME DATABASE ──────────────────────────────────

let db               = JSON.parse(localStorage.getItem('finDB')) || { usuarios: {} };
let usuarioLogado    = null;
let modoApresentacao = false;

// ── SALVAR: local + nuvem ─────────────────────────────────────────────────────

function salvarDB() {
    localStorage.setItem('finDB', JSON.stringify(db));
    if (usuarioLogado && window.rtdb) {
        window.rtdb.ref('usuarios/' + usuarioLogado)
            .set(db.usuarios[usuarioLogado])
            .catch(err => console.warn('RTDB save error:', err));
    }
}

// ── CARREGAR DA NUVEM ─────────────────────────────────────────────────────────

async function carregarDaNuvem(username) {
    if (!window.rtdb) return false;
    try {
        const snap = await window.rtdb.ref('usuarios/' + username).once('value');
        if (snap.exists()) {
            db.usuarios[username] = migrarUsuario(snap.val());
            localStorage.setItem('finDB', JSON.stringify(db));
            return true;
        }
    } catch (err) {
        console.warn('RTDB load error:', err);
    }
    return false;
}

// ── TOAST ─────────────────────────────────────────────────────────────────────

function showToast(msg, tipo = 'info') {
    const box   = document.getElementById('toast-box');
    const toast = document.createElement('div');
    toast.style.background = tipo === 'error' ? 'var(--danger)' : tipo === 'success' ? 'var(--success)' : '#333';
    toast.className = 'toast';
    toast.innerText = msg;
    box.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ── MIGRAÇÃO / ESTRUTURA DO USUÁRIO ──────────────────────────────────────────

function migrarUsuario(usr) {
    if (!usr.extrato)           usr.extrato = [];
    if (!usr.metas)             usr.metas = [];
    if (!usr.investimentos)     usr.investimentos = [];
    if (usr.saldo === undefined || isNaN(usr.saldo)) usr.saldo = 0;
    if (!usr.recorrentes)       usr.recorrentes = [];
    if (!usr.conquistas)        usr.conquistas = [];
    if (!usr.pin)               usr.pin = null;
    if (!usr.avatar)            usr.avatar = null;
    if (!usr.email)             usr.email = null;
    if (usr.email)              usr.email = usr.email.toLowerCase();
    if (!usr.dataCadastro)      usr.dataCadastro = new Date().toISOString().split('T')[0];
    if (!usr.corPersonalizada)  usr.corPersonalizada = null;
    if (usr.easterEggsEncontrados === undefined) usr.easterEggsEncontrados = 0;
    if (usr.batmanEggEncontrado  === undefined)  usr.batmanEggEncontrado  = false;
    if (usr.shinyEggEncontrado   === undefined)  usr.shinyEggEncontrado   = false;
    if (usr.juliusEggEncontrado  === undefined)  usr.juliusEggEncontrado  = false;
    if (usr.cltUsado             === undefined)  usr.cltUsado             = 0;
    if (usr.xp                   === undefined)  usr.xp                   = 0;
    if (usr.diasConsecutivos     === undefined)  usr.diasConsecutivos     = 0;
    if (usr.ultimoDiaAcesso      === undefined)  usr.ultimoDiaAcesso      = null;
    if (usr.batmanMode           === undefined)  usr.batmanMode           = false;
    if (usr.cliquesTemaRapido    === undefined)  usr.cliquesTemaRapido    = 0;
    if (usr.primeiroSaldoNegativo === undefined) usr.primeiroSaldoNegativo = false;
    return usr;
}

// ── BACKUP ────────────────────────────────────────────────────────────────────

function baixarBackup() {
    const usr   = db.usuarios[usuarioLogado];
    const dados = { exportadoEm: new Date().toISOString(), usuario: usuarioLogado, dados: usr };
    const link  = document.createElement('a');
    link.href     = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dados, null, 2));
    link.download = 'backup_' + usuarioLogado + '_' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
    showToast('Backup baixado!', 'success');
}

function restaurarBackup(arquivo) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const dados = JSON.parse(e.target.result);
            if (!dados.dados || !dados.usuario) return showToast('Arquivo inválido!', 'error');
            abrirModal({
                titulo:       'Restaurar backup?',
                mensagem:     'Isso vai substituir todos os seus dados atuais. Tem certeza?',
                confirmLabel: 'Restaurar',
                confirmStyle: 'danger',
                onConfirm: () => {
                    db.usuarios[usuarioLogado] = migrarUsuario(dados.dados);
                    salvarDB();
                    carregarDados();
                    showToast('Backup restaurado!', 'success');
                }
            });
        } catch {
            showToast('Erro ao ler o arquivo!', 'error');
        }
    };
    reader.readAsText(arquivo);
}

// ── MODO APRESENTAÇÃO ─────────────────────────────────────────────────────────

function toggleModoApresentacao() {
    modoApresentacao = !modoApresentacao;
    const btn = document.getElementById('btn-apresentacao');
    if (btn) {
        btn.innerHTML = modoApresentacao ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        btn.title     = modoApresentacao ? 'Mostrar valores' : 'Ocultar valores';
    }
    carregarDados();
    showToast(modoApresentacao ? 'Valores ocultados 🙈' : 'Valores visíveis 👁️', 'info');
}

function formatarSaldoApresentacao(valor) {
    if (modoApresentacao) return 'R$ ****';
    return 'R$ ' + valor.toFixed(2);
}

function formatarValorApresentacao(valor) {
    if (modoApresentacao) return 'R$ ****';
    return 'R$ ' + Math.abs(valor).toFixed(2);
}
