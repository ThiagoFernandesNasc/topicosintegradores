import { useEffect, useMemo, useState } from 'react';
import api, { setAuthToken } from './api';
import './App.css';

const demoVoos = [
  {
    numero_voo: 'SKY1023',
    companhia: 'SkyLine Cia',
    horario_previsto: new Date(Date.now() + 60 * 60000).toISOString(),
    status: 'Previsto',
    preco_medio: 520,
    origem: 'GRU',
    destino: 'GIG',
  },
  {
    numero_voo: 'SKY2108',
    companhia: 'SkyLine Cia',
    horario_previsto: new Date(Date.now() + 25 * 60000).toISOString(),
    status: 'Embarque',
    preco_medio: 640,
    origem: 'CGH',
    destino: 'BSB',
  },
  {
    numero_voo: 'AZU4431',
    companhia: 'Azul',
    horario_previsto: new Date(Date.now() - 45 * 60000).toISOString(),
    status: 'Atrasado',
    preco_medio: 710,
    origem: 'VCP',
    destino: 'REC',
  },
  {
    numero_voo: 'GOL9810',
    companhia: 'Gol',
    horario_previsto: new Date(Date.now() + 140 * 60000).toISOString(),
    status: 'Previsto',
    preco_medio: 430,
    origem: 'GRU',
    destino: 'SSA',
  },
  {
    numero_voo: 'LAT3312',
    companhia: 'Latam',
    horario_previsto: new Date(Date.now() - 120 * 60000).toISOString(),
    status: 'Cancelado',
    preco_medio: 690,
    origem: 'CNF',
    destino: 'POA',
  },
  {
    numero_voo: 'SKY7002',
    companhia: 'SkyLine Cia',
    horario_previsto: new Date(Date.now() + 320 * 60000).toISOString(),
    status: 'Previsto',
    preco_medio: 380,
    origem: 'FOR',
    destino: 'NAT',
  },
];

const companhiasInfo = [
  { nome: 'SkyLine Cia', pontualidade: 82, hubs: ['GRU', 'BSB'] },
  { nome: 'Latam', pontualidade: 74, hubs: ['GRU', 'CGH'] },
  { nome: 'Gol', pontualidade: 69, hubs: ['GIG', 'CNF'] },
  { nome: 'Azul', pontualidade: 77, hubs: ['VCP', 'REC'] },
  { nome: 'United', pontualidade: 81, hubs: ['EWR', 'IAD'] },
  { nome: 'American', pontualidade: 73, hubs: ['DFW', 'MIA'] },
];

const rotasRadar = [
  { origem: 'GRU', destino: 'GIG', status: 'Operando' },
  { origem: 'BSB', destino: 'SSA', status: 'Atenção' },
  { origem: 'VCP', destino: 'REC', status: 'Atraso' },
  { origem: 'CNF', destino: 'POA', status: 'Operando' },
];

const pontosMapa = [
  { code: 'GRU', label: 'São Paulo', x: 18, y: 62 },
  { code: 'GIG', label: 'Rio de Janeiro', x: 22, y: 68 },
  { code: 'BSB', label: 'Brasília', x: 38, y: 50 },
  { code: 'SSA', label: 'Salvador', x: 48, y: 46 },
  { code: 'REC', label: 'Recife', x: 58, y: 34 },
  { code: 'POA', label: 'Porto Alegre', x: 20, y: 84 },
];

const rotasMapa = [
  { from: 'GRU', to: 'GIG', status: 'Operando' },
  { from: 'BSB', to: 'SSA', status: 'Atenção' },
  { from: 'VCP', to: 'REC', status: 'Atraso' },
  { from: 'CNF', to: 'POA', status: 'Operando' },
];

const avioesMapa = [
  { id: 'AV1', x: 28, y: 64, rota: 'GRU → GIG' },
  { id: 'AV2', x: 44, y: 52, rota: 'BSB → SSA' },
  { id: 'AV3', x: 56, y: 38, rota: 'REC → POA' },
];

function encontrarPonto(code) {
  return pontosMapa.find((p) => p.code === code);
}

