// Funções Auxiliares para Armazenamento Local (localStorage)
function salvarDados(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
}

function carregarDados(chave) {
    const dados = localStorage.getItem(chave);
    return dados ? JSON.parse(dados) : [];
}

function carregarValor(chave) {
    const valor = localStorage.getItem(chave);
    return valor ? parseFloat(valor) : 0;
}

function salvarValor(chave, valor) {
    localStorage.setItem(chave, valor.toString());
}

// Função para formatar valores como moeda BRL
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ESTADOS GLOBAIS (Carregados do localStorage)
let clientes = carregarDados('clientes');
let fornecedores = carregarDados('fornecedores');
let produtos = carregarDados('produtos');
let capitalSocial = carregarValor('capitalSocial');
let bens = carregarDados('bens');
let compras = carregarDados('compras');
let vendas = carregarDados('vendas');
let estoque = carregarDados('estoque'); // Contém {nome, quantidade, custoTotal}
let caixa = carregarValor('caixa'); // Dinheiro disponível
let contasAReceber = carregarValor('contasAReceber'); // Vendas a prazo
let contasAPagarMercadorias = carregarValor('contasAPagarMercadorias'); // Compras de mercadorias a prazo
let contasAPagarBens = carregarValor('contasAPagarBens'); // Compra de bens a prazo
let resultadoAcumulado = carregarValor('resultadoAcumulado'); // Lucros/Prejuízos

// --- Funções de População de Selects ---
function popularSelectClientes() {
    const select = document.getElementById('vendaCliente');
    select.innerHTML = '<option value="" disabled selected>Selecione o Cliente</option>';
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.nome;
        option.textContent = cliente.nome;
        select.appendChild(option);
    });
}

function popularSelectFornecedores() {
    const select = document.getElementById('produtoFornecedor');
    select.innerHTML = '<option value="" disabled selected>Selecione o Fornecedor</option>';
    fornecedores.forEach(fornecedor => {
        const option = document.createElement('option');
        option.value = fornecedor.nome;
        option.textContent = fornecedor.nome;
        select.appendChild(option);
    });
    // Também popula o campo de fornecedor de bens, se houver um select
    const bemFornecedorInput = document.getElementById('bemFornecedor');
    if (bemFornecedorInput.tagName === 'SELECT') { // Se for um select, popula
        bemFornecedorInput.innerHTML = '<option value="" disabled selected>Selecione o Fornecedor</option>';
        fornecedores.forEach(fornecedor => {
            const option = document.createElement('option');
            option.value = fornecedor.nome;
            option.textContent = fornecedor.nome;
            bemFornecedorInput.appendChild(option);
        });
    }
}


function popularSelectProdutos() {
    const compraSelect = document.getElementById('compraProduto');
    const vendaSelect = document.getElementById('vendaProduto');

    compraSelect.innerHTML = '<option value="" disabled selected>Selecione o Produto</option>';
    vendaSelect.innerHTML = '<option value="" disabled selected>Selecione o Produto</option>';

    produtos.forEach(produto => {
        const optionCompra = document.createElement('option');
        optionCompra.value = produto.nome;
        optionCompra.textContent = produto.nome;
        compraSelect.appendChild(optionCompra);

        const optionVenda = document.createElement('option');
        optionVenda.value = produto.nome;
        optionVenda.textContent = produto.nome;
        vendaSelect.appendChild(optionVenda);
    });
}

// --- Funções de Envio de Formulários ---

// CADASTROS
document.getElementById('formCliente').addEventListener('submit', e => {
    e.preventDefault();
    const novoCliente = {
        nome: document.getElementById('clienteNome').value,
        cpf: document.getElementById('clienteCPF').value,
        cidade: document.getElementById('clienteCidade').value,
        estado: document.getElementById('clienteEstado').value
    };
    clientes.push(novoCliente);
    salvarDados('clientes', clientes);
    alert('Cliente cadastrado!');
    e.target.reset();
    popularSelectClientes();
});

