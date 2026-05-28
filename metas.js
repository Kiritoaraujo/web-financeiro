function adicionarMeta(e) {
    e.preventDefault();
    const nome = document.getElementById('meta-nome').value.trim();
    const valorAlvo = parseMoeda(document.getElementById('meta-valor').value);
    if (!nome || isNaN(valorAlvo) || valorAlvo <= 0) return showToast('Dados inválidos!', 'error');

    const usr = db.usuarios[usuarioLogado];
    usr.metas.push({ id: Date.now(), nome, valorAlvo, valorArrecadado: 0 });
    salvarDB();
    e.target.reset();
    carregarDados();
    adicionarXP(20); // +20 XP ao criar meta
    showToast('Meta criada!', 'success');
    verificarConquistas();
}

document.addEventListener('DOMContentLoaded', () => {
    const campoMeta = document.getElementById('meta-valor');
    if (campoMeta) {
        campoMeta.addEventListener('blur', (event) => {
            const valor = parseMoeda(event.target.value);
            if (!isNaN(valor) && valor > 0)
                event.target.value = valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        });
        campoMeta.addEventListener('focus', (event) => {
            const val = parseMoeda(event.target.value);
            event.target.value = isNaN(val) ? '' : val;
        });
    }
});

function depositarMeta(id) {
    const usr = db.usuarios[usuarioLogado];
    const meta = usr.metas.find(m => m.id === id);
    if (!meta) return;

    abrirModalInput({
        titulo: 'Depositar em "' + meta.nome + '"',
        mensagem: 'Saldo disponível: <b>R$ ' + usr.saldo.toFixed(2) + '</b>',
        placeholder: 'Valor do depósito (R$)',
        confirmLabel: 'Depositar',
        onConfirm: (val) => {
            const valorDeposito = parseFloat(String(val).replace(',', '.'));
            if (isNaN(valorDeposito) || valorDeposito <= 0) return showToast("Valor inválido.", "error");
            
            // Verificar Modo Julius para despesa potencial
            if (!verificarModoJulius(valorDeposito)) return;
            
            usr.saldo -= valorDeposito;
            meta.valorArrecadado = (meta.valorArrecadado || 0) + valorDeposito;
            salvarDB();
            carregarDados();

            const pct = (meta.valorArrecadado / (meta.valorAlvo || meta.valor || 1)) * 100;
            if (pct >= 100) {
                dispararConfete();
                showToast('🎉 Meta "' + meta.nome + '" concluída! Parabéns!', 'success');
                verificarConquistas();
            } else {
                showToast('Depósito realizado! ' + Math.min(pct, 100).toFixed(0) + '% concluído', 'success');
            }
        }
    });
}

function resgatarMeta(id) {
    const usr = db.usuarios[usuarioLogado];
    const meta = usr.metas.find(m => m.id === id);
    if (!meta) return;

    abrirModal({
        titulo: 'Resgatar meta?',
        mensagem: 'Deseja resgatar "<b>' + meta.nome + '</b>"? O valor de <b>R$ ' + (meta.valorArrecadado || 0).toFixed(2) + '</b> voltará ao seu saldo.',
        confirmLabel: 'Resgatar',
        confirmStyle: 'success',
        onConfirm: () => {
            const index = usr.metas.findIndex(m => m.id === id);
            if (index > -1) {
                usr.saldo += (usr.metas[index].valorArrecadado || usr.metas[index].valor || 0);
                usr.metas.splice(index, 1);
                salvarDB();
                carregarDados();
                showToast("Meta resgatada!", "success");
            }
        }
    });
}

function renderizarMetas() {
    const usr = db.usuarios[usuarioLogado];
    const lista = document.getElementById('lista-metas');
    if (!lista) return;
    lista.innerHTML = '';

    if (!usr.metas || usr.metas.length === 0) {
        lista.innerHTML = '<p style="text-align:center;color:var(--text-sec);margin-top:10px;">Nenhuma meta criada ainda.</p>';
        return;
    }

    usr.metas.forEach(m => {
        const alvo       = m.valorAlvo || m.valor || 1;
        const arrecadado = m.valorArrecadado || 0;
        const pct        = Math.min((arrecadado / alvo) * 100, 100);
        const concluida  = pct >= 100;

        lista.innerHTML += `
            <div class="list-item" style="flex-direction:column;align-items:stretch;${concluida ? 'border-color:var(--success);' : ''}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <h4>${m.nome} ${concluida ? '✅' : ''}</h4>
                        <p>${formatarValorApresentacao(arrecadado).replace('R$ ','R$ ')} / R$ ${alvo.toFixed(2)} &bull; ${pct.toFixed(0)}%</p>
                    </div>
                    <div style="display:flex;gap:6px;">
                        <button onclick="depositarMeta(${m.id})" style="background:var(--primary);color:white;border:none;padding:6px 10px;border-radius:8px;cursor:pointer;"><i class="fas fa-plus"></i></button>
                        <button onclick="resgatarMeta(${m.id})" style="background:var(--danger);color:white;border:none;padding:6px 10px;border-radius:8px;cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="progress-bg">
                    <div class="progress-fill" style="width:${pct}%;${concluida ? 'background:var(--success);' : ''}"></div>
                </div>
            </div>`;
    });
}
