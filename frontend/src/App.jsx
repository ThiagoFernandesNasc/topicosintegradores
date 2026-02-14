import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api, { setAuthToken } from './api';
import './App.css';

const MOCK_VOOS = [
  { cia: 'TAP', numero: 'TP8091', destino: 'Lisboa', horario: '14:30', portao: 'A12', status: 'Confirmado' },
  { cia: 'LATAM', numero: 'LA3502', destino: 'Sao Paulo', horario: '15:15', portao: 'B07', status: 'Confirmado' },
  { cia: 'Gol', numero: 'G31847', destino: 'Rio de Janeiro', horario: '15:45', portao: 'C04', status: 'Atraso Provavel' },
  { cia: 'Azul', numero: 'AD4123', destino: 'Brasilia', horario: '16:20', portao: 'A09', status: 'Confirmado' },
  { cia: 'United', numero: 'UA0834', destino: 'Miami', horario: '16:50', portao: 'D02', status: 'Atraso Provavel' },
  { cia: 'Air France', numero: 'AF0456', destino: 'Paris', horario: '17:30', portao: 'E11', status: 'Cancelado' },
  { cia: 'Emirates', numero: 'EK0262', destino: 'Dubai', horario: '18:00', portao: 'D08', status: 'Confirmado' },
  { cia: 'Avianca', numero: 'AV0127', destino: 'Bogota', horario: '18:45', portao: 'B15', status: 'Confirmado' },
];

const MOCK_AERONAVES = [
  { id: 'PT-ABC', modelo: 'Boeing 737-800', cia: 'GOL', status: 'Em Voo', localizacao: 'Em Rota - GRU/SDU', proximo: 'G31847', manutencao: '05/02/2026' },
  { id: 'PR-XYZ', modelo: 'Airbus A320', cia: 'LATAM', status: 'Disponivel', localizacao: 'Patio A - Portao 12', proximo: 'LA3502', manutencao: '10/02/2026' },
  { id: 'PT-DEF', modelo: 'Boeing 777-300ER', cia: 'TAP', status: 'Manutencao', localizacao: 'Hangar 3', proximo: '-', manutencao: '13/02/2026' },
  { id: 'PR-GHI', modelo: 'Airbus A330-200', cia: 'Azul', status: 'Programado', localizacao: 'Patio B - Portao 7', proximo: 'AD4123', manutencao: '08/02/2026' },
  { id: 'N123UA', modelo: 'Boeing 787-9', cia: 'United', status: 'Em Voo', localizacao: 'Em Rota - MIA/GRU', proximo: 'UA0834', manutencao: '01/02/2026' },
  { id: 'F-ABCD', modelo: 'Airbus A350-900', cia: 'Air France', status: 'Disponivel', localizacao: 'Patio E - Portao 11', proximo: 'AF0456', manutencao: '12/02/2026' },
];

const MOCK_RELATORIOS = [
  { nome: 'Relatorio de Voos - Diario', tipo: 'Operacional', data: '13/02/2026', tamanho: '2.4 MB', status: 'Pronto', lgpd: 'Conforme' },
  { nome: 'Analise de Atrasos - Semanal', tipo: 'Analise', data: '13/02/2026', tamanho: '1.8 MB', status: 'Pronto', lgpd: 'Conforme' },
  { nome: 'Manutencao de Aeronaves', tipo: 'Tecnico', data: '13/02/2026', tamanho: '3.2 MB', status: 'Processando', lgpd: 'Conforme' },
  { nome: 'Ocupacao de Portoes', tipo: 'Operacional', data: '13/02/2026', tamanho: '1.1 MB', status: 'Pronto', lgpd: 'Conforme' },
  { nome: 'Performance Mensal', tipo: 'Gerencial', data: '01/02/2026', tamanho: '5.7 MB', status: 'Pronto', lgpd: 'Conforme' },
  { nome: 'Previsao de Atrasos - Proxima Semana', tipo: 'Preditivo', data: '14/02/2026', tamanho: '-', status: 'Agendado', lgpd: 'Conforme' },
];