document.getElementById('formFornecedor').addEventListener('submit', e => {
    e.preventDefault();
    const novoFornecedor = {
        nome: document.getElementById('fornecedorNome').value,
        cnpj: document.getElementById('fornecedorCNPJ').value,
        cidade: document.getElementById('fornecedorCidade').value,
        estado: document.getElementById('fornecedorEstado').value
    };
    fornecedores.push(novoFornecedor);
    salvarDados('fornecedores', fornecedores);
    alert('Fornecedor cadastrado!');
    e.target.reset();
    popularSelectFornecedores();
});

document.getElementById('formProduto').addEventListener('submit', e => {
    e.preventDefault();
    const novoProduto = {
        nome: document.getElementById('produtoNome').value,
        fornecedor: document.getElementById('produtoFornecedor').value
    };
    produtos.push(novoProduto);
    salvarDados('produtos', produtos);
    alert('Produto cadastrado!');
    e.target.reset();
    popularSelectProdutos();
});

document.getElementById('formCapitalSocial').addEventListener('submit', e => {
    e.preventDefault();
    const valor = parseFloat(document.getElementById('valorCapitalSocial').value);
    if (isNaN(valor) || valor <= 0) {
        alert('Por favor, insira um valor válido para o Capital Social.');
        return;
    }
    capitalSocial = valor;
    salvarValor('capitalSocial', capitalSocial);
    // Adiciona o capital inicial ao caixa.
    caixa += valor;
    salvarValor('caixa', caixa);
    
    // O resultadoAcumulado DEVE COMEÇAR EM ZERO e só mudar com lucros/prejuízos de vendas.
    // Não se adiciona o Capital Social a ele, pois Capital Social já é uma conta do PL.
    // Garanta que `resultadoAcumulado` seja inicializado com 0,00 no `carregarValor` e `btnZerarDados`.

    alert('Capital Social definido e adicionado ao caixa!');
    e.target.reset();
    atualizarTodosRelatorios();
});

document.getElementById('formBem').addEventListener('submit', e => {
    e.preventDefault();
    const valor = parseFloat(document.getElementById('bemValor').value);
    const formaPagamento = document.getElementById('bemFormaPagamento').value;

    if (isNaN(valor) || valor <= 0) {
        alert('Por favor, insira um valor válido para o bem.');
        return;
    }

    if (formaPagamento === 'À Vista' && caixa < valor) {
        alert('Saldo insuficiente em caixa para adquirir este bem à vista.');
        return;
    }

    const novoBem = {
        nome: document.getElementById('bemNome').value,
        valor: valor,
        dataAquisicao: document.getElementById('bemDataAquisicao').value,
        formaPagamento: formaPagamento,
        dataVencimento: (formaPagamento === 'A Prazo') ? document.getElementById('bemDataVencimento')?.value || null : null,
        fornecedor: document.getElementById('bemFornecedor').value,
        tipo: document.getElementById('bemTipo').value
    };
    bens.push(novoBem);
    salvarDados('bens', bens);

    if (formaPagamento === 'À Vista') {
        caixa -= valor;
        salvarValor('caixa', caixa);
    } else { // A Prazo
        contasAPagarBens += valor;
        salvarValor('contasAPagarBens', contasAPagarBens);
    }

    alert('Bem cadastrado!');
    e.target.reset();
    atualizarTodosRelatorios();
});

