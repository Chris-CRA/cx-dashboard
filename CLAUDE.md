# CLAUDE.md

## Descrição do Projeto

Este é o **Support CX · Dashboard Executivo — Memed**, um dashboard estático de página
única para visualização e análise de chamados de suporte (originados do Jira CX).
O dashboard exibe KPIs, gráficos e tabelas organizados em **4 seções** (Visão Geral,
Por Mês, Cards, SLA & Tempo), com filtros interativos por mês, categoria, status, tipo,
sprint e tags (Jira, N3, recorrente, indevido).

As antigas seções **Insights** e **Executivo** não existem mais: os blocos "Apoio de
Times Externos" e "Indicadores de Qualidade" foram realocados para a seção SLA & Tempo.

Não há backend, build step ou pipeline de dados. O dashboard é publicado pelo
**GitHub Pages** (a ideia original de subir pelo Google Sites, que exigia um HTML único,
foi abandonada) e também abre direto do disco, com duplo clique em `index.html`.
A atualização de dados é manual, editando o array `RAW` em `js/data.js`.

## Stack Utilizada

| Camada | Tecnologia |
|---|---|
| Estrutura | HTML5 puro (`index.html`) |
| Estilo | CSS puro (custom properties via `:root`), sem framework (`css/styles.css`) |
| Interatividade | JavaScript vanilla em scripts clássicos (sem React/Vue/build tools/módulos ES) |
| Gráficos | Chart.js 4.4.1 (via CDN — cdnjs.cloudflare.com) |
| Fonte | Google Fonts "Outfit" (via CDN) |
| Dados | Array JavaScript hardcoded (`RAW`) em `js/data.js` |
| Publicação | GitHub Pages (branch `main`) |

Não há `package.json`, `node_modules`, bundler ou linter configurados.

## Estrutura do Projeto

```
cx-dashboard/
├── index.html          # só a estrutura da página (HTML) e os links para CSS/JS
├── css/
│   └── styles.css      # tema (:root) e todos os estilos
├── js/
│   ├── data.js         # const RAW = [...] — única coisa que muda numa atualização de dados
│   ├── helpers.js      # META_SLA_H, slaOk, avg, cnt, freq, fmtH, fmtDate, mesLabel,
│   │                   # cores (CAT/STATUS/TIPO_COLORS), defaults do Chart.js, mkChart,
│   │                   # catChip/stChip/yn
│   ├── sections.js     # build* de cada seção + tabela (sortTable, buildTable)
│   └── app.js          # estado global, LAST3_MESES, SPRINT_ORDEM, abas de mês,
│                       # comparativo, filtros, rebuildAll, goSection, inicialização
├── assets/
│   ├── favicon.ico
│   └── Screenshot.jpg
├── CLAUDE.md
└── README.md
```

### Ordem de carregamento (obrigatória)

Em `index.html`, os scripts são carregados nesta ordem, no fim do `<body>`:

1. Chart.js (CDN, no `<head>`)
2. `js/data.js` → define `RAW`
3. `js/helpers.js`
4. `js/sections.js`
5. `js/app.js` → declara o estado e chama a inicialização (deve ser sempre o último)

Todos são **scripts clássicos** (`<script src>`, sem `type="module"`): as constantes e
funções de nível superior ficam no escopo global compartilhado, e os handlers inline do
HTML (`onclick="goSection(...)"`, `onchange="applyFilters()"`) dependem disso.

### Conteúdo por arquivo

- **`css/styles.css`**: variáveis de tema em `:root` (paleta de marca Memed — violeta,
  azul, teal — em tema escuro), estilos de navegação, faixa de destaque, blocos, tabela,
  chips e responsividade.
- **`index.html`**: barra superior com as 4 abas, linha de filtros e os containers que o
  JS preenche dinamicamente.
