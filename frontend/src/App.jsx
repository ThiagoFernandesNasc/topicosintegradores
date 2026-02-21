import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api, { setAuthToken } from './api';
import './App.css';

const MOCK_VOOS = [
  { cia: 'TAP', numero: 'TP8091', destino: 'Lisboa', horario: '14:30', portao: 'A12', status: 'Confirmado' },
  { cia: 'LATAM', numero: 'LA3502', destino: 'Sao Paulo', horario: '15:15', portao: 'B07', status: 'Confirmado' },
  { cia: 'Gol', numero: 'G31847', destino: 'Rio de Janeiro', horario: '15:45', portao: 'C04', status: 'Atraso Provável' },
  { cia: 'Azul', numero: 'AD4123', destino: 'Brasilia', horario: '16:20', portao: 'A09', status: 'Confirmado' },
  { cia: 'United', numero: 'UA0834', destino: 'Miami', horario: '16:50', portao: 'D02', status: 'Atraso Provável' },
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

const MAP_FLIGHTS_RAW = [
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

const AIRPORT_COORDS = {
  ADD: { lat: 8.9779, lng: 38.7993 },
  AKL: { lat: -37.0082, lng: 174.785 },
  AMS: { lat: 52.3105, lng: 4.7683 },
  BEL: { lat: -1.3793, lng: -48.4763 },
  BKK: { lat: 13.69, lng: 100.7501 },
  BSB: { lat: -15.8692, lng: -47.9208 },
  CDG: { lat: 49.0097, lng: 2.5479 },
  CGH: { lat: -23.6267, lng: -46.6564 },
  CNF: { lat: -19.6357, lng: -43.9669 },
  DOH: { lat: 25.2736, lng: 51.6081 },
  DXB: { lat: 25.2532, lng: 55.3657 },
  FRA: { lat: 50.0379, lng: 8.5622 },
  GRU: { lat: -23.4356, lng: -46.4731 },
  JNB: { lat: -26.1337, lng: 28.242 },
  LHR: { lat: 51.47, lng: -0.4543 },
  LIS: { lat: 38.7742, lng: -9.1342 },
  LOS: { lat: 6.5774, lng: 3.3212 },
  MAD: { lat: 40.4983, lng: -3.5676 },
  NBO: { lat: -1.3192, lng: 36.9278 },
  NRT: { lat: 35.772, lng: 140.3929 },
  PEK: { lat: 40.0799, lng: 116.6031 },
  REC: { lat: -8.1265, lng: -34.9236 },
  SCL: { lat: -33.3929, lng: -70.7858 },
  SFO: { lat: 37.6213, lng: -122.379 },
  SIN: { lat: 1.3644, lng: 103.9915 },
  SVO: { lat: 55.9726, lng: 37.4146 },
  SYD: { lat: -33.9399, lng: 151.1753 },
  VCP: { lat: -23.0074, lng: -47.1345 },
};

function pointGridToLatLng(point) {
  return [85 - point.y * 1.7, point.x * 3.6 - 180];
}

function enrichAirportPoint(point) {
  const coord = AIRPORT_COORDS[point.code];
  if (coord) return { ...point, lat: coord.lat, lng: coord.lng };
  const [lat, lng] = pointGridToLatLng(point);
  return { ...point, lat, lng };
}

const MAP_FLIGHTS = MAP_FLIGHTS_RAW.map((flight) => ({
  ...flight,
  from: enrichAirportPoint(flight.from),
  to: enrichAirportPoint(flight.to),
}));

const MAP_AIRPORT_POINTS = [
  // Brasil (por estado)
  { code: 'GRU', city: 'Sao Paulo', country: 'Brasil', state: 'SP', lat: -23.4356, lng: -46.4731 },
  { code: 'CGH', city: 'Sao Paulo', country: 'Brasil', state: 'SP', lat: -23.6267, lng: -46.6564 },
  { code: 'VCP', city: 'Campinas', country: 'Brasil', state: 'SP', lat: -23.0074, lng: -47.1345 },
  { code: 'SDU', city: 'Rio de Janeiro', country: 'Brasil', state: 'RJ', lat: -22.9114, lng: -43.1649 },
  { code: 'GIG', city: 'Rio de Janeiro', country: 'Brasil', state: 'RJ', lat: -22.809, lng: -43.2506 },
  { code: 'BSB', city: 'Brasilia', country: 'Brasil', state: 'DF', lat: -15.8692, lng: -47.9208 },
  { code: 'CNF', city: 'Belo Horizonte', country: 'Brasil', state: 'MG', lat: -19.6357, lng: -43.9669 },
  { code: 'REC', city: 'Recife', country: 'Brasil', state: 'PE', lat: -8.1265, lng: -34.9236 },
  { code: 'SSA', city: 'Salvador', country: 'Brasil', state: 'BA', lat: -12.9086, lng: -38.3225 },
  { code: 'FOR', city: 'Fortaleza', country: 'Brasil', state: 'CE', lat: -3.7763, lng: -38.5326 },
  { code: 'BEL', city: 'Belem', country: 'Brasil', state: 'PA', lat: -1.3793, lng: -48.4763 },
  { code: 'MAO', city: 'Manaus', country: 'Brasil', state: 'AM', lat: -3.0386, lng: -60.0497 },
  { code: 'POA', city: 'Porto Alegre', country: 'Brasil', state: 'RS', lat: -29.9944, lng: -51.1714 },
  { code: 'CWB', city: 'Curitiba', country: 'Brasil', state: 'PR', lat: -25.5317, lng: -49.1761 },
  { code: 'FLN', city: 'Florianopolis', country: 'Brasil', state: 'SC', lat: -27.6703, lng: -48.5525 },
  { code: 'NAT', city: 'Natal', country: 'Brasil', state: 'RN', lat: -5.7681, lng: -35.3761 },
  { code: 'MCZ', city: 'Maceio', country: 'Brasil', state: 'AL', lat: -9.5108, lng: -35.7917 },
  { code: 'AJU', city: 'Aracaju', country: 'Brasil', state: 'SE', lat: -10.984, lng: -37.0703 },
  { code: 'GYN', city: 'Goiania', country: 'Brasil', state: 'GO', lat: -16.632, lng: -49.2207 },
  { code: 'CGB', city: 'Cuiaba', country: 'Brasil', state: 'MT', lat: -15.6529, lng: -56.1167 },
  { code: 'PMW', city: 'Palmas', country: 'Brasil', state: 'TO', lat: -10.2915, lng: -48.357 },
  { code: 'RIO', city: 'Rio Branco', country: 'Brasil', state: 'AC', lat: -9.8689, lng: -67.8981 },
  { code: 'BVB', city: 'Boa Vista', country: 'Brasil', state: 'RR', lat: 2.8463, lng: -60.6909 },
  { code: 'PVH', city: 'Porto Velho', country: 'Brasil', state: 'RO', lat: -8.7093, lng: -63.9023 },
  { code: 'MCP', city: 'Macapa', country: 'Brasil', state: 'AP', lat: 0.0507, lng: -51.0722 },
  { code: 'THE', city: 'Teresina', country: 'Brasil', state: 'PI', lat: -5.0607, lng: -42.8235 },
  { code: 'SLZ', city: 'Sao Luis', country: 'Brasil', state: 'MA', lat: -2.5854, lng: -44.2341 },
  { code: 'VIX', city: 'Vitoria', country: 'Brasil', state: 'ES', lat: -20.258, lng: -40.2864 },
  { code: 'JPA', city: 'Joao Pessoa', country: 'Brasil', state: 'PB', lat: -7.1459, lng: -34.9486 },
  { code: 'UDI', city: 'Uberlandia', country: 'Brasil', state: 'MG', lat: -18.8836, lng: -48.2253 },
  // Internacional (por pais)
  // America do Sul
  { code: 'SCL', city: 'Santiago', country: 'Chile', state: '-', lat: -33.3929, lng: -70.7858 },
  { code: 'EZE', city: 'Buenos Aires', country: 'Argentina', state: '-', lat: -34.8222, lng: -58.5358 },
  { code: 'AEP', city: 'Buenos Aires', country: 'Argentina', state: '-', lat: -34.5592, lng: -58.4156 },
  { code: 'MVD', city: 'Montevideu', country: 'Uruguai', state: '-', lat: -34.8384, lng: -56.0308 },
  { code: 'ASU', city: 'Assuncao', country: 'Paraguai', state: '-', lat: -25.2399, lng: -57.5191 },
  { code: 'LIM', city: 'Lima', country: 'Peru', state: '-', lat: -12.0219, lng: -77.1143 },
  { code: 'BOG', city: 'Bogota', country: 'Colombia', state: '-', lat: 4.7016, lng: -74.1469 },
  { code: 'UIO', city: 'Quito', country: 'Equador', state: '-', lat: -0.1292, lng: -78.3575 },
  { code: 'CCS', city: 'Caracas', country: 'Venezuela', state: '-', lat: 10.6031, lng: -66.9906 },
  // America do Norte e Central
  { code: 'SFO', city: 'San Francisco', country: 'EUA', state: 'CA', lat: 37.6213, lng: -122.379 },
  { code: 'LAX', city: 'Los Angeles', country: 'EUA', state: 'CA', lat: 33.9416, lng: -118.4085 },
  { code: 'JFK', city: 'Nova York', country: 'EUA', state: 'NY', lat: 40.6413, lng: -73.7781 },
  { code: 'EWR', city: 'Newark', country: 'EUA', state: 'NJ', lat: 40.6895, lng: -74.1745 },
  { code: 'MIA', city: 'Miami', country: 'EUA', state: 'FL', lat: 25.7959, lng: -80.287 },
  { code: 'ORD', city: 'Chicago', country: 'EUA', state: 'IL', lat: 41.9742, lng: -87.9073 },
  { code: 'ATL', city: 'Atlanta', country: 'EUA', state: 'GA', lat: 33.6407, lng: -84.4277 },
  { code: 'IAD', city: 'Washington', country: 'EUA', state: 'VA', lat: 38.9531, lng: -77.4565 },
  { code: 'SEA', city: 'Seattle', country: 'EUA', state: 'WA', lat: 47.4502, lng: -122.3088 },
  { code: 'YYZ', city: 'Toronto', country: 'Canada', state: '-', lat: 43.6777, lng: -79.6248 },
  { code: 'YVR', city: 'Vancouver', country: 'Canada', state: '-', lat: 49.1967, lng: -123.1815 },
  { code: 'MEX', city: 'Cidade do Mexico', country: 'Mexico', state: '-', lat: 19.4361, lng: -99.0719 },
  { code: 'PTY', city: 'Cidade do Panama', country: 'Panama', state: '-', lat: 9.0714, lng: -79.3835 },
  // Europa
  { code: 'LIS', city: 'Lisboa', country: 'Portugal', state: '-', lat: 38.7742, lng: -9.1342 },
  { code: 'OPO', city: 'Porto', country: 'Portugal', state: '-', lat: 41.2481, lng: -8.6814 },
  { code: 'MAD', city: 'Madri', country: 'Espanha', state: '-', lat: 40.4983, lng: -3.5676 },
  { code: 'BCN', city: 'Barcelona', country: 'Espanha', state: '-', lat: 41.2974, lng: 2.0833 },
  { code: 'CDG', city: 'Paris', country: 'Franca', state: '-', lat: 49.0097, lng: 2.5479 },
  { code: 'ORY', city: 'Paris', country: 'Franca', state: '-', lat: 48.7262, lng: 2.3652 },
  { code: 'FRA', city: 'Frankfurt', country: 'Alemanha', state: '-', lat: 50.0379, lng: 8.5622 },
  { code: 'MUC', city: 'Munique', country: 'Alemanha', state: '-', lat: 48.3538, lng: 11.7861 },
  { code: 'AMS', city: 'Amsterda', country: 'Holanda', state: '-', lat: 52.3105, lng: 4.7683 },
  { code: 'LHR', city: 'Londres', country: 'Reino Unido', state: '-', lat: 51.47, lng: -0.4543 },
  { code: 'LGW', city: 'Londres', country: 'Reino Unido', state: '-', lat: 51.1537, lng: -0.1821 },
  { code: 'DUB', city: 'Dublin', country: 'Irlanda', state: '-', lat: 53.4213, lng: -6.2701 },
  { code: 'FCO', city: 'Roma', country: 'Italia', state: '-', lat: 41.8003, lng: 12.2389 },
  { code: 'MXP', city: 'Milao', country: 'Italia', state: '-', lat: 45.63, lng: 8.7281 },
  { code: 'ZRH', city: 'Zurique', country: 'Suica', state: '-', lat: 47.4581, lng: 8.5555 },
  { code: 'VIE', city: 'Viena', country: 'Austria', state: '-', lat: 48.1103, lng: 16.5697 },
  { code: 'CPH', city: 'Copenhague', country: 'Dinamarca', state: '-', lat: 55.6181, lng: 12.656 },
  { code: 'ARN', city: 'Estocolmo', country: 'Suecia', state: '-', lat: 59.6519, lng: 17.9186 },
  { code: 'OSL', city: 'Oslo', country: 'Noruega', state: '-', lat: 60.1939, lng: 11.1004 },
  { code: 'HEL', city: 'Helsinque', country: 'Finlandia', state: '-', lat: 60.3172, lng: 24.9633 },
  { code: 'IST', city: 'Istambul', country: 'Turquia', state: '-', lat: 41.2753, lng: 28.7519 },
  { code: 'ATH', city: 'Atenas', country: 'Grecia', state: '-', lat: 37.9364, lng: 23.9475 },
  // Africa
  { code: 'NBO', city: 'Nairobi', country: 'Quenia', state: '-', lat: -1.3192, lng: 36.9278 },
  { code: 'JNB', city: 'Johannesburgo', country: 'Africa do Sul', state: '-', lat: -26.1337, lng: 28.242 },
  { code: 'CPT', city: 'Cidade do Cabo', country: 'Africa do Sul', state: '-', lat: -33.97, lng: 18.5972 },
  { code: 'ADD', city: 'Adis Abeba', country: 'Etiopia', state: '-', lat: 8.9779, lng: 38.7993 },
  { code: 'LOS', city: 'Lagos', country: 'Nigeria', state: '-', lat: 6.5774, lng: 3.3212 },
  { code: 'CAI', city: 'Cairo', country: 'Egito', state: '-', lat: 30.1219, lng: 31.4056 },
  { code: 'CMN', city: 'Casablanca', country: 'Marrocos', state: '-', lat: 33.3675, lng: -7.5899 },
  { code: 'ALG', city: 'Argel', country: 'Argelia', state: '-', lat: 36.691, lng: 3.2154 },
  { code: 'DSS', city: 'Dacar', country: 'Senegal', state: '-', lat: 14.67, lng: -17.0733 },
  // Oriente Medio e Asia
  { code: 'DXB', city: 'Dubai', country: 'EAU', state: '-', lat: 25.2532, lng: 55.3657 },
  { code: 'AUH', city: 'Abu Dhabi', country: 'EAU', state: '-', lat: 24.433, lng: 54.6511 },
  { code: 'DOH', city: 'Doha', country: 'Catar', state: '-', lat: 25.2736, lng: 51.6081 },
  { code: 'RUH', city: 'Riade', country: 'Arabia Saudita', state: '-', lat: 24.9576, lng: 46.6988 },
  { code: 'TLV', city: 'Tel Aviv', country: 'Israel', state: '-', lat: 32.0005, lng: 34.8708 },
  { code: 'BKK', city: 'Bangkok', country: 'Tailandia', state: '-', lat: 13.69, lng: 100.7501 },
  { code: 'SIN', city: 'Singapura', country: 'Singapura', state: '-', lat: 1.3644, lng: 103.9915 },
  { code: 'KUL', city: 'Kuala Lumpur', country: 'Malasia', state: '-', lat: 2.7456, lng: 101.7072 },
  { code: 'CGK', city: 'Jacarta', country: 'Indonesia', state: '-', lat: -6.1256, lng: 106.6559 },
  { code: 'DEL', city: 'Nova Delhi', country: 'India', state: '-', lat: 28.5562, lng: 77.1 },
  { code: 'BOM', city: 'Mumbai', country: 'India', state: '-', lat: 19.0896, lng: 72.8656 },
  { code: 'HKG', city: 'Hong Kong', country: 'China', state: '-', lat: 22.308, lng: 113.9185 },
  { code: 'PVG', city: 'Xangai', country: 'China', state: '-', lat: 31.1443, lng: 121.8083 },
  { code: 'PEK', city: 'Pequim', country: 'China', state: '-', lat: 40.0799, lng: 116.6031 },
  { code: 'ICN', city: 'Seul', country: 'Coreia do Sul', state: '-', lat: 37.4602, lng: 126.4407 },
  { code: 'NRT', city: 'Toquio', country: 'Japao', state: '-', lat: 35.772, lng: 140.3929 },
  { code: 'HND', city: 'Toquio', country: 'Japao', state: '-', lat: 35.5494, lng: 139.7798 },
  // Oceania
  { code: 'SYD', city: 'Sydney', country: 'Australia', state: '-', lat: -33.9399, lng: 151.1753 },
  { code: 'MEL', city: 'Melbourne', country: 'Australia', state: '-', lat: -37.669, lng: 144.841 },
  { code: 'BNE', city: 'Brisbane', country: 'Australia', state: '-', lat: -27.3842, lng: 153.1175 },
  { code: 'PER', city: 'Perth', country: 'Australia', state: '-', lat: -31.9403, lng: 115.9672 },
  { code: 'AKL', city: 'Auckland', country: 'Nova Zelandia', state: '-', lat: -37.0082, lng: 174.785 },
  { code: 'CHC', city: 'Christchurch', country: 'Nova Zelandia', state: '-', lat: -43.4894, lng: 172.5322 },
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
  if (Number.isFinite(point?.lat) && Number.isFinite(point?.lng)) {
    return [point.lat, point.lng];
  }
  return pointGridToLatLng(point);
}

function shortestLngDelta(fromLng, toLng) {
  let delta = toLng - fromLng;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

function normalizeLng(lng) {
  let value = lng;
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
}

function routeLatLngs(from, to) {
  const [fromLat, fromLng] = pointToLatLng(from);
  const [toLat, toLng] = pointToLatLng(to);
  const delta = shortestLngDelta(fromLng, toLng);
  return [
    [fromLat, fromLng],
    [toLat, fromLng + delta],
  ];
}

function interpolatePoint(from, to, progress) {
  const [fromLat, fromLng] = pointToLatLng(from);
  const [toLat, toLng] = pointToLatLng(to);
  const deltaLng = shortestLngDelta(fromLng, toLng);
  return {
    lat: fromLat + (toLat - fromLat) * progress,
    lng: normalizeLng(fromLng + deltaLng * progress),
  };
}

function headingDegrees(from, to) {
  const [fromLat, fromLng] = pointToLatLng(from);
  const [toLat, toLng] = pointToLatLng(to);
  const dy = fromLat - toLat;
  const dx = shortestLngDelta(fromLng, toLng);
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}

const MAP_TICK_MS = 120;
const MAP_TICK_SECONDS = MAP_TICK_MS / 1000;

function planeIcon(risco, selected, angle) {
  const svgPlane = `<span class="plane-glyph" style="transform: rotate(${angle}deg);">✈</span>`;
  return L.divIcon({
    className: 'plane-icon-wrapper',
    html: `<div class="plane-pin ${risco} ${selected ? 'selected' : ''}">${svgPlane}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
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
  const [mapEscopo, setMapEscopo] = useState('todos');
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Posso responder sobre o site e sobre voos. Exemplo: "quais voos estao atrasados?"', meta: null },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatMode, setChatMode] = useState('executivo');
  const [chatLimit, setChatLimit] = useState(10);
  const [chatPage, setChatPage] = useState(1);
  const [lastChatRequest, setLastChatRequest] = useState(null);
  const [chatUseLLM, setChatUseLLM] = useState(true);
  const mapRootRef = useRef(null);
  const leafletRef = useRef({ map: null, markers: new Map(), routes: new Map(), base: null, airportsLayer: null });

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
      const isNacional = String(f.regiao || '').toLowerCase().includes('nacional');
      if (mapEscopo === 'nacional' && !isNacional) return false;
      if (mapEscopo === 'internacional' && isNacional) return false;
      if (!q) return true;
      const texto = [f.id, f.cia, f.from.code, f.to.code, f.from.city, f.to.city, f.aeronave, f.portao, f.horario]
        .join(' ')
        .toLowerCase();
      return texto.includes(q);
    });
  }, [mapFlights, mapBusca, mapStatus, mapEscopo]);

  const mapResumo = useMemo(() => ({
    operando: mapFlights.filter((f) => f.risco === 'operando').length,
    atencao: mapFlights.filter((f) => f.risco === 'atencao').length,
    atraso: mapFlights.filter((f) => f.risco === 'atraso').length,
  }), [mapFlights]);

  function goSection(section) {
    setActiveSection(section);
    setMenuOpen(false);
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setMapFlights((prev) =>
        prev.map((f) => {
          let progress = f.progress + f.speed * MAP_TICK_SECONDS;
          if (progress > 1) progress -= 1;
          return { ...f, progress };
        })
      );
    }, MAP_TICK_MS);

    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (activeSection !== 'dashboard' || privacyMode) return;

    let retryTimer = null;
    let cancelled = false;

      const tryInit = () => {
        if (cancelled) return;
        const container = mapRootRef.current;
      if (!container || container.offsetWidth === 0 || container.offsetHeight === 0) {
        retryTimer = setTimeout(tryInit, 150);
        return;
      }

      const ctx = leafletRef.current;
      if (ctx.map) {
        requestAnimationFrame(() => ctx.map.invalidateSize());
        return;
      }

      const map = L.map(container, {
        center: [12, -20],
        zoom: 2,
        minZoom: 2,
        maxZoom: 6,
        zoomControl: true,
        worldCopyJump: true,
        attributionControl: true,
        preferCanvas: true,
      });

      const tile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      }).addTo(map);
      let fallbackApplied = false;
      tile.on('tileerror', () => {
        if (fallbackApplied) return;
        fallbackApplied = true;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);
      });
      const forceResize = () => {
        requestAnimationFrame(() => map.invalidateSize(true));
        setTimeout(() => map.invalidateSize(true), 120);
      };
      tile.on('load', forceResize);
      map.whenReady(forceResize);

      ctx.map = map;
      ctx.base = L.circleMarker([-23.4356, -46.4731], {
        radius: 6,
        color: '#0f7b47',
        fillColor: '#22c55e',
        fillOpacity: 0.9,
        weight: 1,
      }).addTo(map);
      ctx.base.bindTooltip('GRU - Aeroporto Base', { direction: 'top', offset: [0, -6] });

      const airportsLayer = L.layerGroup();
      MAP_AIRPORT_POINTS.forEach((airport) => {
        const mk = L.circleMarker([airport.lat, airport.lng], {
          radius: 4,
          color: '#0f7b47',
          fillColor: '#22c55e',
          fillOpacity: 0.9,
          weight: 1,
        });
        const region = airport.state && airport.state !== '-' ? `${airport.state}, ${airport.country}` : airport.country;
        mk.bindTooltip(`${airport.code} - ${airport.city} (${region})`, { direction: 'top', offset: [0, -6] });
        mk.addTo(airportsLayer);
      });
      airportsLayer.addTo(map);
      ctx.airportsLayer = airportsLayer;

      // ensure the map resizes once container is rendered
      forceResize();
    };

    tryInit();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [activeSection, privacyMode]);

  useEffect(() => {
    if (activeSection === 'dashboard' && !privacyMode) return;
    const ctx = leafletRef.current;
    if (ctx.map) {
      ctx.map.remove();
      ctx.map = null;
      ctx.markers.clear();
      ctx.routes.clear();
      ctx.base = null;
      ctx.airportsLayer = null;
    }
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
      const [start, end] = routeLatLngs(f.from, f.to);
      const current = pointToLatLng(interpolatePoint(f.from, f.to, f.progress));
      const selected = selectedFlightId === f.id;
      const angle = headingDegrees(f.from, f.to);
      const color = f.risco === 'atraso' ? '#ff8f8f' : f.risco === 'atencao' ? '#ffd45f' : '#7bb9ff';

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
        mk.__iconSig = `${f.risco}|${selected ? '1' : '0'}|${Math.round(angle)}`;
        const el = mk.getElement();
        if (el) {
          el.style.transition = `transform ${MAP_TICK_MS + 40}ms linear`;
        }
        mk.on('click', async () => {
          const initialHtml = `
            <div style="min-width:200px">
              <strong>${f.id}</strong><br/>
              ${f.cia} · ${f.from.code} → ${f.to.code}<br/>
              <small>${f.aeronave || ''}</small><br/>
              <div>Portão: ${f.portao || '-' } · Velocidade: ${f.velocidade || '-'}</div>
              <div style="margin-top:6px">Progresso: ${Math.round(f.progress * 100)}%</div>
              <div class="popup-risco">Carregando risco...</div>
            </div>`;
          mk.bindPopup(initialHtml).openPopup();
          setSelectedFlightId(f.id);
          // set minimal data immediately for snappy UI and mark loading
          setSelectedFlightData({ ...f, riscoInfo: null, riscoLoading: true });
          // fetch probability from API
          const risco = await fetchRisco(f.id, 'tradicional');
          setSelectedFlightData((prev) => prev ? { ...prev, riscoInfo: risco, riscoLoading: false } : null);
          // update popup content with risco when available
          try {
            const popup = mk.getPopup && mk.getPopup();
            if (popup && risco) {
              const newHtml = `
                <div style="min-width:200px">
                  <strong>${f.id}</strong><br/>
                  ${f.cia} · ${f.from.code} → ${f.to.code}<br/>
                  <small>${f.aeronave || ''}</small><br/>
                  <div>Portão: ${f.portao || '-'} · Velocidade: ${f.velocidade || '-'}</div>
                  <div style="margin-top:6px">Probabilidade de atraso: <strong>${risco.percent ?? '-'}%</strong>
                    ${risco.label ? `<span> — ${risco.label}</span>` : ''}
                  </div>
                </div>`;
              popup.setContent(newHtml);
            }
          } catch (e) {
            // ignore popup update errors
          }
        });
        mk.bindTooltip('', { direction: 'top', offset: [0, -12], opacity: 0.92 });
        ctx.markers.set(f.id, mk);
      }

      const marker = ctx.markers.get(f.id);
      marker.setLatLng(current);
      const nextIconSig = `${f.risco}|${selected ? '1' : '0'}|${Math.round(angle)}`;
      if (marker.__iconSig !== nextIconSig) {
        marker.setIcon(planeIcon(f.risco, selected, angle));
        marker.__iconSig = nextIconSig;
      }
      marker.setTooltipContent(`${f.id} (${f.cia}) | ${f.from.code} -> ${f.to.code} | ${Math.round(f.progress * 100)}%`);
      const mel = marker.getElement();
      if (mel) {
        // keep smooth movement via transform transition
        mel.style.transition = `transform ${MAP_TICK_MS + 40}ms linear`;
        mel.style.willChange = 'transform';
        mel.style.color = color;
      }
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
      ctx.airportsLayer = null;
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

  async function enviarPerguntaIA(e, opts = {}) {
    if (e?.preventDefault) e.preventDefault();
    const pergunta = (opts.pergunta ?? chatInput).trim();
    const page = Number(opts.page ?? 1);
    if (!pergunta || chatSending) return;

    if (!opts.keepInput) setChatInput('');
    setChatSending(true);
    if (!opts.silentUserEcho) {
      setChatMessages((prev) => [...prev, { role: 'user', content: pergunta, meta: null }]);
    }

    try {
      const historico = chatMessages.slice(-8);
      const voosContexto = mapFlights.map((v) => ({
        numero_voo: v.id,
        companhia: v.cia,
        horario_previsto: v.atualizado || null,
        status: v.risco === 'atraso' ? 'ATRASADO' : v.risco === 'atencao' ? 'EM_VOO' : 'PREVISTO',
        preco_medio: 0,
        origem_cidade: v.from?.city || '',
        origem_estado: '',
        destino_cidade: v.to?.city || '',
        destino_estado: '',
      }));
      const resp = await api.post('/ia/chat', {
        pergunta,
        historico,
        voosContexto,
        modo: chatMode,
        page,
        limit: chatLimit,
        usarLLM: chatUseLLM,
      });
      const texto = resp?.data?.resposta || 'Nao consegui responder no momento.';
      const meta = {
        topico: resp?.data?.topico || null,
        confianca: resp?.data?.confianca || null,
        sugestoes: Array.isArray(resp?.data?.sugestoes) ? resp.data.sugestoes : [],
        paginacao: resp?.data?.paginacao || null,
        source: resp?.data?.source || null,
        provider: resp?.data?.provider || null,
        model: resp?.data?.model || null,
      };
      setLastChatRequest({ pergunta, page, limit: chatLimit, modo: chatMode, meta });
      setChatPage(page);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: texto, meta }]);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Falha ao consultar a IA.';
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Erro: ${msg}`, meta: null }]);
    } finally {
      setChatSending(false);
    }
  }

  function pedirProximaPagina() {
    if (!lastChatRequest?.meta?.paginacao?.hasNext) return;
    const nextPage = Number(lastChatRequest.meta.paginacao.page || 1) + 1;
    enviarPerguntaIA(null, {
      pergunta: lastChatRequest.pergunta,
      page: nextPage,
      silentUserEcho: true,
      keepInput: true,
    });
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
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <button className={`nav-btn ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => goSection('dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10h18v6H3z" stroke="#9fbef8" strokeWidth="1.2" fill="#0d2a4a"/></svg>Dashboard
        </button>
        <button className={`nav-btn ${activeSection === 'voos' ? 'active' : ''}`} onClick={() => goSection('voos')}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3 7h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" stroke="#9fbef8" strokeWidth="0.8"/></svg>Voos
        </button>
        <button className={`nav-btn ${activeSection === 'aeronaves' ? 'active' : ''}`} onClick={() => goSection('aeronaves')}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3" stroke="#9fbef8" strokeWidth="0.9"/><path d="M4 20c4-4 8-4 16 0" stroke="#9fbef8" strokeWidth="0.9"/></svg>Aeronaves
        </button>
        <button className={`nav-btn ${activeSection === 'relatorios' ? 'active' : ''}`} onClick={() => goSection('relatorios')}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="2" stroke="#9fbef8" strokeWidth="0.9"/></svg>Relatórios
        </button>
        <button className={`nav-btn ${activeSection === 'configuracoes' ? 'active' : ''}`} onClick={() => goSection('configuracoes')}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="#9fbef8" strokeWidth="0.9"/><path d="M19.4 15a1.5 1.5 0 0 0 0-1.8l1.3-1a.6.6 0 0 0 0-1l-1.3-1a1.5 1.5 0 0 0-1.8 0l-1-.6a.6.6 0 0 0-.6 0l-1 .6a1.5 1.5 0 0 0-1.8 0l-1.3-1a.6.6 0 0 0-1 0l-1.3 1a1.5 1.5 0 0 0 0 1.8l-1 .6a.6.6 0 0 0 0 .6l1 .6a1.5 1.5 0 0 0 0 1.8l-1.3 1a.6.6 0 0 0 0 1l1.3 1a1.5 1.5 0 0 0 1.8 0l1 .6a.6.6 0 0 0 .6 0l1-.6a1.5 1.5 0 0 0 1.8 0l1.3 1a.6.6 0 0 0 1 0l1.3-1a1.5 1.5 0 0 0 0-1.8l1-.6a.6.6 0 0 0 0-.6z" stroke="#9fbef8" strokeWidth="0.6"/></svg>Configurações
        </button>
      </aside>
      {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}

      <div className="main">
        <header className="header">
          <div className="header-left">
            <button className={`menu-toggle ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen((v) => !v)} aria-label="Abrir menu">
              <span />
              <span />
              <span />
            </button>
            <img
              className="app-logo"
              src="/skytrak-logo-transparent.png"
              alt="SkyTrak"
              onError={(e) => {
                const cur = e.currentTarget;
                if (!cur.src.includes('skytrak-logo.png')) cur.src = '/skytrak-logo.png';
              }}
            />
          </div>
          <label className="global-search-wrap" aria-label="Busca global">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
              <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <input
              className="global-search"
              placeholder="Buscar voos, aeronaves, portões..."
              value={buscaGlobal}
              onChange={(e) => setBuscaGlobal(e.target.value)}
            />
          </label>
          <div className="header-actions">
            <button className={`ai-toggle ${aiOpen ? 'on' : ''}`} onClick={() => setAiOpen((v) => !v)} aria-label="Abrir IA">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="6" y="5" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M9 10h.01M15 10h.01M8.5 18h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M12 5V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <span className="who">{me?.nome || 'Operador'} ({me?.perfil || 'OPERADOR'})</span>
            <button className={`privacy-toggle ${privacyMode ? 'on' : ''}`} onClick={() => setPrivacyMode((v) => !v)}>
              Modo Privacidade {privacyMode ? 'ON' : 'OFF'}
            </button>
            <button className="btn ghost" onClick={sair}>Sair</button>
          </div>
        </header>
        {aiOpen && (
          <aside className="ai-drawer">
            <div className="ai-drawer-head">
              <h3>Assistente IA</h3>
              <button className="btn ghost small" onClick={() => setAiOpen(false)}>Fechar</button>
            </div>
            <div className="chat-body">
              {chatMessages.map((m, idx) => (
                <p key={`drawer-${idx}`}>
                  <strong>{m.role === 'assistant' ? 'IA' : 'Voce'}:</strong> {m.content}
                  {m.role === 'assistant' && m.meta?.confianca ? <span className="chat-meta"> · Confianca: {m.meta.confianca}</span> : null}
                  {m.role === 'assistant' && m.meta?.source ? <span className="chat-meta"> · Fonte: {m.meta.source === 'llm' ? `${m.meta.provider || 'LLM'}${m.meta.model ? ` (${m.meta.model})` : ''}` : 'fallback local'}</span> : null}
                </p>
              ))}
            </div>
            <div className="chat-controls">
              <select value={chatMode} onChange={(e) => setChatMode(e.target.value)} disabled={chatSending}>
                <option value="executivo">Modo executivo</option>
                <option value="tecnico">Modo tecnico</option>
              </select>
              <select value={chatLimit} onChange={(e) => setChatLimit(Number(e.target.value))} disabled={chatSending}>
                <option value={5}>5 itens</option>
                <option value={10}>10 itens</option>
                <option value={15}>15 itens</option>
                <option value={20}>20 itens</option>
              </select>
              <label className="chat-toggle">
                <input type="checkbox" checked={chatUseLLM} onChange={(e) => setChatUseLLM(e.target.checked)} disabled={chatSending} />
                Usar LLM
              </label>
              <button
                className="btn ghost small"
                type="button"
                onClick={pedirProximaPagina}
                disabled={chatSending || !lastChatRequest?.meta?.paginacao?.hasNext}
              >
                Proxima pagina
              </button>
            </div>
            <form className="chat-form" onSubmit={enviarPerguntaIA}>
              <input
                placeholder="Pergunte sobre o site ou voos..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatSending}
              />
              <button className="btn primary small" type="submit" disabled={chatSending || !chatInput.trim()}>
                {chatSending ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          </aside>
        )}

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
                  <span>{mapFiltrados.length} voos visíveis</span>
                </div>
                <button className="btn ghost small" onClick={() => setMapFullscreen((v) => !v)}>
                  {mapFullscreen ? 'Minimizar' : 'Maximizar'}
                </button>
              </div>

              {privacyMode ? (
                <div className="map-privacy-lock">Modo privacidade ativo: mapa ocultado por segurança.</div>
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
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
                        <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                      <input
                        value={mapBusca}
                        onChange={(e) => setMapBusca(e.target.value)}
                        placeholder="Pesquisar voo, companhia ou aeroporto"
                      />
                    </div>
                    <div className="map-count-card">
                      <strong>{mapFiltrados.length}</strong>
                      <span>voos ativos</span>
                    </div>
                  </div>

                  <div className="status-filters">
                    <button className={`status-chip ${mapStatus === 'todos' ? 'active' : ''}`} onClick={() => setMapStatus('todos')}>Todos</button>
                    <button className={`status-chip operando ${mapStatus === 'operando' ? 'active' : ''}`} onClick={() => setMapStatus('operando')}>Operando {mapResumo.operando}</button>
                    <button className={`status-chip atencao ${mapStatus === 'atencao' ? 'active' : ''}`} onClick={() => setMapStatus('atencao')}>Atenção {mapResumo.atencao}</button>
                    <button className={`status-chip atraso ${mapStatus === 'atraso' ? 'active' : ''}`} onClick={() => setMapStatus('atraso')}>Atraso {mapResumo.atraso}</button>
                  </div>
                  <div className="scope-filters">
                    <button className={`scope-chip ${mapEscopo === 'todos' ? 'active' : ''}`} onClick={() => setMapEscopo('todos')}>Todos os voos</button>
                    <button className={`scope-chip ${mapEscopo === 'nacional' ? 'active' : ''}`} onClick={() => setMapEscopo('nacional')}>Nacionais</button>
                    <button className={`scope-chip ${mapEscopo === 'internacional' ? 'active' : ''}`} onClick={() => setMapEscopo('internacional')}>Internacionais</button>
                  </div>

                  <div ref={mapRootRef} className="leaflet-map" />

                  <div className="map-legend-row">
                    <span><i className="legend-dot active" /> Operando</span>
                    <span><i className="legend-dot attention" /> Atenção</span>
                    <span><i className="legend-dot danger" /> Atraso</span>
                    <span><i className="legend-dot base" /> Aeroporto Base</span>
                  </div>
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>Probabilidade de Atrasos Operacionais</h3>
                <span className="chip warn">Atenção: Pico às 17:00</span>
              </div>
              <p className="chart-subtitle">Previsão para as próximas 4 horas</p>
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
              {chatMessages.map((m, idx) => (
                <p key={`panel-${idx}`}>
                  <strong>{m.role === 'assistant' ? 'IA' : 'Voce'}:</strong> {m.content}
                  {m.role === 'assistant' && m.meta?.confianca ? <span className="chat-meta"> · Confianca: {m.meta.confianca}</span> : null}
                  {m.role === 'assistant' && m.meta?.source ? <span className="chat-meta"> · Fonte: {m.meta.source === 'llm' ? `${m.meta.provider || 'LLM'}${m.meta.model ? ` (${m.meta.model})` : ''}` : 'fallback local'}</span> : null}
                </p>
              ))}
            </div>
            <div className="chat-controls">
              <select value={chatMode} onChange={(e) => setChatMode(e.target.value)} disabled={chatSending}>
                <option value="executivo">Modo executivo</option>
                <option value="tecnico">Modo tecnico</option>
              </select>
              <select value={chatLimit} onChange={(e) => setChatLimit(Number(e.target.value))} disabled={chatSending}>
                <option value={5}>5 itens</option>
                <option value={10}>10 itens</option>
                <option value={15}>15 itens</option>
                <option value={20}>20 itens</option>
              </select>
              <label className="chat-toggle">
                <input type="checkbox" checked={chatUseLLM} onChange={(e) => setChatUseLLM(e.target.checked)} disabled={chatSending} />
                Usar LLM
              </label>
              <button
                className="btn ghost small"
                type="button"
                onClick={pedirProximaPagina}
                disabled={chatSending || !lastChatRequest?.meta?.paginacao?.hasNext}
              >
                Proxima pagina
              </button>
            </div>
            <form className="chat-form" onSubmit={enviarPerguntaIA}>
              <input
                placeholder="Pergunte sobre o site ou voos..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatSending}
                  />
                  <button className="btn primary small" type="submit" disabled={chatSending || !chatInput.trim()}>
                    {chatSending ? 'Enviando...' : 'Enviar'}
                  </button>
                </form>
              </aside>
            </div>
          </section>
        )}

        {activeSection === 'voos' && (
          <section className="section">
            <h2>Gestão de Voos</h2>
            <p>Visualização completa de todos os voos</p>
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
            <h2>Gestão de Aeronaves</h2>
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
            <h2>Relatórios</h2>
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
            <h2>Configurações</h2>
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