// COMPRAS (de Mercadorias)
document.getElementById('formCompra').addEventListener('submit', e => {
    e.preventDefault();
    const inputQuantidade = document.getElementById('compraQuantidade').value;
    const inputPreco = document.getElementById('compraPrecoCompra').value;
    const inputIcms = document.getElementById('compraICMS').value;

    const quantidade = parseFloat(inputQuantidade); // Use parseFloat para quantidade se ela puder ser decimal
    const preco = parseFloat(inputPreco);
    const icms = parseFloat(inputIcms);
    const formaPagamento = document.getElementById('compraCreditoDebito').value;
    let caixaAtual = carregarValor('caixa'); // Recarrega para ter o valor mais atualizado

    // Validações
    if (isNaN(quantidade) || quantidade <= 0) {
        alert('Por favor, insira uma quantidade válida e positiva.');
        return;
    }
    if (isNaN(preco) || preco <= 0) {
        alert('Por favor, insira um preço de compra válido e positivo.');
        return;
    }
    if (isNaN(icms) || icms < 0 || icms > 100) {
        alert('Por favor, insira um percentual de ICMS válido (entre 0 e 100).');
        return;
    }

    const custoTotalBruto = quantidade * preco;
    const icmsRecuperar = custoTotalBruto * (icms / 100);
    const custoLiquido = custoTotalBruto - icmsRecuperar; // Custo do produto para o estoque

    if (formaPagamento === 'Débito' && caixaAtual < custoTotalBruto) { // "Débito" = à vista
        alert('Saldo insuficiente em caixa para efetuar esta compra à vista.');
        return;
    }

    // Atualiza o caixa ou contas a pagar
    if (formaPagamento === 'Débito') {
        caixa -= custoTotalBruto; // Saída total do caixa (bruto)
        salvarValor('caixa', caixa);
    } else { // "Crédito" = a prazo
        contasAPagarMercadorias += custoTotalBruto; // Contas a pagar é o valor bruto
        salvarValor('contasAPagarMercadorias', contasAPagarMercadorias);
    }

    // Registra a compra
    const novaCompra = {
        id: Date.now(),
        produto: document.getElementById('compraProduto').value,
        quantidade: quantidade,
        precoUnitario: preco, // Preço unitário bruto
        icms: icms, // Percentual ICMS
        icmsRecuperar: icmsRecuperar, // Valor do ICMS a recuperar
        custoLiquido: custoLiquido, // Custo líquido total para o estoque
        formaPagamento: formaPagamento,
        dataVencimento: (formaPagamento === 'Crédito') ? document.getElementById('compraDataVencimento')?.value || null : null,
        data: new Date().toISOString().split('T')[0]
    };
    compras.push(novaCompra);
    salvarDados('compras', compras);

    // Atualiza estoque (PEPS, LIFO, Custo Médio - aqui é custo médio)
    const produtoNome = novaCompra.produto;
    let produtoNoEstoque = estoque.find(item => item.nome === produtoNome);

    if (produtoNoEstoque) {
        // Atualiza custo médio ponderado
        const novoCustoTotal = produtoNoEstoque.custoTotal + custoLiquido;
        const novaQuantidade = produtoNoEstoque.quantidade + quantidade;
        produtoNoEstoque.custoTotal = novoCustoTotal;
        produtoNoEstoque.quantidade = novaQuantidade;
    } else {
        estoque.push({
            nome: produtoNome,
            quantidade: quantidade,
            custoTotal: custoLiquido // Custo líquido inicial
        });
    }
    salvarDados('estoque', estoque);

    alert('Compra registrada!');
    e.target.reset();
    atualizarTodosRelatorios();
});

