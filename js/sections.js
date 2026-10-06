// Renderização das seções (build*): Visão Geral, Por Mês, Cards e SLA & Tempo.

// Último mês fechado × mês anterior (setas de variação e destaques). null sem os dois meses.
function mesesComparacao() {
  const meses = [...new Set(RAW.map(x=>x.mes))].sort();
  const ref = ultimoMesFechado(meses);
  const base = ref ? meses[meses.indexOf(ref)-1] : null;
  return ref && base ? {ref, base} : null;
}

// ── KPIs (Visão Geral) ──
// hist = dados filtrados do histórico completo, usado só para a variação; null esconde as setas.
function buildKpis(d, hist) {
  document.getElementById('heroFigure').textContent = d.length;
  const cmp = hist ? mesesComparacao() : null;
  const ref = cmp ? hist.filter(x=>x.mes===cmp.ref) : [];
  const base = cmp ? hist.filter(x=>x.mes===cmp.base) : [];
  const delta = (fn, suf, maiorMelhor) => {
    if(!ref.length || !base.length) return '';
    const v = fn(ref)-fn(base);
    const cls = v===0 ? 'flat' : (v>0)===maiorMelhor ? 'good' : 'bad';
    const txt = v===0 ? '=' : `${v>0?'▲':'▼'} ${Math.abs(v)}${suf}`;
    return `<span class="stat-delta ${cls}" title="${mesNomeCompleto(cmp.ref)} comparado a ${mesNomeCompleto(cmp.base)}">${txt} ${mesCurto(cmp.ref)} vs ${mesCurto(cmp.base)}</span>`;
  };
  document.getElementById('statSecondary').innerHTML = [
    [`${pct(d,'sla_cumprido','Sim')}%`, 'SLA cumprido', delta(a=>pct(a,'sla_cumprido','Sim'),' p.p.',true)],
    [`${pct(d,'status','Encerrado')}%`, 'Taxa de encerramento', delta(a=>pct(a,'status','Encerrado'),' p.p.',true)],
    [`${pct(d,'resolvido_se','Sim')}%`, 'Resolvidos pelo SE', delta(a=>pct(a,'resolvido_se','Sim'),' p.p.',true)],
    [cnt(d,'escalonado_n3','Sim'), 'Escalonados N3', delta(a=>cnt(a,'escalonado_n3','Sim'),'',false)],
  ].map(([v,l,dl])=>`<div class="stat-chip"><b>${v}</b><span>${l}</span>${dl}</div>`).join('');
}

// ── DESTAQUES DO PERÍODO (Visão Geral) ──
// Frases geradas dos próprios dados. d = recorte da Visão Geral; hist = filtrados no histórico.
function buildDestaques(d, hist, comparar) {
  const el = document.getElementById('destaques');
  if(!d.length) { el.innerHTML = '<li>Nenhum card no filtro atual.</li>'; return; }
  const itens = [];
  const [mot, qtd] = freq(d,'motivo')[0];
  itens.push(['var(--violet)', `<strong>${motivoLabel(mot)}</strong> é o principal motivo de contato: ${qtd} de ${d.length} cards (${Math.round(qtd/d.length*100)}%).`]);
  const pSla = pct(d,'sla_cumprido','Sim');
  itens.push([pSla===100?'var(--good)':'var(--warn)', `<strong>${pSla}%</strong> dos cards tiveram a 1ª resposta dentro da meta de ${META_SLA_H}h úteis.`]);
  const cmp = comparar ? mesesComparacao() : null;
  const ref = cmp ? hist.filter(x=>x.mes===cmp.ref) : [], base = cmp ? hist.filter(x=>x.mes===cmp.base) : [];
  if(ref.length && base.length) {
    const [pb, pr] = [pct(base,'resolvido_se','Sim'), pct(ref,'resolvido_se','Sim')];
    const [nb, nr] = [MES_PT[+cmp.base.split('-')[1]-1], MES_PT[+cmp.ref.split('-')[1]-1]];
    itens.push([pr>=pb?'var(--good)':'var(--warn)', pr===pb
      ? `A resolução direta pelo SE se manteve em <strong>${pr}%</strong> em ${nr}.`
      : `A resolução direta pelo SE ${pr>pb?'subiu':'caiu'} de <strong>${pb}%</strong> em ${nb} para <strong>${pr}%</strong> em ${nr}.`]);
  }
  const abertos = hist.filter(x=>x.status!=='Encerrado');
  const antigos = abertos.filter(x=>diasAberto(x)>30).length;
  itens.push([abertos.length?'var(--warn)':'var(--good)', abertos.length
    ? `<strong>${abertos.length} card${abertos.length!==1?'s':''} em aberto</strong>${antigos?`, ${antigos} há mais de 30 dias`:''}.`
    : 'Nenhum card em aberto.']);
  el.innerHTML = itens.map(([cor,txt])=>`<li style="--dot:${cor}"><span>${txt}</span></li>`).join('');
}