- **`js/app.js`**:
  - Estado global: `filtered`, `curMes`, `curSection`, `tags`, `charts`.
  - `LAST3_MESES`: janela rolante dos 3 últimos meses com dados no `RAW`, usada pela
    Visão Geral e pelas abas de mês (`renderMonthTabs`). Quando entra o primeiro card de
    um mês novo, o mês mais antigo sai das abas automaticamente.
  - `SPRINT_ORDEM`: sprints em ordem cronológica (pela abertura do 1º card de cada uma).
  - Filtros: `applyFilters`, `toggleTag`, `resetAll`, `populateFilters`, `setMes`.
  - Comparativo Mês a Mês: `renderCompareTabs`, `toggleCompareMes`, `setCompareMeses`
    (estado guardado nos próprios botões, sem variável global nova).
  - Orquestração: `rebuildAll`. Navegação: `goSection`.
- **`js/sections.js`**: `buildKpis`, `buildOverviewCharts`, `buildMensalSection`,
  `buildTable` (busca e ordenação só de exibição; estado no próprio `<table>`),
  `buildCardsPanel` (Cards por Sprint e Cards em Aberto), `buildSla` (inclui Apoio
  Externo e Indicadores de Qualidade).

## Regras para Preservar a Arquitetura Atual

- **Não introduzir frameworks, bundlers, gerenciadores de pacotes ou build steps**
  (React, Vue, Webpack, Vite, npm/yarn, etc.), mesmo que pareçam simplificar o código.
- **Manter scripts clássicos.** Não converter para módulos ES (`type="module"`,
  `import`/`export`) nem carregar dados via `fetch` (ex.: `data.json`): ambos quebram a
  abertura direta do `index.html` pelo disco (`file://`).
- **Não criar novos arquivos CSS/JS, nem mover código entre arquivos, sem autorização
  explícita.** A divisão atual (`styles.css`, `data.js`, `helpers.js`, `sections.js`,
  `app.js`) é a estrutura aprovada. Código novo vai no arquivo da sua responsabilidade:
  utilitário compartilhado → `helpers.js`; renderização de seção → `sections.js`;
  estado/filtros/navegação → `app.js`; dados → somente `data.js`.
- **Respeitar a ordem de carregamento dos scripts** descrita acima. Código executado no
  carregamento (fora de funções) só pode usar o que já foi definido nos arquivos
  anteriores.
- **Cache do GitHub Pages**: os links de CSS/JS no `index.html` usam `?v=AAAAMMDD`.
  Ao alterar `styles.css`, `helpers.js`, `sections.js` ou `app.js`, atualizar o `?v=` do
  arquivo alterado (data do dia, com sufixo `b`, `c`... se houver mais de uma mudança no
  mesmo dia). Em atualizações só de dados, atualizar o `?v=` do `data.js`.
- **Não adicionar novas dependências externas** (CDNs, bibliotecas JS/CSS) sem
  aprovação explícita.
- Manter o padrão de nomenclatura já existente (funções em `camelCase` com prefixo
  `build*` para renderização de seção, variáveis em português para conceitos de
  domínio como `curMes`, `sla_h`, etc.).

## Cuidados ao Alterar o `RAW` (`js/data.js`)

- `RAW` é a **única fonte de dados** do dashboard — todas as seções, KPIs e gráficos
  dependem diretamente dela. Qualquer alteração de estrutura de campos exige revisar
  todas as funções `build*` que os consomem.
- Uma atualização de dados deve mexer **apenas** em `js/data.js` (e no `?v=` dele no
  `index.html`). Se for necessário mexer em outro arquivo, é uma mudança estrutural e
  precisa de autorização própria.
- **Manter os tipos de dados consistentes**: campos numéricos (`sla_h`, `tempo_total_h`)
  devem ser `number` ou `null` — nunca string; campos booleanos como `tem_jira` devem
  permanecer `true`/`false`; campos categóricos como `sla_cumprido`, `recorrente`,
  `indevido`, `escalonado_n3`, `resolvido_se` usam a convenção `"Sim"`/`"Não"` (string),
  não booleano.
