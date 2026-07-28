/**
 * HelpRegistry — dicionário central de ajuda contextual do ERP.
 *
 * Regra de arquitetura: nenhuma página pode conter texto de ajuda hard-coded.
 * Todo conteúdo de ajuda vive aqui e é consumido via `useHelp()` / `<HelpDialog />`.
 *
 * A chave de cada entrada é a URL canônica do item de menu (ver `menu-config.ts`),
 * o que garante resolução automática por rota, sem mapeamentos paralelos.
 */

export type HelpMedia = {
  /** `video` = arquivo mp4/webm; `gif` = imagem animada; `youtube` = embed */
  type: "video" | "gif" | "youtube";
  /** URL absoluta do arquivo/embed. Assets locais devem usar CDN (.asset.json). */
  src: string;
  /** Título curto exibido acima da mídia */
  title?: string;
  /** Legenda descritiva (também usada como texto alternativo em GIFs) */
  caption?: string;
  /** Imagem de pôster para vídeos (evita CLS enquanto carrega) */
  poster?: string;
};

export type HelpContent = {
  id: string;
  summary: string;
  description: string;
  features: string[];
  permissions?: string[];
  integrations?: string[];
  bestPractices?: string[];
  tips?: string[];
  relatedModules?: string[];
  /** Tutoriais curtos (vídeo/GIF) exibidos dentro do HelpDialog */
  media?: HelpMedia[];
};

/** Helper para reduzir repetição mantendo tipagem estrita. */
function help(
  id: string,
  summary: string,
  description: string,
  features: string[],
  extra: Partial<Omit<HelpContent, "id" | "summary" | "description" | "features">> = {},
): HelpContent {
  return { id, summary, description, features, ...extra };
}