// VENDAS
document.getElementById('formVenda').addEventListener('submit', e => {
    e.preventDefault();
    const inputQuantidade = document.getElementById('vendaQuantidade').value;
    const inputPrecoVenda = document.getElementById('vendaPreco').value;
    const inputIcmsVenda = document.getElementById('vendaICMS').value;

    const quantidade = parseFloat(inputQuantidade); // Use parseFloat para quantidade
    const precoVenda = parseFloat(inputPrecoVenda);
    const icmsVenda = parseFloat(inputIcmsVenda);
    const formaPagamento = document.getElementById('vendaPagamento').value;
    
    // Validações
    if (isNaN(quantidade) || quantidade <= 0) {
        alert('Por favor, insira uma quantidade válida e positiva para a venda.');
        return;
    }
    if (isNaN(precoVenda) || precoVenda <= 0) {
        alert('Por favor, insira um preço de venda válido e positivo.');
        return;
    }
    if (isNaN(icmsVenda) || icmsVenda < 0 || icmsVenda > 100) {
        alert('Por favor, insira um percentual de ICMS de venda válido (entre 0 e 100).');
        return;
    }

    // Valida estoque antes de vender
    const produtoVendidoNome = document.getElementById('vendaProduto').value;
    let produtoNoEstoque = estoque.find(item => item.nome === produtoVendidoNome);

    if (!produtoNoEstoque || produtoNoEstoque.quantidade < quantidade) {
        alert('Estoque insuficiente para esta venda!');
        return;
    }

    // Calcula custo da mercadoria vendida (CMV) para o cálculo de lucro
    let custoMercadoriaVendida = 0;
    const custoMedioUnitario = produtoNoEstoque.custoTotal / produtoNoEstoque.quantidade;
    custoMercadoriaVendida = custoMedioUnitario * quantidade;

    // Calcula valores de venda e ICMS
    const valorTotalVendaBruto = precoVenda * quantidade;
    const icmsSobreVenda = valorTotalVendaBruto * (icmsVenda / 100);
    const receitaLiquidaVenda = valorTotalVendaBruto - icmsSobreVenda;

    // Atualiza o caixa ou contas a receber
    if (formaPagamento === 'À Vista') {
        caixa += valorTotalVendaBruto; // Recebimento total bruto da venda
        salvarValor('caixa', caixa);
    } else { // A Prazo
        contasAReceber += valorTotalVendaBruto; // Contas a receber é o valor bruto
        salvarValor('contasAReceber', contasAReceber);
    }

    // Registra a venda
    const novaVenda = {
        id: Date.now(),
        produto: produtoVendidoNome,
        cliente: document.getElementById('vendaCliente').value,
        quantidade: quantidade,
        precoVendaUnitario: precoVenda,
        icms: icmsVenda,
        formaPagamento: formaPagamento,
        dataVencimento: (formaPagamento === 'A Prazo') ? document.getElementById('vendaDataVencimento')?.value || null : null,
        custoMercadoriaVendida: custoMercadoriaVendida,
        icmsSobreVenda: icmsSobreVenda, // Valor do ICMS sobre a venda (despesa)
        valorTotalVendaBruto: valorTotalVendaBruto,
        receitaLiquidaVenda: receitaLiquidaVenda,
        data: new Date().toISOString().split('T')[0]
    };
    vendas.push(novaVenda);
    salvarDados('vendas', vendas);

    // Atualiza estoque (reduz a quantidade e o custo total proporcionalmente)
    produtoNoEstoque.quantidade -= quantidade;
    produtoNoEstoque.custoTotal -= custoMercadoriaVendida;
    salvarDados('estoque', estoque);

    // Atualiza o resultado acumulado (lucro/prejuízo)
    // Lucro = Receita Líquida - Custo da Mercadoria Vendida
    const lucroOperacional = receitaLiquidaVenda - custoMercadoriaVendida;
    resultadoAcumulado += lucroOperacional;
    salvarValor('resultadoAcumulado', resultadoAcumulado);

    alert('Venda registrada!');
    e.target.reset();
    atualizarTodosRelatorios();
});

// --- Funções de Atualização de Relatórios ---