const MAP_FLIGHTS = [
  {
    id: 'TP8091',
    cia: 'TAP',
    from: { code: 'GRU', city: 'Sao Paulo', x: 33, y: 66, time: '14:30' },
    to: { code: 'LIS', city: 'Lisboa', x: 47, y: 38, time: '05:45' },
    altitude: '38.000 ft',
    velocidade: '850 km/h',
    aeronave: 'Airbus A330-900',
    portao: 'A12',
    progress: 0.62,
    speed: 0.022,
    risco: 'operando',
    regiao: 'Europa',
    atualizado: '14:12 UTC',
  },
  {
    id: 'LA3502',
    cia: 'LATAM',
    from: { code: 'GRU', city: 'Sao Paulo', x: 33, y: 66, time: '15:15' },
    to: { code: 'SCL', city: 'Santiago', x: 29, y: 72, time: '18:30' },
    altitude: '36.200 ft',
    velocidade: '822 km/h',
    aeronave: 'Boeing 787-9',
    portao: 'B07',
    progress: 0.56,
    speed: 0.014,
    risco: 'operando',
    regiao: 'Nacional/Regional',
    atualizado: '14:15 UTC',
  },
  {
    id: 'AZ4123',
    cia: 'Azul',
    from: { code: 'VCP', city: 'Campinas', x: 33, y: 65, time: '15:25' },
    to: { code: 'REC', city: 'Recife', x: 36, y: 55, time: '18:10' },
    altitude: '31.400 ft',
    velocidade: '768 km/h',
    aeronave: 'Airbus A321neo',
    portao: 'A09',
    progress: 0.41,
    speed: 0.013,
    risco: 'atencao',
    regiao: 'Nacional/Regional',
    atualizado: '14:16 UTC',
  },
  {
    id: 'G31847',
    cia: 'Gol',
    from: { code: 'CGH', city: 'Sao Paulo', x: 33, y: 66, time: '15:45' },
    to: { code: 'BSB', city: 'Brasilia', x: 35, y: 62, time: '17:00' },
    altitude: '29.500 ft',
    velocidade: '744 km/h',
    aeronave: 'Boeing 737-800',
    portao: 'C04',
    progress: 0.49,
    speed: 0.015,
    risco: 'atencao',
    regiao: 'Nacional/Regional',
    atualizado: '14:18 UTC',
  },
  {
    id: 'AF0456',
    cia: 'Air France',
    from: { code: 'CDG', city: 'Paris', x: 46, y: 33, time: '17:30' },
    to: { code: 'GRU', city: 'Sao Paulo', x: 33, y: 66, time: '05:10' },
    altitude: '37.400 ft',
    velocidade: '840 km/h',
    aeronave: 'Airbus A350-900',
    portao: 'E11',
    progress: 0.52,
    speed: 0.012,
    risco: 'atraso',
    regiao: 'Europa',
    atualizado: '14:20 UTC',
  },
  {
    id: 'KL0679',
    cia: 'KLM',
    from: { code: 'AMS', city: 'Amsterda', x: 47, y: 31, time: '16:20' },
    to: { code: 'NBO', city: 'Nairobi', x: 55, y: 58, time: '23:40' },
    altitude: '35.700 ft',
    velocidade: '812 km/h',
    aeronave: 'Boeing 787-10',
    portao: 'D10',
    progress: 0.47,
    speed: 0.011,
    risco: 'operando',
    regiao: 'Europa/Africa',
    atualizado: '14:11 UTC',
  },
  {
    id: 'BA0247',
    cia: 'British Airways',
    from: { code: 'LHR', city: 'Londres', x: 45, y: 32, time: '16:00' },
    to: { code: 'JNB', city: 'Johannesburgo', x: 54, y: 72, time: '04:20' },
    altitude: '39.100 ft',
    velocidade: '865 km/h',
    aeronave: 'Airbus A380-800',
    portao: 'C08',
    progress: 0.39,
    speed: 0.01,
    risco: 'atraso',
    regiao: 'Africa',
    atualizado: '14:08 UTC',
  },
  {
    id: 'ET0507',
    cia: 'Ethiopian',
    from: { code: 'ADD', city: 'Adis Abeba', x: 56, y: 55, time: '17:40' },
    to: { code: 'LOS', city: 'Lagos', x: 48, y: 56, time: '22:05' },
    altitude: '34.000 ft',
    velocidade: '790 km/h',
    aeronave: 'Boeing 777-200LR',
    portao: 'B03',
    progress: 0.63,
    speed: 0.012,
    risco: 'operando',
    regiao: 'Africa',
    atualizado: '14:10 UTC',
  },
  {
    id: 'EK0262',
    cia: 'Emirates',
    from: { code: 'DXB', city: 'Dubai', x: 56, y: 43, time: '18:00' },
    to: { code: 'SIN', city: 'Singapura', x: 69, y: 58, time: '06:55' },
    altitude: '41.000 ft',
    velocidade: '905 km/h',
    aeronave: 'Airbus A380-800',
    portao: 'D08',
    progress: 0.28,
    speed: 0.012,
    risco: 'atencao',
    regiao: 'Asia',
    atualizado: '14:13 UTC',
  },
  {
    id: 'QR0789',
    cia: 'Qatar',
    from: { code: 'DOH', city: 'Doha', x: 55, y: 44, time: '18:20' },
    to: { code: 'BKK', city: 'Bangkok', x: 66, y: 52, time: '01:40' },
    altitude: '38.600 ft',
    velocidade: '876 km/h',
    aeronave: 'Boeing 777-300ER',
    portao: 'D11',
    progress: 0.44,
    speed: 0.013,
    risco: 'operando',
    regiao: 'Asia',
    atualizado: '14:14 UTC',
  },
  {
    id: 'SQ0673',
    cia: 'Singapore',
    from: { code: 'SIN', city: 'Singapura', x: 69, y: 58, time: '19:00' },
    to: { code: 'NRT', city: 'Toquio', x: 82, y: 38, time: '02:30' },
    altitude: '36.900 ft',
    velocidade: '845 km/h',
    aeronave: 'Airbus A350-900',
    portao: 'E02',
    progress: 0.31,
    speed: 0.011,
    risco: 'atencao',
    regiao: 'Asia',
    atualizado: '14:09 UTC',
  },
  {
    id: 'UA0834',
    cia: 'United',
    from: { code: 'NRT', city: 'Toquio', x: 82, y: 38, time: '16:50' },
    to: { code: 'SFO', city: 'San Francisco', x: 12, y: 38, time: '01:15' },
    altitude: '39.100 ft',
    velocidade: '890 km/h',
    aeronave: 'Boeing 777-300ER',
    portao: 'D02',
    progress: 0.44,
    speed: 0.01,
    risco: 'atencao',
    regiao: 'America do Norte/Asia',
    atualizado: '14:05 UTC',
  },
  {
    id: 'IB6823',
    cia: 'Iberia',
    from: { code: 'MAD', city: 'Madri', x: 45, y: 35, time: '16:35' },
    to: { code: 'LIS', city: 'Lisboa', x: 43, y: 36, time: '17:40' },
    altitude: '25.000 ft',
    velocidade: '640 km/h',
    aeronave: 'Airbus A320',
    portao: 'C02',
    progress: 0.72,
    speed: 0.016,
    risco: 'operando',
    regiao: 'Europa',
    atualizado: '14:19 UTC',
  },
  {
    id: 'LH2098',
    cia: 'Lufthansa',
    from: { code: 'FRA', city: 'Frankfurt', x: 46, y: 33, time: '15:50' },
    to: { code: 'GRU', city: 'Sao Paulo', x: 33, y: 66, time: '04:30' },
    altitude: '37.000 ft',
    velocidade: '830 km/h',
    aeronave: 'Boeing 747-8',
    portao: 'E05',
    progress: 0.28,
    speed: 0.013,
    risco: 'operando',
    regiao: 'Europa',
    atualizado: '14:02 UTC',
  },
  {
    id: 'SU9876',
    cia: 'Aeroflot',
    from: { code: 'SVO', city: 'Moscou', x: 60, y: 28, time: '17:10' },
    to: { code: 'GRU', city: 'Sao Paulo', x: 33, y: 66, time: '03:50' },
    altitude: '36.500 ft',
    velocidade: '820 km/h',
    aeronave: 'Airbus A330',
    portao: 'E09',
    progress: 0.12,
    speed: 0.011,
    risco: 'operando',
    regiao: 'Europa/Asia',
    atualizado: '14:06 UTC',
  },
  {
    id: 'SA5599',
    cia: 'South African',
    from: { code: 'JNB', city: 'Johannesburgo', x: 54, y: 72, time: '18:20' },
    to: { code: 'LIS', city: 'Lisboa', x: 43, y: 36, time: '05:50' },
    altitude: '35.800 ft',
    velocidade: '815 km/h',
    aeronave: 'Boeing 777-200',
    portao: 'D01',
    progress: 0.46,
    speed: 0.012,
    risco: 'atencao',
    regiao: 'Africa/Europa',
    atualizado: '14:07 UTC',
  },
  {
    id: 'CA5678',
    cia: 'Air China',
    from: { code: 'PEK', city: 'Pequim', x: 80, y: 36, time: '19:05' },
    to: { code: 'GRU', city: 'Sao Paulo', x: 33, y: 66, time: '06:40' },
    altitude: '39.000 ft',
    velocidade: '860 km/h',
    aeronave: 'Boeing 777-300ER',
    portao: 'F02',
    progress: 0.05,
    speed: 0.014,
    risco: 'operando',
    regiao: 'Asia',
    atualizado: '14:01 UTC',
  },
  {
    id: 'QF400',
    cia: 'Qantas',
    from: { code: 'SYD', city: 'Sydney', x: 95, y: 50, time: '20:10' },
    to: { code: 'AKL', city: 'Auckland', x: 98, y: 44, time: '05:10' },
    altitude: '34.000 ft',
    velocidade: '780 km/h',
    aeronave: 'Boeing 787-9',
    portao: 'A01',
    progress: 0.66,
    speed: 0.012,
    risco: 'operando',
    regiao: 'Oceania',
    atualizado: '14:21 UTC',
  },
  {
    id: 'G32001',
    cia: 'Gol',
    from: { code: 'GRU', city: 'Sao Paulo', x: 33, y: 66, time: '16:05' },
    to: { code: 'CNF', city: 'Belo Horizonte', x: 34, y: 68, time: '17:20' },
    altitude: '28.500 ft',
    velocidade: '720 km/h',
    aeronave: 'Boeing 737-800',
    portao: 'C05',
    progress: 0.22,
    speed: 0.02,
    risco: 'operando',
    regiao: 'Nacional',
    atualizado: '14:17 UTC',
  },
  {
    id: 'AZ5000',
    cia: 'Azul',
    from: { code: 'VCP', city: 'Campinas', x: 33, y: 65, time: '16:40' },
    to: { code: 'BEL', city: 'Belem', x: 38, y: 50, time: '19:10' },
    altitude: '30.200 ft',
    velocidade: '760 km/h',
    aeronave: 'Embraer E195',
    portao: 'B09',
    progress: 0.12,
    speed: 0.018,
    risco: 'operando',
    regiao: 'Nacional',
    atualizado: '14:22 UTC',
  },
  {
    id: 'KQ7700',
    cia: 'Kenya Airways',
    from: { code: 'NBO', city: 'Nairobi', x: 55, y: 58, time: '18:50' },
    to: { code: 'LHR', city: 'Londres', x: 45, y: 32, time: '05:00' },
    altitude: '36.700 ft',
    velocidade: '825 km/h',
    aeronave: 'Boeing 787-8',
    portao: 'D15',
    progress: 0.34,
    speed: 0.012,
    risco: 'operando',
    regiao: 'Africa/Europa',
    atualizado: '14:12 UTC',
  },
];