export const HELP_REGISTRY: Record<string, HelpContent> = {
  // ───────────────────────────── Visão geral
  "/inicio": help(
    "/inicio",
    "Visão geral e acesso rápido",
    "Painel central com indicadores do dia, alertas críticos e atalhos para as funções mais utilizadas do ERP.",
    ["Widgets de indicadores", "Alertas operacionais", "Atalhos por perfil de usuário"],
    { tips: ["Use este painel como ponto de partida diário para identificar pendências antes de abrir cada módulo."] },
  ),
  "/dashboard/industrial": help(
    "/dashboard/industrial",
    "Dashboard Industrial",
    "Visão executiva consolidada da fábrica: produção, ocupação de máquinas, lead time e saúde financeira em tempo real.",
    ["KPIs de produção", "Ocupação de capacidade", "Lead time médio", "Indicadores financeiros"],
    { relatedModules: ["/pcp/oee", "/producao", "/financeiro/dashboard"] },
  ),

  // ───────────────────────────── Sistema
  "/funcionario": help("/funcionario", "Cadastro de colaboradores", "Registro de funcionários com dados pessoais, cargo, setor e vínculo com apontamentos de produção.", ["Dados cadastrais", "Cargo e setor", "Vínculo com apontamentos"]),
  "/usuarios": help("/usuarios", "Usuários e permissões", "Gestão de contas de acesso ao ERP e atribuição de papéis (RBAC) que definem o que cada perfil pode ver e executar.", ["Criação de contas", "Atribuição de papéis", "Bloqueio de acesso"], { permissions: ["admin", "desenvolvedor"], tips: ["Papéis são validados no banco de dados; alterações valem imediatamente no próximo login."] }),
  "/senha": help("/senha", "Alteração de senha", "Troca segura das credenciais do usuário autenticado, com validação de força e confirmação.", ["Troca de senha", "Validação de força", "Sessão preservada"]),
  "/time-log": help("/time-log", "Registro de tempos", "Histórico de tempos e eventos registrados pelos usuários nas operações do sistema.", ["Histórico por usuário", "Filtros por período", "Exportação"]),
  "/menus": help("/menus", "Gerenciar menus", "Controle de visibilidade dos itens do menu lateral por instalação, permitindo simplificar a navegação.", ["Ligar/desligar itens", "Itens bloqueados", "Preferência persistida"], { permissions: ["admin"] }),
  "/dev/organograma": help("/dev/organograma", "Organograma", "Visualização da hierarquia da empresa, agrupando usuários por seus cargos e responsabilidades.", ["Visão por cargo", "Mapeamento de usuários", "Hierarquia funcional"]),
  "/configuracoes": help("/configuracoes", "Configurações da conta", "Dados do perfil do usuário autenticado e alteração segura de senha.", ["Meu perfil", "Alteração de senha"]),

  // ───────────────────────────── Cadastros
  "/empresa": help("/empresa", "Clientes", "Cadastro de clientes com dados fiscais, endereços e condições comerciais utilizadas em pedidos e notas.", ["Dados fiscais (CNPJ/IE)", "Endereços de entrega", "Condições comerciais"], { relatedModules: ["/comercial/pedidos", "/fiscal/nota-fiscal"] }),
  "/composicao": help("/composicao", "Composições têxteis", "Cadastro das composições de fibras (ex.: 100% algodão, PA/EL) usadas na engenharia de artigos.", ["Percentual por fibra", "Uso em fichas técnicas"]),
  "/fio": help("/fio", "Cadastro de fios", "Catálogo de fios com título, composição e fornecedor, base para o consumo de matéria-prima.", ["Título do fio", "Composição", "Fornecedor padrão"], { relatedModules: ["/estoque-fios"] }),
  "/artigos": help("/artigos", "Artigos / Tecidos", "Cadastro dos artigos têxteis produzidos, com gramatura, largura, composição e parâmetros de malharia.", ["Gramatura e largura", "Composição", "Parâmetros de máquina"], { relatedModules: ["/producao/bom"] }),
  "/cliente-artigo": help("/cliente-artigo", "Cliente × Artigo", "Vínculo entre clientes e artigos, permitindo preços, tolerâncias e especificações específicas por cliente.", ["Preço por cliente", "Especificação própria", "Tolerâncias de qualidade"]),
  "/tabela-cor": help("/tabela-cor", "Fornecedores", "Cadastro de fornecedores de fios, produtos químicos e serviços de industrialização.", ["Dados fiscais", "Contatos", "Serviços prestados"], { relatedModules: ["/compras/fornecedores"] }),
  "/cor": help("/cor", "Cores", "Catálogo de cores com códigos internos e referências de tinturaria.", ["Código interno", "Referência de tinturaria"]),
  "/estampa": help("/estampa", "Estampas", "Cadastro de estampas com identificação, repetição e vínculo aos artigos.", ["Identificação", "Repetição", "Vínculo com artigo"]),
  "/variante": help("/variante", "Variantes", "Combinações de artigo, cor e estampa que formam o SKU comercializado.", ["Composição do SKU", "Controle por variante"]),
  "/produtos": help("/produtos", "Produtos", "Catálogo geral de produtos acabados, semiacabados e insumos usados por estoque, compras e fiscal.", ["Tipo de produto", "Unidade de medida", "Dados fiscais (NCM)"], { relatedModules: ["/fiscal/ncm", "/estoque-tecidos"] }),
  "/maquina": help("/maquina", "Máquinas", "Cadastro do parque de máquinas com características técnicas usadas no planejamento de capacidade.", ["Tipo e finura", "Capacidade nominal", "Setor"], { relatedModules: ["/pcp/capacidade", "/pcp/maquina-turnos"] }),
  "/agulha": help("/agulha", "Agulhas", "Controle das agulhas por máquina, apoiando manutenção e custos de consumo.", ["Modelo", "Consumo por máquina"]),
  "/correia": help("/correia", "Correias", "Cadastro de correias e componentes de manutenção do parque fabril.", ["Modelo", "Aplicação"]),
  "/rep-meta": help("/rep-meta", "Metas de representantes", "Definição de metas de faturamento por representante e período.", ["Meta por período", "Acompanhamento de realizado"]),
  "/representantes": help("/representantes", "Representantes (legado)", "Cadastro legado de representantes comerciais, mantido para compatibilidade histórica.", ["Consulta histórica"], { tips: ["Módulo legado: prefira os cadastros atuais para novos registros."] }),

  // ───────────────────────────── Estoque / WMS
  "/estoque-tecidos": help("/estoque-tecidos", "Estoque de tecidos", "Controle de saldo físico, reservado e disponível dos tecidos, com rastreabilidade por rolo e lote.", ["Saldo físico × reservado × disponível", "Controle por lote e rolo", "Localizações de armazenagem"], { integrations: ["Kardex", "Reservas", "Expedição"], relatedModules: ["/estoque/kardex", "/lotes"], bestPractices: ["Nunca ajuste saldo manualmente sem registrar o motivo — todo movimento deve gerar Kardex."] }),
  "/estoque-fios": help("/estoque-fios", "Estoque de fios", "Gestão de fios e cones em estoque, com entrada por nota, consumo por OP e saldo por lote.", ["Entrada por recebimento", "Consumo por ordem de produção", "Saldo por lote"], { relatedModules: ["/compras/recebimentos", "/pcp/mrp"] }),
  "/lotes": help("/lotes", "Lotes", "Rastreabilidade completa dos lotes produzidos e comprados, incluindo saldos segregados por status de qualidade.", ["Genealogia do lote", "Saldos segregados (liberado/bloqueado)", "Histórico de inspeções"], { relatedModules: ["/qualidade/segunda", "/producao/qualidade"] }),
  "/estoque/kardex": help("/estoque/kardex", "Kardex", "Livro de movimentações do estoque: toda entrada, saída e transferência com origem, documento e saldo resultante.", ["Movimentos cronológicos", "Filtro por produto e período", "Saldo acumulado"], { bestPractices: ["Use o Kardex como fonte de verdade em qualquer divergência de saldo."] }),
  "/comercial/estoque": help("/comercial/estoque", "Estoque comercial", "Visão do estoque disponível para venda, já descontadas reservas comerciais e materiais bloqueados.", ["Disponível para venda", "Reservas comerciais", "Bloqueios de qualidade"], { relatedModules: ["/comercial/pedidos"] }),
  "/wms": help("/wms", "Dashboard WMS", "Painel de gestão de armazém: ocupação de endereços, tarefas pendentes e acuracidade de inventário.", ["Ocupação por endereço", "Tarefas de movimentação", "Acuracidade"], { relatedModules: ["/wms/inventario"] }),
  "/wms/inventario": help("/wms/inventario", "Inventário cíclico", "Contagens rotativas de estoque com apuração de divergências e geração de ajustes rastreados.", ["Programação de contagens", "Registro de divergência", "Ajuste com Kardex"], { bestPractices: ["Feche cada contagem antes de iniciar outra no mesmo endereço para evitar saldo inconsistente."] }),

  // ───────────────────────────── Produção / PCP
  "/producao": help("/producao", "Painel de OP", "Monitoramento em tempo real do chão de fábrica: OPs em andamento, atrasos e produção apontada.", ["OPs por status", "Atrasos e prioridades", "Produção apontada no turno"], { relatedModules: ["/producao/op", "/pcp/oee"] }),
  "/producao/pedidos": help("/producao/pedidos", "Pedidos de produção", "Carteira de pedidos que alimenta o planejamento e a geração de ordens de produção.", ["Carteira por cliente", "Datas prometidas", "Origem da demanda"]),
  "/producao/op": help("/producao/op", "Ordens de Produção", "Criação, acompanhamento e encerramento de OPs, com explosão de materiais, reservas e apontamento de consumo.", ["Explosão de materiais (BOM)", "Reserva de insumos", "Apontamento de produção e consumo", "Encerramento com entrada de lote"], { integrations: ["MRP", "Estoque", "Qualidade"], relatedModules: ["/producao/bom", "/pcp/mrp", "/pcp/reservas"], bestPractices: ["Encerre a OP somente após o apontamento final — o encerramento gera entrada de lote e custo."] }),
  "/producao/qualidade": help("/producao/qualidade", "Qualidade da produção", "Inspeções de processo e de retorno, com bloqueio, liberação e classificação de lotes.", ["Registro de inspeção", "Bloqueio e liberação", "Classificação de qualidade"], { relatedModules: ["/pcp/planos-inspecao", "/qualidade/rnc", "/qualidade/segunda"] }),
  "/pcp/planos-inspecao": help("/pcp/planos-inspecao", "Planos de inspeção", "Definição dos critérios, ensaios e tolerâncias aplicados nas inspeções de qualidade.", ["Critérios e ensaios", "Tolerâncias", "Aplicação por artigo"]),
  "/producao/expedicao": help("/producao/expedicao", "Expedição", "Preparação e liberação de cargas: separação, conferência e vínculo com romaneios e notas.", ["Separação FIFO", "Conferência de volumes", "Vínculo com romaneio"], { relatedModules: ["/logistica/romaneios", "/logistica/separacoes"] }),
  "/producao/industrial": help("/producao/industrial", "Análise industrial (OEE)", "Análise de eficiência global dos equipamentos: disponibilidade, performance e qualidade.", ["Disponibilidade", "Performance", "Qualidade", "Paradas classificadas"]),
  "/producao/plano": help("/producao/plano", "Planejamento (PCP)", "Planejamento de produção por período, equilibrando demanda, capacidade e prioridades.", ["Plano por período", "Balanceamento de carga", "Prioridades"], { relatedModules: ["/pcp/capacidade"] }),
  "/producao/bom": help("/producao/bom", "Ficha técnica / BOM", "Estrutura de materiais multinível do produto, com quantidades, perdas e versões controladas.", ["Estrutura multinível", "Percentual de perda", "Versionamento", "Custo explodido"], { integrations: ["MRP", "Custos industriais"], relatedModules: ["/pcp/mrp", "/pcp/custos", "/producao/onde-e-usado"], bestPractices: ["Crie uma nova versão em vez de editar a vigente — versões preservam o histórico de custo."] }),
  "/producao/onde-e-usado": help("/producao/onde-e-usado", "Onde é usado", "Consulta reversa da BOM: identifica em quais produtos um insumo é consumido.", ["Busca reversa", "Impacto de alteração", "Níveis de uso"]),
  "/pcp/turnos": help("/pcp/turnos", "Turnos", "Definição dos turnos de trabalho, horários e intervalos usados no cálculo de capacidade.", ["Horários e intervalos", "Jornada por turno"], { relatedModules: ["/pcp/calendario", "/pcp/maquina-turnos"] }),
  "/pcp/calendario": help("/pcp/calendario", "Calendário produtivo", "Calendário industrial com dias úteis, feriados e paradas programadas.", ["Dias úteis", "Feriados", "Paradas programadas"]),
  "/pcp/maquina-turnos": help("/pcp/maquina-turnos", "Máquina × Turno", "Alocação de máquinas aos turnos, base para a capacidade disponível do período.", ["Alocação por turno", "Capacidade resultante"]),
  "/pcp/capacidade": help("/pcp/capacidade", "Capacidade de máquina", "Cálculo da capacidade produtiva por máquina e período, comparando carga planejada e disponível.", ["Capacidade disponível", "Carga planejada", "Gargalos"]),
  "/pcp/operacoes": help("/pcp/operacoes", "Operações produtivas", "Catálogo das operações do processo (tricotagem, tinturaria, acabamento) com tempos padrão.", ["Tempo padrão", "Setor executor", "Uso em roteiros"]),
  "/pcp/roteiros": help("/pcp/roteiros", "Roteiros de produção", "Sequência de operações por produto, com tempos e recursos, usada pelo planejamento e pelo custo.", ["Sequência de operações", "Tempos por etapa", "Versionamento"], { relatedModules: ["/pcp/operacoes", "/pcp/custos"] }),
  "/pcp/processos": help("/pcp/processos", "Processos industriais", "Cadastro dos macroprocessos industriais e seus parâmetros técnicos.", ["Parâmetros técnicos", "Setores envolvidos"]),
  "/pcp/oee": help("/pcp/oee", "OEE industrial", "Indicador consolidado de eficiência do parque fabril por máquina, turno e período.", ["OEE por máquina", "Comparativo de turnos", "Histórico"]),
  "/pcp/custos": help("/pcp/custos", "Custos industriais", "Cálculo do custo do produto: matéria-prima explodida pela BOM, mão de obra e overhead por operação.", ["Custo de material", "Custo de operação", "Custo total explodido"], { permissions: ["gerente", "admin", "desenvolvedor"], relatedModules: ["/producao/bom"] }),
  "/pcp/mrp": help("/pcp/mrp", "MRP — Materiais", "Cálculo da necessidade líquida de materiais a partir da demanda, do estoque e das reservas existentes.", ["Explosão multinível da BOM", "Necessidade bruta × líquida", "Sugestões de compra e produção"], { integrations: ["BOM", "Estoque", "Compras"], relatedModules: ["/compras/sugestoes", "/pcp/mrp-op"], bestPractices: ["Rode o MRP após atualizar a carteira de pedidos e conferir saldos de estoque."] }),
  "/pcp/mrp-op": help("/pcp/mrp-op", "MRP → Sugestão de OP", "Conversão das necessidades de itens produzidos em ordens de produção sugeridas.", ["Sugestões por item", "Conversão em OP", "Agrupamento por período"]),
  "/pcp/vinculos-artigo": help("/pcp/vinculos-artigo", "Vínculos Produto → Artigo", "Relacionamento entre produtos comerciais e artigos de engenharia para explosão correta do MRP.", ["Vínculo produto/artigo", "Validação de cobertura"]),
  "/pcp/reservas": help("/pcp/reservas", "Reservas de material", "Reserva transacional de insumos para ordens de produção, protegendo o saldo disponível.", ["Reserva por OP", "Liberação e cancelamento", "Impacto no disponível"], { bestPractices: ["Cancele reservas de OPs abandonadas — reservas órfãs travam o saldo disponível."] }),
  "/producao/industrializacao": help("/producao/industrializacao", "Industrialização por terceiros", "Controle de remessas e retornos de industrialização (tinturaria, acabamento), com saldo em poder de terceiros.", ["Remessa para terceiros", "Retorno com inspeção", "Saldo em terceiros"], { relatedModules: ["/producao/qualidade", "/fiscal/nota-fiscal"] }),
  "/qualidade/rnc": help("/qualidade/rnc", "RNC — Não conformidades", "Registro, tratamento e encerramento de não conformidades com causa raiz e ação corretiva.", ["Abertura de RNC", "Causa raiz", "Ação corretiva", "Encerramento"], { relatedModules: ["/producao/qualidade"] }),
  "/qualidade/segunda": help("/qualidade/segunda", "Segunda qualidade", "Classificação e destinação de material fora do padrão, com saldo segregado e regras de venda.", ["Classificação por defeito", "Saldo segregado", "Liberação comercial"], { relatedModules: ["/lotes", "/comercial/estoque"] }),

  // ───────────────────────────── Compras
  "/compras": help("/compras", "Dashboard de compras", "Visão geral do ciclo de suprimentos: solicitações abertas, cotações, pedidos e recebimentos pendentes.", ["Pipeline de compras", "Pendências por etapa", "Valores em aberto"]),
  "/compras/fornecedores": help("/compras/fornecedores", "Fornecedores (Compras)", "Base de fornecedores homologados com condições, prazos e histórico de fornecimento.", ["Condições comerciais", "Lead time", "Histórico de compras"]),
  "/compras/solicitacoes": help("/compras/solicitacoes", "Solicitações de compra", "Requisições internas de materiais e serviços, com aprovação antes da cotação.", ["Requisição por setor", "Aprovação", "Origem MRP ou manual"]),
  "/compras/cotacoes": help("/compras/cotacoes", "Cotações", "Comparativo de propostas de fornecedores para escolher preço, prazo e condição.", ["Múltiplos fornecedores", "Mapa comparativo", "Seleção do vencedor"]),
  "/compras/pedidos": help("/compras/pedidos", "Pedidos de compra", "Emissão e acompanhamento de pedidos, incluindo os gerados a partir das sugestões do MRP.", ["Emissão do pedido", "Acompanhamento de entrega", "Origem MRP"], { relatedModules: ["/compras/sugestoes", "/compras/recebimentos"] }),
  "/compras/recebimentos": help("/compras/recebimentos", "Recebimentos", "Entrada de materiais com conferência de quantidade, inspeção e geração de movimento de estoque.", ["Conferência quantitativa", "Inspeção de entrada", "Entrada no Kardex"]),
  "/compras/contas-pagar": help("/compras/contas-pagar", "Contas a pagar", "Títulos a pagar originados de pedidos e notas de entrada, com baixas e programação de pagamento.", ["Títulos em aberto", "Programação de pagamento", "Baixas"], { relatedModules: ["/financeiro/fluxo-caixa"] }),
  "/compras/sugestoes": help("/compras/sugestoes", "Sugestões do MRP", "Necessidades de compra calculadas pelo MRP, convertidas em pedidos de forma transacional.", ["Necessidade por item e data", "Filtro por fornecedor", "Conversão em pedido"], { relatedModules: ["/pcp/mrp"] }),

  // ───────────────────────────── Comercial
  "/comercial/pedidos": help("/comercial/pedidos", "Pedidos de venda", "Gestão da carteira comercial: itens, preços, reservas de estoque e liberação para faturamento.", ["Itens e preços", "Reserva de estoque", "Liberação para faturamento"], { relatedModules: ["/comercial/estoque", "/fiscal/nota-fiscal"] }),

  // ───────────────────────────── Financeiro & Logística
  "/financeiro/dashboard": help("/financeiro/dashboard", "Dashboard financeiro", "Visão executiva da saúde financeira: recebíveis, pagáveis, inadimplência e saldo projetado.", ["Recebíveis e pagáveis", "Inadimplência", "Saldo projetado"]),
  "/financeiro": help("/financeiro", "Contas a receber", "Gestão de recebíveis: títulos, baixas, conciliação e acompanhamento de inadimplência.", ["Títulos por cliente", "Baixas e conciliação", "Inadimplência"], { integrations: ["Faturamento", "Fluxo de caixa"], relatedModules: ["/financeiro/fluxo-caixa"] }),
  "/financeiro/fluxo-caixa": help("/financeiro/fluxo-caixa", "Fluxo de caixa", "Projeção de entradas e saídas por período, consolidando recebíveis, pagáveis e saldos bancários.", ["Projeção por período", "Realizado × previsto", "Saldos por conta"]),
  "/financeiro/movimentos": help("/financeiro/movimentos", "Movimentos financeiros", "Extrato de todos os lançamentos financeiros com origem, centro de custo e conta.", ["Lançamentos detalhados", "Filtros por origem", "Exportação"]),
  "/financeiro/centros-custo": help("/financeiro/centros-custo", "Centros de custo", "Estrutura de centros de custo usada para ratear despesas e apurar resultado por área.", ["Hierarquia de centros", "Rateio de despesas", "Resultado por área"]),
  "/financeiro/contas-bancarias": help("/financeiro/contas-bancarias", "Contas bancárias", "Cadastro das contas bancárias, saldos e vínculo com baixas e conciliação.", ["Cadastro de contas", "Saldo atual", "Conciliação"]),
  "/logistica": help("/logistica", "Logística", "Painel logístico com cargas, separações, romaneios e entregas em andamento.", ["Cargas em andamento", "Pendências de separação", "Entregas do dia"]),
  "/logistica/separacoes": help("/logistica/separacoes", "Separações (picking)", "Ordens de separação por pedido, com definição de lotes e conferência de itens.", ["Picking por pedido", "Escolha de lotes (FIFO)", "Conferência"]),
  "/logistica/romaneios": help("/logistica/romaneios", "Romaneios", "Agrupamento de volumes e pedidos em romaneios de carga vinculados à nota fiscal e à transportadora.", ["Volumes e pesos", "Vínculo com NF-e", "Transportadora"]),
  "/logistica/entregas": help("/logistica/entregas", "Entregas e rastreio", "Acompanhamento das entregas, prazos e comprovantes de recebimento.", ["Status de entrega", "Prazos e atrasos", "Comprovantes"]),
  "/logistica/transportadoras": help("/logistica/transportadoras", "Transportadoras", "Cadastro de transportadoras, praças atendidas e dados fiscais para emissão de notas.", ["Dados fiscais", "Praças atendidas", "Vínculo com romaneio"]),
  "/rastreabilidade/pedido/00000000-0000-0000-0000-000000000000": help("/rastreabilidade/pedido/00000000-0000-0000-0000-000000000000", "Rastreabilidade do pedido", "Linha do tempo completa de um pedido: matéria-prima, lotes, OPs, inspeções, nota fiscal e entrega.", ["Genealogia de lotes", "Linha do tempo do pedido", "Documentos vinculados"]),

  // ───────────────────────────── Fiscal
  "/fiscal/dashboard": help("/fiscal/dashboard", "Dashboard fiscal", "Panorama fiscal: notas emitidas, rejeições, contingência e prazos de obrigações.", ["Notas por status", "Rejeições recentes", "Ambiente e certificado"]),
  "/fiscal/nota-fiscal": help("/fiscal/nota-fiscal", "Nota Fiscal (NF-e)", "Ciclo completo da NF-e de venda e remessa: montagem do payload, cálculo de impostos, transmissão e DANFE.", ["Geração de XML", "Cálculo de impostos", "Transmissão e retorno", "Impressão de DANFE"], { permissions: ["fiscal", "admin"], integrations: ["Focus NFe", "Financeiro", "Estoque"], bestPractices: ["Valide o cadastro fiscal do cliente e o NCM do produto antes de transmitir."] }),
  "/fiscal/nota-fiscal-importacao": help("/fiscal/nota-fiscal-importacao", "NF de importação", "Registro de notas de importação com dados de DI, adições e tributos específicos.", ["Dados de DI", "Adições", "Tributos de importação"]),
  "/fiscal/nota-fiscal-upload": help("/fiscal/nota-fiscal-upload", "Upload de notas", "Importação de arquivos XML de notas recebidas para escrituração e conferência.", ["Upload de XML", "Validação de chave", "Conferência de itens"]),
  "/fiscal/impostos": help("/fiscal/impostos", "Impostos", "Parametrização e consulta dos tributos aplicados (ICMS, IPI, PIS, COFINS).", ["Alíquotas por tributo", "Consulta por produto"]),
  "/fiscal/r-nota-fiscal": help("/fiscal/r-nota-fiscal", "Relação de notas fiscais", "Consulta consolidada das notas emitidas com filtros por período, status e cliente.", ["Filtros avançados", "Exportação", "Consulta de status"]),
  "/fiscal/cfop": help("/fiscal/cfop", "CFOP", "Cadastro dos códigos fiscais de operação usados na determinação tributária.", ["Código e descrição", "Uso por operação"]),
  "/fiscal/uf-icms": help("/fiscal/uf-icms", "UF × ICMS", "Matriz de alíquotas de ICMS interestadual por unidade federativa.", ["Alíquota por UF", "Operações interestaduais"]),
  "/fiscal/ncm": help("/fiscal/ncm", "NCM", "Cadastro das classificações fiscais de mercadoria vinculadas aos produtos.", ["Código NCM", "Vínculo com produto", "Tributação padrão"]),
  "/fiscal/regras-tributarias": help("/fiscal/regras-tributarias", "Regras tributárias", "Motor de regras que determina CFOP, CST e alíquotas conforme operação, UF e produto.", ["Determinação de CFOP/CST", "Regras por UF", "Prioridade de regra"], { bestPractices: ["Teste toda regra nova no Simulador Fiscal antes de habilitá-la em produção."], relatedModules: ["/fiscal/simulador"] }),
  "/fiscal/beneficios": help("/fiscal/beneficios", "Benefícios fiscais", "Cadastro de benefícios e reduções aplicáveis por operação ou produto.", ["Tipo de benefício", "Base legal", "Aplicação"]),
  "/fiscal/simulador": help("/fiscal/simulador", "Simulador fiscal", "Simulação da tributação de uma operação sem emitir documento, validando regras e alíquotas.", ["Simulação por operação", "Resultado por tributo", "Diagnóstico da regra aplicada"]),
  "/fiscal/certificados": help("/fiscal/certificados", "Certificados A1", "Gestão do certificado digital A1 e das credenciais de transmissão, armazenados de forma criptografada.", ["Validade do certificado", "Ambiente (homologação/produção)", "Credenciais cifradas"], { permissions: ["admin"], tips: ["Credenciais são armazenadas cifradas (AES-256-GCM) e nunca exibidas em texto puro."] }),
  "/fiscal/relatorios": help("/fiscal/relatorios", "Relatórios fiscais", "Geração de livros e apurações mensais para conferência e envio ao contador.", ["Livro de saídas", "Apuração mensal", "Exportação"]),

  // ───────────────────────────── DEV / Administração
  "/roadmap-industrial": help("/roadmap-industrial", "Roadmap industrial", "Acompanhamento das sprints e do estágio de maturidade dos módulos industriais.", ["Sprints e status", "Escopo por módulo"], { permissions: ["desenvolvedor", "admin"] }),
  "/admin/auditoria": help("/admin/auditoria", "Auditoria do ERP", "Verificação técnica de integridade: tabelas, políticas RLS, RPCs e consistência de dados.", ["Integridade de dados", "Checagem de RLS", "Diagnóstico de módulos"], { permissions: ["desenvolvedor", "admin"] }),
  "/dev/focus-nfe": help("/dev/focus-nfe", "Focus NFe", "Painel técnico de integração com o provedor fiscal, ambiente e diagnóstico de credenciais.", ["Ambiente ativo", "Diagnóstico de token", "Logs de eventos"], { permissions: ["desenvolvedor"] }),
  "/dev/sprint0": help("/dev/sprint0", "Sprint 0 — Checklist", "Checklist técnico de fundação do projeto e pré-requisitos de homologação.", ["Itens de fundação", "Status de conclusão"], { permissions: ["desenvolvedor"] }),
  "/dev/e2e": help("/dev/e2e", "Suíte E2E SEED", "Execução das rotinas de teste ponta a ponta com dados de semente controlados.", ["Cenários E2E", "Resultado por execução"], { permissions: ["desenvolvedor"] }),
  "/dev/cargos": help("/dev/cargos", "Cargos", "Gestão dos cargos e das permissões associadas a cada função no sistema.", ["Cargos", "Permissões associadas"], { permissions: ["desenvolvedor", "admin"] }),
};

/** Conteúdo de fallback quando um item ainda não possui entrada dedicada. */
export function buildFallbackHelp(id: string, title: string, description?: string): HelpContent {
  return {
    id,
    summary: title,
    description:
      description ??
      `Módulo "${title}" do ERP Industrial Digitale Têxtil. A documentação detalhada deste item ainda está em elaboração.`,
    features: ["Consulte a equipe técnica para detalhes operacionais deste módulo."],
  };
}
