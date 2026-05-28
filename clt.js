function calcularCLT() {
    const salario = parseFloat(document.getElementById('clt-salario').value) || 0;
    const dias = parseFloat(document.getElementById('clt-dias').value) || 0;
    const condução = parseFloat(document.getElementById('clt-conducao').value) || 0;
    const refeicao = parseFloat(document.getElementById('clt-refeicao').value) || 0;

    if (salario <= 0 || dias <= 0) return showToast('Informe salário e dias trabalhados!', 'error');

    // Track usage for achievement
    if (usuarioLogado) {
        const usr = db.usuarios[usuarioLogado];
        usr.cltUsado = (usr.cltUsado || 0) + 1;
        salvarDB();
        verificarConquistas();
    }

    const totalConducao = dias * condução;
    const totalRefeicao = dias * refeicao;
    const salarioBrutoTotal = salario + totalConducao + totalRefeicao;

    const divRes = document.getElementById('resultado-clt');
    divRes.style.display = 'block';
    divRes.innerHTML = `
        <h4 style="margin-bottom:10px;">Resumo (bruto sem descontos)</h4>
        <p style="display:flex; justify-content:space-between;">Salário base: <span>R$ ${salario.toFixed(2)}</span></p>
        <p style="display:flex; justify-content:space-between;">Condução (${dias} dias): <span>R$ ${totalConducao.toFixed(2)}</span></p>
        <p style="display:flex; justify-content:space-between;">Vale-refeição (${dias} dias): <span>R$ ${totalRefeicao.toFixed(2)}</span></p>
        <hr style="margin:10px 0; border:1px solid var(--border);">
        <p style="display:flex; justify-content:space-between; font-weight:bold; color:var(--success);">Total a receber (bruto): <span>R$ ${salarioBrutoTotal.toFixed(2)}</span></p>
        <div style="display:flex;gap:10px;margin-top:15px;">
            <button onclick="registrarCLTNoExtrato(${salarioBrutoTotal})" class="btn-primary" style="flex:1;font-size:12px;">
                <i class="fas fa-plus"></i> Registrar no Extrato
            </button>
        </div>
    `;
}

function registrarCLTNoExtrato(valor) {
    const usr = db.usuarios[usuarioLogado];
    const hoje = new Date();
    const data = hoje.getFullYear() + '-' + String(hoje.getMonth()+1).padStart(2,'0') + '-' + String(hoje.getDate()).padStart(2,'0');
    
    abrirModal({
        titulo: 'Registrar Salário CLT?',
        mensagem: `Deseja registrar <b>R$ ${valor.toFixed(2)}</b> como receita no extrato?`,
        confirmLabel: 'Registrar',
        confirmStyle: 'success',
        onConfirm: () => {
            usr.saldo += valor;
            usr.extrato.push({
                id: Date.now() + Math.random(),
                desc: 'Salário CLT',
                valor: valor,
                data: data,
                tipo: 'receita',
                categoria: 'salario'
            });
            salvarDB();
            carregarDados();
            showToast('Salário registrado no extrato!', 'success');
            adicionarXP(30);
        }
    });
}

// ── INDEPENDÊNCIA FINANCEIRA ──────────────────────────────────────────────────

function calcularIndependenciaFinanceira() {
    const gastoMensal = parseFloat(document.getElementById('gasto-mensal').value) || 0;
    const taxaAnual = parseFloat(document.getElementById('taxa-retorno-if').value) || 6;
    
    if (gastoMensal <= 0 || taxaAnual <= 0) {
        return showToast('Preencha os valores corretamente!', 'error');
    }
    
    // Fórmula: Patrimônio necessário = (Gasto Mensal × 12) / (Taxa Anual / 100)
    const gastoAnual = gastoMensal * 12;
    const taxaDecimal = taxaAnual / 100;
    const patrimonioNecessario = gastoAnual / taxaDecimal;
    
    // Calculando também a renda mensal esperada
    const rendaMensalEsperada = patrimonioNecessario * (taxaDecimal / 12);
    
    const divRes = document.getElementById('resultado-if');
    divRes.style.display = 'block';
    divRes.innerHTML = `
        <h4 style="margin-bottom:15px;color:var(--primary);">💰 Seu Número (Patrimônio Necessário)</h4>
        <div style="background:var(--input-bg);border-radius:12px;padding:15px;margin-bottom:15px;border:2px solid var(--primary);">
            <p style="font-size:12px;color:var(--text-sec);margin-bottom:8px;">Patrimônio para viver com essa renda:</p>
            <p style="font-size:32px;font-weight:bold;color:var(--primary);">R$ ${patrimonioNecessario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div style="background:var(--success);background:rgba(40,167,69,0.15);border-radius:12px;padding:12px;border:1px solid var(--success);">
                <p style="font-size:11px;color:var(--text-sec);margin-bottom:4px;">Gasto anual</p>
                <b style="color:var(--success);font-size:18px;">R$ ${gastoAnual.toFixed(2)}</b>
            </div>
            <div style="background:var(--primary);background:rgba(58,142,246,0.15);border-radius:12px;padding:12px;border:1px solid var(--primary);">
                <p style="font-size:11px;color:var(--text-sec);margin-bottom:4px;">Renda mensal esperada</p>
                <b style="color:var(--primary);font-size:18px;">R$ ${rendaMensalEsperada.toFixed(2)}</b>
            </div>
        </div>
        
        <div style="margin-top:15px;background:var(--input-bg);border-radius:12px;padding:12px;border:1px solid var(--border);">
            <p style="font-size:12px;color:var(--text-sec);margin-bottom:8px;"><b>Informações:</b></p>
            <ul style="font-size:12px;color:var(--text-sec);margin-left:15px;">
                <li>Assumindo uma taxa de retorno anual de <b>${taxaAnual}%</b></li>
                <li>Seu saldo atual: <b>R$ ${db.usuarios[usuarioLogado].saldo.toFixed(2)}</b></li>
                <li>Falta investir: <b>R$ ${Math.max(0, patrimonioNecessario - db.usuarios[usuarioLogado].saldo).toFixed(2)}</b></li>
            </ul>
        </div>
    `;
}