- **Preservar os valores possíveis de `status`**, pois o mapeamento de chips
  (`stChip`) e outras lógicas dependem de valores exatos (`"Encerrado"`,
  `"Aguardando cliente"`, `"Em andamento"`, `"Aguardando N3"`,
  `"Respondido / Aguardando retorno"`, etc.). Novos valores de status exigem atualizar
  `stChip` e `STATUS_COLORS` (em `helpers.js`) e qualquer lógica de contagem
  correspondente. O mesmo vale para `categoria` (`catChip`, `CAT_COLORS`).
- **Novos campos** só devem ser adicionados a itens do `RAW` se todos os objetos do
  array forem atualizados de forma consistente — objetos com campos ausentes podem
  quebrar `avg`, `cnt` e `freq`, que assumem chaves presentes (mesmo que com valor `null`).
- **Não remover ou renomear campos existentes** sem primeiro mapear todas as funções
  que os referenciam (`buildKpis`, `buildSla`, `buildCardsPanel`, `buildTable`, filtros).
- Ao adicionar novos chamados, seguir exatamente o formato de data ISO já usado
  (`"2026-08-11T09:44:41"`) e o padrão de `mes` (`"YYYY-MM"`) e `dia` (`"YYYY-MM-DD"`).
  O `mes` é o da **abertura** do card, mesmo que ele esteja numa aba mensal anterior
  da planilha (ex.: card de outubro na aba Set-26).
- **`sprint`**: copiar o nome exato do cabeçalho de sprint da planilha
  (ex.: `"Sprint Iced Coffee - 25/09 a 09/10"`). Cards sem sprint (jun/26) usam `null`.
- **Cards em aberto**: manter o `status` real e deixar `ultima_resp`, `encerr_jira` e
  `tempo_total_h` como `null` enquanto não existirem na planilha (`ultima_resp` pode já
  vir preenchida em cards abertos; nesse caso, copiar, mas `tempo_total_h` continua
  `null`). Quando o card for encerrado, `tempo_total_h` = diferença em horas corridas
  entre `abertura` e `ultima_resp`, arredondada a 2 casas.
- **Regra de sincronização do SLA (`sla_h`)**: o campo `sla_h` é um valor **já
  calculado na planilha de origem** (`SupportCX Base.xlsx`), na coluna SLA (coluna I),
  pela fórmula `=HORAS_UTEIS(E;F;Feriados!A:A)` — que calcula horas úteis entre a
  Data de Abertura (coluna E) e a Data 1ª Resposta (coluna F), descontando os
  feriados listados na aba `Feriados`. Ao atualizar o `RAW`, `sla_h` deve ser
  copiado diretamente do valor já calculado nessa coluna. **Não recalcular o SLA no
  dashboard** (ex.: a partir de `abertura`/`primeira_resp` com diferença simples de
  datas), **não substituir o valor por uma diferença de datas corrida**, e **não criar
  uma nova coluna/campo de SLA**. Se a fórmula da planilha mudar, a sincronização deve
  apenas refletir o novo valor calculado, sem alterar a lógica do dashboard.

## Meta de SLA (24 horas úteis)

- A meta de SLA da 1ª resposta é de **24 horas úteis**: se a 1ª resposta sai dentro
  desse prazo, o SLA foi cumprido. Por isso existem cards com `sla_h` acima de 4h (ou
  bem mais, em fins de semana/feriados) com `sla_cumprido = "Sim"` — isso é correto.
- A meta fica centralizada na constante `META_SLA_H = 24` em `js/helpers.js`. Qualquer
  rótulo, escala ou faixa de SLA deve usar essa constante; não escrever o número da meta
  fixo no código (o texto estático "Meta 24h úteis" em `index.html` é a única exceção e
  deve acompanhar a constante).
- **Se o SLA foi cumprido vem sempre do campo `sla_cumprido`** da planilha (helper
  `slaOk`), nunca de uma comparação de `sla_h` com a meta no dashboard.

## Cuidados ao Alterar CSS e JavaScript

- **CSS**: as variáveis em `:root` (`css/styles.css`) são centralizadas e reutilizadas
  em todo o dashboard — alterar uma variável afeta todas as seções simultaneamente.
  Antes de mudar uma variável, verificar todos os seletores que a utilizam para evitar
  quebrar contraste ou legibilidade em outra parte da UI.
