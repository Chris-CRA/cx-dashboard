# CLAUDE.md

## Descrição do Projeto

Este é o **Support CX · Dashboard Executivo — Memed**, um dashboard estático de página
única para visualização e análise de chamados de suporte (originados do Jira CX).
O dashboard exibe KPIs, gráficos e tabelas organizados em seções (Visão Geral, Por Mês,
Cards, SLA & Tempo, Insights, Executivo), com filtros interativos por mês, categoria,
status, tipo, sprint e tags (Jira, N3, recorrente, indevido).

Não há backend, build step ou pipeline de dados: o projeto é aberto diretamente no
navegador a partir de `index.html`. A atualização de dados é feita manualmente, editando
o array de dados embutido no próprio arquivo.

## Stack Utilizada

| Camada | Tecnologia |
|---|---|
| Estrutura | HTML5 puro |
| Estilo | CSS puro (custom properties via `:root`), sem framework |
| Interatividade | JavaScript vanilla (sem React/Vue/build tools/módulos ES) |
| Gráficos | Chart.js 4.4.1 (via CDN — cdnjs.cloudflare.com) |
| Fonte | Google Fonts "Outfit" (via CDN) |
| Dados | Array JavaScript hardcoded (`RAW`), embutido no HTML |

Não há `package.json`, `node_modules`, bundler ou linter configurados. O projeto é
intencionalmente monolítico e sem dependências de build.

## Estrutura do Projeto

```
cx-dashboard/
├── index.html          # aplicação inteira: HTML + CSS + JS (~1180 linhas)
└── assets/
    ├── favicon.ico
    └── Screenshot.jpg
```

Dentro de `index.html`:
- **`<head>` / CSS**: variáveis de tema em `:root` (paleta de marca Memed — violeta,
  azul, teal), estilos de sidebar, cards, tabela, chips e responsividade.
- **`<body>`**: sidebar de navegação (6 seções) e containers que o JS preenche
  dinamicamente.
- **`<script>`**:
  - `RAW`: array de dados fonte única (chamados de suporte, ~25 campos por item).
  - Estado global: `filtered`, `curMes`, `curSection`, `tags`, `charts`.
  - Filtros: `applyFilters`, `toggleTag`, `resetAll`, `populateFilters`, `setMes`.
  - Renderização: `buildKpis`, `buildOverviewCharts`, `buildMensalSection`,
    `buildTable`, `buildSla`, `buildInsights`, `buildExec`, orquestrados por
    `rebuildAll`.
  - Navegação: `goSection`.
  - Helpers: `mkChart`, `avg`, `cnt`, `freq`, `fmtH`, `fmtDate`, `catChip`/`stChip`/`yn`.

## Regras para Preservar a Arquitetura Atual

- **Não introduzir frameworks, bundlers, gerenciadores de pacotes ou build steps**
  (React, Vue, Webpack, Vite, npm/yarn, etc.), mesmo que pareçam simplificar o código.
  O projeto deve continuar sendo um HTML único, aberto diretamente no navegador.
- **Não dividir `index.html` em múltiplos arquivos** (separar CSS/JS em arquivos
  externos, criar componentes, etc.) sem autorização explícita — mesmo que isso seja
  uma prática comum, é uma mudança estrutural que altera a forma como o projeto é
  distribuído e aberto.
- **Não adicionar novas dependências externas** (CDNs, bibliotecas JS/CSS) sem
  aprovação explícita.
- Manter o padrão de nomenclatura já existente (funções em `camelCase` com prefixo
  `build*` para renderização de seção, variáveis em português para conceitos de
  domínio como `curMes`, `sla_h`, etc.).

## Cuidados ao Alterar o `RAW`

- `RAW` é a **única fonte de dados** do dashboard — todas as seções, KPIs e gráficos
  dependem diretamente dela. Qualquer alteração de estrutura de campos exige revisar
  todas as funções `build*` que os consomem.
