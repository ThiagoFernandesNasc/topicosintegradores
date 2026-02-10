function calcularRiscoPercent(voo, modelo = 'tradicional') {
  const status = String(voo.status || '').toLowerCase();
  let percent = 20;

  if (status.includes('cancel')) percent = 95;
  else if (status.includes('atras') || status.includes('delay')) percent = 78;
  else if (status.includes('embarque') || status.includes('boarding')) percent = 35;
  else if (status.includes('final') || status.includes('cheg')) percent = 10;
  else if (status.includes('previsto') || status.includes('scheduled')) percent = 40;

  const preco = Number(voo.preco_medio || 0);
  if (preco >= 700) percent += 8;
  else if (preco >= 500) percent += 4;

  const horario = new Date(voo.horario_previsto).getTime();
  if (!Number.isNaN(horario)) {
    const diffMin = (horario - Date.now()) / 60000;
    if (diffMin < -30) percent += 12;
    else if (diffMin < 60) percent += 6;
  }

  if (modelo === 'generativa') percent += 3;

  const final = Math.min(98, Math.max(5, Math.round(percent)));
  return final;
}

function rotuloRisco(percent) {
  if (percent >= 85) return 'CRITICO';
  if (percent >= 70) return 'ALTO';
  if (percent >= 45) return 'MEDIO';
  return 'BAIXO';
}

function explicarRisco(voo, percent, modelo) {
  const status = String(voo.status || 'previsto');
  const horario = new Date(voo.horario_previsto).toLocaleString('pt-BR');
  if (modelo === 'generativa') {
    return `Modelo generativo sintetizou sinais do status "${status}", janela ${horario} e padrão tarifário para chegar em ${percent}%.`;
  }
  return `Modelo tradicional cruzou status "${status}", horário previsto ${horario} e preço médio para chegar em ${percent}%.`;
}

function calcularRiscoAtraso(voo, modelo = 'tradicional') {
  const percent = calcularRiscoPercent(voo, modelo);
  const label = rotuloRisco(percent);
  const explicacao = explicarRisco(voo, percent, modelo);

  return {
    percent,
    label,
    modelo,
    explicacao,
  };
}

module.exports = { calcularRiscoAtraso };