- **Cores repetidas no JS**: as cores dos gráficos também estão em código fixo em
  `js/helpers.js` (`CAT_COLORS`, `STATUS_COLORS`, `TIPO_COLORS`, `Chart.defaults`,
  `TT`, `SCALES`) e em alguns pontos de `js/sections.js`. Mudanças de tema/paleta
  precisam atualizar o CSS e esses pontos juntos.
- Evitar duplicar regras CSS já existentes; reutilizar classes existentes (`.chip`,
  `.tile`, `.tab`, `.tag-btn`, etc.) em vez de criar novas equivalentes.
- **JavaScript**: funções como `mkChart`, `avg`, `cnt`, `freq` são utilitários
  compartilhados por múltiplas seções — qualquer alteração em sua assinatura ou
  comportamento deve ser validada contra todos os pontos de uso (`buildKpis`,
  `buildOverviewCharts`, `buildMensalSection`, `buildCardsPanel`, `buildSla`).
- O fluxo `applyFilters → rebuildAll → build*` é o núcleo da aplicação. Qualquer novo
  filtro ou seção deve se integrar a esse pipeline existente, não criar um fluxo
  paralelo.
- Não introduzir manipulação de estado fora das variáveis globais já definidas
  (`filtered`, `curMes`, `curSection`, `tags`, `charts`) sem justificativa clara.
- Preservar o tratamento de valores `null`/ausentes já existente nos helpers
  (`fmtH`, `fmtDate`, `avg`) — não assumir que campos sempre têm valor.

## Regra: Não Modificar Arquivos sem Autorização Explícita

- **Nenhum arquivo deste projeto deve ser criado, editado ou excluído sem
  autorização explícita e específica do usuário para aquela alteração.**
- Uma aprovação anterior não vale para alterações futuras não relacionadas — cada
  mudança deve ser solicitada e confirmada individualmente.
- Antes de qualquer edição, apresentar o que será alterado e aguardar confirmação
  clara do usuário.

## Regra de Segurança: Comandos Destrutivos ou Irreversíveis

- **Nenhum comando potencialmente destrutivo ou irreversível pode ser executado sem
  autorização explícita do usuário para aquele comando específico**, incluindo mas não
  se limitando a:
  - `git reset` (especialmente `--hard`).
  - `git checkout` ou `git revert` que possam descartar alterações não commitadas ou
    reverter histórico.
  - `git clean` (remoção de arquivos não rastreados).
  - Exclusão de arquivos ou pastas (`rm`, `rm -rf`, `Remove-Item`, etc.).
  - Qualquer comando que possa sobrescrever, truncar ou causar perda de dados
    (ex: redirecionamento `>` sobre arquivo existente, `git push --force`).
  - Alterações de configuração do ambiente (variáveis de ambiente, configurações do
    git, do sistema ou do editor).
  - Instalação ou remoção de dependências (ainda que o projeto não tenha
    gerenciador de pacotes hoje — isso inclui não introduzir um sem autorização).
- Antes de propor qualquer comando dessa natureza, explicar claramente o que ele fará
  e seu impacto, e aguardar confirmação explícita antes de executar.
- **`git push` publica o dashboard no GitHub Pages** (fica visível para quem tem o
  link). Só executar com autorização explícita.
- **Comandos somente de leitura, análise e validação podem ser executados
  normalmente**, sem necessidade de autorização prévia, sempre que forem necessários
  para analisar o projeto ou validar alterações já aprovadas — por exemplo: `git
  status`, `git diff`, `git log`, listagem de arquivos/pastas, leitura de conteúdo de
  arquivos, `node --check` nos arquivos JS, e abertura do `index.html` no navegador
  para checagem visual.

## Regra: Analisar Impacto Antes de Alterar

- Antes de propor ou aplicar qualquer mudança, mapear todas as funções, seções e
  estilos que dependem do trecho a ser alterado (buscar em `index.html`,
  `css/styles.css` e `js/*.js` por nome de função, classe CSS ou campo de dado).
