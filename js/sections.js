// Renderização das seções (build*): Visão Geral, Por Mês, Cards e SLA & Tempo.

// ── KPIs (Visão Geral) ──
function buildKpis(d) {
  const total = d.length;
  const seR   = cnt(d,'resolvido_se','Sim');
  const n3    = cnt(d,'escalonado_n3','Sim');
  const rec   = cnt(d,'recorrente','Sim');
  const slaM  = avg(d,'sla_h');
  const tM    = avg(d,'tempo_total_h');
  const enc   = cnt(d,'status','Encerrado');
  const pSe   = total?Math.round(seR/total*100):0;
  const pEnc  = total?Math.round(enc/total*100):0;

  document.getElementById('heroFigure').textContent = total;
  document.getElementById('statSecondary').innerHTML = `
    <div class="stat-chip"><b>${pSe}%</b><span>Resolvidos pelo SE</span></div>
    <div class="stat-chip"><b>${n3}</b><span>Escalonados N3</span></div>
    <div class="stat-chip"><b>${rec}</b><span>Recorrentes</span></div>
    <div class="stat-chip"><b>${slaM.toFixed(1)}h</b><span>SLA Médio 1ª Resp.</span></div>
    <div class="stat-chip"><b>${tM.toFixed(1)}h</b><span>Tempo Médio Total</span></div>
    <div class="stat-chip"><b>${pEnc}%</b><span>Taxa de Encerramento</span></div>
  `;
}

// ── OVERVIEW CHARTS ──
function buildOverviewCharts(d) {
  const catF = freq(d,'categoria');
  mkChart('cCat','bar',catF.map(x=>x[0]),catF.map(x=>x[1]),{
    backgroundColor:catF.map(x=>catColor(x[0])), borderRadius:7, borderSkipped:false,
    ttCb:{label:c=>`${c.raw} card${c.raw!==1?'s':''}`}
  });

  const stF = freq(d,'status');
  mkChart('cStatus','doughnut',stF.map(x=>x[0]),stF.map(x=>x[1]),{
    backgroundColor:stF.map(x=>statusColor(x[0])), borderWidth:0, legend:true, hoverOffset:6, cutout:'64%'
  });

  const tpF = freq(d,'tipo');
  mkChart('cTipo','doughnut',tpF.map(x=>x[0]),tpF.map(x=>x[1]),{
    backgroundColor:tpF.map(x=>tipoColor(x[0])), borderWidth:0, legend:true, hoverOffset:6, cutout:'64%'
  });

  const motF = freq(d,'motivo').slice(0,6);
  mkChart('cMotivo','bar',motF.map(x=>x[0].replace(/-/g,' ')),motF.map(x=>x[1]),{
    backgroundColor:'#7c72e8', borderRadius:6
  });
}

// ── MENSAL ──
function buildMensalSection(d) {
  const months = [...new Set(RAW.map(x=>x.mes))].sort();
  const mLabels = months.map(mesLabel);
  const mCounts = months.map(m=>RAW.filter(x=>x.mes===m).length);
  const mSla = months.map(m=>{
    const v=RAW.filter(x=>x.mes===m&&x.sla_h!=null).map(x=>x.sla_h);
    return v.length? (v.reduce((a,b)=>a+b,0)/v.length) :0;
  });

  mkChart('cMensal','bar',mLabels,mCounts,{
    backgroundColor:'#968bf4', borderRadius:8, borderSkipped:false,
    ttCb:{label:c=>`${c.raw} cards`}
  });

  mkChart('cSlaMensal','bar',mLabels,mSla,{
    backgroundColor:'#14a98d', borderRadius:8, borderSkipped:false,
    ttCb:{label:c=>`${c.raw.toFixed(2)}h`}
  });

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
       borderWidth:{bottom:2}, borderColor:'#19222c'},
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
  const hoje = Date.now();
  const abertos = d.filter(x=>x.status!=='Encerrado')
    .map(x=>({...x, dias:Math.floor((hoje-new Date(x.abertura))/86400000)}))
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
      <div class="cell-foot">Da abertura à última resposta</div>
    </div>
    <div class="cell">
      <div class="cell-eyebrow">Pior Caso SLA</div>
      <div class="cell-val">${slaMax.toFixed(1)}<small>h</small></div>
      <div class="cell-foot">Card com maior tempo de resposta</div>
    </div>
  `;

  const labels = d.map(x=>x.id.replace('CXATEND-','#'));
  mkChart('cSlaBar','bar',labels,d.map(x=>x.sla_h),{
    backgroundColor:d.map(x=>slaOk(x)?'#14a98d':'#c9821f'),
    borderRadius:5, borderSkipped:false,
    ttCb:{label:c=>`${c.raw.toFixed(2)}h`}
  });
  mkChart('cTempoBar','bar',labels,d.map(x=>x.tempo_total_h),{
    backgroundColor:'#7c72e8',
    ttCb:{label:c=>`${c.raw!=null?c.raw.toFixed(2):'—'}h`}
  });

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