const aeroportos = ['GRU', 'GIG', 'BSB', 'CGH', 'VCP', 'REC', 'SSA', 'CNF', 'CWB', 'POA', 'FOR', 'NAT'];
const companhias = [
  { prefix: 'SKY', nome: 'SkyLine Cia' },
  { prefix: 'LAT', nome: 'Latam' },
  { prefix: 'GOL', nome: 'Gol' },
  { prefix: 'AZU', nome: 'Azul' },
];
const statusPool = ['Previsto', 'Embarque', 'Atrasado', 'Finalizado', 'Cancelado'];

function gerarVooAleatorio(indice) {
  const companhia = companhias[Math.floor(Math.random() * companhias.length)];
  const origem = aeroportos[Math.floor(Math.random() * aeroportos.length)];
  let destino = aeroportos[Math.floor(Math.random() * aeroportos.length)];
  if (destino === origem) {
    destino = aeroportos[(aeroportos.indexOf(origem) + 3) % aeroportos.length];
  }
  const numero = `${companhia.prefix}${Math.floor(1000 + Math.random() * 8999)}`;
  const offsetMin = Math.floor(-120 + Math.random() * 480);
  const horario_previsto = new Date(Date.now() + offsetMin * 60000).toISOString();
  const status = statusPool[Math.floor(Math.random() * statusPool.length)];
  const preco_medio = Math.floor(360 + Math.random() * 380);

  return {
    numero_voo: numero,
    companhia: companhia.nome,
    horario_previsto,
    status,
    preco_medio,
    origem,
    destino,
    _seed: indice,
  };
}

function gerarVoosExtras(quantidade = 6, existentes = new Set()) {
  const extras = [];
  let tentativas = 0;
  while (extras.length < quantidade && tentativas < quantidade * 10) {
    const voo = gerarVooAleatorio(extras.length + 1);
    if (!existentes.has(voo.numero_voo)) {
      existentes.add(voo.numero_voo);
      extras.push(voo);
    }
    tentativas += 1;
  }
  return extras;
}

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

function formatarData(valor) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '-';
  return data.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function calcularRiscoPercent(voo, modelo) {
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

  return Math.min(98, Math.max(5, Math.round(percent)));
}

function rotuloRisco(percent) {
  if (percent >= 85) return 'CRITICO';
  if (percent >= 70) return 'ALTO';
  if (percent >= 45) return 'MEDIO';
  return 'BAIXO';
}

function chaveRisco(label) {
  if (label === 'CRITICO') return 'critico';
  if (label === 'MEDIO') return 'medio';
  if (label === 'ALTO') return 'alto';
  return 'baixo';
}

function labelAmigavel(label) {
  if (label === 'CRITICO') return 'Crítico';
  if (label === 'MEDIO') return 'Médio';
  if (label === 'ALTO') return 'Alto';
  return 'Baixo';
}

function explicacaoRisco(voo, percent, modelo) {
  const status = String(voo.status || 'previsto');
  const horario = formatarData(voo.horario_previsto);
  if (modelo === 'generativa') {
    return `Modelo generativo sintetizou sinais do status "${status}", janela ${horario} e padrão tarifário para chegar em ${percent}%.`;
  }
  return `Modelo tradicional cruzou status "${status}", horário previsto ${horario} e preço médio para chegar em ${percent}%.`;
}

function riscoLocal(voo, modelo) {
  const percent = calcularRiscoPercent(voo, modelo);
  const label = rotuloRisco(percent);
  const explicacao = explicacaoRisco(voo, percent, modelo);
  return { percent, label, modelo, explicacao, fonte: 'LOCAL' };
}