// ── OVERVIEW CHARTS ──
// Lista de barras horizontais (categoria/motivo): largura relativa ao maior, % sobre o total.
const listaBarras = (pares, total, cor) => pares.length ? `<div class="metric-list">${pares.map(([k,v],i)=>`
    <div class="metric-item">
      <div class="metric-item-head">
        <span class="metric-item-lbl">${k}</span>
        <span class="metric-item-val">${v}<span> (${Math.round(v/total*100)}%)</span></span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${v/pares[0][1]*100}%;background:${cor(k,i)}"></div></div>
    </div>`).join('')}</div>` : `<div class="metric-desc">Nenhum card no filtro atual.</div>`;

function buildOverviewCharts(d) {
  document.getElementById('catList').innerHTML = listaBarras(freq(d,'categoria'), d.length, k=>catColor(k));

  const stF = freq(d,'status');
  mkChart('cStatus','doughnut',stF.map(x=>x[0]),stF.map(x=>x[1]),{
    backgroundColor:stF.map(x=>statusColor(x[0])), borderWidth:0, legend:true, hoverOffset:6, cutout:'64%'
  });

  const tpF = freq(d,'tipo');
  mkChart('cTipo','doughnut',tpF.map(x=>x[0]),tpF.map(x=>x[1]),{
    backgroundColor:tpF.map(x=>tipoColor(x[0])), borderWidth:0, legend:true, hoverOffset:6, cutout:'64%'
  });

  // Só o motivo principal em violeta; os demais em cinza neutro
  const motF = freq(d,'motivo').slice(0,6).map(([k,v])=>[motivoLabel(k),v]);
  document.getElementById('motivoList').innerHTML = listaBarras(motF, d.length, (k,i)=>i===0?'var(--violet)':'#3a4452');
}

