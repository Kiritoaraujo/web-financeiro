let chartInvest = null;

function verificarNovoFundo() {
    const val = document.getElementById('inv-select').value;
    document.getElementById('div-inv-nome').style.display = val === 'novo' ? 'flex' : 'none';
}

function carregarSelectInvestimentos() {
    const usr = db.usuarios[usuarioLogado];
    const select = document.getElementById('inv-select');
    if (!select) return;
    select.innerHTML = '<option value="novo">+ Adicionar Novo Fundo</option>';
    usr.investimentos.forEach(inv => select.innerHTML += '<option value="' + inv.nome + '">' + inv.nome + '</option>');
    verificarNovoFundo();
}

function adicionarInvestimento(e) {
    e.preventDefault();
    const sel   = document.getElementById('inv-select').value;
    const nome  = sel === 'novo' ? document.getElementById('inv-nome').value.toUpperCase().trim() : sel;
    const qtd   = parseInt(document.getElementById('inv-qtd').value);
    const preco = parseFloat(document.getElementById('inv-preco').value);
    const data  = new Date().toISOString().split('T')[0];

    if (!nome || isNaN(qtd) || isNaN(preco)) return showToast("Dados inválidos!", "error");

    const usr = db.usuarios[usuarioLogado];
    let fundo = usr.investimentos.find(i => i.nome === nome);
    if (!fundo) { fundo = { nome, historico: [], evolucao: [] }; usr.investimentos.push(fundo); }
    if (!fundo.evolucao) fundo.evolucao = [];

    usr.saldo -= (qtd * preco);
    for (let i = 0; i < qtd; i++) fundo.historico.push(preco);

    // Salva ponto de evolução (data + preço médio atual)
    const media = fundo.historico.reduce((a, b) => a + b, 0) / fundo.historico.length;
    fundo.evolucao.push({ data, media: parseFloat(media.toFixed(2)), qtd: fundo.historico.length });

    salvarDB();
    e.target.reset();
    carregarDados();
    adicionarXP(30); // +30 XP ao registrar investimento
    showToast("Compra registrada!", "success");
    verificarConquistas();
}

function excluirFundo(nome) {
    abrirModal({
        titulo: 'Excluir fundo?',
        mensagem: 'Deseja excluir o fundo <b>' + nome + '</b>? O histórico será perdido.',
        confirmLabel: 'Excluir',
        confirmStyle: 'danger',
        onConfirm: () => {
            const usr = db.usuarios[usuarioLogado];
            usr.investimentos = usr.investimentos.filter(i => i.nome !== nome);
            salvarDB();
            carregarDados();
            showToast(nome + ' removido!', 'success');
        }
    });
}

function verHistoricoFundo(nome) {
    const usr = db.usuarios[usuarioLogado];
    const fundo = usr.investimentos.find(i => i.nome === nome);
    if (!fundo) return;

    const evolucao = fundo.evolucao || [];
    const linhas = evolucao.length === 0
        ? '<p style="color:var(--text-sec);">Sem histórico disponível.</p>'
        : evolucao.map(p => `
            <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px;">
                <span>${p.data.split('-').reverse().join('/')}</span>
                <span>${p.qtd} cota(s)</span>
                <span style="color:var(--primary);font-weight:bold;">Média: R$ ${p.media.toFixed(2)}</span>
            </div>`).join('');

    abrirModal({
        titulo: '📈 Histórico ' + nome,
        mensagem: '<div style="max-height:250px;overflow-y:auto;">' + linhas + '</div>',
        confirmLabel: 'Fechar',
        confirmStyle: 'primary',
        onConfirm: () => {}
    });
}

function renderizarInvestimentos() {
    const usr = db.usuarios[usuarioLogado];
    const lista = document.getElementById('lista-invest');
    if (!lista) return;
    lista.innerHTML = '';

    if (!usr.investimentos || usr.investimentos.length === 0) {
        lista.innerHTML = '<p style="text-align:center;color:var(--text-sec);margin-top:10px;">Nenhum investimento registrado.</p>';
    }

    usr.investimentos.forEach(f => {
        const qtd   = f.historico.length;
        const media = qtd ? f.historico.reduce((a, b) => a + b, 0) / qtd : 0;
        const total = media * qtd;

        lista.innerHTML += `
            <div class="list-item">
                <div style="width:100%;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <h4>${f.nome}</h4>
                        <div style="display:flex;gap:6px;">
                            <button onclick="verHistoricoFundo('${f.nome}')" style="background:none;border:none;color:var(--primary);cursor:pointer;" title="Histórico">
                                <i class="fas fa-history"></i>
                            </button>
                            <button onclick="excluirFundo('${f.nome}')" style="background:none;border:none;color:var(--danger);cursor:pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:12px;color:var(--text-sec);margin-top:6px;">
                        <span>Cotas: <b style="color:var(--text-main);">${qtd}</b></span>
                        <span>Médio: <b style="color:var(--primary);">${formatarValorApresentacao(media)}</b></span>
                        <span>Total: <b style="color:var(--success);">${formatarValorApresentacao(total)}</b></span>
                    </div>
                </div>
            </div>`;
    });

    // Gráfico de preço médio
    const canvas = document.getElementById('grafico-invest');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (chartInvest) chartInvest.destroy();
        const labels = usr.investimentos.map(f => f.nome);
        const data   = usr.investimentos.map(f => f.historico.length ? (f.historico.reduce((a,b)=>a+b,0)/f.historico.length) : 0);
        const isDark = document.body.classList.contains('dark-theme');
        const tickColor = isDark ? '#fff' : '#333';

        if (data.length > 0) {
            canvas.style.display = 'block';
            chartInvest = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Preço Médio (R$)',
                        data,
                        backgroundColor: labels.map((_, i) =>
                            ['#3a8ef6','#ff4757','#2ed573','#ffa502','#a29bfe','#fd79a8'][i % 6]),
                        borderRadius: 8,
                    }]
                },
                options: {
                    plugins: { legend: { labels: { color: tickColor } } },
                    scales: {
                        y: { ticks: { color: tickColor }, grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } },
                        x: { ticks: { color: tickColor }, grid: { display: false } }
                    }
                }
            });
        } else {
            canvas.style.display = 'none';
        }
    }
}