// ── SIMULADOR DE JUROS COMPOSTOS ──────────────────────────────────────────────

function calcularJurosCompostos() {
    const aporteMensal = parseFloat(document.getElementById('aporte-mensal').value) || 0;
    const taxaAnual = parseFloat(document.getElementById('taxa-retorno-jc').value) || 10;
    const anos = parseInt(document.getElementById('anos-jc').value) || 10;
    
    if (aporteMensal <= 0 || taxaAnual <= 0 || anos <= 0) {
        return showToast('Preencha os valores corretamente!', 'error');
    }
    
    // Fórmula de juros compostos com aporte mensal
    // VF = PMT × [((1 + i)^n - 1) / i]
    const taxaMensal = taxaAnual / 100 / 12;
    const meses = anos * 12;
    
    let saldo = 0;
    const historico = [];
    
    for (let mes = 1; mes <= meses; mes++) {
        saldo = saldo * (1 + taxaMensal) + aporteMensal;
        
        // Guarda resultado a cada ano
        if (mes % 12 === 0) {
            historico.push({
                ano: mes / 12,
                saldo: saldo,
                aportesTotal: mes * aporteMensal
            });
        }
    }
    
    const aporteTotal = aporteMensal * meses;
    const rendimentoTotal = saldo - aporteTotal;
    
    const divRes = document.getElementById('resultado-jc');
    divRes.style.display = 'block';
    
    const tabelaHistorico = historico.map(h => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:12px;">
            <span><b>Ano ${h.ano}</b></span>
            <span style="color:var(--primary);font-weight:bold;">R$ ${h.saldo.toFixed(2)}</span>
        </div>
    `).join('');
    
    divRes.innerHTML = `
        <h4 style="margin-bottom:15px;color:var(--primary);">📈 Simulação de Juros Compostos</h4>
        <div style="background:var(--input-bg);border-radius:12px;padding:15px;margin-bottom:15px;border:2px solid var(--success);">
            <p style="font-size:12px;color:var(--text-sec);margin-bottom:8px;">Saldo final em ${anos} anos:</p>
            <p style="font-size:32px;font-weight:bold;color:var(--success);">R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">
            <div style="background:rgba(58,142,246,0.15);border-radius:12px;padding:12px;border:1px solid var(--primary);">
                <p style="font-size:11px;color:var(--text-sec);margin-bottom:4px;">Aporte total</p>
                <b style="color:var(--primary);font-size:18px;">R$ ${aporteTotal.toFixed(2)}</b>
            </div>
            <div style="background:rgba(40,167,69,0.15);border-radius:12px;padding:12px;border:1px solid var(--success);">
                <p style="font-size:11px;color:var(--text-sec);margin-bottom:4px;">Rendimento</p>
                <b style="color:var(--success);font-size:18px;">R$ ${rendimentoTotal.toFixed(2)}</b>
            </div>
        </div>
        
        <div style="background:var(--input-bg);border-radius:12px;padding:12px;border:1px solid var(--border);">
            <p style="font-size:13px;font-weight:bold;color:var(--text-main);margin-bottom:10px;">Evolução anual:</p>
            <div style="max-height:200px;overflow-y:auto;">
                ${tabelaHistorico}
            </div>
        </div>
        
        <p style="font-size:11px;color:var(--text-sec);margin-top:12px;text-align:center;">
            💡 Aportando <b>R$ ${aporteMensal.toFixed(2)}/mês</b> com <b>${taxaAnual}%</b> ao ano
        </p>
    `;
}
