// ── PERFIL, AVATAR, PIN, TEMA PERSONALIZADO ───────────────────────────────────

function abrirPerfil() {
    const usr = db.usuarios[usuarioLogado];
    const totalMovimentado = usr.extrato.reduce((acc, t) => acc + Math.abs(t.valor), 0);
    const totalReceitas    = usr.extrato.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
    const totalDespesas    = usr.extrato.filter(t => t.tipo === 'despesa').reduce((a, t) => a + Math.abs(t.valor), 0);
    const metasConcluidas  = usr.metas.filter(m => (m.valorArrecadado || 0) >= (m.valorAlvo || m.valor || 1)).length;

    const avatarHTML = usr.avatar
        ? `<img src="${usr.avatar}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--primary);">`
        : `<div style="width:80px;height:80px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:32px;color:white;margin:0 auto;">
               ${usr.nome.charAt(0).toUpperCase()}
           </div>`;

    const conquistas = usr.conquistas || [];
    const conquistasHTML = conquistas.length === 0
        ? '<p style="color:var(--text-sec);font-size:13px;">Nenhuma conquista ainda.</p>'
        : conquistas.map(c => `
            <div style="position:relative;display:inline-block;" class="tooltip-wrap">
                <span style="font-size:22px;cursor:default;">${c.emoji}</span>
                <div style="position:absolute;bottom:110%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:5px 9px;border-radius:7px;font-size:11px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity 0.2s;z-index:999;" class="tooltip-text">${c.nome}</div>
            </div>`).join(' ');

    fecharModal();
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease;overflow-y:auto;';

    overlay.innerHTML = `
        <div style="background:var(--bg-card);backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:20px;padding:25px;max-width:360px;width:100%;box-shadow:0 8px 32px var(--shadow);">
            <div style="text-align:center;margin-bottom:20px;">
                <div id="avatar-preview" style="margin-bottom:12px;display:flex;justify-content:center;">${avatarHTML}</div>
                <label style="display:inline-block;cursor:pointer;font-size:13px;color:white;background:var(--primary);border-radius:20px;padding:8px 18px;margin-bottom:12px;box-shadow:0 2px 8px var(--shadow);">
                    <i class="fas fa-camera"></i> Alterar foto
                    <input type="file" accept="image/*" onchange="alterarAvatar(this)" style="display:none;">
                </label>
                <h3 style="margin-top:4px;color:var(--text-main);" id="perfil-nome-display">${usr.nome}</h3>
                <p style="color:var(--text-sec);font-size:13px;">@${usuarioLogado} &bull; desde ${usr.dataCadastro || 'N/A'}</p>
                <button onclick="editarNomePerfil()" style="margin-top:8px;background:none;border:1px solid var(--border);color:var(--primary);border-radius:8px;padding:6px 14px;font-size:12px;cursor:pointer;"><i class="fas fa-pen"></i> Editar nome</button>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
                <div style="background:var(--input-bg);border-radius:12px;padding:12px;text-align:center;border:1px solid var(--border);">
                    <p style="font-size:11px;color:var(--text-sec);">Total movimentado</p>
                    <b style="color:var(--primary);">R$ ${totalMovimentado.toFixed(2)}</b>
                </div>
                <div style="background:var(--input-bg);border-radius:12px;padding:12px;text-align:center;border:1px solid var(--border);">
                    <p style="font-size:11px;color:var(--text-sec);">Metas concluídas</p>
                    <b style="color:var(--success);">${metasConcluidas}</b>
                </div>
                <div style="background:var(--input-bg);border-radius:12px;padding:12px;text-align:center;border:1px solid var(--border);">
                    <p style="font-size:11px;color:var(--text-sec);">Receitas</p>
                    <b style="color:var(--success);">R$ ${totalReceitas.toFixed(2)}</b>
                </div>
                <div style="background:var(--input-bg);border-radius:12px;padding:12px;text-align:center;border:1px solid var(--border);">
                    <p style="font-size:11px;color:var(--text-sec);">Despesas</p>
                    <b style="color:var(--danger);">R$ ${totalDespesas.toFixed(2)}</b>
                </div>
            </div>

            <div style="margin-bottom:20px;">
                <p style="font-size:13px;font-weight:bold;margin-bottom:8px;color:var(--text-main);">🔥 Streak de Dias</p>
                <div style="background:var(--input-bg);border-radius:12px;padding:12px;border:1px solid var(--border);text-align:center;">
                    <b style="font-size:24px;color:#ff6b6b;">${usr.diasConsecutivos || 0}</b>
                    <p style="font-size:12px;color:var(--text-sec);margin-top:4px;">dias consecutivos acessando</p>
                </div>
            </div>

            <div style="margin-bottom:20px;">
                ${(() => {
                    const xpInfo = calcularXpProxNivel(usr.xp || 0);
                    return `
                    <div style="background:var(--input-bg);border-radius:12px;padding:12px;border:1px solid var(--border);">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <b style="font-size:16px;">Nível ${xpInfo.nivelAtual}</b>
                            <span style="color:var(--text-sec);font-size:12px;">${xpInfo.xpAtual}/${xpInfo.xpProxNivel} XP</span>
                        </div>
                        <div style="background:var(--border);border-radius:8px;height:8px;overflow:hidden;">
                            <div style="background:linear-gradient(90deg, var(--primary), #fda085);height:100%;width:${xpInfo.progresso}%;transition:width 0.3s ease-out;"></div>
                        </div>
                    </div>`;
                })()}
            </div>

            <div style="margin-bottom:20px;">
                <p style="font-size:13px;font-weight:bold;margin-bottom:8px;color:var(--text-main);">💎 Progresso para Platina</p>
                ${(() => {
                    const todasConquistas = LISTA_CONQUISTAS.filter(c => c.id !== 'platina');
                    const temConquista = (id) => (usr.conquistas || []).some(c => c.id === id);
                    const conquistadas = todasConquistas.filter(c => temConquista(c.id)).length;
                    const total = todasConquistas.length;
                    return `
                    <div style="background:var(--input-bg);border-radius:12px;padding:12px;border:1px solid var(--border);">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <b>${conquistadas}/${total} Conquistas</b>
                            <span style="color:var(--text-sec);font-size:12px;">${Math.floor((conquistadas/total)*100)}%</span>
                        </div>
                        <div style="background:var(--border);border-radius:8px;height:8px;overflow:hidden;">
                            <div style="background:linear-gradient(90deg, #ffd700, #ffed4e);height:100%;width:${(conquistadas/total)*100}%;transition:width 0.3s ease-out;"></div>
                        </div>
                    </div>`;
                })()}
            </div>

            <div style="margin-bottom:20px;">
                <p style="font-size:13px;font-weight:bold;margin-bottom:8px;color:var(--text-main);">🏆 Conquistas <span style="font-size:11px;font-weight:normal;color:var(--text-sec);">(passe o mouse para ver)</span></p>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">${conquistasHTML}</div>
            </div>

            <div style="margin-bottom:20px;">
                <p style="font-size:13px;font-weight:bold;margin-bottom:8px;color:var(--text-main);">🎨 Cor do tema</p>
                <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                    ${['#3a8ef6','#ff1a1a','#8a2be2','#1abc9c','#e67e22','#e91e8c'].map(c =>
                        `<button onclick="aplicarCorPersonalizada('${c}')" style="width:32px;height:32px;border-radius:50%;background:${c};border:3px solid ${(usr.corPersonalizada||'#3a8ef6')===c?'white':'transparent'};cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.3);transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"></button>`
                    ).join('')}
                    <input type="color" value="${usr.corPersonalizada || '#3a8ef6'}" onchange="aplicarCorPersonalizada(this.value)"
                        style="width:32px;height:32px;border:none;border-radius:50%;cursor:pointer;padding:0;">
                </div>
            </div>

            <div style="margin-bottom:20px;">
                <p style="font-size:13px;font-weight:bold;margin-bottom:8px;color:var(--text-main);">🔐 PIN de acesso rápido</p>
                <p style="font-size:12px;color:var(--text-sec);margin-bottom:8px;">${usr.pin ? 'PIN configurado ✓' : 'Nenhum PIN configurado'}</p>
                <div style="display:flex;gap:8px;">
                    <button onclick="configurarPIN()" class="btn-primary" style="flex:1;padding:10px;font-size:13px;">
                        ${usr.pin ? 'Alterar PIN' : 'Criar PIN'}
                    </button>
                    ${usr.pin ? '<button onclick="removerPIN()" class="btn-primary" style="flex:1;padding:10px;font-size:13px;background:var(--danger);">Remover</button>' : ''}
                </div>
                ${usr.pin ? '<p style="font-size:11px;color:var(--text-sec);margin-top:6px;text-align:center;">Esqueceu o PIN? <a href="#" onclick="recuperarPINComSenha()" style="color:var(--primary);">Usar senha da conta</a></p>' : ''}
            </div>

            <div style="display:flex;gap:8px;margin-bottom:10px;">
                <button onclick="baixarBackup()" class="btn-primary" style="flex:1;padding:10px;font-size:13px;background:#28a745;">
                    <i class="fas fa-download"></i> Backup
                </button>
                <label class="btn-primary" style="flex:1;padding:10px;font-size:13px;background:#6c757d;cursor:pointer;text-align:center;">
                    <i class="fas fa-upload"></i> Restaurar
                    <input type="file" accept=".json" onchange="restaurarBackup(this.files[0])" style="display:none;">
                </label>
            </div>

            <button onclick="fecharModal()" style="width:100%;padding:11px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-sec);cursor:pointer;font-weight:bold;">
                Fechar
            </button>
        </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(); });

    // Tooltip hover for achievements
    setTimeout(() => {
        document.querySelectorAll('.tooltip-wrap').forEach(wrap => {
            const tip = wrap.querySelector('.tooltip-text');
            wrap.addEventListener('mouseenter', () => { if (tip) tip.style.opacity = '1'; });
            wrap.addEventListener('mouseleave', () => { if (tip) tip.style.opacity = '0'; });
        });
    }, 100);
}

// ── EDITAR NOME ───────────────────────────────────────────────────────────────

function editarNomePerfil() {
    fecharModal();
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease;';
    const nomeAtual = db.usuarios[usuarioLogado].nome;
    overlay.innerHTML = `
        <div style="background:var(--bg-card);backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:18px;padding:25px;max-width:340px;width:100%;box-shadow:0 8px 32px var(--shadow);">
            <h3 style="margin-bottom:12px;color:var(--text-main);">✏️ Editar nome</h3>
            <div class="input-group" style="margin-bottom:15px;">
                <i class="fas fa-user"></i>
                <input id="input-novo-nome" type="text" value="${nomeAtual}" placeholder="Novo nome" style="border:none;outline:none;background:transparent;width:100%;color:var(--text-main);font-size:15px;margin-left:10px;">
            </div>
            <div style="display:flex;gap:10px;">
                <button onclick="abrirPerfil()" style="flex:1;padding:11px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-sec);cursor:pointer;font-weight:bold;">Cancelar</button>
                <button id="btn-salvar-nome" style="flex:1;padding:11px;border-radius:8px;border:none;background:var(--primary);color:white;cursor:pointer;font-weight:bold;">Salvar</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    const input = document.getElementById('input-novo-nome');
    input.focus(); input.select();
    document.getElementById('btn-salvar-nome').onclick = () => {
        const novo = input.value.trim();
        if (!novo) return showToast('Nome não pode ser vazio!', 'error');
        db.usuarios[usuarioLogado].nome = novo;
        salvarDB();
        fecharModal();
        carregarDados();
        showToast('Nome atualizado!', 'success');
    };
}