function mask(text, enabled) {
  return enabled ? '***' : text;
}

function statusClass(status) {
  const value = String(status).toLowerCase();
  if (value.includes('cancel')) return 'danger';
  if (value.includes('atraso') || value.includes('processando')) return 'warn';
  if (value.includes('agendado') || value.includes('programado') || value.includes('voo')) return 'info';
  return 'ok';
}

function pointToLatLng(point) {
  const lat = 85 - point.y * 1.7;
  const lng = point.x * 3.6 - 180;
  return [lat, lng];
}

function interpolatePoint(from, to, progress) {
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
}

function headingDegrees(from, to) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI + 90;
}

function planeIcon(risco, selected, angle) {
  const svgPlane = `
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${angle}deg);">
      <path d="M2 12 L22 6 L18 12 L22 18 L2 12 Z" fill="#0e3a5a" opacity="0.95" />
    </svg>`;
  return L.divIcon({
    className: 'plane-icon-wrapper',
    html: `<div class="plane-pin ${risco} ${selected ? 'selected' : ''}">${svgPlane}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function riscoLabel(risco) {
  if (risco === 'atraso') return 'Risco alto de atraso';
  if (risco === 'atencao') return 'Risco moderado';
  return 'Operacao estavel';
}
  // Gera um conjunto de voos "ambient" para popular o mapa (mock de fundo)
  function buildAmbientFlights() {
    const ambient = [];
    for (let i = 0; i < 60; i++) {
      const src = MAP_FLIGHTS[i % MAP_FLIGHTS.length];
      ambient.push({
        id: `${src.id}-A${i}`,
        cia: src.cia,
        from: src.from,
        to: src.to,
        progress: Math.random(),
        speed: src.speed || 0.012,
        risco: src.risco || 'operando'
      });
    }
    return ambient;
  }

  function App() {
  const [token, setToken] = useState(null);
  const [me, setMe] = useState(null);
  const [erro, setErro] = useState('');
  const [email, setEmail] = useState('user1@example.com');
  const [senha, setSenha] = useState('123456');
  const [nome, setNome] = useState('');
  const [companhia, setCompanhia] = useState('');
  const [perfil, setPerfil] = useState('OPERADOR');
  const [modoAuth, setModoAuth] = useState('login');
  const [cookieStatus, setCookieStatus] = useState(() => localStorage.getItem('cookie_status') || '');

  const [activeSection, setActiveSection] = useState('dashboard');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [buscaGlobal, setBuscaGlobal] = useState('');
  const [voos, setVoos] = useState(MOCK_VOOS);
  const [mapFlights, setMapFlights] = useState(MAP_FLIGHTS);
  const [ambientFlights, setAmbientFlights] = useState([]);
  const [selectedFlightId, setSelectedFlightId] = useState(null);
  const [selectedFlightData, setSelectedFlightData] = useState(null);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [mapBusca, setMapBusca] = useState('');
  const [mapStatus, setMapStatus] = useState('todos');
  const mapRootRef = useRef(null);
  const leafletRef = useRef({ map: null, markers: new Map(), routes: new Map(), base: null });

  const visiveis = useMemo(() => {
    const q = buscaGlobal.toLowerCase().trim();
    if (!q) return voos;
    return voos.filter((v) =>
      [v.cia, v.numero, v.destino, v.portao, v.status].join(' ').toLowerCase().includes(q)
    );
  }, [voos, buscaGlobal]);

  const selectedFlight = useMemo(
    () => mapFlights.find((f) => f.id === selectedFlightId) || null,
    [mapFlights, selectedFlightId]
  );
  const displayedFlight = selectedFlightData || selectedFlight;
  const mapFiltrados = useMemo(() => {
    const q = mapBusca.toLowerCase().trim();
    return mapFlights.filter((f) => {
      if (mapStatus !== 'todos' && f.risco !== mapStatus) return false;
      if (!q) return true;
      const texto = [f.id, f.cia, f.from.code, f.to.code, f.from.city, f.to.city, f.aeronave, f.portao, f.horario]
        .join(' ')
        .toLowerCase();
      return texto.includes(q);
    });
  }, [mapFlights, mapBusca, mapStatus]);

  const mapResumo = useMemo(() => ({
    operando: mapFlights.filter((f) => f.risco === 'operando').length,
    atencao: mapFlights.filter((f) => f.risco === 'atencao').length,
    atraso: mapFlights.filter((f) => f.risco === 'atraso').length,
  }), [mapFlights]);

  useEffect(() => {
    let rafId = 0;
    let prevTime = performance.now();
    let acc = 0;

    const tick = (now) => {
      const dt = Math.min(0.06, (now - prevTime) / 1000);
      prevTime = now;
      acc += dt * 1000; // ms

      // update internal positions every frame but only set React state every 80ms
      mapFlights.forEach((f) => {
        f.progress = f.progress + f.speed * dt;
        if (f.progress > 1) f.progress -= 1;
      });

      if (acc >= 100) {
        // shallow copy to trigger render
        setMapFlights((prev) => prev.map((f) => ({ ...f })));
        acc = 0;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);
  useEffect(() => {
    if (activeSection !== 'dashboard' || privacyMode || !mapRootRef.current) return;

    const ctx = leafletRef.current;
    if (ctx.map) {
      requestAnimationFrame(() => ctx.map.invalidateSize());
      return;
    }

    const map = L.map(mapRootRef.current, {
      center: [12, -20],
      zoom: 2,
      minZoom: 2,
      maxZoom: 6,
      zoomControl: true,
      worldCopyJump: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);

    ctx.map = map;
    ctx.base = L.circleMarker([-23.4356, -46.4731], {
      radius: 6,
      color: '#0f7b47',
      fillColor: '#22c55e',
      fillOpacity: 0.9,
      weight: 1,
    }).addTo(map);
    ctx.base.bindTooltip('GRU - Aeroporto Base', { direction: 'top', offset: [0, -6] });

    requestAnimationFrame(() => map.invalidateSize());
  }, [activeSection, privacyMode]);

  useEffect(() => {
    if (!mapFullscreen) return;
    const map = leafletRef.current.map;
    if (map) requestAnimationFrame(() => map.invalidateSize());
  }, [mapFullscreen]);

  useEffect(() => {
    const ctx = leafletRef.current;
    const map = ctx.map;
    if (!map || activeSection !== 'dashboard' || privacyMode) return;

    const visible = new Set(mapFiltrados.map((f) => f.id));
    mapFiltrados.forEach((f) => {
      const start = pointToLatLng(f.from);
      const end = pointToLatLng(f.to);
      const current = pointToLatLng(interpolatePoint(f.from, f.to, f.progress));
      const selected = selectedFlightId === f.id;
      const angle = headingDegrees(f.from, f.to);
      const color = f.risco === 'atraso' ? '#ff8f8f' : f.risco === 'atencao' ? '#ffd45f' : '#ffe083';

      if (!ctx.routes.has(f.id)) {
        ctx.routes.set(
          f.id,
          L.polyline([start, end], {
            color: '#87b6e8',
            weight: 1.2,
            opacity: 0.65,
            dashArray: '6 8',
          }).addTo(map)
        );
      } else {
        ctx.routes.get(f.id).setLatLngs([start, end]);
      }

      const route = ctx.routes.get(f.id);
      route.setStyle({
        color: selected ? '#d7ebff' : '#87b6e8',
        weight: selected ? 2.2 : 1.2,
        opacity: selected ? 0.95 : 0.65,
      });

      if (!ctx.markers.has(f.id)) {
        const mk = L.marker(current, {
          icon: planeIcon(f.risco, selected, angle),
          keyboard: false,
        });
        mk.addTo(map);
        mk.on('click', async () => {
          mk.bindPopup(`<strong>${f.id}</strong><br/>${f.cia} · ${f.from.code} → ${f.to.code}<br/>${Math.round(f.progress * 100)}%`).openPopup();
          setSelectedFlightId(f.id);
          // set minimal data immediately for snappy UI and mark loading
          setSelectedFlightData({ ...f, riscoInfo: null, riscoLoading: true });
          // fetch probability from API
          const risco = await fetchRisco(f.id, 'tradicional');
          setSelectedFlightData((prev) => prev ? { ...prev, riscoInfo: risco, riscoLoading: false } : null);
        });
        mk.bindTooltip('', { direction: 'top', offset: [0, -12], opacity: 0.92 });
        ctx.markers.set(f.id, mk);
      }

      const marker = ctx.markers.get(f.id);
      marker.setLatLng(current);
      marker.setIcon(planeIcon(f.risco, selected, angle));
      marker.setTooltipContent(`${f.id} (${f.cia}) | ${f.from.code} -> ${f.to.code} | ${Math.round(f.progress * 100)}%`);
      marker.getElement()?.style.setProperty('--pin-color', color);
    });

    [...ctx.markers.keys()].forEach((id) => {
      if (!visible.has(id)) {
        ctx.markers.get(id).remove();
        ctx.markers.delete(id);
      }
    });

    [...ctx.routes.keys()].forEach((id) => {
      if (!visible.has(id)) {
        ctx.routes.get(id).remove();
        ctx.routes.delete(id);
      }
    });
  }, [mapFiltrados, selectedFlightId, activeSection, privacyMode]);

  

  useEffect(() => () => {
    const ctx = leafletRef.current;
    if (ctx.map) {
      ctx.map.remove();
      ctx.map = null;
      ctx.markers.clear();
      ctx.routes.clear();
      ctx.base = null;
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');
    try {
      const resp = await api.post('/auth/login', { email, senha });
      setToken(resp.data.token);
      setAuthToken(resp.data.token);
      const meResp = await api.get('/auth/me');
      setMe(meResp.data);
    } catch (err) {
      setErro(err?.response?.data?.error || 'Falha no login');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.post('/auth/register', { nome, email, senha, perfil, companhia });
      setModoAuth('login');
      setErro('Cadastro realizado. Faça login.');
    } catch (err) {
      setErro(err?.response?.data?.error || 'Erro ao registrar usuario');
    }
  }

  function sair() {
    setToken(null);
    setMe(null);
    setAuthToken(null);
  }

  function closeModal() {
    const ctx = leafletRef.current;
    if (selectedFlightId && ctx?.markers?.has && ctx.markers.has(selectedFlightId)) {
      try { ctx.markers.get(selectedFlightId).closePopup(); } catch (e) {}
    }
    setSelectedFlightId(null);
    setSelectedFlightData(null);
  }

  function flightProbability(f) {
    if (!f) return 0;
    if (f.risco === 'atraso') return Math.min(95, 60 + Math.round((1 - f.progress) * 40));
    if (f.risco === 'atencao') return Math.min(80, 30 + Math.round((1 - f.progress) * 50));
    return Math.max(5, Math.round((1 - f.progress) * 30));
  }

  async function fetchRisco(numero_voo, modelo = 'tradicional') {
    try {
      const resp = await api.get(`/ia/risco-atraso/${numero_voo}?modelo=${modelo}`);
      const data = resp.data || {};
      // normalize several possible response shapes to { percent, label }
      if (data.risco && typeof data.risco === 'object' && (data.risco.percent || data.risco.label)) {
        return { percent: data.risco.percent ?? data.risco.percentual ?? null, label: data.risco.label ?? null };
      }
      if (typeof data.percent === 'number' || typeof data.percentual === 'number') {
        return { percent: data.percent ?? data.percentual, label: data.label ?? null };
      }
      if (typeof data.probability === 'number') {
        // probability as 0..1
        return { percent: Math.round((data.probability || 0) * 100), label: data.label ?? null };
      }
      return null;
    } catch (err) {
      console.error('Erro ao buscar risco:', err);
      return null;
    }
  }

  if (!token) {
    const bloqueadoPorCookie = cookieStatus !== 'aceito' && cookieStatus !== 'recusado';
    return (
      <div className="auth-wrap">
          <div className="company-corner">SkyTrak Air Traffic Control</div>
          <div className={`auth-card ${bloqueadoPorCookie ? 'blocked' : ''}`}>
            <img
              className="auth-logo"
              src="/skytrak-logo-transparent.png"
              alt="SkyTrak"
              onError={(e) => {
                const cur = e.currentTarget;
                if (!cur.src.includes('skytrak-logo.png')) cur.src = '/skytrak-logo.png';
              }}
            />
            <p>Sistema de Gestão Aeroportuária com IA e compliance LGPD.</p>
          {modoAuth === 'login' ? (
            <form onSubmit={handleLogin} className="auth-form">
              <label>Email<input disabled={bloqueadoPorCookie} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <label>Senha<input disabled={bloqueadoPorCookie} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} /></label>
              {erro && <span className="error">{erro}</span>}
              <button disabled={bloqueadoPorCookie} className="btn primary" type="submit">Entrar</button>
              <button disabled={bloqueadoPorCookie} className="btn ghost" type="button" onClick={() => setModoAuth('register')}>Criar conta</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <label>Nome<input disabled={bloqueadoPorCookie} value={nome} onChange={(e) => setNome(e.target.value)} /></label>
              <label>Email<input disabled={bloqueadoPorCookie} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <label>Senha<input disabled={bloqueadoPorCookie} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} /></label>
                <label>Perfil
                  <select disabled={bloqueadoPorCookie} value={perfil} onChange={(e) => setPerfil(e.target.value)}>
                    <option value="OPERADOR">Operador</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="CIA">Companhia</option>
                    <option value="PASSAGEIRO">Passageiro</option>
                  </select>
                </label>
                {perfil === 'CIA' && (
                  <label>Companhia
                    <input
                      disabled={bloqueadoPorCookie}
                      value={companhia}
                      onChange={(e) => setCompanhia(e.target.value)}
                      placeholder="Nome da companhia"
                    />
                  </label>
                )}
              {erro && <span className="error">{erro}</span>}
              <button disabled={bloqueadoPorCookie} className="btn primary" type="submit">Cadastrar</button>
              <button disabled={bloqueadoPorCookie} className="btn ghost" type="button" onClick={() => setModoAuth('login')}>Voltar</button>
            </form>
          )}
        </div>
        {bloqueadoPorCookie && (
          <div className="cookie-banner">
            <span>Aceite ou recuse cookies para usar o sistema.</span>
            <div>
              <button className="btn primary" onClick={() => { setCookieStatus('aceito'); localStorage.setItem('cookie_status', 'aceito'); }}>Aceitar</button>
              <button className="btn ghost" onClick={() => { setCookieStatus('recusado'); localStorage.setItem('cookie_status', 'recusado'); }}>Recusar</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <button className={`nav-btn ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10h18v6H3z" stroke="#9fbef8" strokeWidth="1.2" fill="#0d2a4a"/></svg>Dashboard
        </button>
        <button className={`nav-btn ${activeSection === 'voos' ? 'active' : ''}`} onClick={() => setActiveSection('voos')}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3 7h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" stroke="#9fbef8" strokeWidth="0.8"/></svg>Voos
        </button>
        <button className={`nav-btn ${activeSection === 'aeronaves' ? 'active' : ''}`} onClick={() => setActiveSection('aeronaves')}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3" stroke="#9fbef8" strokeWidth="0.9"/><path d="M4 20c4-4 8-4 16 0" stroke="#9fbef8" strokeWidth="0.9"/></svg>Aeronaves
        </button>
        <button className={`nav-btn ${activeSection === 'relatorios' ? 'active' : ''}`} onClick={() => setActiveSection('relatorios')}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="2" stroke="#9fbef8" strokeWidth="0.9"/></svg>Relatorios
        </button>
        <button className={`nav-btn ${activeSection === 'configuracoes' ? 'active' : ''}`} onClick={() => setActiveSection('configuracoes')}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="#9fbef8" strokeWidth="0.9"/><path d="M19.4 15a1.5 1.5 0 0 0 0-1.8l1.3-1a.6.6 0 0 0 0-1l-1.3-1a1.5 1.5 0 0 0-1.8 0l-1-.6a.6.6 0 0 0-.6 0l-1 .6a1.5 1.5 0 0 0-1.8 0l-1.3-1a.6.6 0 0 0-1 0l-1.3 1a1.5 1.5 0 0 0 0 1.8l-1 .6a.6.6 0 0 0 0 .6l1 .6a1.5 1.5 0 0 0 0 1.8l-1.3 1a.6.6 0 0 0 0 1l1.3 1a1.5 1.5 0 0 0 1.8 0l1 .6a.6.6 0 0 0 .6 0l1-.6a1.5 1.5 0 0 0 1.8 0l1.3 1a.6.6 0 0 0 1 0l1.3-1a1.5 1.5 0 0 0 0-1.8l1-.6a.6.6 0 0 0 0-.6z" stroke="#9fbef8" strokeWidth="0.6"/></svg>Configuracoes
        </button>
      </aside>

      <div className="main">
        <header className="header">
                <img
                className="app-logo"
                src="/skytrak-logo-transparent.png"
                alt="SkyTrak"
                onError={(e) => {
                  const cur = e.currentTarget;
                  if (!cur.src.includes('skytrak-logo.png')) cur.src = '/skytrak-logo.png';
                }}
              />
          <input
            className="global-search"
            placeholder="Buscar voos, aeronaves, portoes..."
            value={buscaGlobal}
            onChange={(e) => setBuscaGlobal(e.target.value)}
          />
          <div className="header-actions">
            <span className="who">{me?.nome || 'Operador'} ({me?.perfil || 'OPERADOR'})</span>
            <button className={`privacy-toggle ${privacyMode ? 'on' : ''}`} onClick={() => setPrivacyMode((v) => !v)}>
              Modo Privacidade {privacyMode ? 'ON' : 'OFF'}
            </button>
            <button className="btn ghost" onClick={sair}>Sair</button>
          </div>
        </header>

        {activeSection === 'dashboard' && (
          <section className="section">
            <h2>Dashboard Operacional</h2>
            <div className="kpi-row">
              <div className="kpi"><span>Voos Ativos</span><strong>{mask(String(mapFlights.length), privacyMode)}</strong></div>
              <div className="kpi"><span>Pousos Hoje</span><strong>{mask(String(mapFlights.filter(f => ['GRU','CGH','SDU'].includes(f.to.code)).length), privacyMode)}</strong></div>
              <div className="kpi warn"><span>Atrasos</span><strong>{mask(String(mapResumo.atraso), privacyMode)}</strong></div>
              <div className="kpi"><span>Incidentes</span><strong>{mask('0', privacyMode)}</strong></div>
            </div>

            <div className={`panel map-world ${mapFullscreen ? 'fullscreen' : ''}`}>
              <div className="map-head">
                <div>
                  <h3>Mapa de rotas ao vivo</h3>
                  <span>{mapFiltrados.length} voos visiveis</span>
                </div>
                <button className="btn ghost small" onClick={() => setMapFullscreen((v) => !v)}>
                  {mapFullscreen ? 'Minimizar' : 'Maximizar'}
                </button>
              </div>

              {privacyMode ? (
                <div className="map-privacy-lock">Modo privacidade ativo: mapa ocultado por seguranca.</div>
              ) : (
                <div className="map-stage">
                  <div className="map-toolbar">
                    <div className="map-toolbar-left">
                      <span className="map-badge">Skyline Live</span>
                      <div className="zoom-controls">
                        <button type="button" className="zoom-btn" onClick={() => leafletRef.current.map?.zoomIn()}>+</button>
                        <button type="button" className="zoom-btn" onClick={() => leafletRef.current.map?.zoomOut()}>−</button>
                      </div>
                    </div>
                    <div className="map-search-wrap">
                      <input
                        value={mapBusca}
                        onChange={(e) => setMapBusca(e.target.value)}
                        placeholder="Pesquisar voo, companhia ou aeroporto"
                      />
                      <button type="button">Filtrar</button>
                    </div>
                    <div className="map-count-card">
                      <strong>{mapFiltrados.length}</strong>
                      <span>voos ativos</span>
                    </div>
                  </div>

                  <div className="status-filters">
                    <button className={`status-chip ${mapStatus === 'todos' ? 'active' : ''}`} onClick={() => setMapStatus('todos')}>Todos</button>
                    <button className={`status-chip operando ${mapStatus === 'operando' ? 'active' : ''}`} onClick={() => setMapStatus('operando')}>Operando {mapResumo.operando}</button>
                    <button className={`status-chip atencao ${mapStatus === 'atencao' ? 'active' : ''}`} onClick={() => setMapStatus('atencao')}>Atencao {mapResumo.atencao}</button>
                    <button className={`status-chip atraso ${mapStatus === 'atraso' ? 'active' : ''}`} onClick={() => setMapStatus('atraso')}>Atraso {mapResumo.atraso}</button>
                  </div>

                  <div ref={mapRootRef} className="leaflet-map" />

                  <div className="map-legend-row">
                    <span><i className="legend-dot active" /> Operando</span>
                    <span><i className="legend-dot attention" /> Atencao</span>
                    <span><i className="legend-dot danger" /> Atraso</span>
                    <span><i className="legend-dot base" /> Aeroporto Base</span>
                  </div>
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>Probabilidade de Atrasos Operacionais</h3>
                <span className="chip warn">Atencao: Pico as 17:00</span>
              </div>
              <p className="chart-subtitle">Previsao para as proximas 4 horas</p>
              <div className="prob-chart">
                <div className="prob-axis">
                  <span>80</span>
                  <span>60</span>
                  <span>40</span>
                  <span>20</span>
                  <span>0</span>
                </div>
                <div className="prob-plot">
                  <div className="grid-lines" />
                  <div className="prob-col">
                    <i className="bar ok" style={{ height: '18%' }} />
                    <label>14:00</label>
                  </div>
                  <div className="prob-col">
                    <i className="bar ok" style={{ height: '34%' }} />
                    <label>15:00</label>
                  </div>
                  <div className="prob-col">
                    <i className="bar warn" style={{ height: '54%' }} />
                    <label>16:00</label>
                  </div>
                  <div className="prob-col">
                    <i className="bar danger" style={{ height: '78%' }} />
                    <label>17:00</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid-dashboard">
              <div className="panel">
                <h3>Voos em Operacao</h3>
                <table className="table">
                  <thead><tr><th>Companhia</th><th>Voo</th><th>Destino</th><th>Horario</th><th>Portao</th><th>Status</th></tr></thead>
                  <tbody>
                    {visiveis.map((v) => (
                      <tr key={v.numero}>
                        <td>{mask(v.cia, privacyMode)}</td>
                        <td>{mask(v.numero, privacyMode)}</td>
                        <td>{mask(v.destino, privacyMode)}</td>
                        <td>{v.horario}</td>
                        <td>{mask(v.portao, privacyMode)}</td>
                        <td><span className={`chip ${statusClass(v.status)}`}>{v.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <aside className="panel chat">
                <h3>Chat IA Generativa</h3>
                <div className="chat-body">
                  <p><strong>IA:</strong> Posso analisar risco por companhia, rota e janela de portao.</p>
                  <p><strong>Operador:</strong> Quais voos com risco alto nas proximas 4 horas?</p>
                  <p><strong>IA:</strong> G31847 e UA0834 com atraso provavel. Recomendo realocacao de gate.</p>
                </div>
                <input placeholder="Digite uma pergunta operacional..." />
              </aside>
            </div>
          </section>
        )}

        {activeSection === 'voos' && (
          <section className="section">
            <h2>Gestao de Voos</h2>
            <p>Visualizacao completa de todos os voos</p>
            <div className="panel">
              <table className="table">
                <thead><tr><th>Companhia</th><th>Voo</th><th>Destino</th><th>Horario</th><th>Portao</th><th>Status</th></tr></thead>
                <tbody>
                  {visiveis.map((v) => (
                    <tr key={v.numero}>
                      <td>{mask(v.cia, privacyMode)}</td>
                      <td>{mask(v.numero, privacyMode)}</td>
                      <td>{mask(v.destino, privacyMode)}</td>
                      <td>{v.horario}</td>
                      <td>{mask(v.portao, privacyMode)}</td>
                      <td><span className={`chip ${statusClass(v.status)}`}>{v.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeSection === 'aeronaves' && (
          <section className="section">
            <h2>Gestao de Aeronaves</h2>
            <div className="cards-grid">
              {MOCK_AERONAVES.map((a) => (
                <article className="aircraft-card" key={a.id}>
                  <h3>{mask(a.id, privacyMode)}</h3>
                  <p>{a.modelo}</p>
                  <span className={`chip ${statusClass(a.status)}`}>{a.status}</span>
                  <p><strong>Companhia:</strong> {mask(a.cia, privacyMode)}</p>
                  <p><strong>Localizacao:</strong> {mask(a.localizacao, privacyMode)}</p>
                  <p><strong>Proximo voo:</strong> {mask(a.proximo, privacyMode)}</p>
                  <p><strong>Ultima manutencao:</strong> {a.manutencao}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeSection === 'relatorios' && (
          <section className="section">
            <h2>Relatorios</h2>
            <div className="panel lgpd-banner">
              <strong>Conformidade LGPD Ativa</strong>
              <p>Todos os relatórios seguem anonimização de dados pessoais e retenção controlada.</p>
            </div>
            <div className="panel">
              <div className="row-tools">
                <select><option>Hoje</option><option>7 dias</option><option>30 dias</option></select>
                <button className="btn ghost">Filtros</button>
                <button className="btn primary">Novo Relatorio</button>
              </div>
              <table className="table">
                <thead><tr><th>Nome</th><th>Tipo</th><th>Data</th><th>Tamanho</th><th>Status</th><th>LGPD</th><th>Acoes</th></tr></thead>
                <tbody>
                  {MOCK_RELATORIOS.map((r) => (
                    <tr key={r.nome}>
                      <td>{mask(r.nome, privacyMode)}</td>
                      <td>{r.tipo}</td>
                      <td>{r.data}</td>
                      <td>{r.tamanho}</td>
                      <td><span className={`chip ${statusClass(r.status)}`}>{r.status}</span></td>
                      <td><span className="chip ok">{r.lgpd}</span></td>
                      <td><button className="btn small">Baixar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeSection === 'configuracoes' && (
          <section className="section">
            <h2>Configuracoes</h2>
            <div className="settings-grid">
              <div className="panel">
                <h3>Perfil do Usuario</h3>
                <label>Nome<input value={mask('Operador Sistema', privacyMode)} readOnly /></label>
                <label>Email<input value={mask('operador@aeroporto.com', privacyMode)} readOnly /></label>
                <label>Cargo<select><option>Operador Senior</option></select></label>
              </div>
              <div className="panel">
                <h3>Notificacoes</h3>
                <label><input type="checkbox" defaultChecked /> Atrasos de Voos</label>
                <label><input type="checkbox" defaultChecked /> Cancelamentos</label>
                <label><input type="checkbox" /> Manutencao</label>
                <label><input type="checkbox" defaultChecked /> Sistema</label>
              </div>
              <div className="panel">
                <h3>Privacidade e Seguranca</h3>
                <label><input type="checkbox" checked={privacyMode} onChange={() => setPrivacyMode((v) => !v)} /> Modo Privacidade Automatico</label>
                <label><input type="checkbox" defaultChecked /> Registro de Acessos</label>
                <label>Retencao de Dados<select><option>90 dias</option><option>180 dias</option><option>365 dias</option></select></label>
              </div>
              <div className="panel">
                <h3>Aparencia</h3>
                <label>Tema<select><option>Escuro (Dark Mode)</option><option>Claro</option></select></label>
                <label>Idioma<select><option>Portugues (Brasil)</option><option>English</option></select></label>
                <label>Densidade<select><option>Confortavel</option><option>Compacta</option></select></label>
              </div>
              <div className="panel full">
                <h3>Seguranca da Conta</h3>
                <div className="security-actions">
                  <button className="btn ghost">Alterar Senha</button>
                  <button className="btn ghost">Autenticacao em Dois Fatores</button>
                  <button className="btn ghost">Sessoes Ativas</button>
                  <button className="btn ghost">Solicitar Dados Pessoais (LGPD Art. 18)</button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {displayedFlight && !privacyMode && (
        <div className="flight-modal-backdrop" onClick={closeModal}>
            <div className="flight-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal" onClick={closeModal}>✕</button>
            <div className="flight-header">
              <h3>{displayedFlight.id}</h3>
              <p>{displayedFlight.cia}</p>
            </div>

            <div className="route-visual">
              <div>
                <strong>{displayedFlight.from.code}</strong>
                <span>{displayedFlight.from.city}</span>
                <b>{displayedFlight.from.time}</b>
              </div>
              <div className="progress-block">
                  <div className="progress-top">
                    <div className="airport-left">
                      <div className="time">{displayedFlight.from.time}</div>
                      <div className="label">Partida</div>
                    </div>
                    <div className="progress-center">
                      <div className="plane-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 12 L22 6 L18 12 L22 18 L2 12 Z" fill="#98c3ff" />
                        </svg>
                      </div>
                                    <button className="close-modal" onClick={closeModal} aria-label="Fechar">
                                      <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M6 6 L18 18 M18 6 L6 18" stroke="#96afda" strokeWidth="1.6" strokeLinecap="round"/></svg>
                                    </button>
                      <div className="progress-line">
                        <i style={{ width: `${Math.round(displayedFlight.progress * 100)}%` }} />
                      </div>
                      {displayedFlight?.riscoLoading ? (
                        <div className="probability"><span className="spinner" /> Carregando...</div>
                      ) : (
                        <div className="probability">Probabilidade: <strong>{displayedFlight?.riscoInfo?.percent ?? flightProbability(displayedFlight)}%</strong>{displayedFlight?.riscoInfo?.label ? <span className="prob-label"> — {displayedFlight.riscoInfo.label}</span> : null}</div>
                      )}
                    </div>
                    <div className="airport-right">
                      <div className="time">{displayedFlight.to.time}</div>
                      <div className="label">Chegada</div>
                    </div>
                  </div>
                    <small className="progress-percent">{Math.round(displayedFlight.progress * 100)}% completo</small>
              </div>
              <div>
                  <strong>{displayedFlight.to.code}</strong>
                  <span>{displayedFlight.to.city}</span>
                  <b>{displayedFlight.to.time}</b>
              </div>
            </div>

            <div className="flight-grid">
                  <article className="stat-card">
                    <span className="stat-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2v4M12 18v4M4 12h4M16 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" stroke="#9fbef8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span>Altitude</span>
                    <strong>{displayedFlight.altitude}</strong>
                  </article>

                  <article className="stat-card">
                    <span className="stat-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 13h4l3-8 4 16 3-10 4-1" stroke="#9fbef8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span>Velocidade</span>
                    <strong>{displayedFlight.velocidade}</strong>
                  </article>

                  <article className="stat-card">
                    <span className="stat-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 12l20-7-4 14-6-3-6 3-4-7z" stroke="#9fbef8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span>Aeronave</span>
                    <strong>{displayedFlight.aeronave}</strong>
                  </article>

                  <article className="stat-card">
                    <span className="stat-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="5" width="18" height="14" rx="2" stroke="#9fbef8" strokeWidth="1.2"/>
                        <path d="M8 12h8" stroke="#9fbef8" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <span>Portão</span>
                    <strong>{displayedFlight.portao}</strong>
                  </article>
            </div>

              <div className="flight-status-live"><span className="status-dot" /> Voo Ativo - Em Rota</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;









