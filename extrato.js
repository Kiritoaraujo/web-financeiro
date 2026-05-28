let chartExtrato = null;
let filtroMes = 'todos';
let filtroTipo = 'todos';
let edicaoId = null;

function atualizarCategorias() {
    const tipo = document.getElementById('trans-tipo').value;
    const catSelect = document.getElementById('trans-categoria');
    if (tipo === 'receita') {
        catSelect.innerHTML = `
            <option value="salario">Salário</option>
            <option value="investimento">Investimentos</option>
            <option value="venda">Vendas</option>
            <option value="outros">Outros</option>
            <option value="personalizada">Personalizada</option>`;
    } else {
        catSelect.innerHTML = `
            <option value="alimentacao">Alimentação</option>
            <option value="transporte">Transporte</option>
            <option value="lazer">Lazer</option>
            <option value="contas">Contas</option>
            <option value="outros">Outros</option>
            <option value="personalizada">Personalizada</option>`;
    }
    checarCategoriaPersonalizada();
}

function checarCategoriaPersonalizada() {
    const categoria = document.getElementById('trans-categoria').value;
    const div = document.getElementById('div-categoria-personalizada');
    if (categoria === 'personalizada') {
        div.style.display = 'flex';
    } else {
        div.style.display = 'none';
        document.getElementById('trans-categoria-personalizada').value = '';
    }
}

function formatarMoedaInput(event) {
    const raw = event.target.value.trim();
    if (!raw) return;
    const valor = parseMoeda(raw);
    if (isNaN(valor) || valor <= 0) { event.target.value = ''; return; }
    event.target.value = valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseMoeda(valor) {
    if (!valor && valor !== 0) return NaN;
    const s = String(valor).trim();
    // Remove R$, spaces
    const limpo = s.replace(/R\$\s*/g, '').trim();
    // Formato pt-BR: 1.600,50 → has both dot and comma
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(limpo)) {
        return parseFloat(limpo.replace(/\./g, '').replace(',', '.'));
    }
    // Comma as decimal: 1600,50
    if (/^\d+(,\d{1,2})$/.test(limpo)) {
        return parseFloat(limpo.replace(',', '.'));
    }
    // Plain integer or float: 1600 or 1600.50
    const n = parseFloat(limpo.replace(',', '.'));
    return isNaN(n) ? NaN : n;
}

function prepararTransacaoParaCadastro() {
    const campo = document.getElementById('trans-valor');
    if (!campo) return;
    campo.addEventListener('blur', formatarMoedaInput);
    campo.addEventListener('focus', (e) => {
        // Strip formatting back to plain number for editing
        const val = parseMoeda(e.target.value);
        e.target.value = isNaN(val) ? '' : val;
    });
}

function adicionarTransacao(e) {
    e.preventDefault();
    const desc = document.getElementById('trans-desc').value.trim();
    const valor = parseMoeda(document.getElementById('trans-valor').value);
    const data = document.getElementById('trans-data').value;
    const tipo = document.getElementById('trans-tipo').value;
    let categoria = document.getElementById('trans-categoria').value;
    const catPersonalizada = document.getElementById('trans-categoria-personalizada').value.trim();

    if (categoria === 'personalizada' && catPersonalizada) {
        categoria = catPersonalizada;
    }

    if (!desc || isNaN(valor) || valor <= 0 || !data) return showToast('Preencha corretamente!', 'error');

    const valorFinal = tipo === 'despesa' ? -valor : valor;
    const usr = db.usuarios[usuarioLogado];

    if (edicaoId) {
        const trans = usr.extrato.find(t => t.id === edicaoId);
        if (!trans) return showToast('Transação não encontrada.', 'error');
        // Remove o efeito da transação antiga do saldo
        usr.saldo -= trans.valor;
        // Atualiza dados
        trans.desc = desc;
        trans.valor = valorFinal;
        trans.data = data;
        trans.tipo = tipo;
        trans.categoria = categoria;
        // Aplica o novo valor ao saldo
        usr.saldo += valorFinal;
        showToast('Transação atualizada!', 'success');
    } else {
        // Nova transação
        const transId = Date.now() + Math.random();
        usr.saldo += valorFinal;
        usr.extrato.push({ id: transId, desc, valor: valorFinal, data, tipo, categoria });
        showToast('Lançamento Adicionado!', 'success');
        // Verificar Pokémon Shiny
        processarEasterEggsTransacao(transId);
    }

    salvarDB();
    e.target.reset();
    edicaoId = null;
    document.getElementById('btn-adicionar-trans').innerText = 'Adicionar';
    document.getElementById('btn-cancelar-edicao').style.display = 'none';
    atualizarCategorias();
    // Adiciona XP pela ação
    adicionarXP(10);
    carregarDados();
}

function editarTransacao(id) {
    const usr = db.usuarios[usuarioLogado];
    const trans = usr.extrato.find(t => t.id === id);
    if (!trans) return showToast('Transação não encontrada', 'error');

    edicaoId = id;
    document.getElementById('trans-desc').value = trans.desc;
    document.getElementById('trans-valor').value = trans.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('trans-data').value = trans.data;
    document.getElementById('trans-tipo').value = trans.tipo;
    atualizarCategorias();

    const catSelect = document.getElementById('trans-categoria');
    const opGlobal = Array.from(catSelect.options).find(o => o.value === trans.categoria);
    if (opGlobal) {
        catSelect.value = trans.categoria;
    } else {
        catSelect.value = 'personalizada';
        document.getElementById('trans-categoria-personalizada').value = trans.categoria;
    }
    checarCategoriaPersonalizada();

    document.getElementById('btn-adicionar-trans').innerText = 'Salvar edição';
    document.getElementById('btn-cancelar-edicao').style.display = 'block';
}

