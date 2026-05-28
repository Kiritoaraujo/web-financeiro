// ── AUTENTICAÇÃO ──────────────────────────────────────────────────────────────

function hashSenha(senha) {
    if (typeof CryptoJS !== 'undefined') return CryptoJS.SHA256(senha).toString();
    return senha;
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cadastrarUsuario(e) {
    e.preventDefault();
    const nome     = document.getElementById('cad-nome').value.trim();
    const userNick = document.getElementById('cad-user').value.trim().toLowerCase().replace(/\s+/g, '');
    const email    = document.getElementById('cad-email').value.trim().toLowerCase();
    const senha    = document.getElementById('cad-senha').value;
    const senha2   = document.getElementById('cad-senha2').value;

    if (!nome || !userNick || !email || !senha || !senha2)
        return showToast('Preencha todos os campos!', 'error');
    if (userNick.length < 3)
        return showToast('Nome de usuário precisa ter ao menos 3 caracteres!', 'error');
    if (!validarEmail(email))
        return showToast('E-mail inválido! Verifique o formato.', 'error');
    if (senha.length < 6)
        return showToast('A senha precisa ter ao menos 6 caracteres!', 'error');
    if (senha !== senha2)
        return showToast('As senhas não coincidem!', 'error');
    if (db.usuarios[userNick])
        return showToast('Nome de usuário já existe! Escolha outro.', 'error');
    if (Object.values(db.usuarios).some(u => u.email === email))
        return showToast('E-mail já cadastrado! Faça login.', 'error');

    db.usuarios[userNick] = migrarUsuario({
        nome,
        email,
        senha: hashSenha(senha),
        saldo: 0,
        dataCadastro: new Date().toISOString().split('T')[0]
    });
    salvarDB();
    showToast('Conta criada com sucesso! Faça login.', 'success');
    mostrarTela('screen-login');
}

async function fazerLogin(e) {
    if (e && e.preventDefault) e.preventDefault();

    const userNick = document.getElementById('login-user').value.trim().toLowerCase();
    const senha    = document.getElementById('login-senha').value;

    if (!userNick || !senha)
        return showToast('Preencha usuário e senha!', 'error');

    showToast('Verificando...', 'info');

    // Tenta carregar da nuvem primeiro (sincroniza dados mais recentes)
    await carregarDaNuvem(userNick);

    const usuario = db.usuarios[userNick];
    if (!usuario || usuario.senha !== hashSenha(senha))
        return showToast('Usuário ou senha incorretos!', 'error');

    function loginFinal() {
        usuarioLogado = userNick;
        mostrarTela('screen-main');
        document.getElementById('menu-inferior').style.display = 'flex';
        carregarDados();
        showToast('Bem-vindo, ' + usuario.nome + '!', 'success');
    }

    verificarPINLogin(userNick, loginFinal);
}

function loginComGoogle() {
    if (typeof firebaseAuth === 'undefined' || typeof googleProvider === 'undefined') {
        return showToast('Firebase não configurado.', 'error');
    }

    showToast('Abrindo login do Google...', 'info');

    firebaseAuth.signInWithPopup(googleProvider)
        .then(async result => {
            const googleUser = result.user;
            if (!googleUser || !googleUser.email)
                return showToast('Não foi possível obter o e-mail do Google.', 'error');

            const email = googleUser.email.toLowerCase();

            // Busca conta existente pelo e-mail localmente
            let localKey = Object.keys(db.usuarios).find(k => db.usuarios[k].email === email);

            // Se não achou local, busca na nuvem pelo e-mail
            if (!localKey && window.rtdb) {
                try {
                    const snap = await window.rtdb.ref('usuarios').orderByChild('email').equalTo(email).limitToFirst(1).once('value');
                    if (snap.exists()) {
                        snap.forEach(child => {
                            localKey = child.key;
                            db.usuarios[localKey] = migrarUsuario(child.val());
                        });
                        localStorage.setItem('finDB', JSON.stringify(db));
                    }
                } catch (err) {
                    console.warn('RTDB Google lookup error:', err);
                }
            }

            if (!localKey) {
                // Cria novo usuário
                let base = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase() || ('user' + Date.now());
                let candidate = base;
                let counter = 1;
                while (db.usuarios[candidate]) { candidate = base + counter; counter++; }
                localKey = candidate;

                db.usuarios[localKey] = migrarUsuario({
                    nome: googleUser.displayName || 'Usuário Google',
                    email,
                    senha: hashSenha(Date.now().toString() + Math.random()),
                    saldo: 0,
                    dataCadastro: new Date().toISOString().split('T')[0],
                    googleUid: googleUser.uid
                });
                showToast('Conta criada via Google!', 'success');
            }

            // Atualiza dados do Google
            const usr = db.usuarios[localKey];
            usr.nome = googleUser.displayName || usr.nome;
            usr.email = email;
            if (!usr.googleUid) usr.googleUid = googleUser.uid;
            salvarDB();

            usuarioLogado = localKey;
            mostrarTela('screen-main');
            document.getElementById('menu-inferior').style.display = 'flex';
            carregarDados();
            showToast('Login com Google realizado!', 'success');
        })
        .catch(err => {
            console.error('Erro Google login:', err);
            if (err.code === 'auth/popup-closed-by-user') {
                showToast('Login cancelado.', 'info');
            } else if (err.code === 'auth/popup-blocked') {
                showToast('Popup bloqueado! Permita popups e tente novamente.', 'error');
            } else {
                showToast('Falha no login com Google: ' + err.message, 'error');
            }
        });
}

function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon  = document.getElementById(iconId);
    if (!input || !icon) return;
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    icon.className = visible ? 'fas fa-eye' : 'fas fa-eye-slash';
}

