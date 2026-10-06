// Estado global, filtros, navegação e inicialização (carregado por último).

// State
let filtered = [...RAW];
let curMes = 'all';
let curSection = 'overview';
let tags = { jira:false, n3:false, rec:false, indev:false };
let charts = {};

// Visão Geral sempre reflete só os últimos 3 meses com dados no RAW (janela rolante).
// Demais seções (Por Mês, Cards, SLA & Tempo) continuam usando o histórico completo.
const LAST3_MESES = [...new Set(RAW.map(d=>d.mes))].sort().slice(-3);
// Sprints em ordem cronológica (pela abertura do 1º card de cada uma); null = cards sem sprint (jun/26)
const SPRINT_ORDEM = [...new Set([...RAW].sort((a,b)=>a.abertura.localeCompare(b.abertura)).map(d=>d.sprint))];

// ── MONTH TABS ──
function setMes(mes) {
  curMes = mes;
  document.querySelectorAll('.period-btn').forEach(t=>t.classList.remove('active'));
  const tabId = mes==='all'?'tab-all':`tab-${mes}`;
  const el = document.getElementById(tabId);
  if(el) el.classList.add('active');
  applyFilters();
}

function renderMonthTabs() {
  const bar = document.getElementById('monthTabs');
  bar.querySelectorAll('.period-btn:not(#tab-all)').forEach(t=>t.remove());
  LAST3_MESES.forEach(m => {
    const count = RAW.filter(d=>d.mes===m).length;
    const btn = document.createElement('button');
    btn.className = 'period-btn';
    btn.id = `tab-${m}`;
    btn.onclick = () => setMes(m);
    btn.innerHTML = `${mesNomeCompleto(m)} <span class="period-count" id="cnt-${m}">${count}</span>`;
    bar.appendChild(btn);
  });
}

// "Dados até DD/MM/AAAA": data do registro mais recente do RAW (abertura, respostas ou encerramento)
function renderDataStamp() {
  const ult = RAW.flatMap(d=>[d.abertura,d.primeira_resp,d.ultima_resp,d.encerr_jira]).filter(Boolean).sort().pop();
  document.getElementById('dataStamp').textContent = ult ? `Dados até ${ult.slice(8,10)}/${ult.slice(5,7)}/${ult.slice(0,4)}` : '';
}

// ── COMPARATIVO MÊS A MÊS: seleção de meses ──
// A seleção fica nos próprios botões (#compareMeses .tag-btn.on), sem estado global novo.
// Padrão: os mesmos 3 últimos meses da Visão Geral (LAST3_MESES).
function renderCompareTabs() {
  const box = document.getElementById('compareMeses');
  box.innerHTML = '';
  [...new Set(RAW.map(d=>d.mes))].sort().forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'tag-btn' + (LAST3_MESES.includes(m) ? ' on' : '');
    btn.dataset.mes = m;
    btn.textContent = mesLabel(m);
    btn.onclick = () => toggleCompareMes(m);
    box.appendChild(btn);
  });
}
const compareSel = () => [...document.querySelectorAll('#compareMeses .tag-btn.on')].map(b=>b.dataset.mes);
const markCompareMeses = sel => document.querySelectorAll('#compareMeses .tag-btn')
  .forEach(b=>b.classList.toggle('on', sel.includes(b.dataset.mes)));
function toggleCompareMes(m) {
  const btn = document.querySelector(`#compareMeses .tag-btn[data-mes="${m}"]`);
  if(btn.classList.contains('on') && compareSel().length===1) return; // mínimo de 1 mês marcado
  btn.classList.toggle('on');
  applyFilters();
}
function setCompareMeses(preset) {
  const months = [...new Set(RAW.map(d=>d.mes))].sort();
  let sel = LAST3_MESES;
  if(preset==='all') sel = months;
  if(preset==='extremos') {
    // Primeiro mês com dados × último mês já encerrado no calendário (anterior ao mês atual)
    const hoje = new Date();
    const atual = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
    const fechados = months.filter(m=>m<atual);
    const fim = fechados.length ? fechados[fechados.length-1] : months[months.length-1];
    sel = [...new Set([months[0], fim])];
  }
  markCompareMeses(sel);
  applyFilters();
}