function cancelarEdicao() {
    edicaoId = null;
    document.getElementById('form-transacao').reset();
    document.getElementById('btn-adicionar-trans').innerText = 'Adicionar';
    document.getElementById('btn-cancelar-edicao').style.display = 'none';
    document.getElementById('div-categoria-personalizada').style.display = 'none';
    atualizarCategorias();
}

function excluirTransacao(id) {
    const usr = db.usuarios[usuarioLogado];
    const trans = usr.extrato.find(t => t.id === id);
    if (!trans) return showToast('Transação não encontrada.', 'error');

    abrirModal({
        titulo: 'Excluir transação?',
        mensagem: `Deseja excluir "<b>${trans.desc}</b>"? Esta ação não pode ser desfeita.`,
        confirmLabel: 'Excluir',
        confirmStyle: 'danger',
        onConfirm: () => {
            // Reverte o efeito da transação no saldo
            // Se valor = +100 (receita), saldo -= 100
            // Se valor = -50 (despesa), saldo -= (-50) = saldo += 50
            usr.saldo -= trans.valor;
            usr.extrato = usr.extrato.filter(t => t.id !== id);
            salvarDB();
            carregarDados();
            showToast('Transação excluída!', 'success');
        }
    });
}

function filtrarExtrato() {
    filtroMes = document.getElementById('filtro-mes').value;
    filtroTipo = document.getElementById('filtro-tipo').value;
    renderizarExtrato();
}

function renderizarExtrato() {
    const usr = db.usuarios[usuarioLogado];
    const lista = document.getElementById('lista-extrato');
    if(!lista) return;
    lista.innerHTML = '';

    let despesasPorCategoria = {};

    const items = [...usr.extrato].reverse().filter(t => {
        let okTipo = true;
        let okMes = true;

        if (filtroTipo !== 'todos') okTipo = t.tipo === filtroTipo;
        if (filtroMes === 'atual') {
            const hoje = new Date();
            const anoMesHoje = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
            // Compare prefix directly — avoids UTC date parsing off-by-one
            okMes = t.data.startsWith(anoMesHoje);
        }

        return okTipo && okMes;
    });

    if (items.length === 0) {
        lista.innerHTML = '<p style="text-align:center; margin-top:10px; color:var(--text-sec);">Nenhuma transação nesse filtro.</p>';
    }

    items.forEach(t => {
        const isDespesa = t.tipo === 'despesa';
        if (isDespesa) despesasPorCategoria[t.categoria || 'outros'] = (despesasPorCategoria[t.categoria || 'outros'] || 0) + Math.abs(t.valor);

        lista.innerHTML += `
            <div class="list-item" data-trans-id="${t.id}">
                <div class="info">
                    <h4>${t.desc} <span style="font-size:10px; background:var(--border); padding:2px 5px; border-radius:3px;">${t.categoria || 'geral'}</span></h4>
                    <p>${t.data.split('-').reverse().join('/')}</p>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <h4 style="color:${isDespesa ? 'var(--danger)' : 'var(--success)'}; margin-right: 5px;">R$ ${Math.abs(t.valor).toFixed(2)}</h4>
                    <button data-action="editar" data-id="${t.id}" style="background:none; border:none; color:var(--text-sec); cursor:pointer;"><i class="fas fa-edit"></i></button>
                    <button data-action="excluir" data-id="${t.id}" style="background:none; border:none; color:var(--text-sec); cursor:pointer;"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    });

    const canvas = document.getElementById('grafico-categorias');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (chartExtrato) chartExtrato.destroy();

        const labels = Object.keys(despesasPorCategoria).map(c => c.toUpperCase());
        const data = Object.values(despesasPorCategoria);

        if(data.length > 0) {
            canvas.style.display = 'block';
            chartExtrato = new Chart(ctx, {
                type: 'doughnut',
                data: { labels: labels, datasets: [{ data: data, backgroundColor: ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#9b59b6'], borderWidth: 0 }] },
                options: { plugins: { legend: { labels: { color: document.body.classList.contains('dark-theme') ? '#fff' : '#333' } } } }
            });
        } else {
            canvas.style.display = 'none';
        }
    }
}

function exportarDados() {
    const usr = db.usuarios[usuarioLogado];
    if (!usr.extrato || usr.extrato.length === 0) return showToast('Sem dados para exportar.', 'error');
    let csv = 'Data,Descricao,Categoria,Tipo,Valor\n';
    usr.extrato.forEach(t => csv += `${t.data},"${t.desc}","${t.categoria || ''}",${t.tipo},${Math.abs(t.valor).toFixed(2).replace('.', ',')}\n`);
    const link = document.createElement('a');
    link.href = encodeURI('data:text/csv;charset=utf-8,' + csv);
    link.download = `extrato_${usuarioLogado}.csv`;
    link.click();
}

prepararTransacaoParaCadastro();

// Event delegation for extrato list buttons (IDs contain decimals, can't use inline onclick)
document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = parseFloat(btn.dataset.id);
    if (action === 'editar') editarTransacao(id);
    else if (action === 'excluir') excluirTransacao(id);
});