function salvarDados(chave, dados) {
  localStorage.setItem(chave, JSON.stringify(dados));
}

function carregarDados(chave) {
  return JSON.parse(localStorage.getItem(chave)) || [];
}

function atualizarSelects() {
  const produtos = carregarDados('produtos');
  const fornecedores = carregarDados('fornecedores');
  const clientes = carregarDados('clientes');

  const selectProdutoCompra = document.getElementById('compraProduto');
  const selectProdutoVenda = document.getElementById('vendaProduto');
  const selectProdutoFornecedor = document.getElementById('produtoFornecedor');
  const selectVendaCliente = document.getElementById('vendaCliente');

  [selectProdutoCompra, selectProdutoVenda].forEach(select => {
    select.innerHTML = '<option disabled selected>Selecione o produto</option>';
    produtos.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.nome;
      opt.textContent = p.nome;
      select.appendChild(opt);
    });
  });

  selectProdutoFornecedor.innerHTML = '<option disabled selected>Selecione o fornecedor</option>';
  fornecedores.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.nome;
    opt.textContent = f.nome;
    selectProdutoFornecedor.appendChild(opt);
  });

  selectVendaCliente.innerHTML = '<option disabled selected>Selecione o cliente</option>';
  clientes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.nome;
    opt.textContent = c.nome;
    selectVendaCliente.appendChild(opt);
  });
}

// CADASTROS
document.getElementById('formCliente').addEventListener('submit', e => {
  e.preventDefault();
  const clientes = carregarDados('clientes');
  clientes.push({
    nome: document.getElementById('clienteNome').value,
    cpf: document.getElementById('clienteCPF').value,
    cidade: document.getElementById('clienteCidade').value,
    estado: document.getElementById('clienteEstado').value
  });
  salvarDados('clientes', clientes);
  alert('Cliente cadastrado!');
  e.target.reset();
  atualizarSelects();
});

document.getElementById('formFornecedor').addEventListener('submit', e => {
  e.preventDefault();
  const fornecedores = carregarDados('fornecedores');
  fornecedores.push({
    nome: document.getElementById('fornecedorNome').value,
    cnpj: document.getElementById('fornecedorCNPJ').value,
    cidade: document.getElementById('fornecedorCidade').value,
    estado: document.getElementById('fornecedorEstado').value
  });
  salvarDados('fornecedores', fornecedores);
  alert('Fornecedor cadastrado!');
  e.target.reset();
  atualizarSelects();
});

document.getElementById('formProduto').addEventListener('submit', e => {
  e.preventDefault();
  const produtos = carregarDados('produtos');
  produtos.push({
    nome: document.getElementById('produtoNome').value,
    fornecedor: document.getElementById('produtoFornecedor').value
  });
  salvarDados('produtos', produtos);
  alert('Produto cadastrado!');
  e.target.reset();
  atualizarSelects();
});

// COMPRAS
document.getElementById('formCompra').addEventListener('submit', e => {
  e.preventDefault();
  const compras = carregarDados('compras');
  compras.push({
    produto: document.getElementById('compraProduto').value,
    quantidade: parseInt(document.getElementById('compraQuantidade').value),
    preco: parseFloat(document.getElementById('compraPrecoCompra').value),
    icms: parseFloat(document.getElementById('compraICMS').value),
    forma: document.getElementById('compraCreditoDebito').value
  });
  salvarDados('compras', compras);
  alert('Compra registrada!');
  e.target.reset();
  atualizarRelatorios();
});

// VENDAS
document.getElementById('formVenda').addEventListener('submit', e => {
  e.preventDefault();
  const vendas = carregarDados('vendas');
  vendas.push({
    produto: document.getElementById('vendaProduto').value,
    cliente: document.getElementById('vendaCliente').value,
    quantidade: parseInt(document.getElementById('vendaQuantidade').value),
    pagamento: document.getElementById('vendaPagamento').value,
    icms: parseFloat(document.getElementById('vendaICMS').value),
    precoVenda: parseFloat(document.getElementById('vendaPreco').value) // Preço de venda informado pelo usuário
  });
  salvarDados('vendas', vendas);
  alert('Venda registrada!');
  e.target.reset();
  atualizarRelatorios();
});

// RELATÓRIOS
function atualizarRelatorios() {
  const produtos = carregarDados('produtos');
  const compras = carregarDados('compras');
  const vendas = carregarDados('vendas');

  const estoque = {};
  const totalVendas = {};
  const custo = {};
  const lucro = {};

  compras.forEach(c => {
    estoque[c.produto] = (estoque[c.produto] || 0) + c.quantidade;
    custo[c.produto] = (custo[c.produto] || 0) + (c.quantidade * c.preco);
  });

  vendas.forEach(v => {
    estoque[v.produto] = (estoque[v.produto] || 0) - v.quantidade;
    totalVendas[v.produto] = (totalVendas[v.produto] || 0) + v.quantidade;
    const produtoInfo = produtos.find(p => p.nome === v.produto);
    const precoVenda = v.precoVenda || 0;
    const icms = v.icms || 0;
    const totalVenda = v.quantidade * precoVenda * (1 - icms / 100);
    lucro[v.produto] = (lucro[v.produto] || 0) + totalVenda;
  });

  // Relatório de Estoque
  const estoqueBody = document.querySelector('#stock-report tbody');
  estoqueBody.innerHTML = '';
  for (let produto in estoque) {
    estoqueBody.innerHTML += `<tr><td>${produto}</td><td>${estoque[produto]}</td></tr>`;
  }

  // Relatório de Vendas
  const vendasBody = document.querySelector('#sales-report tbody');
  vendasBody.innerHTML = '';
  for (let produto in totalVendas) {
    vendasBody.innerHTML += `<tr><td>${produto}</td><td>${totalVendas[produto]}</td><td>-</td></tr>`;
  }

  // Relatório de Custo e Lucro
  const custoLucroBody = document.querySelector('#cost-profit-report tbody');
  custoLucroBody.innerHTML = '';
  for (let produto in custo) {
    const lucroProduto = lucro[produto] || 0;
    const custoProduto = custo[produto] || 0;
    custoLucroBody.innerHTML += `<tr><td>${produto}</td><td>${custoProduto.toFixed(2)}</td><td>${lucroProduto.toFixed(2)}</td></tr>`;
  }
}

// Inicializando select e relatórios
atualizarSelects();
atualizarRelatorios();