// ── MENSAL ──
function buildMensalSection(d) {
  const months = [...new Set(RAW.map(x=>x.mes))].sort();
  // Meses parciais com rótulo "*" e cor translúcida; último mês fechado em destaque
  const parcial = months.map(mesParcial);
  const refMes = ultimoMesFechado(months);
  const mLabels = months.map((m,i)=>mesLabel(m)+(parcial[i]?'*':''));
  const mCounts = months.map(m=>RAW.filter(x=>x.mes===m).length);
  const mSla = months.map(m=>{
    const v=RAW.filter(x=>x.mes===m&&x.sla_h!=null).map(x=>x.sla_h);
    return v.length? (v.reduce((a,b)=>a+b,0)/v.length) :0;
  });

  mkChart('cMensal','bar',mLabels,mCounts,{
    backgroundColor:months.map((m,i)=>parcial[i]?'rgba(150,139,244,0.35)':m===refMes?'#968bf4':'#3a4452'),
    borderRadius:8, borderSkipped:false,
    ttCb:{label:c=>`${c.raw} cards${parcial[c.dataIndex]?' (mês parcial)':''}`}
  });

  mkChart('cSlaMensal','bar',mLabels,mSla,{
    backgroundColor:months.map((m,i)=>parcial[i]?'rgba(20,169,141,0.35)':'#14a98d'),
    borderRadius:8, borderSkipped:false,
    ttCb:{label:c=>`${c.raw.toFixed(2)}h${parcial[c.dataIndex]?' (mês parcial)':''}`}
  });
  document.getElementById('mensalNota').textContent = parcial.some(Boolean)
    ? `* Mês parcial (início da base ou mês em andamento).${refMes?` Em destaque: ${mesNomeCompleto(refMes).toLowerCase()}, último mês fechado.`:''}`
    : '';

  // Compare body
  const compareBody = document.getElementById('compareBody');
  // Variação em relação a outro mês (usada quando exatamente 2 meses estão selecionados)
  const sgn = (v,dec,suf='') => `${v>=0?'+':'−'}${Math.abs(v).toFixed(dec)}${suf}`;
  const mkDelta = (data, base) => {
    if(!base || !base.data.length) return '';
    const b = base.data;
    const pct = b.length ? sgn((data.length-b.length)/b.length*100,0,'%') : '—';
    const [slaA, slaB] = [avg(data,'sla_h'), avg(b,'sla_h')];
    const [seA, seB] = [Math.round(cnt(data,'resolvido_se','Sim')/data.length*100), Math.round(cnt(b,'resolvido_se','Sim')/b.length*100)];
    const [jA, jB] = [data.filter(x=>x.tem_jira).length, b.filter(x=>x.tem_jira).length];
    const rows = [
      ['Cards', `${b.length} → ${data.length} (${pct})`],
      ['SLA Médio', `${slaB.toFixed(2)}h → ${slaA.toFixed(2)}h (${sgn(slaA-slaB,2,'h')})`],
      ['Resolv. SE', `${seB}% → ${seA}% (${sgn(seA-seB,0,' p.p.')})`],
      ['Jiras', `${jB} → ${jA} (${sgn(jA-jB,0)})`],
    ];
    return `
      <div class="compare-stats" style="flex-direction:column;gap:8px">
        <span class="compare-stat"><span>Variação vs ${mesLabel(base.mes)}</span></span>
        ${rows.map(([l,v])=>`
          <div class="metric-item-head" style="margin-bottom:0">
            <span class="metric-item-lbl">${l}</span><span class="metric-item-val">${v}</span>
          </div>`).join('')}
      </div>`;
  };
  const mkMonthSummary = (data, label, base) => {
    if(!data.length) return `
      <div class="compare-col">
        <div class="compare-head"><span class="compare-month">${label}</span></div>
        <div class="metric-desc">Nenhum card registrado ainda. Os dados aparecerão aqui assim que forem inseridos na planilha.</div>
      </div>`;
    const cats = freq(data,'categoria');
    return `
      <div class="compare-col">
        <div class="compare-head">
          <span class="compare-month">${label}</span>
          <span class="compare-count">${data.length}</span>
        </div>
        <div class="metric-list">
          ${cats.map(([k,v])=>`
            <div class="metric-item">
              <div class="metric-item-head">
                <span class="metric-item-lbl">${k}</span>
                <span class="metric-item-val">${v}<span> (${(v/data.length*100).toFixed(0)}%)</span></span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width:${v/data.length*100}%;background:${catColor(k)}"></div></div>
            </div>
          `).join('')}
        </div>
        <div class="compare-stats">
          ${[
            ['SLA Médio',`${avg(data,'sla_h').toFixed(2)}h`],
            ['Resolv. SE',`${cnt(data,'resolvido_se','Sim')}/${data.length}`],
            ['Jiras',`${data.filter(x=>x.tem_jira).length}`],
          ].map(([l,v])=>`<div class="compare-stat"><b>${v}</b><span>${l}</span></div>`).join('')}
        </div>
        ${mkDelta(data, base)}
      </div>
    `;
  };
  // Só os meses marcados no seletor; até 4 lado a lado, acima disso largura mínima + rolagem horizontal
  const sel = compareSel();
  const selMonths = months.filter(m=>sel.includes(m));
  const cols = selMonths.length<=4 ? `repeat(${selMonths.length},1fr)` : `repeat(${selMonths.length},minmax(280px,1fr))`;
  const base = selMonths.length===2 ? {mes:selMonths[0], data:RAW.filter(x=>x.mes===selMonths[0])} : null;
  compareBody.innerHTML = `<div class="compare-wrap" style="grid-template-columns:${cols}">${selMonths.map((m,i)=>mkMonthSummary(RAW.filter(x=>x.mes===m),mesNomeCompleto(m),i===1?base:null)).join('')}</div>`;
}