// ── AVATAR ────────────────────────────────────────────────────────────────────

function alterarAvatar(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        db.usuarios[usuarioLogado].avatar = e.target.result;
        salvarDB();
        const preview = document.getElementById('avatar-preview');
        if (preview) preview.innerHTML = `<img src="${e.target.result}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--primary);">`;
        atualizarAvatarHeader();
        showToast('Foto atualizada!', 'success');
    };
    reader.readAsDataURL(file);
}

function atualizarAvatarHeader() {
    const usr = db.usuarios[usuarioLogado];
    const el = document.getElementById('avatar-header');
    if (!el) return;
    el.innerHTML = usr.avatar
        ? `<img src="${usr.avatar}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.7);">`
        : `<div style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:16px;">${usr.nome.charAt(0).toUpperCase()}</div>`;
}

function aplicarCorPersonalizada(cor) {
    const usr = db.usuarios[usuarioLogado];
    usr.corPersonalizada = cor;
    salvarDB();
    document.documentElement.style.setProperty('--primary', cor);
    showToast('Cor aplicada!', 'success');
    fecharModal();
    abrirPerfil();
}

function carregarCorPersonalizada() {
    const usr = db.usuarios[usuarioLogado];
    // Apply custom colour regardless of theme — dark theme variables handle the rest
    if (usr.corPersonalizada) {
        document.documentElement.style.setProperty('--primary', usr.corPersonalizada);
    }
}