function resetarLoginForm() {
    const form = document.getElementById('form-login');
    if (form) form.reset();
    const senha = document.getElementById('login-senha');
    const icon  = document.getElementById('login-senha-icon');
    if (senha) senha.type = 'password';
    if (icon)  icon.className = 'fas fa-eye';
}

function logout() {
    document.documentElement.style.removeProperty('--primary');
    usuarioLogado    = null;
    modoApresentacao = false;
    mostrarTela('screen-login');
    document.getElementById('menu-inferior').style.display = 'none';
    if (typeof firebaseAuth !== 'undefined') {
        firebaseAuth.signOut().catch(() => {});
    }
}

function carregarDados() {
    const usr = migrarUsuario(db.usuarios[usuarioLogado]);
    db.usuarios[usuarioLogado] = usr; // Bug 2 fix: persist migration back to db
    salvarDB();

    // Bug 8 fix: use local date string to avoid UTC off-by-one
    function localDateStr(d) {
        const dt = d || new Date();
        return dt.getFullYear() + '-' +
            String(dt.getMonth() + 1).padStart(2, '0') + '-' +
            String(dt.getDate()).padStart(2, '0');
    }

    const hoje = localDateStr();
    if (usr.ultimoDiaAcesso !== hoje) {
        const ultimoAcessoData = usr.ultimoDiaAcesso ? new Date(usr.ultimoDiaAcesso + 'T12:00:00') : null;
        const hojeData = new Date(hoje + 'T12:00:00');
        if (ultimoAcessoData) {
            const diasDiferenca = Math.floor((hojeData - ultimoAcessoData) / (1000 * 60 * 60 * 24));
            if (diasDiferenca === 1) {
                usr.diasConsecutivos = (usr.diasConsecutivos || 0) + 1;
                showToast('🔥 Streak: ' + usr.diasConsecutivos + ' dias!', 'success');
            } else if (diasDiferenca > 1) {
                usr.diasConsecutivos = 1;
            }
        } else {
            usr.diasConsecutivos = 1;
        }
        usr.ultimoDiaAcesso = hoje;
        salvarDB();
    }

    processarRecorrentes();

    const hora = new Date().getHours();
    let saudacao = 'Bom dia';
    if (hora >= 12 && hora < 18) saudacao = 'Boa tarde';
    else if (hora >= 18 || hora < 5) saudacao = 'Boa noite';
    document.getElementById('saudacao-texto').innerText = saudacao + ', ' + usr.nome + '!';

    const saldoEl = document.getElementById('saldo-atual');
    saldoEl.innerText = formatarSaldoApresentacao(usr.saldo);
    saldoEl.style.color = usr.saldo < 0 ? 'var(--danger)' : 'var(--primary)';

    const btnAp = document.getElementById('btn-apresentacao');
    if (btnAp) btnAp.innerHTML = modoApresentacao ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';

    atualizarAvatarHeader();
    carregarCorPersonalizada();

    renderizarExtrato();
    renderizarMetas();
    renderizarInvestimentos();
    carregarSelectInvestimentos();
    renderizarRecorrentes();
    verificarConquistas();
}