// ── TABLE ──
// Busca e ordenação são só de exibição da tabela: não alteram `filtered` nem as demais seções.
// O estado de ordenação fica no próprio <table> (data-sort / data-dir), sem estado global novo.
const sprintCurto = s => s ? s.replace(/^Sprint /,'').split(' - ')[0] : 'Sem sprint';
function sortTable(key) {
  const t = document.getElementById('tCards');
  t.dataset.dir = t.dataset.sort===key && t.dataset.dir==='asc' ? 'desc' : 'asc';
  t.dataset.sort = key;
  buildTable(filtered);
}
function buildTable(d) {
  const t = document.getElementById('tCards');
  const [key, dir] = [t.dataset.sort, t.dataset.dir==='asc' ? 1 : -1];
  const busca = document.getElementById('fBusca').value.trim().toLowerCase();
  const rows = busca ? d.filter(r=>r.id.toLowerCase().includes(busca) || r.assunto.toLowerCase().includes(busca)) : d;
  document.getElementById('tableSubtitle').textContent = busca
    ? `${rows.length} de ${d.length} registros exibidos · busca "${busca}"`
    : `${d.length} registros exibidos`;
  const val = r => key==='sprint' ? SPRINT_ORDEM.indexOf(r.sprint) : key==='tem_jira' ? (r.tem_jira?'Sim':'Não') : r[key];
  const ordered = [...rows].sort((a,b)=>{
    const [va, vb] = [val(a), val(b)];
    if(va==null || vb==null) return va==null ? (vb==null?0:1) : -1; // vazios sempre no fim
    return (typeof va==='number' ? va-vb : String(va).localeCompare(String(vb),'pt')) * dir;
  });
  t.querySelectorAll('th[data-sort]').forEach(th=>{
    th.textContent = th.textContent.replace(/ [▲▼]$/,'');
    if(th.dataset.sort===key) th.textContent += dir===1 ? ' ▲' : ' ▼';
  });
  document.getElementById('tBody').innerHTML = ordered.length ? ordered.map(r=>`
    <tr>
      <td class="td-mono">${r.id}</td>
      <td class="td-ellipsis" title="${r.assunto}">${r.assunto}</td>
      <td>${catChip(r.categoria)}</td>
      <td>${stChip(r.status)}</td>
      <td class="td-muted">${r.tipo}</td>
      <td>${yn(r.tem_jira?'Sim':'Não')}</td>
      <td>${yn(r.escalonado_n3,'chip-warn')}</td>
      <td>${r.recorrente==='Sim'?`<span class="chip chip-warn">Sim</span>`:`<span class="chip chip-muted">—</span>`}</td>
      <td>${yn(r.indevido,'chip-warn')}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,r.sla_h/META_SLA_H*100)}%;background:${slaOk(r)?'var(--good)':'var(--warn)'}"></div></div>
          <span class="detail-num">${fmtH(r.sla_h)}</span>
        </div>
      </td>
      <td class="td-muted" style="white-space:nowrap" title="${r.sprint||'Sem sprint'}">${sprintCurto(r.sprint)}</td>
      <td class="td-muted">${mesLabel(r.mes)}</td>
    </tr>
  `).join('') : `<tr><td colspan="12" class="td-muted">Nenhum card encontrado.</td></tr>`;
}

