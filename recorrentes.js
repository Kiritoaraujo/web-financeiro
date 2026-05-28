// ── TRANSAÇÕES RECORRENTES ────────────────────────────────────────────────────

function adicionarRecorrente(e) {
    e.preventDefault();
    const desc  = document.getElementById('rec-desc').value.trim();
    const valor = parseMoeda(document.getElementById('rec-valor').value);
    const tipo  = document.getElementById('rec-tipo').value;
    const dia   = parseInt(document.getElementById('rec-dia').value);
    let categoria = document.getElementById('rec-categoria').value;

    if (!desc || isNaN(valor) || valor <= 0 || isNaN(dia) || dia < 1 || dia > 28)
        return showToast('Preencha corretamente! Dia deve ser entre 1 e 28.', 'error');

    const usr = db.usuarios[usuarioLogado];
    usr.recorrentes.push({ id: Date.now(), desc, valor, tipo, dia, categoria, ativo: true });
    salvarDB();
    e.target.reset();
    renderizarRecorrentes();
    adicionarXP(15); // +15 XP ao criar recorrente
    showToast('Transação recorrente criada!', 'success');
}

function toggleRecorrente(id) {
    const usr = db.usuarios[usuarioLogado];
    const rec = usr.recorrentes.find(r => r.id === id);
    if (!rec) return;
    rec.ativo = !rec.ativo;
    salvarDB();
    renderizarRecorrentes();
    showToast(rec.ativo ? 'Recorrente ativada!' : 'Recorrente pausada!', 'info');
}

function excluirRecorrente(id) {
    const usr = db.usuarios[usuarioLogado];
    const rec = usr.recorrentes.find(r => r.id === id);
    if (!rec) return;
    abrirModal({
        titulo: 'Remover recorrente?',
        mensagem: `Deseja remover "<b>${rec.desc}</b>"? Ela não será mais lançada automaticamente.`,
        confirmLabel: 'Remover',
        confirmStyle: 'danger',
        onConfirm: () => {
            usr.recorrentes = usr.recorrentes.filter(r => r.id !== id);
            salvarDB();
            renderizarRecorrentes();
            showToast('Recorrente removida!', 'success');
        }
    });
}

function processarRecorrentes() {
    const usr = db.usuarios[usuarioLogado];
    if (!usr.recorrentes || usr.recorrentes.length === 0) return;

    const hoje = new Date();
    const mesAtual = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');

    usr.recorrentes.forEach(rec => {
        if (!rec.ativo) return;
        // Verifica se já foi lançada esse mês
        const jaLancada = usr.extrato.some(t =>
            t.recorrenteId === rec.id && t.data.startsWith(mesAtual)
        );
        if (jaLancada) return;

        // Lança apenas se o dia já passou ou é hoje
        if (hoje.getDate() >= rec.dia) {
            const dataLancamento = mesAtual + '-' + String(rec.dia).padStart(2, '0');
            const valorFinal = rec.tipo === 'despesa' ? -Math.abs(rec.valor) : Math.abs(rec.valor);
            usr.saldo += valorFinal;
            usr.extrato.push({
                id: Date.now() + Math.random(),
                desc: rec.desc + ' (recorrente)',
                valor: valorFinal,
                data: dataLancamento,
                tipo: rec.tipo,
                categoria: rec.categoria,
                recorrenteId: rec.id
            });
            showToast('Lançamento recorrente: ' + rec.desc, 'info');
        }
    });
    salvarDB();
}

function renderizarRecorrentes() {
    const usr = db.usuarios[usuarioLogado];
    const lista = document.getElementById('lista-recorrentes');
    if (!lista) return;
    lista.innerHTML = '';

    if (!usr.recorrentes || usr.recorrentes.length === 0) {
        lista.innerHTML = '<p style="text-align:center;color:var(--text-sec);margin-top:10px;">Nenhuma recorrente cadastrada.</p>';
        return;
    }

    usr.recorrentes.forEach(rec => {
        const isDespesa = rec.tipo === 'despesa';
        lista.innerHTML += `
            <div class="list-item" style="opacity:${rec.ativo ? '1' : '0.5'};">
                <div class="info">
                    <h4>${rec.desc} <span style="font-size:10px;background:var(--border);padding:2px 6px;border-radius:3px;">${rec.categoria}</span></h4>
                    <p>Todo dia ${rec.dia} &bull; ${rec.ativo ? 'Ativa' : 'Pausada'}</p>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <h4 style="color:${isDespesa ? 'var(--danger)' : 'var(--success)'};">
                        ${isDespesa ? '-' : '+'}R$ ${rec.valor.toFixed(2)}
                    </h4>
                    <button onclick="toggleRecorrente(${rec.id})" style="background:none;border:none;color:var(--primary);cursor:pointer;">
                        <i class="fas fa-${rec.ativo ? 'pause' : 'play'}"></i>
                    </button>
                    <button onclick="excluirRecorrente(${rec.id})" style="background:none;border:none;color:var(--danger);cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
    });
}
