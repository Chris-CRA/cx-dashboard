# Instruções de Code Review

## Formato do relatório

Estruture sempre a resposta do review neste formato:

### Resumo
- Quantidade de arquivos analisados.
- Principais problemas encontrados (lista curta).
- Avaliação geral da alteração (uma frase).

### Problemas encontrados
Para cada problema, use exatamente esta estrutura:

**Severidade:** Crítica / Alta / Média / Baixa / Sugestão
**Arquivo:** `caminho/do/arquivo`
**Local:** linha ou trecho relevante
**Problema:** explicação simples do que foi identificado
**Por que isso é um problema:** explicação técnica
**Recomendação:** como poderia ser corrigido

### Pontos positivos
Destaque decisões boas encontradas no código alterado, não só problemas.

### Testes
- Testes existentes relacionados à alteração.
- Testes que deveriam ser executados.
- Testes que deveriam ser criados, se aplicável.

### Impacto
Informe se a alteração pode afetar: outras seções do dashboard, cálculos de KPIs,
gráficos, filtros, ou o array RAW como fonte de dados.

## O que sempre verificar

- Conformidade com as regras de tipos de dados do RAW definidas no CLAUDE.md.
- Impacto em funções utilitárias compartilhadas (mkChart, avg, cnt, freq) quando
  a alteração as afeta direta ou indiretamente.
- Preservação do comportamento das 6 seções existentes.
- Introdução acidental de dados de teste/fictícios em estruturas de produção (RAW).

## Severidade — critérios para este projeto

Como este é um dashboard estático sem testes automatizados nem CI, calibre assim:

- **Crítica**: quebra renderização, corrompe cálculo de KPI/gráfico, ou introduz
  dado inválido no RAW que afeta múltiplas seções.
- **Alta**: viola regra explícita do CLAUDE.md (tipo de dado, convenção de campo).
- **Média**: código duplicado, complexidade evitável, inconsistência de nomenclatura.
- **Baixa/Sugestão**: estilo, legibilidade, pequenas melhorias não urgentes.

## Comportamento obrigatório

- Nunca editar, criar ou excluir arquivos durante o review.
- Apresentar o diagnóstico completo e aguardar autorização explícita antes de
  aplicar qualquer correção.