- **Manter os tipos de dados consistentes**: campos numéricos (`sla_h`, `tempo_total_h`)
  devem ser `number` ou `null` — nunca string; campos booleanos como `tem_jira` devem
  permanecer `true`/`false`; campos categóricos como `sla_cumprido`, `recorrente`,
  `indevido`, `escalonado_n3`, `resolvido_se` usam a convenção `"Sim"`/`"Não"` (string),
  não booleano.
- **Preservar os valores possíveis de `status`**, pois o mapeamento de chips
  (`stChip`) e outras lógicas dependem de valores exatos (`"Encerrado"`,
  `"Aguardando cliente"`, `"Em andamento"`, `"Aguardando N3"`, etc.). Novos valores de
  status exigem atualizar `stChip` e qualquer lógica de contagem correspondente.
  O mesmo vale para `categoria` (usado em `catChip`).
- **Novos campos** só devem ser adicionados a itens do `RAW` se todos os objetos do
  array forem atualizados de forma consistente — objetos com campos ausentes podem
  quebrar `avg`, `cnt` e `freq`, que assumem chaves presentes (mesmo que com valor `null`).
- **Não remover ou renomear campos existentes** sem primeiro mapear todas as funções
  que os referenciam (`buildKpis`, `buildSla`, `buildInsights`, `buildExec`, filtros).
- Ao adicionar novos chamados, seguir exatamente o formato de data ISO já usado
  (`"2026-08-11T09:44:41"`) e o padrão de `mes` (`"YYYY-MM"`) e `dia` (`"YYYY-MM-DD"`).
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

## Cuidados ao Alterar CSS e JavaScript

- **CSS**: as variáveis em `:root` (cores, raios de borda) são centralizadas e
  reutilizadas em todo o dashboard — alterar uma variável afeta todas as seções
  simultaneamente. Antes de mudar uma variável, verificar todos os seletores que a
  utilizam para evitar quebrar contraste ou legibilidade em outra parte da UI.
- Evitar duplicar regras CSS já existentes; reutilizar classes existentes (`.chip`,
  `.nav-item`, `.card`, etc.) em vez de criar novas equivalentes.
- **JavaScript**: funções como `mkChart`, `avg`, `cnt`, `freq` são utilitários
  compartilhados por múltiplas seções — qualquer alteração em sua assinatura ou
  comportamento deve ser validada contra todos os pontos de uso (`buildKpis`,
  `buildOverviewCharts`, `buildMensalSection`, `buildSla`, `buildInsights`, `buildExec`).
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
- **Comandos somente de leitura, análise e validação podem ser executados
  normalmente**, sem necessidade de autorização prévia, sempre que forem necessários
  para analisar o projeto ou validar alterações já aprovadas — por exemplo: `git
  status`, `git diff`, `git log`, listagem de arquivos/pastas, leitura de conteúdo de
  arquivos, e abertura do `index.html` no navegador para checagem visual.

## Regra: Analisar Impacto Antes de Alterar

- Antes de propor ou aplicar qualquer mudança, mapear todas as funções, seções e
  estilos que dependem do trecho a ser alterado (usar busca no arquivo por nome de
  função, classe CSS ou campo de dado).
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
- Manter a paridade visual e de comportamento entre as 6 seções existentes ao fazer
  mudanças estruturais.

## Regra: Testar/Validar Antes de Concluir

- Após qualquer alteração, verificar visualmente no navegador (abrindo `index.html`)
  que:
  - A página carrega sem erros no console.
  - Todas as 6 seções (Visão Geral, Por Mês, Cards, SLA & Tempo, Insights, Executivo)
    continuam renderizando corretamente.
  - Os filtros (mês, categoria, status, tipo, sprint, tags) continuam funcionando e
    atualizando os dados corretamente.
  - Os gráficos (Chart.js) renderizam sem erros.
  - Os KPIs exibem valores coerentes com os dados filtrados.
- Se a alteração envolveu o array `RAW`, validar que o JSON/array continua
  sintaticamente válido (sem vírgulas faltando, aspas não fechadas, etc.) antes de
  considerar a tarefa concluída.
- Só reportar uma alteração como concluída após essa validação — não assumir sucesso
  apenas por a edição ter sido aplicada sem erro de sintaxe.

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
