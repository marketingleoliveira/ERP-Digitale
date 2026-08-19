# BACKUP ERP DIGITALE

Crie um sistema ERP 100% web chamado Sistema Digitale Têxtil, desenvolvido para atender a propria empresa, baseada no sistema @project:66a0086f-3a9f-4b49-95c6-10c5f61c45e0:"Portal Digitale Têxtil ( VENDAS ) " , atender os setores de estamparias digitais, confecções, private label e distribuidores de tecidos. O sistema deve possuir uma interface moderna, extremamente rápida, responsiva e intuitiva, utilizando React, TypeScript, Tailwind CSS e Supabase como banco de dados e autenticação. Toda a arquitetura deve ser modular, escalável e preparada para futuras integrações.

O Sistema Digitale Têxtil deve iniciar com um Dashboard executivo contendo indicadores em tempo real, como faturamento do dia, faturamento do mês, pedidos em produção, pedidos atrasados, ordens de produção abertas, estoque disponível, produtos mais vendidos, clientes ativos, contas a receber, contas a pagar, gráficos financeiros, gráficos de vendas e indicadores de produtividade.

Criar um módulo completo de cadastro de clientes contendo pessoa física e jurídica, múltiplos endereços, contatos, vendedores responsáveis, limite de crédito, histórico financeiro, histórico de compras, observações internas, documentos e classificação por segmentos.

Criar um módulo de fornecedores com cadastro completo, documentos fiscais, produtos fornecidos, histórico de compras e controle financeiro.

Criar um módulo de representantes comerciais contendo comissão, metas, carteira de clientes, desempenho mensal, vendas realizadas e indicadores individuais.

Criar um módulo completo de produtos têxteis permitindo cadastro de tecidos, estampas, modelos, matérias-primas, aviamentos, produtos acabados, semiacabados e insumos.

Cada produto deve possuir código interno, SKU, código de barras, descrição completa, descrição resumida, categoria, subcategoria, coleção, marca, fornecedor, unidade de medida, peso, dimensões, composição do tecido, gramatura, largura, elasticidade, imagens, vídeos, documentos técnicos, ficha técnica e status.

Implementar controle completo de variantes permitindo cor, tamanho, modelagem, coleção, grade, lote, estampa e qualquer outro atributo configurável.

Criar gerenciamento completo de estoque com movimentações automáticas, entradas, saídas, transferências, inventário, ajuste de estoque, estoque mínimo, estoque máximo, reserva para pedidos, rastreamento por lote e localização física.

Criar módulo completo de compras contendo solicitações de compra, pedidos de compra, recebimento, conferência, integração com estoque e financeiro.

Criar módulo comercial contendo orçamento, pedido de venda, aprovação, separação, faturamento, expedição e acompanhamento da entrega.

Criar um CRM integrado permitindo registrar contatos, negociações, tarefas, propostas comerciais, follow-up, agenda e funil de vendas.

Criar módulo financeiro contendo contas a pagar, contas a receber, fluxo de caixa, conciliação bancária, centros de custo, plano de contas, DRE, balancetes, projeções financeiras, inadimplência e emissão de boletos.

Criar módulo completo de produção (PCP).

O PCP deverá permitir cadastrar processos produtivos, etapas de fabricação, centros de trabalho, máquinas, operadores, capacidade produtiva, tempo padrão, consumo de matéria-prima e sequência operacional.

Permitir abertura de Ordens de Produção.

Cada Ordem de Produção deve apresentar:

Número da OP

Produto

Cliente

Quantidade

Quantidade produzida

Quantidade pendente

Status

Prioridade

Data de emissão

Prazo de entrega

Etapas concluídas

Etapas pendentes

Responsáveis

Consumo de matéria-prima

Custos

Observações

Criar um painel Kanban para acompanhar todas as ordens de produção em tempo real.

Criar rastreamento completo da produção mostrando em qual etapa cada pedido se encontra.

Criar módulo específico para facções terceirizadas permitindo envio de materiais, retorno de produção, controle de perdas, custos, produtividade e prazos.

Criar módulo de qualidade permitindo inspeções, não conformidades, aprovação, rejeição, rastreamento de defeitos e indicadores de qualidade.

Criar um módulo de logística contendo separação, conferência, embalagem, expedição, romaneio, transportadoras, rastreamento e comprovantes de entrega.

Criar um módulo fiscal preparado para integração futura com emissão de NF-e, NFC-e e demais documentos fiscais.

Criar um módulo de usuários permitindo níveis de acesso por função, permissões individuais, auditoria completa de ações e histórico de alterações.

Criar um módulo administrativo permitindo parametrização do sistema sem necessidade de programação.

Criar um sistema completo de notificações mostrando avisos de estoque baixo, contas vencidas, pedidos atrasados, produção parada, metas atingidas e tarefas pendentes.

Criar busca global inteligente permitindo localizar rapidamente clientes, produtos, pedidos, ordens de produção, notas fiscais e documentos.

Criar filtros avançados em todas as telas.

Todos os cadastros devem possuir paginação, pesquisa instantânea, ordenação, exportação para Excel e PDF e impressão.

Criar um sistema de anexos permitindo armazenar imagens, PDFs, documentos técnicos, contratos e fichas.

Todo o sistema deve possuir modo claro e modo escuro.

Utilizar componentes modernos com cards, tabelas inteligentes, gráficos interativos, indicadores visuais e experiência semelhante a softwares SaaS premium.

Toda a estrutura deve ser organizada em módulos independentes, preparada para integração futura com APIs de e-commerce, marketplaces, WhatsApp, transportadoras, gateways de pagamento, plataformas de BI e outros sistemas corporativos.

A arquitetura do projeto deve seguir padrões escaláveis, componentização, reutilização de código, segurança, autenticação robusta, controle de permissões, logs de auditoria e excelente desempenho mesmo com grande volume de dados.

O nome Sistema Digitale Têxtil deve aparecer na tela de login, no cabeçalho, no menu lateral, no título das páginas, no favicon, nos metadados do projeto e em toda a identidade visual. Criar uma identidade visual moderna utilizando a paleta de cores da marca Digitale Têxtil, com um design profissional inspirado nos melhores ERPs do mercado.

Gerar também dados fictícios para demonstração, permitindo navegar por todas as telas imediatamente após a criação do projeto.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://erpdigitale.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2072e8ab-b568-4a03-8fef-3460893cfae5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