function atualizarTodosRelatorios() {
    const estoqueDados = carregarDados('estoque');
    const comprasAtuais = carregarDados('compras'); // Carrega o estado mais recente
    const vendasAtuais = carregarDados('vendas');   // Carrega o estado mais recente

    // --- Relatório de Estoque ---
    const estoqueBody = document.querySelector('#stock-report tbody');
    estoqueBody.innerHTML = '';
    if (estoqueDados.length === 0) {
        estoqueBody.innerHTML = '<tr><td colspan="3">Nenhum produto em estoque.</td></tr>';
    } else {
        estoqueDados.forEach(item => {
            if (item.quantidade > 0) { // Mostra apenas produtos com estoque positivo
                const custoMedioUnitario = item.custoTotal / item.quantidade;
                estoqueBody.innerHTML += `<tr><td>${item.nome}</td><td>${item.quantidade}</td><td>${formatarMoeda(custoMedioUnitario)}</td></tr>`;
            }
        });
    }

    // --- Relatório de Compras Detalhado ---
    const purchaseBody = document.querySelector('#purchase-report tbody');
    purchaseBody.innerHTML = '';
    if (comprasAtuais.length === 0) {
        purchaseBody.innerHTML = '<tr><td colspan="8">Nenhuma compra registrada.</td></tr>';
    } else {
        comprasAtuais.forEach(compra => {
            const precoUnitarioBruto = compra.precoUnitario || 0;
            const icmsPerc = compra.icms || 0;
            const icmsRecuperarValor = compra.icmsRecuperar || 0;
            const custoLiquidoValor = compra.custoLiquido || 0;

            purchaseBody.innerHTML += `
                <tr>
                    <td>${compra.data}</td>
                    <td>${compra.produto}</td>
                    <td>${compra.quantidade}</td>
                    <td>${formatarMoeda(precoUnitarioBruto)}</td>
                    <td>${icmsPerc.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
                    <td>${formatarMoeda(icmsRecuperarValor)}</td>
                    <td>${formatarMoeda(custoLiquidoValor)}</td>
                    <td>${compra.formaPagamento}</td>
                </tr>
            `;
        });
    }

    // --- Relatório de Vendas ---
    const vendasBody = document.querySelector('#sales-report tbody');
    vendasBody.innerHTML = '';
    if (vendasAtuais.length === 0) {
        vendasBody.innerHTML = '<tr><td colspan="5">Nenhuma venda registrada.</td></tr>';
    } else {
        const vendasAgrupadasParaRelatorio = {};
        vendasAtuais.forEach(v => {
            if (!vendasAgrupadasParaRelatorio[v.produto]) {
                vendasAgrupadasParaRelatorio[v.produto] = {
                    quantidade: 0,
                    valorTotalVendaBruto: 0,
                    icmsSobreVenda: 0,
                    receitaLiquidaVenda: 0
                };
            }
            vendasAgrupadasParaRelatorio[v.produto].quantidade += v.quantidade;
            vendasAgrupadasParaRelatorio[v.produto].valorTotalVendaBruto += (v.valorTotalVendaBruto || (v.quantidade * v.precoVendaUnitario));
            vendasAgrupadasParaRelatorio[v.produto].icmsSobreVenda += (v.icmsSobreVenda || 0);
            vendasAgrupadasParaRelatorio[v.produto].receitaLiquidaVenda += (v.receitaLiquidaVenda || 0);
        });

        for (let produto in vendasAgrupadasParaRelatorio) {
            const info = vendasAgrupadasParaRelatorio[produto];
            vendasBody.innerHTML += `
                <tr>
                    <td>${produto}</td>
                    <td>${info.quantidade}</td>
                    <td>${formatarMoeda(info.valorTotalVendaBruto)}</td>
                    <td>${formatarMoeda(info.icmsSobreVenda)}</td>
                    <td>${formatarMoeda(info.receitaLiquidaVenda)}</td>
                </tr>
            `;
        }
    }

    // --- Relatório de Custo e Lucro ---
    const custoLucroBody = document.querySelector('#cost-profit-report tbody');
    custoLucroBody.innerHTML = '';
    if (vendasAtuais.length === 0) {
        custoLucroBody.innerHTML = '<tr><td colspan="4">Nenhum custo ou lucro para exibir (baseado em vendas).</td></tr>';
    } else {
        const vendasAgrupadasPorProduto = {};
        vendasAtuais.forEach(v => {
            if (!vendasAgrupadasPorProduto[v.produto]) {
                vendasAgrupadasPorProduto[v.produto] = {
                    custoMercadoriaVendida: 0,
                    icmsSobreVenda: 0, // Mantido para referência, mas não usado no cálculo do Lucro Bruto da tabela
                    valorTotalVendaBruto: 0,
                    receitaLiquidaVenda: 0
                };
            }
            vendasAgrupadasPorProduto[v.produto].custoMercadoriaVendida += (v.custoMercadoriaVendida || 0);
            vendasAgrupadasPorProduto[v.produto].icmsSobreVenda += (v.icmsSobreVenda || 0);
            vendasAgrupadasPorProduto[v.produto].valorTotalVendaBruto += (v.valorTotalVendaBruto || (v.quantidade * v.precoVendaUnitario));
            vendasAgrupadasPorProduto[v.produto].receitaLiquidaVenda += (v.receitaLiquidaVenda || 0);
        });

        for (let produto in vendasAgrupadasPorProduto) {
            const info = vendasAgrupadasPorProduto[produto];
            const lucroBruto = info.receitaLiquidaVenda - info.custoMercadoriaVendida;

            custoLucroBody.innerHTML += `
                <tr>
                    <td>${produto}</td>
                    <td>${formatarMoeda(info.receitaLiquidaVenda)}</td>
                    <td>${formatarMoeda(info.custoMercadoriaVendida)}</td>
                    <td>${formatarMoeda(lucroBruto)}</td>
                </tr>
            `;
        }
    }

    // --- Resumo de Impostos (Melhorado) ---
    let totalIcmsRecuperar = comprasAtuais.reduce((sum, c) => sum + (c.icmsRecuperar || 0), 0);
    let totalIcmsSobreVenda = vendasAtuais.reduce((sum, v) => sum + (v.icmsSobreVenda || 0), 0);
    // Saldo de ICMS: ICMS a Pagar (Débito) - ICMS a Recuperar (Crédito)
    let saldoIcms = totalIcmsSobreVenda - totalIcmsRecuperar;

    document.getElementById('totalIcmsRecuperar').textContent = formatarMoeda(totalIcmsRecuperar);
    document.getElementById('totalIcmsSobreVenda').textContent = formatarMoeda(totalIcmsSobreVenda);
    document.getElementById('saldoIcms').textContent = formatarMoeda(saldoIcms);


    // Atualiza o Balanço Patrimonial após todos os outros relatórios
    atualizarBalançoPatrimonial();
}


