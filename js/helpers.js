// Utilitários compartilhados: cálculos, formatação, cores, Chart.js e chips.

// ── HELPERS ──
// Meta de SLA da 1ª resposta: 24 horas úteis. Só para exibição (rótulos, escala das barras);
// se o SLA foi cumprido vem sempre de `sla_cumprido`, calculado na planilha.
const META_SLA_H = 24;
const slaOk = r => r.sla_cumprido!=='Não';
const avg = (a, k) => { const v=a.filter(d=>d[k]!=null).map(d=>d[k]); return v.length? v.reduce((x,y)=>x+y,0)/v.length :0; };
const cnt = (a,k,v) => a.filter(d=>d[k]===v).length;
const freq = (a,k) => { const m={}; a.forEach(d=>{const v=d[k]; m[v]=(m[v]||0)+1;}); return Object.entries(m).sort((a,b)=>b[1]-a[1]); };
const mediana = (a,k) => { const v=a.filter(d=>d[k]!=null).map(d=>d[k]).sort((x,y)=>x-y); if(!v.length) return 0; const m=Math.floor(v.length/2); return v.length%2? v[m] : (v[m-1]+v[m])/2; };
const pct = (a,k,v) => a.length ? Math.round(cnt(a,k,v)/a.length*100) : 0;
const diasAberto = r => Math.floor((Date.now()-new Date(r.abertura))/86400000);
// "opções-de-receituário" → "Opções de receituário" (só exibição)
const motivoLabel = m => { const s=String(m).replace(/-/g,' '); return s.charAt(0).toUpperCase()+s.slice(1); };
const fmtH = h => h==null?'—':`${h.toFixed(2)}h`;
const fmtDate = ts => { if(!ts) return '—'; const d=new Date(ts); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; };
const MES_PT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MES_PT_ABBR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const mesLabel = m => { const [y,mm]=m.split('-'); return `${MES_PT_ABBR[+mm-1]}/${y.slice(2)}`; };
// "jul – set 2026" (ou "nov 2026 – jan 2027" quando a janela cruza o ano)
const janelaLabel = () => {
  const [ini, fim] = [LAST3_MESES[0], LAST3_MESES[LAST3_MESES.length-1]];
  const ab = m => MES_PT_ABBR[+m.split('-')[1]-1].toLowerCase();
  const [yi, yf] = [ini.slice(0,4), fim.slice(0,4)];
  return yi===yf ? `${ab(ini)} – ${ab(fim)} ${yf}` : `${ab(ini)} ${yi} – ${ab(fim)} ${yf}`;
};
// Mês corrente do calendário ("YYYY-MM"); meses parciais = 1º mês da base ou mês ainda em andamento
const mesHoje = () => { const h=new Date(); return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}`; };
const mesParcial = m => m===[...new Set(RAW.map(d=>d.mes))].sort()[0] || m>=mesHoje();
const ultimoMesFechado = meses => meses.filter(m=>m<mesHoje()).pop();
const mesCurto = m => MES_PT_ABBR[+m.split('-')[1]-1].toLowerCase();
const mesNomeCompleto = m => { const [y,mm]=m.split('-'); const nome=MES_PT[+mm-1]; return `${nome.charAt(0).toUpperCase()+nome.slice(1)} ${y}`; };

// ── SEMANTIC COLOR MAP (categoria/status/tipo) ──
const CAT_COLORS = { Bug:'#dd6478', Usabilidade:'#968bf4', Performance:'#c9821f', 'Autenticação':'#4f8fe0' };
const catColor = cat => CAT_COLORS[cat] || '#6f7885';
// Verde = encerrado · âmbar = em andamento com o time · azul = com N3 · cinza = aguardando cliente
// (cinza-claro = respondido, aguardando retorno do cliente)
const STATUS_COLORS = { 'Encerrado':'#14a98d', 'Em andamento':'#c9821f', 'Aguardando N3':'#4f8fe0', 'Respondido / Aguardando retorno':'#c3cad3' };
const statusColor = s => STATUS_COLORS[s] || '#8a93a0';
const TIPO_COLORS = { 'Dúvida':'#968bf4', 'Configuração':'#14a98d', 'Bug':'#dd6478', 'Melhoria':'#c9821f', 'Solicitação':'#4f8fe0' };
const tipoColor = tp => TIPO_COLORS[tp] || '#6f7885';

// ── CHART DEFAULTS ──
Chart.defaults.color = '#8a93a0';
Chart.defaults.borderColor = 'rgba(255,255,255,0.10)';
Chart.defaults.font.family = "'Outfit', system-ui, sans-serif";
Chart.defaults.font.size = 11;

const TT = {
  backgroundColor:'#131922', borderColor:'rgba(255,255,255,0.10)', borderWidth:1,
  padding:10, cornerRadius:8, titleFont:{size:11,weight:'700',family:'Outfit'},
  bodyFont:{size:11,family:'Outfit'}, titleColor:'#eef1f4', bodyColor:'#aab2bd',
};
const SCALES = {
  x:{grid:{display:false},ticks:{color:'#8a93a0',font:{size:11,family:'Outfit'}}},
  y:{grid:{color:'rgba(255,255,255,0.10)'},ticks:{color:'#8a93a0',font:{size:11,family:'Outfit'}},beginAtZero:true}
};

function mkChart(id,type,labels,data,opts={}) {
  if(charts[id]) charts[id].destroy();
  const el = document.getElementById(id);
  if(!el) return;
  charts[id] = new Chart(el, {
    type,
    data:{labels, datasets:[{data, ...opts}]},
    options:{
      responsive:true, maintainAspectRatio:false, animation:{duration:400},
      plugins:{
        legend:{display:opts.legend??false, position:'bottom', labels:{boxWidth:9,padding:14,font:{size:11,family:'Outfit'},color:'#aab2bd'}},
        tooltip:{...TT, callbacks:opts.ttCb||{}}
      },
      scales: type==='bar'||type==='line'? SCALES : undefined,
    }
  });
}

// ── BADGE HELPERS ──
const catChip = cat => {
  const m={Bug:'chip-critical',Usabilidade:'chip-violet',Performance:'chip-warn',Autenticação:'chip-info'};
  return `<span class="chip ${m[cat]||'chip-muted'}">${cat}</span>`;
};
const stChip = s => {
  const m={Encerrado:'chip-good','Aguardando cliente':'chip-muted','Em andamento':'chip-warn','Respondido / Aguardando retorno':'chip-muted','Aguardando N3':'chip-info'};
  return `<span class="chip ${m[s]||'chip-muted'}">${s}</span>`;
};
const yn = (v,on='chip-good',off='chip-muted') => v==='Sim'?`<span class="chip ${on}">Sim</span>`:`<span class="chip ${off}">—</span>`;