// ── CARDS: sprints e pendências ──
function buildCardsPanel(d) {
  // Cards por Sprint — empilhado Encerrados × Em aberto, sprints em ordem cronológica
  const sprints = SPRINT_ORDEM.filter(s=>d.some(x=>x.sprint===s));
  const enc = sprints.map(s=>d.filter(x=>x.sprint===s && x.status==='Encerrado').length);
  const abe = sprints.map(s=>d.filter(x=>x.sprint===s && x.status!=='Encerrado').length);
  if(charts.cSprint) charts.cSprint.destroy();
  const el = document.getElementById('cSprint');
  if(el) charts.cSprint = new Chart(el, {
    type:'bar',
    data:{labels:sprints.map(sprintCurto), datasets:[
      {label:'Encerrados', data:enc, backgroundColor:STATUS_COLORS['Encerrado'], borderRadius:4, borderSkipped:false},
      {label:'Em aberto', data:abe, backgroundColor:'#c9821f', borderRadius:4, borderSkipped:false,
       borderWidth:{bottom:2}, borderColor:'#131922'},
    ]},
    options:{
      responsive:true, maintainAspectRatio:false, animation:{duration:400},
      plugins:{
        legend:{display:true, position:'bottom', labels:{boxWidth:9,padding:14,font:{size:11,family:'Outfit'},color:'#aab2bd'}},
        tooltip:{...TT, callbacks:{
          title:items=>sprints[items[0].dataIndex] || 'Sem sprint',
          footer:items=>{ const i=items[0].dataIndex; return `Total: ${enc[i]+abe[i]} cards`; }
        }}
      },
      scales:{ x:{...SCALES.x, stacked:true}, y:{...SCALES.y, stacked:true, ticks:{...SCALES.y.ticks, precision:0}} },
    }
  });

  // Cards em Aberto — tudo que não está Encerrado, do mais antigo para o mais recente.
  // "Dias em aberto" é só exibição (hoje − abertura); não altera sla_h nem tempo_total_h.
  const abertos = d.filter(x=>x.status!=='Encerrado')
    .map(x=>({...x, dias:diasAberto(x)}))
    .sort((a,b)=>b.dias-a.dias);
  document.getElementById('abertoSub').textContent = abertos.length
    ? `${abertos.length} card${abertos.length!==1?'s':''} não encerrado${abertos.length!==1?'s':''} · destaque acima de 7 e de 30 dias`
    : '';
  document.getElementById('abertoList').innerHTML = abertos.length ? abertos.map(r=>`
    <div class="detail-row">
      <div class="detail-head">
        <span class="td-mono" style="font-size:11px">${r.id}</span>
        <span class="chip ${r.dias>30?'chip-critical':r.dias>7?'chip-warn':'chip-muted'}">${r.dias} dia${r.dias!==1?'s':''}</span>
      </div>
      <div class="detail-head" style="margin-bottom:0">
        <span class="td-ellipsis td-muted" style="font-size:11px" title="${r.assunto}">${r.assunto}</span>
        ${stChip(r.status)}
      </div>
    </div>
  `).join('') : `<div class="metric-desc">Nenhum card em aberto no filtro atual.</div>`;
}