// ── FILTERS ──
function toggleTag(btnId, key) {
  tags[key] = !tags[key];
  document.getElementById(btnId).classList.toggle('on', tags[key]);
  applyFilters();
}
function resetAll() {
  curMes='all'; tags={jira:false,n3:false,rec:false,indev:false};
  document.getElementById('fCat').value='';
  document.getElementById('fStatus').value='';
  document.getElementById('fTipo').value='';
  document.getElementById('fSprint').value='';
  document.getElementById('fBusca').value='';
  ['fJira','fN3','fRec','fIndev'].forEach(id=>document.getElementById(id).classList.remove('on'));
  markCompareMeses(LAST3_MESES);
  document.querySelectorAll('.period-btn').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-all').classList.add('active');
  applyFilters();
}

function applyFilters() {
  const cat = document.getElementById('fCat').value;
  const stat = document.getElementById('fStatus').value;
  const tipo = document.getElementById('fTipo').value;
  const sprint = document.getElementById('fSprint').value;
  filtered = RAW.filter(d=>{
    if(sprint) {
      if(d.sprint!==sprint) return false;
    } else if(curMes!=='all' && d.mes!==curMes) {
      return false;
    }
    if(cat && d.categoria!==cat) return false;
    if(stat && d.status!==stat) return false;
    if(tipo && d.tipo!==tipo) return false;
    if(tags.jira && !d.tem_jira) return false;
    if(tags.n3 && d.escalonado_n3!=='Sim') return false;
    if(tags.rec && d.recorrente!=='Sim') return false;
    if(tags.indev && d.indevido!=='Sim') return false;
    return true;
  });
  rebuildAll();
}

function populateFilters() {
  const fill = (id, vals) => {
    const el=document.getElementById(id);
    vals.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;el.appendChild(o);});
  };
  fill('fCat', [...new Set(RAW.map(d=>d.categoria))]);
  fill('fStatus', [...new Set(RAW.map(d=>d.status))]);
  fill('fTipo', [...new Set(RAW.map(d=>d.tipo))]);
  fill('fSprint', [...new Set(RAW.map(d=>d.sprint).filter(Boolean))]);
}

// ── REBUILD ──
function rebuildAll() {
  const d = filtered;
  const sprint = document.getElementById('fSprint').value;
  const temFiltro = curMes!=='all' || sprint || document.getElementById('fCat').value
    || document.getElementById('fStatus').value || document.getElementById('fTipo').value
    || Object.values(tags).some(Boolean);
  document.getElementById('countPill').textContent = d.length;
  document.getElementById('countPillLabel').textContent = temFiltro ? `de ${RAW.length} cards` : 'cards · histórico completo';
  const overviewData = d.filter(x=>LAST3_MESES.includes(x.mes));
  buildKpis(overviewData);
  // Rótulos do total da Visão Geral: deixam explícito o recorte dos últimos 3 meses
  const janela = curMes==='all' && !sprint;
  const periodo = sprint ? sprint : curMes!=='all' ? mesNomeCompleto(curMes).toLowerCase() : janelaLabel();
  const complemento = overviewData.length!==d.length ? ` · de ${d.length} no histórico completo` : '';
  document.getElementById('heroEyebrow').textContent = janela ? 'Total de Cards · Últimos 3 meses' : 'Total de Cards';
  document.getElementById('heroCaption').textContent = periodo + complemento;
  buildOverviewCharts(overviewData);
  buildMensalSection(d);
  buildTable(d);
  buildCardsPanel(d);
  buildSla(d);
}

// ── NAVIGATION ──
function goSection(id) {
  document.querySelectorAll('.view').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(n=>n.classList.remove('active'));
  document.getElementById(`s-${id}`).classList.add('active');
  document.querySelectorAll('.tab').forEach(n=>{
    if(n.getAttribute('onclick')===`goSection('${id}')`) n.classList.add('active');
  });
  curSection = id;
  rebuildAll();
}

// ── INIT ──
populateFilters();
renderDataStamp();
renderMonthTabs();
renderCompareTabs();
document.querySelectorAll('#tCards th[data-sort]').forEach(th=>th.onclick=()=>sortTable(th.dataset.sort));
rebuildAll();