function atualizarBalançoPatrimonial() {
    // Recarrega todos os valores mais recentes do localStorage
    capitalSocial = carregarValor('capitalSocial');
    caixa = carregarValor('caixa');
    contasAReceber = carregarValor('contasAReceber');
    contasAPagarMercadorias = carregarValor('contasAPagarMercadorias');
    contasAPagarBens = carregarValor('contasAPagarBens');
    resultadoAcumulado = carregarValor('resultadoAcumulado'); // Lucros/Prejuízos Acumulados

    // Ativo
    let totalBensImobilizados = bens.reduce((acc, bem) => acc + bem.valor, 0);
    let totalEstoqueMercadorias = estoque.reduce((acc, item) => acc + (item.custoTotal || 0), 0);

    // ATIVO CIRCULANTE
    let ativoCirculante = caixa + contasAReceber + totalEstoqueMercadorias;

    // ATIVO NÃO CIRCULANTE (IMOBILIZADO)
    let ativoNaoCirculante = totalBensImobilizados;

    // TOTAL ATIVO
    let totalAtivo = ativoCirculante + ativoNaoCirculante;

    // PASSIVO CIRCULANTE
    let passivoCirculante = contasAPagarMercadorias + contasAPagarBens;

    // PATRIMÔNIO LÍQUIDO
    let patrimonioLiquido = capitalSocial + resultadoAcumulado;

    // TOTAL PASSIVO + PL
    let totalPassivoPL = passivoCirculante + patrimonioLiquido;

    // Atualiza a exibição no HTML
    document.getElementById('balancoCaixa').textContent = formatarMoeda(caixa);
    document.getElementById('balancoContasAReceber').textContent = formatarMoeda(contasAReceber);
    document.getElementById('balancoEstoqueMercadorias').textContent = formatarMoeda(totalEstoqueMercadorias);
    document.getElementById('balancoBens').textContent = formatarMoeda(totalBensImobilizados);

    document.getElementById('balancoContasAPagarMercadorias').textContent = formatarMoeda(contasAPagarMercadorias);
    document.getElementById('balancoContasAPagarBens').textContent = formatarMoeda(contasAPagarBens);

    document.getElementById('balancoCapitalSocial').textContent = formatarMoeda(capitalSocial);
    document.getElementById('balancoResultado').textContent = formatarMoeda(resultadoAcumulado);

    document.getElementById('totalAtivo').textContent = formatarMoeda(totalAtivo);
    document.getElementById('totalPassivoPL').textContent = formatarMoeda(totalPassivoPL);

    // Opcional: Verificação de consistência
    if (Math.abs(totalAtivo - totalPassivoPL) > 0.01) { // Tolerância para floating point
        console.warn("Divergência no Balanço Patrimonial! Ativo != Passivo + PL. Verifique os cálculos.");
    }
}