- Explicar ao usuário, antes da alteração, quais partes do dashboard podem ser
  afetadas (ex: "alterar o campo X impacta as seções Y e Z").
- Se o impacto for incerto ou abranger múltiplas seções, sinalizar isso explicitamente
  antes de prosseguir.

## Regra: Preservar Funcionalidades Existentes

- Nenhuma alteração deve remover, quebrar ou alterar o comportamento de filtros,
  navegação entre seções, gráficos ou cálculos de KPIs já existentes, a menos que essa
  seja explicitamente a mudança solicitada.
- Novas funcionalidades devem ser aditivas sempre que possível, evitando reescrever
  lógica funcional já validada.
- Manter a paridade visual e de comportamento entre as 4 seções existentes ao fazer
  mudanças estruturais.

## Regra: Testar/Validar Antes de Concluir

- Após qualquer alteração de código, rodar `node --check` em cada arquivo de `js/`
  alterado.
- Verificar visualmente no navegador (subindo um servidor local, ex.:
  `python -m http.server 8765`, e abrindo `http://localhost:8765/index.html`) que:
  - A página carrega sem erros no console (inclusive sem 404 de CSS/JS).
  - As 4 seções (Visão Geral, Por Mês, Cards, SLA & Tempo) continuam renderizando
    corretamente.
  - Os filtros (mês, categoria, status, tipo, sprint, tags) continuam funcionando e
    atualizando os dados corretamente.
  - Os gráficos (Chart.js) renderizam sem erros.
  - Os KPIs exibem valores coerentes com os dados filtrados.
- Se a alteração envolveu o array `RAW`, validar que `js/data.js` continua
  sintaticamente válido (sem vírgulas faltando, aspas não fechadas, etc.) antes de
  considerar a tarefa concluída.
- Só reportar uma alteração como concluída após essa validação — não assumir sucesso
  apenas por a edição ter sido aplicada sem erro de sintaxe.

## Padrão de Commits

- **Atualização de dados** (só `js/data.js`): mensagem fixa
  `Atualização DD/MM/AAAA - Support CX`, com a data do dia.
- **Mudança estrutural** (código, layout, CSS, estrutura): mensagem descritiva da
  mudança.
- Não misturar atualização de dados e mudança estrutural no mesmo commit.

## Comportamento do Code Review Local

Quando eu disser "Faça o code review" ou algo equivalente, siga este processo:

1. Identifique quais arquivos foram alterados (git diff / git status).
2. Analise o diff e o contexto necessário do restante do projeto.
3. Verifique conformidade com as regras deste CLAUDE.md.
4. Identifique problemas, classifique a gravidade e explique cada um.

Nunca edite, crie ou exclua arquivos durante o review. Apresente o diagnóstico e
aguarde autorização explícita antes de aplicar qualquer correção.

Estruture sempre a resposta neste formato:

### Resumo
- Quantidade de arquivos analisados.
- Principais problemas encontrados.
- Avaliação geral da alteração.

### Problemas encontrados
Para cada problema:
**Severidade:** Crítica / Alta / Média / Baixa / Sugestão
**Arquivo:** caminho/do/arquivo
**Local:** linha ou trecho relevante
**Problema:** explicação simples
**Por que isso é um problema:** explicação técnica
**Recomendação:** como corrigir

### Pontos positivos
Destaque decisões boas encontradas no código alterado.

### Testes
- Testes existentes relacionados à alteração.
- Testes que deveriam ser executados.
- Testes que deveriam ser criados, se aplicável.

### Impacto
Informe se a alteração afeta outras seções do dashboard, cálculos de KPIs, gráficos,
filtros, ou o array RAW como fonte de dados.

Critérios de severidade para este projeto (sem testes automatizados nem CI):
- Crítica: quebra renderização, corrompe cálculo de KPI/gráfico, ou introduz dado
  inválido no RAW que afeta múltiplas seções.
- Alta: viola regra explícita deste CLAUDE.md.
- Média: código duplicado, complexidade evitável, inconsistência de nomenclatura.
- Baixa/Sugestão: estilo, legibilidade, melhorias não urgentes.