function App() {
  const [email, setEmail] = useState('user1@example.com');
  const [senha, setSenha] = useState('123456');
  const [nome, setNome] = useState('');
  const [perfil, setPerfil] = useState('OPERADOR');
  const [token, setToken] = useState(null);
  const [voos, setVoos] = useState([]);
  const [erro, setErro] = useState('');
  const [me, setMe] = useState(null);
  const [modeloIA, setModeloIA] = useState('tradicional');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [qtdeExtras, setQtdeExtras] = useState(6);
  const [modoAuth, setModoAuth] = useState('login');
  const [cookieStatus, setCookieStatus] = useState(() => {
    try {
      return localStorage.getItem('cookie_status') || '';
    } catch {
      return '';
    }
  });

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');

    try {
      const resp = await api.post('/auth/login', { email, senha });
      const t = resp.data.token;
      setToken(t);
      setAuthToken(t);

      const meResp = await api.get('/auth/me');
      setMe(meResp.data);
    } catch (err) {
      console.error(err);
      setErro(err?.response?.data?.error || 'Falha no login');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setErro('');

    try {
      await api.post('/auth/register', {
        nome,
        email,
        senha,
        perfil,
      });
      setModoAuth('login');
      setErro('Cadastro realizado! Faça login.');
    } catch (err) {
      console.error(err);
      setErro(err?.response?.data?.error || 'Erro ao registrar usuário');
    }
  }

  function handleDemo() {
    setToken('demo');
    setMe({ nome: 'Visitante', perfil: 'Demo' });
    setVoos(demoVoos.map((voo) => ({ ...voo, risco: riscoLocal(voo, modeloIA) })));
    setUltimaAtualizacao(new Date());
  }

  async function enriquecerVoosComRisco(lista, modelo, usarApi) {
    if (!lista.length) return [];
    if (!usarApi) {
      return lista.map((voo) => ({ ...voo, risco: riscoLocal(voo, modelo) }));
    }

    const resultados = await Promise.all(
      lista.map(async (voo) => {
        try {
          const resp = await api.get(
            `/ia/risco-atraso/${voo.numero_voo}?modelo=${modelo}`
          );
          return { ...voo, risco: { ...resp.data.risco, fonte: 'API' } };
        } catch (err) {
          console.error(err);
          return { ...voo, risco: riscoLocal(voo, modelo) };
        }
      })
    );

    return resultados;
  }

  async function carregarVoos() {
    setErro('');
    try {
      const resp = await api.get('/voos');
      const base = Array.isArray(resp.data) ? resp.data : [];
      const existentes = new Set(base.map((voo) => voo.numero_voo).filter(Boolean));
      const extras = gerarVoosExtras(qtdeExtras, existentes);
      const combinados = [...base, ...extras];
      const unicos = combinados.reduce((acc, voo) => {
        if (!voo || !voo.numero_voo) return acc;
        if (!acc.map.has(voo.numero_voo)) {
          acc.map.set(voo.numero_voo, true);
          acc.lista.push(voo);
        }
        return acc;
      }, { map: new Map(), lista: [] }).lista;
      const enriquecidos = await enriquecerVoosComRisco(
        unicos,
        modeloIA,
        token !== 'demo'
      );
      setVoos(enriquecidos);
      setUltimaAtualizacao(new Date());
    } catch (err) {
      console.error(err);
      setErro('Erro ao carregar voos');
    }
  }

  async function atualizarRiscosModelo(novoModelo) {
    const atualizados = await enriquecerVoosComRisco(
      voos,
      novoModelo,
      token !== 'demo'
    );
    setVoos(atualizados);
  }

  const indicadores = useMemo(() => {
    const total = voos.length;
    const riscos = voos.map((v) => (v.risco ? v.risco.percent : calcularRiscoPercent(v, modeloIA)));
    const alto = riscos.filter((p) => p >= 70).length;
    const medio = riscos.filter((p) => p >= 45 && p < 70).length;
    const media = total ? Math.round(riscos.reduce((a, b) => a + b, 0) / total) : 0;
    return { total, alto, medio, media };
  }, [voos, modeloIA]);

  useEffect(() => {
    if (!voos.length || !token) return;
    atualizarRiscosModelo(modeloIA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeloIA]);


  if (!token) {
    const bloqueadoPorCookie = cookieStatus !== 'aceito' && cookieStatus !== 'recusado';
    return (
      <div className="login">
        <div className={`login-card ${bloqueadoPorCookie ? 'blocked' : ''}`}>
          <span className="brand-pill">SkyLine Cia</span>
          <h1>Controle inteligente de risco de atrasos</h1>
          <p>
            Plataforma de monitoramento que usa IA para estimar a porcentagem de atraso de cada voo e entregar
            transparência para passageiros e operações.
          </p>
          <div className="airline-strip">
            <span>Companhias integradas</span>
            <div className="airline-tags">
              <span>SkyLine Cia</span>
              <span>Latam</span>
              <span>Gol</span>
              <span>Azul</span>
              <span>United</span>
              <span>American</span>
            </div>
          </div>
          {modoAuth === 'login' ? (
            <form onSubmit={handleLogin} className="login-form">
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={bloqueadoPorCookie}
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••"
                  disabled={bloqueadoPorCookie}
                />
              </label>
              {erro && <span className="error">{erro}</span>}
              <div className="login-actions">
                <button type="submit" className="btn primary" disabled={bloqueadoPorCookie}>Entrar</button>
                <button type="button" className="btn ghost" onClick={handleDemo} disabled={bloqueadoPorCookie}>
                  Entrar em modo demo
                </button>
              </div>
              <button
                type="button"
                className="link-btn"
                onClick={() => setModoAuth('register')}
                disabled={bloqueadoPorCookie}
              >
                Criar nova conta
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="login-form">
              <label>
                Nome completo
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  disabled={bloqueadoPorCookie}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={bloqueadoPorCookie}
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••"
                  disabled={bloqueadoPorCookie}
                />
              </label>
              <label>
                Perfil
                <select
                  value={perfil}
                  onChange={(e) => setPerfil(e.target.value)}
                  disabled={bloqueadoPorCookie}
                >
                  <option value="OPERADOR">Operador</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="CIA">Companhia</option>
                  <option value="VISUALIZADOR">Visualizador</option>
                </select>
              </label>
              {erro && <span className="error">{erro}</span>}
              <div className="login-actions">
                <button type="submit" className="btn primary" disabled={bloqueadoPorCookie}>
                  Criar conta
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setModoAuth('login')}
                  disabled={bloqueadoPorCookie}
                >
                  Já tenho conta
                </button>
              </div>
            </form>
          )}
          <div className="login-footer">
            LGPD aplicada por padrão, com consentimento explícito e minimização de dados.
          </div>
        </div>
        <div className="login-art">
          <div className="orb" />
          <div className="orb second" />
          <div className="gridline" />
          <div className="gridline" />
        </div>
        {bloqueadoPorCookie && (
          <div className="cookie-banner" role="dialog" aria-live="polite">
            <div>
              Usamos cookies essenciais para autenticação e análise de risco. Ao continuar, você concorda com o uso.
            </div>
            <div className="cookie-actions">
              <button
                className="btn primary"
                onClick={() => {
                  setCookieStatus('aceito');
                  try {
                    localStorage.setItem('cookie_status', 'aceito');
                  } catch {}
                }}
              >
                Aceitar
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  setCookieStatus('recusado');
                  try {
                    localStorage.setItem('cookie_status', 'recusado');
                  } catch {}
                }}
              >
                Recusar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-pill">SkyLine Cia</span>
          <div>
            <h2>SkyLine Intelligence</h2>
            <p>Risco de atrasos com IA tradicional e IA generativa.</p>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="user-chip">
            <span className="dot" />
            {me ? `${me.nome} · ${me.perfil}` : 'Sessão ativa'}
          </div>
          <button
            className="btn ghost"
            onClick={() => {
              setToken(null);
              setAuthToken(null);
              setVoos([]);
              setMe(null);
            }}
          >
            Sair
          </button>
        </div>
      </header>

      <main className="content">
        <section className="ops-strip">
          <div>
            <strong>Operação agora</strong>
            <span>GRU 28°C · visibilidade 9km · vento 12kt</span>
          </div>
          <div>
            <strong>Slot crítico</strong>
            <span>Gate 12 · janela 16:40–17:10</span>
          </div>
          <div>
            <strong>Alertas</strong>
            <span>2 voos em monitoramento</span>
          </div>
        </section>
        <section className="hero">
          <div className="hero-copy">
            <h1>Visão única dos riscos de atraso em todos os voos disponíveis.</h1>
            <p>
              O SkyLine Cia centraliza status, previsão e probabilidade de atraso. Cada voo recebe uma porcentagem
              calculada por IA, com explicação transparente para decisões rápidas.
            </p>
            <div className="hero-actions">
              <button className="btn primary" onClick={carregarVoos}>Carregar voos (API)</button>
              <button className="btn outline" onClick={handleDemo}>Usar dados demo</button>
            </div>
            <div className="last-update">
              Última atualização: {ultimaAtualizacao ? ultimaAtualizacao.toLocaleString('pt-BR') : 'Sem dados'}
            </div>
            <div className="status-legend">
              <span className="legend-item previsto">Previsto</span>
              <span className="legend-item embarque">Embarque</span>
              <span className="legend-item atraso">Atrasado</span>
              <span className="legend-item cancelado">Cancelado</span>
            </div>
          </div>
          <div className="hero-panel">
            <div className="panel-card radar">
              <h3>Radar de rotas</h3>
              <div className="radar-grid">
                {rotasRadar.map((rota, index) => (
                  <div key={`${rota.origem}-${rota.destino}-${index}`} className="radar-route">
                    <span>{rota.origem} → {rota.destino}</span>
                    <strong>{rota.status}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel-card">
              <h3>Indicadores em tempo real</h3>
              <div className="kpi-grid">
                <div>
                  <span>Total de voos</span>
                  <strong>{indicadores.total}</strong>
                </div>
                <div>
                  <span>Risco alto</span>
                  <strong>{indicadores.alto}</strong>
                </div>
                <div>
                  <span>Risco médio</span>
                  <strong>{indicadores.medio}</strong>
                </div>
                <div>
                  <span>Média de risco</span>
                  <strong>{indicadores.media}%</strong>
                </div>
              </div>
            </div>
            <div className="panel-card small">
              <h3>Modelo de IA</h3>
              <div className="segmented">
                <button
                  className={modeloIA === 'tradicional' ? 'active' : ''}
                  onClick={() => setModeloIA('tradicional')}
                >
                  Tradicional
                </button>
                <button
                  className={modeloIA === 'generativa' ? 'active' : ''}
                  onClick={() => setModeloIA('generativa')}
                >
                  Generativa
                </button>
              </div>
              <p>
                {modeloIA === 'tradicional'
                  ? 'Baseado em regras, séries históricas e variáveis operacionais.'
                  : 'Gera hipóteses e explicações contextuais com linguagem natural.'}
              </p>
            </div>
            <div className="panel-card small">
              <h3>Voos extras</h3>
              <p>Quantidade de voos simulados ao carregar.</p>
              <div className="extras-control">
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={qtdeExtras}
                  onChange={(e) => setQtdeExtras(Number(e.target.value))}
                />
                <span>{qtdeExtras}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="airlines-section">
          <div className="section-title">
            <h2>Companhias aéreas em monitoramento</h2>
            <span>Pontualidade histórica e hubs principais.</span>
          </div>
          <div className="airline-grid">
            {companhiasInfo.map((cia) => (
              <div key={cia.nome} className="airline-card">
                <div className="airline-header">
                  <h3>{cia.nome}</h3>
                  <span className="airline-score">{cia.pontualidade}% on-time</span>
                </div>
                <div className="airline-hubs">
                  {cia.hubs.map((hub) => (
                    <span key={`${cia.nome}-${hub}`}>{hub}</span>
                  ))}
                </div>
                <p>Risco ajustado por histórico de atrasos, conectividade e janela de slot.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="map-section">
          <div className="section-title">
            <h2>Mapa de rotas ao vivo</h2>
            <span>Posição atual e destino previstos para voos monitorados.</span>
          </div>
          <div className="map-shell">
            <div className="map-panel">
              <div className="map-svg">
                {rotasMapa.map((rota, index) => {
                  const origem = encontrarPonto(rota.from);
                  const destino = encontrarPonto(rota.to);
                  if (!origem || !destino) return null;
                  return (
                    <div
                      key={`${rota.from}-${rota.to}-${index}`}
                      className={`route-line ${rota.status.toLowerCase()}`}
                      style={{
                        '--x1': `${origem.x}%`,
                        '--y1': `${origem.y}%`,
                        '--x2': `${destino.x}%`,
                        '--y2': `${destino.y}%`,
                      }}
                    />
                  );
                })}
                {pontosMapa.map((ponto) => (
                  <div
                    key={ponto.code}
                    className="map-point"
                    style={{ left: `${ponto.x}%`, top: `${ponto.y}%` }}
                  >
                    <span>{ponto.code}</span>
                    <small>{ponto.label}</small>
                  </div>
                ))}
                {avioesMapa.map((aviao, index) => (
                  <div
                    key={aviao.id}
                    className={`map-plane p${index + 1}`}
                    style={{ left: `${aviao.x}%`, top: `${aviao.y}%` }}
                    title={aviao.rota}
                  >
                    ✈
                  </div>
                ))}
              </div>
              <div className="map-overlay">
                <div className="map-pill">SkyLine Live</div>
                <div className="map-kpi">
                  <strong>72</strong>
                  <span>voos ativos</span>
                </div>
                <div className="map-kpi">
                  <strong>5</strong>
                  <span>alertas críticos</span>
                </div>
              </div>
            </div>
            <aside className="map-sidebar">
              <h3>Tráfego em destaque</h3>
              <ul className="traffic-list">
                {rotasRadar.map((rota, index) => (
                  <li key={`${rota.origem}-${rota.destino}-${index}`}>
                    <span>{rota.origem} → {rota.destino}</span>
                    <strong>{rota.status}</strong>
                  </li>
                ))}
              </ul>
              <div className="map-legend">
                <span className="legend-item previsto">Operando</span>
                <span className="legend-item embarque">Atenção</span>
                <span className="legend-item atraso">Atraso</span>
              </div>
            </aside>
          </div>
        </section>

        <section className="table-section">
          <div className="section-title">
            <h2>Painel de risco de atrasos</h2>
            <span>Percentual estimado por voo com justificativa IA.</span>
          </div>
          {erro && <p className="error">{erro}</p>}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Voo</th>
                  <th>Companhia</th>
                  <th>Rota</th>
                  <th>Horário previsto</th>
                  <th>Status</th>
                  <th>Preço médio</th>
                  <th>Risco IA</th>
                </tr>
              </thead>
              <tbody>
                {voos.map((v, i) => {
                  const risco = v.risco || riscoLocal(v, modeloIA);
                  const percent = risco.percent;
                  const label = risco.label;
                  const key = chaveRisco(label);
                  return (
                    <tr key={`${v.numero_voo}-${i}`}>
                      <td>{v.numero_voo}</td>
                      <td>
                        <span className="airline-badge">{v.companhia}</span>
                      </td>
                      <td>{v.origem || '-'} → {v.destino || '-'}</td>
                      <td>{formatarData(v.horario_previsto)}</td>
                      <td>{v.status}</td>
                      <td>{money.format(Number(v.preco_medio || 0))}</td>
                      <td>
                        <div className="risk-cell">
                          <div className={`risk-badge ${key}`}>
                            {labelAmigavel(label)} · {percent}%
                          </div>
                          <span className="risk-note">
                            {risco.explicacao}{' '}
                            <span className={`source-badge ${risco.fonte === 'API' ? 'api' : 'local'}`}>
                              {risco.fonte}
                            </span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {voos.length === 0 && (
              <div className="empty">
                Nenhum voo carregado. Use “Carregar voos” ou “Dados demo” para visualizar o painel.
              </div>
            )}
          </div>
        </section>

        <section className="section-grid">
          <div className="section-title">
            <h2>IA Tradicional e IA Generativa</h2>
            <span>As duas abordagens convivem para reduzir risco operacional.</span>
          </div>
          <div className="grid two stagger">
            <div className="card" style={{ '--d': '0ms' }}>
              <h3>IA Tradicional</h3>
              <p>
                Modelos supervisionados e regras estatísticas para previsão de atraso com variáveis operacionais,
                sazonalidade, histórico de companhia e horário.
              </p>
              <div className="pill-list">
                <span>Regressão logística</span>
                <span>Árvores de decisão</span>
                <span>Regras de negócio</span>
              </div>
            </div>
            <div className="card" style={{ '--d': '120ms' }}>
              <h3>IA Generativa</h3>
              <p>
                Geração de insights explicáveis para equipes e passageiros, criando narrativas de risco e impactos em
                cadeia com linguagem clara.
              </p>
              <div className="pill-list">
                <span>Sumarização automática</span>
                <span>Alertas contextualizados</span>
                <span>Simulação de cenários</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section-grid">
          <div className="section-title">
            <h2>LGPD aplicada ao produto</h2>
            <span>Privacidade desde o design com controles e transparência.</span>
          </div>
          <div className="grid three stagger">
            <div className="card" style={{ '--d': '0ms' }}>
              <h3>Consentimento e finalidade</h3>
              <p>Coleta mínima de dados pessoais, com consentimento explícito e finalidade documentada.</p>
            </div>
            <div className="card" style={{ '--d': '120ms' }}>
              <h3>Direitos do titular</h3>
              <p>Portal de acesso, correção, portabilidade e exclusão com SLA de atendimento.</p>
            </div>
            <div className="card" style={{ '--d': '240ms' }}>
              <h3>Segurança e retenção</h3>
              <p>Criptografia, trilhas de auditoria e política de retenção com expurgo automático.</p>
            </div>
          </div>
        </section>

        <section className="section-grid">
          <div className="section-title">
            <h2>Base SPEC de dados (focada no usuário)</h2>
            <span>Modelagem a partir do banco do back-end, centrada em experiência e compliance.</span>
          </div>
          <div className="grid three stagger">
            <div className="card" style={{ '--d': '0ms' }}>
              <h3>Usuário</h3>
              <p><strong>Campos:</strong> id_usuario, nome, email, perfil, canal_preferido.</p>
              <p><strong>Uso:</strong> autenticação, segmentação e personalização de alertas.</p>
            </div>
            <div className="card" style={{ '--d': '120ms' }}>
              <h3>Consentimento LGPD</h3>
              <p><strong>Campos:</strong> id_usuario, finalidade, status, data_aceite, revogacao.</p>
              <p><strong>Uso:</strong> governança de dados e auditoria.</p>
            </div>
            <div className="card" style={{ '--d': '240ms' }}>
              <h3>Preferências de Viagem</h3>
              <p><strong>Campos:</strong> id_usuario, origem_frequente, destino_frequente, janela_horaria.</p>
              <p><strong>Uso:</strong> priorização de insights e alertas.</p>
            </div>
            <div className="card" style={{ '--d': '360ms' }}>
              <h3>Consulta de Risco</h3>
              <p><strong>Campos:</strong> id_consulta, id_usuario, voo_id, percent_risco, modelo_ia.</p>
              <p><strong>Uso:</strong> histórico de decisões e melhoria de modelos.</p>
            </div>
            <div className="card" style={{ '--d': '480ms' }}>
              <h3>Notificações</h3>
              <p><strong>Campos:</strong> id_notificacao, id_usuario, tipo, mensagem, enviado_em.</p>
              <p><strong>Uso:</strong> comunicação proativa com passageiros e operações.</p>
            </div>
            <div className="card" style={{ '--d': '600ms' }}>
              <h3>Feedback do Usuário</h3>
              <p><strong>Campos:</strong> id_feedback, id_usuario, voo_id, avaliacao, comentario.</p>
              <p><strong>Uso:</strong> ajuste de modelos e melhoria de experiência.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        SkyLine Cia · Transparência de risco de atraso com IA · Versão acadêmica
      </footer>
    </div>
  );
}

export default App;