// --- Botão de Zerar Dados ---
document.getElementById('btnZerarDados').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja apagar TODOS os dados salvos? Esta ação é irreversível!')) {
        localStorage.clear();
        // Redefine as variáveis globais para o estado inicial
        clientes = [];
        fornecedores = [];
        produtos = [];
        capitalSocial = 0; // Inicia capital social como zero
        bens = [];
        compras = [];
        vendas = [];
        estoque = [];
        caixa = 0; // Caixa começa como zero
        contasAReceber = 0;
        contasAPagarMercadorias = 0;
        contasAPagarBens = 0;
        resultadoAcumulado = 0; // Lucros/Prejuízos começa como zero

        alert('Todos os dados foram zerados!');
        // Recarrega a página ou atualiza todos os selects e relatórios
        location.reload(); // A forma mais simples de resetar tudo
    }
});


// --- Lógica de Inicialização (Executada ao carregar a página) ---
document.addEventListener('DOMContentLoaded', () => {
    popularSelectClientes();
    popularSelectFornecedores();
    popularSelectProdutos();
    atualizarTodosRelatorios(); // Inicializa os relatórios ao carregar

    // Controle de visibilidade dos campos de data de vencimento (Bens)
    const bemFormaPagamentoSelect = document.getElementById('bemFormaPagamento');
    const bemDataVencimentoGroup = document.getElementById('bemDataVencimentoGroup');

    if (bemFormaPagamentoSelect && bemDataVencimentoGroup) {
        bemFormaPagamentoSelect.addEventListener('change', function() {
            if (this.value === 'A Prazo') {
                bemDataVencimentoGroup.style.display = 'block';
                bemDataVencimentoGroup.querySelector('input').setAttribute('required', 'required');
            } else {
                bemDataVencimentoGroup.style.display = 'none';
                bemDataVencimentoGroup.querySelector('input').removeAttribute('required');
            }
        });
        bemFormaPagamentoSelect.dispatchEvent(new Event('change')); // Garante o estado inicial
    }

    // Controle de visibilidade dos campos de data de vencimento (Compras)
    const compraCreditoDebitoSelect = document.getElementById('compraCreditoDebito');
    const compraDataVencimentoGroup = document.getElementById('compraDataVencimentoGroup');

    if (compraCreditoDebitoSelect && compraDataVencimentoGroup) {
        compraCreditoDebitoSelect.addEventListener('change', function() {
            if (this.value === 'Crédito') { // "Crédito" para compras = a prazo
                compraDataVencimentoGroup.style.display = 'block';
                compraDataVencimentoGroup.querySelector('input').setAttribute('required', 'required');
            } else {
                compraDataVencimentoGroup.style.display = 'none';
                compraDataVencimentoGroup.querySelector('input').removeAttribute('required');
            }
        });
        compraCreditoDebitoSelect.dispatchEvent(new Event('change')); // Garante o estado inicial
    }

    // Controle de visibilidade dos campos de data de vencimento (Vendas)
    const vendaPagamentoSelect = document.getElementById('vendaPagamento');
    const vendaDataVencimentoGroup = document.getElementById('vendaDataVencimentoGroup');

    if (vendaPagamentoSelect && vendaDataVencimentoGroup) {
        vendaPagamentoSelect.addEventListener('change', function() {
            if (this.value === 'A Prazo') {
                vendaDataVencimentoGroup.style.display = 'block';
                vendaDataVencimentoGroup.querySelector('input').setAttribute('required', 'required');
            } else {
                vendaDataVencimentoGroup.style.display = 'none';
                vendaDataVencimentoGroup.querySelector('input').removeAttribute('required');
            }
        });
        vendaPagamentoSelect.dispatchEvent(new Event('change')); // Garante o estado inicial
    }
});