// ── PIN ───────────────────────────────────────────────────────────────────────

function configurarPIN() {
    fecharModal();
    abrirModalPIN('Criar PIN de 4 dígitos', (pin) => {
        abrirModalPIN('Confirme o PIN', (pin2) => {
            if (pin !== pin2) return showToast('PINs não coincidem!', 'error');
            db.usuarios[usuarioLogado].pin = hashSenha(pin);
            salvarDB();
            showToast('PIN criado com sucesso!', 'success');
        });
    });
}

function removerPIN() {
    fecharModal();
    abrirModalPIN('Digite o PIN atual para remover', (pin) => {
        const usr = db.usuarios[usuarioLogado];
        if (hashSenha(pin) !== usr.pin) return showToast('PIN incorreto!', 'error');
        usr.pin = null;
        salvarDB();
        showToast('PIN removido!', 'success');
    });
}

// Recover PIN using account password
function recuperarPINComSenha() {
    fecharModal();
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s;';
    overlay.innerHTML = `
        <div style="background:var(--bg-card);backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:20px;padding:25px;max-width:320px;width:100%;box-shadow:0 8px 32px var(--shadow);">
            <h3 style="margin-bottom:12px;color:var(--text-main);">🔑 Recuperar PIN</h3>
            <p style="font-size:13px;color:var(--text-sec);margin-bottom:15px;">Digite a senha da sua conta para redefinir o PIN.</p>
            <div class="input-group" style="margin-bottom:15px;">
                <i class="fas fa-lock"></i>
                <input id="rec-pin-senha" type="password" placeholder="Senha da conta" style="border:none;outline:none;background:transparent;width:100%;color:var(--text-main);font-size:15px;margin-left:10px;">
            </div>
            <div style="display:flex;gap:10px;">
                <button onclick="fecharModal()" style="flex:1;padding:11px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-sec);cursor:pointer;font-weight:bold;">Cancelar</button>
                <button id="btn-rec-pin" style="flex:1;padding:11px;border-radius:8px;border:none;background:var(--primary);color:white;cursor:pointer;font-weight:bold;">Verificar</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    document.getElementById('btn-rec-pin').onclick = () => {
        const senha = document.getElementById('rec-pin-senha').value;
        const usr = db.usuarios[usuarioLogado];
        if (hashSenha(senha) !== usr.senha) return showToast('Senha incorreta!', 'error');
        fecharModal();
        // Now let them set a new PIN
        abrirModalPIN('Novo PIN de 4 dígitos', (pin) => {
            abrirModalPIN('Confirme o novo PIN', (pin2) => {
                if (pin !== pin2) return showToast('PINs não coincidem!', 'error');
                usr.pin = hashSenha(pin);
                salvarDB();
                showToast('PIN redefinido com sucesso!', 'success');
            });
        });
    };
}

function abrirModalPIN(titulo, onConfirm) {
    fecharModal();
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s;';

    overlay.innerHTML = `
        <div style="background:var(--bg-card);backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:20px;padding:25px;max-width:300px;width:100%;box-shadow:0 8px 32px var(--shadow);text-align:center;">
            <h3 style="margin-bottom:20px;color:var(--text-main);">${titulo}</h3>
            <div id="pin-display" style="display:flex;justify-content:center;gap:12px;margin-bottom:20px;">
                ${[0,1,2,3].map(i => `<div id="pin-dot-${i}" style="width:16px;height:16px;border-radius:50%;border:2px solid var(--primary);background:transparent;transition:background 0.2s;"></div>`).join('')}
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:220px;margin:0 auto 15px;">
                ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(n => `
                    <button onclick="pinDigit('${n}')" style="padding:14px;border-radius:12px;border:1px solid var(--border);background:var(--input-bg);color:var(--text-main);font-size:18px;font-weight:bold;cursor:pointer;${n===''?'visibility:hidden;':''}">
                        ${n}
                    </button>`).join('')}
            </div>
            <button onclick="fecharModal()" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-sec);cursor:pointer;">Cancelar</button>
        </div>`;

    document.body.appendChild(overlay);

    let pinAtual = '';
    window._pinCallback = onConfirm;

    window.pinDigit = (n) => {
        if (n === '⌫') {
            pinAtual = pinAtual.slice(0, -1);
        } else if (pinAtual.length < 4 && n !== '') {
            pinAtual += n;
        }
        for (let i = 0; i < 4; i++) {
            const dot = document.getElementById('pin-dot-' + i);
            if (dot) dot.style.background = i < pinAtual.length ? 'var(--primary)' : 'transparent';
        }
        if (pinAtual.length === 4) {
            setTimeout(() => {
                fecharModal();
                window._pinCallback(pinAtual);
            }, 200);
        }
    };
}

function verificarPINLogin(userNick, onSucesso) {
    const usr = db.usuarios[userNick];
    if (!usr || !usr.pin) { onSucesso(); return; }

    abrirModalPIN('Digite seu PIN', (pin) => {
        if (hashSenha(pin) === usr.pin) {
            onSucesso();
        } else {
            showToast('PIN incorreto!', 'error');
            // Offer password recovery option after wrong PIN
            setTimeout(() => {
                abrirModal({
                    titulo: '🔑 PIN incorreto',
                    mensagem: 'Deseja entrar usando a senha da conta em vez do PIN?',
                    confirmLabel: 'Usar senha',
                    confirmStyle: 'primary',
                    cancelLabel: 'Tentar PIN novamente',
                    onConfirm: () => {
                        // Bypass PIN: go straight with password already validated
                        onSucesso();
                    }
                });
            }, 300);
        }
    });
}

// ── PREVISÃO DE SALDO ─────────────────────────────────────────────────────────

function mostrarPrevisaoSaldo() {
    const usr = db.usuarios[usuarioLogado];
    const hoje = new Date();
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    const mesAtual = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');

    let saldoEstimado = usr.saldo;
    const pendentes = [];

    (usr.recorrentes || []).forEach(rec => {
        if (!rec.ativo) return;
        const jaLancada = usr.extrato.some(t =>
            t.recorrenteId === rec.id && t.data.startsWith(mesAtual)
        );
        if (!jaLancada && rec.dia > hoje.getDate()) {
            const valorFinal = rec.tipo === 'despesa' ? -Math.abs(rec.valor) : Math.abs(rec.valor);
            saldoEstimado += valorFinal;
            pendentes.push({ desc: rec.desc, tipo: rec.tipo, valor: rec.valor, dia: rec.dia });
        }
    });

    const linhas = pendentes.length === 0
        ? '<p style="color:var(--text-sec);font-size:13px;">Sem recorrentes pendentes este mês.</p>'
        : pendentes.map(p => `
            <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px;">
                <span>${p.desc} <span style="font-size:10px;color:var(--text-sec);">dia ${p.dia}</span></span>
                <span style="color:${p.tipo==='despesa'?'var(--danger)':'var(--success)'};">${p.tipo==='despesa'?'-':'+'}R$ ${p.valor.toFixed(2)}</span>
            </div>`).join('');

    const corSaldo = saldoEstimado >= 0 ? 'var(--success)' : 'var(--danger)';

    abrirModal({
        titulo: '🔮 Previsão de Saldo',
        mensagem: `
            <p style="font-size:12px;color:var(--text-sec);margin-bottom:12px;">Com base nas suas transações fixas até o dia ${ultimoDia}/${hoje.getMonth()+1}:</p>
            ${linhas}
            <div style="margin-top:15px;padding:12px;background:var(--input-bg);border-radius:10px;border:1px solid var(--border);">
                <p style="font-size:12px;color:var(--text-sec);">Saldo atual: <b>R$ ${usr.saldo.toFixed(2)}</b></p>
                <p style="font-size:14px;font-weight:bold;color:${corSaldo};margin-top:4px;">Saldo estimado final do mês: R$ ${saldoEstimado.toFixed(2)}</p>
            </div>`,
        confirmLabel: 'Fechar',
        confirmStyle: 'primary',
        onConfirm: () => {}
    });
}

// ── RELATÓRIO MENSAL PDF ──────────────────────────────────────────────────────

function gerarRelatorioPDF() {
    const usr = db.usuarios[usuarioLogado];
    const hoje = new Date();
    const mesAtual = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
    const nomesMeses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const nomeMes = nomesMeses[hoje.getMonth()] + ' ' + hoje.getFullYear();

    const transacoesMes = usr.extrato.filter(t => t.data.startsWith(mesAtual));
    const receitas  = transacoesMes.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
    const despesas  = transacoesMes.filter(t => t.tipo === 'despesa').reduce((a, t) => a + Math.abs(t.valor), 0);
    const balanco   = receitas - despesas;

    // Maior gasto
    const maiorGasto = transacoesMes.filter(t => t.tipo === 'despesa')
        .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))[0];

    // Meta mais próxima
    const metaProxima = usr.metas
        .filter(m => (m.valorArrecadado || 0) < (m.valorAlvo || m.valor || 1))
        .sort((a, b) => {
            const pa = (a.valorArrecadado || 0) / (a.valorAlvo || a.valor || 1);
            const pb = (b.valorArrecadado || 0) / (b.valorAlvo || b.valor || 1);
            return pb - pa;
        })[0];

    // Gastos por categoria
    const porCat = {};
    transacoesMes.filter(t => t.tipo === 'despesa').forEach(t => {
        const c = t.categoria || 'outros';
        porCat[c] = (porCat[c] || 0) + Math.abs(t.valor);
    });

    // Build HTML for print
    const estilos = `
        body{font-family:'Segoe UI',sans-serif;color:#1a3a5c;background:#fff;margin:0;padding:30px;}
        h1{color:#3a8ef6;text-align:center;margin-bottom:5px;}
        .sub{text-align:center;color:#7a9cbf;font-size:14px;margin-bottom:30px;}
        .card{background:#f0f6ff;border-radius:12px;padding:18px;margin-bottom:18px;border:1px solid rgba(58,142,246,0.15);}
        .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(58,142,246,0.1);}
        .row:last-child{border-bottom:none;}
        .green{color:#28a745;font-weight:bold;}
        .red{color:#dc3545;font-weight:bold;}
        .blue{color:#3a8ef6;font-weight:bold;}
        h3{color:#3a8ef6;margin-bottom:12px;}
        .badge{display:inline-block;background:rgba(58,142,246,0.12);border-radius:6px;padding:2px 8px;font-size:11px;text-transform:capitalize;}
        @media print{body{padding:15px;}}
    `;

    const linhasTransacoes = transacoesMes.slice(-20).reverse().map(t => `
        <div class="row">
            <span>${t.data.split('-').reverse().join('/')} — ${t.desc} <span class="badge">${t.categoria||'geral'}</span></span>
            <span class="${t.tipo==='despesa'?'red':'green'}">${t.tipo==='despesa'?'-':'+'}R$ ${Math.abs(t.valor).toFixed(2)}</span>
        </div>`).join('');

    const linhasCat = Object.entries(porCat).sort((a,b)=>b[1]-a[1]).map(([c,v]) => `
        <div class="row"><span style="text-transform:capitalize;">${c}</span><span class="red">R$ ${v.toFixed(2)}</span></div>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório ${nomeMes}</title><style>${estilos}</style></head><body>
        <h1>📊 Relatório Financeiro</h1>
        <div class="sub">${nomeMes} &bull; @${usuarioLogado}</div>

        <div class="card">
            <h3>💰 Balanço do Mês</h3>
            <div class="row"><span>Total de Receitas</span><span class="green">R$ ${receitas.toFixed(2)}</span></div>
            <div class="row"><span>Total de Despesas</span><span class="red">R$ ${despesas.toFixed(2)}</span></div>
            <div class="row"><span><b>Saldo do Mês</b></span><span class="${balanco>=0?'green':'red'}"><b>R$ ${balanco.toFixed(2)}</b></span></div>
            <div class="row"><span>Saldo Atual na Conta</span><span class="blue">R$ ${usr.saldo.toFixed(2)}</span></div>
        </div>

        ${maiorGasto ? `<div class="card"><h3>🔴 Maior Gasto</h3><div class="row"><span>${maiorGasto.desc} <span class="badge">${maiorGasto.categoria||'geral'}</span></span><span class="red">R$ ${Math.abs(maiorGasto.valor).toFixed(2)}</span></div></div>` : ''}

        ${metaProxima ? `<div class="card"><h3>🎯 Meta Mais Próxima</h3><div class="row"><span>${metaProxima.nome}</span><span class="blue">${((metaProxima.valorArrecadado||0)/(metaProxima.valorAlvo||metaProxima.valor||1)*100).toFixed(0)}% concluída</span></div><div class="row"><span>Arrecadado / Alvo</span><span>R$ ${(metaProxima.valorArrecadado||0).toFixed(2)} / R$ ${(metaProxima.valorAlvo||metaProxima.valor||0).toFixed(2)}</span></div></div>` : ''}

        ${linhasCat ? `<div class="card"><h3>📂 Gastos por Categoria</h3>${linhasCat}</div>` : ''}

        ${linhasTransacoes ? `<div class="card"><h3>📋 Últimas Transações do Mês</h3>${linhasTransacoes}</div>` : '<p style="color:#7a9cbf;text-align:center;">Sem transações este mês.</p>'}

        <p style="text-align:center;font-size:11px;color:#aaa;margin-top:20px;">Gerado em ${new Date().toLocaleString('pt-BR')} &bull; Gestão Financeira</p>
    </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
}

// ── IMPORTAR CSV BANCÁRIO ─────────────────────────────────────────────────────

const MAP_CATEGORIAS = {
    'uber': 'transporte', 'lyft': 'transporte', 'onibus': 'transporte', 'metro': 'transporte', 'combustivel': 'transporte', 'gasolina': 'transporte', 'estacio': 'transporte',
    'ifood': 'alimentacao', 'rappi': 'alimentacao', 'pizza': 'alimentacao', 'restaurante': 'alimentacao', 'lanche': 'alimentacao', 'mercado': 'alimentacao', 'supermercado': 'alimentacao', 'padaria': 'alimentacao', 'acougue': 'alimentacao',
    'netflix': 'lazer', 'spotify': 'lazer', 'steam': 'lazer', 'cinema': 'lazer', 'teatro': 'lazer', 'amazon prime': 'lazer', 'disney': 'lazer',
    'agua': 'contas', 'luz': 'contas', 'energia': 'contas', 'internet': 'contas', 'telefone': 'contas', 'celular': 'contas', 'aluguel': 'contas', 'condominio': 'contas',
    'salario': 'salario', 'salário': 'salario', 'pagamento': 'salario',
};

function categorizarAutomatico(desc) {
    const lower = desc.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [chave, cat] of Object.entries(MAP_CATEGORIAS)) {
        if (lower.includes(chave)) return cat;
    }
    return 'outros';
}

function importarCSVBancario(arquivo) {
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const texto = e.target.result;
        const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);
        if (linhas.length < 2) return showToast('CSV vazio ou inválido!', 'error');

        // Detect separator
        const sep = linhas[0].includes(';') ? ';' : ',';
        const header = linhas[0].split(sep).map(h => h.toLowerCase().replace(/"/g, '').trim());

        // Try to find columns
        const iData      = header.findIndex(h => h.includes('data') || h.includes('date'));
        const iDesc      = header.findIndex(h => h.includes('desc') || h.includes('historico') || h.includes('memo') || h.includes('lancamento'));
        const iValor     = header.findIndex(h => h.includes('valor') || h.includes('value') || h.includes('amount'));
        const iTipo      = header.findIndex(h => h.includes('tipo') || h.includes('type') || h.includes('credito') || h.includes('debito'));

        if (iData === -1 || iDesc === -1 || iValor === -1)
            return showToast('CSV não reconhecido. Precisa de colunas: data, descrição, valor.', 'error');

        const transacoes = [];
        for (let i = 1; i < linhas.length; i++) {
            const cols = linhas[i].split(sep).map(c => c.replace(/"/g, '').trim());
            if (cols.length < Math.max(iData, iDesc, iValor) + 1) continue;

            let dataRaw = cols[iData];
            // Normalize date to YYYY-MM-DD
            let data = '';
            if (/^\d{4}-\d{2}-\d{2}$/.test(dataRaw)) {
                data = dataRaw;
            } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataRaw)) {
                const [d, m, y] = dataRaw.split('/');
                data = `${y}-${m}-${d}`;
            } else if (/^\d{2}\/\d{2}\/\d{2}$/.test(dataRaw)) {
                const [d, m, y] = dataRaw.split('/');
                data = `20${y}-${m}-${d}`;
            } else {
                continue;
            }

            const desc  = cols[iDesc];
            let valorStr = cols[iValor].replace('.', '').replace(',', '.');
            let valor   = parseFloat(valorStr);
            if (isNaN(valor) || !desc) continue;

            // Determine type: negative = despesa, positive = receita; or use tipo column
            let tipo = valor < 0 ? 'despesa' : 'receita';
            if (iTipo !== -1) {
                const tipoCol = cols[iTipo].toLowerCase();
                if (tipoCol.includes('debito') || tipoCol.includes('débito') || tipoCol.includes('saida') || tipoCol.includes('saída')) tipo = 'despesa';
                else if (tipoCol.includes('credito') || tipoCol.includes('crédito') || tipoCol.includes('entrada')) tipo = 'receita';
            }

            const categoria = categorizarAutomatico(desc);
            const valorFinal = tipo === 'despesa' ? -Math.abs(valor) : Math.abs(valor);
            transacoes.push({ id: Date.now() + i + Math.random(), desc, valor: valorFinal, data, tipo, categoria });
        }

        if (transacoes.length === 0) return showToast('Nenhuma transação válida encontrada no CSV.', 'error');

        abrirModal({
            titulo: '📥 Importar CSV',
            mensagem: `Foram encontradas <b>${transacoes.length} transações</b>. As categorias foram atribuídas automaticamente. Deseja importar?`,
            confirmLabel: 'Importar',
            confirmStyle: 'primary',
            onConfirm: () => {
                const usr = db.usuarios[usuarioLogado];
                transacoes.forEach(t => {
                    usr.saldo += t.valor;
                    usr.extrato.push(t);
                });
                salvarDB();
                carregarDados();
                showToast(`${transacoes.length} transações importadas!`, 'success');
                verificarConquistas();
            }
        });
    };
    reader.readAsText(arquivo, 'UTF-8');
}