// ── SLA ──
function buildSla(d) {
  const slaM = avg(d,'sla_h');
  const tM   = avg(d,'tempo_total_h');
  const slaCump = cnt(d,'sla_cumprido','Sim');
  const slaMax = d.length ? Math.max(...d.map(x=>x.sla_h||0)) : 0;

  document.getElementById('slaStatRow').innerHTML = `
    <div class="cell">
      <div class="cell-eyebrow">SLA Médio 1ª Resp.</div>
      <div class="cell-val">${slaM.toFixed(2)}<small>h</small></div>
      <div class="cell-foot">${slaM<=META_SLA_H?'<strong>Meta atingida</strong>':'<span class="flag">Acima da meta</span>'} · meta ${META_SLA_H}h úteis</div>
    </div>
    <div class="cell">
      <div class="cell-eyebrow">SLAs Cumpridos</div>
      <div class="cell-val">${slaCump}<small>/${d.length}</small></div>
      <div class="cell-foot"><strong>${d.length?Math.round(slaCump/d.length*100):0}%</strong> de conformidade</div>
    </div>
    <div class="cell">
      <div class="cell-eyebrow">Tempo Médio Total</div>
      <div class="cell-val">${tM.toFixed(1)}<small>h</small></div>
      <div class="cell-foot">Mediana ${mediana(d,'tempo_total_h').toFixed(1)}h · da abertura à última resposta</div>
    </div>
    <div class="cell">
      <div class="cell-eyebrow">Pior Caso SLA</div>
      <div class="cell-val">${slaMax.toFixed(1)}<small>h</small></div>
      <div class="cell-foot">Card com maior tempo de resposta</div>
    </div>
  `;

  // Faixas de 1ª resposta (horas úteis, valor da planilha). Só agrupam para exibição:
  // se o SLA foi cumprido continua vindo de sla_cumprido.
  const comSla = d.filter(x=>x.sla_h!=null);
  const faixas = [
    ['Até 4h', x=>x.sla_h<=4, 'var(--good)'],
    ['De 4h a 8h', x=>x.sla_h>4 && x.sla_h<=8, 'rgba(20,169,141,0.7)'],
    [`De 8h a ${META_SLA_H}h`, x=>x.sla_h>8 && x.sla_h<=META_SLA_H, 'rgba(20,169,141,0.45)'],
    [`Acima de ${META_SLA_H}h`, x=>x.sla_h>META_SLA_H, 'var(--critical)'],
  ];
  const top5 = k => d.filter(x=>x[k]!=null).sort((a,b)=>b[k]-a[k]).slice(0,5);
  const topList = (rows,k) => rows.length ? `<div class="detail-list">${rows.map(r=>`
    <div class="detail-row">
      <div class="detail-head" style="margin-bottom:0">
        <span class="td-mono" style="font-size:11px">${r.id}</span>
        <span class="td-ellipsis td-muted" style="font-size:11px;flex:1" title="${r.assunto}">${r.assunto}</span>
        <span class="detail-num">${fmtH(r[k])}</span>
      </div>
    </div>`).join('')}</div>` : `<div class="metric-desc">Sem dados no filtro atual.</div>`;
  document.getElementById('slaFaixas').innerHTML = `
    <div class="metric-list">${faixas.map(([l,f,c])=>{ const v=comSla.filter(f).length; return `
      <div class="metric-item">
        <div class="metric-item-head">
          <span class="metric-item-lbl">${l}</span>
          <span class="metric-item-val">${v}<span> (${comSla.length?Math.round(v/comSla.length*100):0}%)</span></span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${comSla.length?v/comSla.length*100:0}%;background:${c}"></div></div>
      </div>`; }).join('')}</div>
    <div class="split-title" style="margin:22px 0 10px">Maiores tempos de 1ª resposta</div>
    ${topList(top5('sla_h'),'sla_h')}`;
  const encerrados = d.filter(x=>x.tempo_total_h!=null);
  document.getElementById('tempoTop').innerHTML = `
    <div class="compare-stats" style="margin-top:0;padding-top:0;border-top:none">
      <div class="compare-stat"><b>${mediana(d,'tempo_total_h').toFixed(1)}h</b><span>Mediana</span></div>
      <div class="compare-stat"><b>${tM.toFixed(1)}h</b><span>Média</span></div>
      <div class="compare-stat"><b>${encerrados.length}</b><span>Com tempo total</span></div>
    </div>
    <div class="metric-desc">A mediana não é distorcida por poucos casos muito longos.</div>
    <div class="split-title" style="margin:22px 0 10px">Maiores tempos totais</div>
    ${topList(top5('tempo_total_h'),'tempo_total_h')}
    <div class="metric-desc" style="margin-top:10px">Cards em aberto não entram: o tempo total só existe após o encerramento.</div>`;
  document.getElementById('slaDetailCount').textContent = `Ver todos (${d.length})`;

  const mx = d.length ? Math.max(...d.map(x=>Math.max(x.sla_h||0, x.tempo_total_h||0))) : 0;
  document.getElementById('slaDetail').innerHTML = d.map(r=>`
    <div class="detail-row">
      <div class="detail-head">
        <span class="td-mono" style="font-size:11px">${r.id}</span>
        <span class="td-ellipsis td-muted" style="font-size:11px">${r.assunto}</span>
      </div>
      <div class="detail-line">
        <span class="detail-lbl">1ª Resposta</span>
        <div class="bar-track"><div class="bar-fill" style="width:${mx?(r.sla_h||0)/mx*100:0}%;background:${slaOk(r)?'var(--good)':'var(--warn)'}"></div></div>
        <span class="detail-num">${fmtH(r.sla_h)}</span>
      </div>
      <div class="detail-line">
        <span class="detail-lbl">Tempo Total</span>
        <div class="bar-track"><div class="bar-fill" style="width:${mx&&r.tempo_total_h?r.tempo_total_h/mx*100:0}%;background:var(--violet-soft)"></div></div>
        <span class="detail-num">${fmtH(r.tempo_total_h)}</span>
      </div>
    </div>
  `).join('');

  // Apoio de Times Externos (realocado de Insights)
  const apoioMap = {};
  d.forEach(x=>{ if(x.apoio) apoioMap[x.apoio]=(apoioMap[x.apoio]||0)+1; });
  const ae = Object.entries(apoioMap);
  const total = d.length, comApoio = d.filter(x=>x.apoio).length;
  document.getElementById('apoioBody').innerHTML = ae.length ? `
    <div class="metric-list">
      ${ae.map(([k,v])=>`
        <div class="metric-item">
          <div class="metric-item-head">
            <span class="metric-item-lbl">${k}</span>
            <span class="metric-item-val">${v}<span> card${v>1?'s':''}</span></span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${total?v/total*100:0}%;background:var(--violet)"></div></div>
          <div class="metric-desc">${total?Math.round(v/total*100):0}% dos atendimentos envolveram este time</div>
        </div>
      `).join('')}
      <div class="metric-desc" style="margin-top:2px">${total-comApoio} de ${total} cards resolvidos sem apoio externo</div>
    </div>
  ` : `<div class="metric-desc">Nenhum apoio externo registrado no filtro atual.</div>`;

  // Indicadores de Qualidade (realocado de Insights)
  const rec = cnt(d,'recorrente','Sim'), indev = cnt(d,'indevido','Sim');
  document.getElementById('qualBody').innerHTML = `
    <div class="metric-list">
      ${[
        ['Resolvidos pelo SE', cnt(d,'resolvido_se','Sim'), total, 'var(--good)', 'Resolução direta sem escalonamento'],
        ['SLA Cumprido', cnt(d,'sla_cumprido','Sim'), total, 'var(--violet)', `Primeira resposta dentro de ${META_SLA_H}h úteis`],
        ['Recorrentes', rec, total, 'var(--warn)', 'Problema já visto anteriormente'],
        ['Indevidos', indev, total, 'var(--critical)', 'Poderiam ser evitados'],
        ['Com Jira', d.filter(x=>x.tem_jira).length, total, 'var(--info)', 'Geraram demanda de desenvolvimento'],
      ].map(([l,v,t,c,desc])=>`
        <div class="metric-item">
          <div class="metric-item-head">
            <span class="metric-item-lbl">${l}</span>
            <span class="metric-item-val">${v}<span> (${t?Math.round(v/t*100):0}%)</span></span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${t?(v/t*100):0}%;background:${c}"></div></div>
          <div class="metric-desc">${desc}</div>
        </div>
      `).join('')}
    </div>
  `;
}
