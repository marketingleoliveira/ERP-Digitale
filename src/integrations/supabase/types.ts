export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agulhas: {
        Row: {
          agulha: string
          created_at: string
          habilitado: boolean
          id: string
          marca: string | null
          modelo: string | null
          pe: number | null
          updated_at: string
        }
        Insert: {
          agulha: string
          created_at?: string
          habilitado?: boolean
          id?: string
          marca?: string | null
          modelo?: string | null
          pe?: number | null
          updated_at?: string
        }
        Update: {
          agulha?: string
          created_at?: string
          habilitado?: boolean
          id?: string
          marca?: string | null
          modelo?: string | null
          pe?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      article_cores: {
        Row: {
          article_id: string
          cor_descricao: string
          cor_id: string | null
          created_at: string
          id: string
        }
        Insert: {
          article_id: string
          cor_descricao: string
          cor_id?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          article_id?: string
          cor_descricao?: string
          cor_id?: string | null
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_cores_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_cores_cor_id_fkey"
            columns: ["cor_id"]
            isOneToOne: false
            referencedRelation: "cores"
            referencedColumns: ["id"]
          },
        ]
      }
      article_fios: {
        Row: {
          article_id: string
          created_at: string
          fio_descricao: string
          fio_id: string | null
          id: string
          porcentagem: number
          qtd_cones: number
          updated_at: string
        }
        Insert: {
          article_id: string
          created_at?: string
          fio_descricao: string
          fio_id?: string | null
          id?: string
          porcentagem?: number
          qtd_cones?: number
          updated_at?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          fio_descricao?: string
          fio_id?: string | null
          id?: string
          porcentagem?: number
          qtd_cones?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_fios_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_fios_fio_id_fkey"
            columns: ["fio_id"]
            isOneToOne: false
            referencedRelation: "fios"
            referencedColumns: ["id"]
          },
        ]
      }
      article_lavagens: {
        Row: {
          article_id: string
          created_at: string
          id: string
          lavagem: string
          simbolo: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          lavagem: string
          simbolo?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          lavagem?: string
          simbolo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_lavagens_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          alim_fio_1_ativo: boolean
          alim_fio_1_fio_id: string | null
          alim_fio_1_lfa: number | null
          alim_fio_1_tensao: number | null
          alim_fio_2_ativo: boolean
          alim_fio_2_fio_id: string | null
          alim_fio_2_lfa: number | null
          alim_fio_2_tensao: number | null
          alim_fio_3_ativo: boolean
          alim_fio_3_fio_id: string | null
          alim_fio_3_lfa: number | null
          alim_fio_3_tensao: number | null
          alimentador_fio_1: string | null
          alimentador_fio_2: string | null
          alimentador_fio_3: string | null
          altura_disco: number | null
          ativo: boolean
          categoria: string | null
          cest: string | null
          cliente: string | null
          codigo: string | null
          composicao: string | null
          created_at: string
          descricao: string | null
          descricao_curta: string | null
          diametro: number | null
          disposicao_agulhas: string | null
          falha_agulha: boolean | null
          fci: string | null
          finura: number | null
          gramatura: number | null
          id: string
          imagem_url: string | null
          largura: number | null
          lfa: number | null
          n_alimentadores: number | null
          n_voltas: number | null
          ncm: string | null
          nome: string
          observacao: string | null
          origem: string | null
          owner_id: string | null
          p_acabamento: string | null
          peca_tara_kg: number | null
          peso_peca_kg: number | null
          ponto_cilindro: string | null
          ponto_disco: string | null
          preco_venda: number | null
          qtd_agulhas_cilindro: number | null
          qtd_agulhas_disco: number | null
          r_custo: number | null
          r_lucro: number | null
          r_malharia: number | null
          r_malharia_compl: number | null
          r_venda: number | null
          r_venda_metros: number | null
          rendimento: number | null
          roda_1: number | null
          roda_2: number | null
          roda_lycra: number | null
          rpm: number | null
          slug: string | null
          tecnologias: string[] | null
          tensao_fio: number | null
          tensao_lycra: number | null
          tipo: string | null
          tipo_maquina: string | null
          updated_at: string
        }
        Insert: {
          alim_fio_1_ativo?: boolean
          alim_fio_1_fio_id?: string | null
          alim_fio_1_lfa?: number | null
          alim_fio_1_tensao?: number | null
          alim_fio_2_ativo?: boolean
          alim_fio_2_fio_id?: string | null
          alim_fio_2_lfa?: number | null
          alim_fio_2_tensao?: number | null
          alim_fio_3_ativo?: boolean
          alim_fio_3_fio_id?: string | null
          alim_fio_3_lfa?: number | null
          alim_fio_3_tensao?: number | null
          alimentador_fio_1?: string | null
          alimentador_fio_2?: string | null
          alimentador_fio_3?: string | null
          altura_disco?: number | null
          ativo?: boolean
          categoria?: string | null
          cest?: string | null
          cliente?: string | null
          codigo?: string | null
          composicao?: string | null
          created_at?: string
          descricao?: string | null
          descricao_curta?: string | null
          diametro?: number | null
          disposicao_agulhas?: string | null
          falha_agulha?: boolean | null
          fci?: string | null
          finura?: number | null
          gramatura?: number | null
          id?: string
          imagem_url?: string | null
          largura?: number | null
          lfa?: number | null
          n_alimentadores?: number | null
          n_voltas?: number | null
          ncm?: string | null
          nome: string
          observacao?: string | null
          origem?: string | null
          owner_id?: string | null
          p_acabamento?: string | null
          peca_tara_kg?: number | null
          peso_peca_kg?: number | null
          ponto_cilindro?: string | null
          ponto_disco?: string | null
          preco_venda?: number | null
          qtd_agulhas_cilindro?: number | null
          qtd_agulhas_disco?: number | null
          r_custo?: number | null
          r_lucro?: number | null
          r_malharia?: number | null
          r_malharia_compl?: number | null
          r_venda?: number | null
          r_venda_metros?: number | null
          rendimento?: number | null
          roda_1?: number | null
          roda_2?: number | null
          roda_lycra?: number | null
          rpm?: number | null
          slug?: string | null
          tecnologias?: string[] | null
          tensao_fio?: number | null
          tensao_lycra?: number | null
          tipo?: string | null
          tipo_maquina?: string | null
          updated_at?: string
        }
        Update: {
          alim_fio_1_ativo?: boolean
          alim_fio_1_fio_id?: string | null
          alim_fio_1_lfa?: number | null
          alim_fio_1_tensao?: number | null
          alim_fio_2_ativo?: boolean
          alim_fio_2_fio_id?: string | null
          alim_fio_2_lfa?: number | null
          alim_fio_2_tensao?: number | null
          alim_fio_3_ativo?: boolean
          alim_fio_3_fio_id?: string | null
          alim_fio_3_lfa?: number | null
          alim_fio_3_tensao?: number | null
          alimentador_fio_1?: string | null
          alimentador_fio_2?: string | null
          alimentador_fio_3?: string | null
          altura_disco?: number | null
          ativo?: boolean
          categoria?: string | null
          cest?: string | null
          cliente?: string | null
          codigo?: string | null
          composicao?: string | null
          created_at?: string
          descricao?: string | null
          descricao_curta?: string | null
          diametro?: number | null
          disposicao_agulhas?: string | null
          falha_agulha?: boolean | null
          fci?: string | null
          finura?: number | null
          gramatura?: number | null
          id?: string
          imagem_url?: string | null
          largura?: number | null
          lfa?: number | null
          n_alimentadores?: number | null
          n_voltas?: number | null
          ncm?: string | null
          nome?: string
          observacao?: string | null
          origem?: string | null
          owner_id?: string | null
          p_acabamento?: string | null
          peca_tara_kg?: number | null
          peso_peca_kg?: number | null
          ponto_cilindro?: string | null
          ponto_disco?: string | null
          preco_venda?: number | null
          qtd_agulhas_cilindro?: number | null
          qtd_agulhas_disco?: number | null
          r_custo?: number | null
          r_lucro?: number | null
          r_malharia?: number | null
          r_malharia_compl?: number | null
          r_venda?: number | null
          r_venda_metros?: number | null
          rendimento?: number | null
          roda_1?: number | null
          roda_2?: number | null
          roda_lycra?: number | null
          rpm?: number | null
          slug?: string | null
          tecnologias?: string[] | null
          tensao_fio?: number | null
          tensao_lycra?: number | null
          tipo?: string | null
          tipo_maquina?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cargos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          permissoes: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          permissoes?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          permissoes?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      cfop: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string
          id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      composicoes: {
        Row: {
          codigo: string
          composicao: string
          created_at: string
          habilitado: boolean
          id: string
          ncm: string | null
          owner_id: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          codigo: string
          composicao: string
          created_at?: string
          habilitado?: boolean
          id?: string
          ncm?: string | null
          owner_id?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          composicao?: string
          created_at?: string
          habilitado?: boolean
          id?: string
          ncm?: string | null
          owner_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      cores: {
        Row: {
          codigo: string
          cor: string
          created_at: string
          habilitado: boolean
          id: string
          observacao: string | null
          tinturaria_id: string | null
          tipo: string
          updated_at: string
          valor: number | null
          valor_complementar: number | null
        }
        Insert: {
          codigo: string
          cor: string
          created_at?: string
          habilitado?: boolean
          id?: string
          observacao?: string | null
          tinturaria_id?: string | null
          tipo: string
          updated_at?: string
          valor?: number | null
          valor_complementar?: number | null
        }
        Update: {
          codigo?: string
          cor?: string
          created_at?: string
          habilitado?: boolean
          id?: string
          observacao?: string | null
          tinturaria_id?: string | null
          tipo?: string
          updated_at?: string
          valor?: number | null
          valor_complementar?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cores_tinturaria_id_fkey"
            columns: ["tinturaria_id"]
            isOneToOne: false
            referencedRelation: "tinturarias"
            referencedColumns: ["id"]
          },
        ]
      }
      correias: {
        Row: {
          correia: string
          created_at: string
          habilitado: boolean
          id: string
          marca: string | null
          modelo: string | null
          updated_at: string
        }
        Insert: {
          correia: string
          created_at?: string
          habilitado?: boolean
          id?: string
          marca?: string | null
          modelo?: string | null
          updated_at?: string
        }
        Update: {
          correia?: string
          created_at?: string
          habilitado?: boolean
          id?: string
          marca?: string | null
          modelo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          artigos_venda: Json
          bairro: string | null
          celular: string | null
          cep: string | null
          cidade: string | null
          cidade_codigo: string | null
          cnpj: string | null
          comissao: number | null
          complemento: string | null
          consumidor_final: boolean | null
          contato: string | null
          contribuinte_icms: number | null
          cpf: string | null
          created_at: string
          crt: string | null
          email: string | null
          endereco: string | null
          entrega_bairro: string | null
          entrega_cep: string | null
          entrega_cidade: string | null
          entrega_cidade_codigo: string | null
          entrega_complemento: string | null
          entrega_endereco: string | null
          entrega_numero: string | null
          entrega_uf: string | null
          flag_acabamento: boolean
          flag_cliente: boolean
          flag_confeccao: boolean
          flag_fiador: boolean
          flag_fornecedor: boolean
          flag_habilitado: boolean
          flag_importador: boolean
          flag_malha: boolean
          flag_representante: boolean
          flag_transportadora: boolean
          icms: number | null
          id: string
          indicador_ie: number | null
          indicador_presenca: number | null
          inscricao_estadual: string | null
          intervalo: number | null
          limite_credito: number | null
          matriz: string | null
          meta_valor: number | null
          nome_fantasia: string | null
          numero: string | null
          observacao: string | null
          observacao_financeiro: string | null
          owner_id: string | null
          pais: string | null
          parcelas: number | null
          peca_tara_kg: number | null
          prazo: number | null
          razao_social: string
          regime_especial: string | null
          rg: string | null
          sales_rep_id: string | null
          segmento: string | null
          segmento_cliente: string | null
          status: string
          suframa: string | null
          tabela_prazo: string | null
          telefone: string | null
          tipo_cliente: string | null
          tipo_pagamento: string | null
          transportadora_id: string | null
          transportadora_preferencial_id: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          artigos_venda?: Json
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cidade_codigo?: string | null
          cnpj?: string | null
          comissao?: number | null
          complemento?: string | null
          consumidor_final?: boolean | null
          contato?: string | null
          contribuinte_icms?: number | null
          cpf?: string | null
          created_at?: string
          crt?: string | null
          email?: string | null
          endereco?: string | null
          entrega_bairro?: string | null
          entrega_cep?: string | null
          entrega_cidade?: string | null
          entrega_cidade_codigo?: string | null
          entrega_complemento?: string | null
          entrega_endereco?: string | null
          entrega_numero?: string | null
          entrega_uf?: string | null
          flag_acabamento?: boolean
          flag_cliente?: boolean
          flag_confeccao?: boolean
          flag_fiador?: boolean
          flag_fornecedor?: boolean
          flag_habilitado?: boolean
          flag_importador?: boolean
          flag_malha?: boolean
          flag_representante?: boolean
          flag_transportadora?: boolean
          icms?: number | null
          id?: string
          indicador_ie?: number | null
          indicador_presenca?: number | null
          inscricao_estadual?: string | null
          intervalo?: number | null
          limite_credito?: number | null
          matriz?: string | null
          meta_valor?: number | null
          nome_fantasia?: string | null
          numero?: string | null
          observacao?: string | null
          observacao_financeiro?: string | null
          owner_id?: string | null
          pais?: string | null
          parcelas?: number | null
          peca_tara_kg?: number | null
          prazo?: number | null
          razao_social: string
          regime_especial?: string | null
          rg?: string | null
          sales_rep_id?: string | null
          segmento?: string | null
          segmento_cliente?: string | null
          status?: string
          suframa?: string | null
          tabela_prazo?: string | null
          telefone?: string | null
          tipo_cliente?: string | null
          tipo_pagamento?: string | null
          transportadora_id?: string | null
          transportadora_preferencial_id?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          artigos_venda?: Json
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cidade_codigo?: string | null
          cnpj?: string | null
          comissao?: number | null
          complemento?: string | null
          consumidor_final?: boolean | null
          contato?: string | null
          contribuinte_icms?: number | null
          cpf?: string | null
          created_at?: string
          crt?: string | null
          email?: string | null
          endereco?: string | null
          entrega_bairro?: string | null
          entrega_cep?: string | null
          entrega_cidade?: string | null
          entrega_cidade_codigo?: string | null
          entrega_complemento?: string | null
          entrega_endereco?: string | null
          entrega_numero?: string | null
          entrega_uf?: string | null
          flag_acabamento?: boolean
          flag_cliente?: boolean
          flag_confeccao?: boolean
          flag_fiador?: boolean
          flag_fornecedor?: boolean
          flag_habilitado?: boolean
          flag_importador?: boolean
          flag_malha?: boolean
          flag_representante?: boolean
          flag_transportadora?: boolean
          icms?: number | null
          id?: string
          indicador_ie?: number | null
          indicador_presenca?: number | null
          inscricao_estadual?: string | null
          intervalo?: number | null
          limite_credito?: number | null
          matriz?: string | null
          meta_valor?: number | null
          nome_fantasia?: string | null
          numero?: string | null
          observacao?: string | null
          observacao_financeiro?: string | null
          owner_id?: string | null
          pais?: string | null
          parcelas?: number | null
          peca_tara_kg?: number | null
          prazo?: number | null
          razao_social?: string
          regime_especial?: string | null
          rg?: string | null
          sales_rep_id?: string | null
          segmento?: string | null
          segmento_cliente?: string | null
          status?: string
          suframa?: string | null
          tabela_prazo?: string | null
          telefone?: string | null
          tipo_cliente?: string | null
          tipo_pagamento?: string | null
          transportadora_id?: string | null
          transportadora_preferencial_id?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_transportadora_preferencial_id_fkey"
            columns: ["transportadora_preferencial_id"]
            isOneToOne: false
            referencedRelation: "tinturarias"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa: {
        Row: {
          ambiente_nfe: string
          bairro: string | null
          cep: string | null
          certificado_a1_nome: string | null
          certificado_a1_path: string | null
          certificado_a1_validade: string | null
          cidade: string | null
          cnae: string | null
          cnpj: string
          codigo_municipio: string | null
          complemento: string | null
          created_at: string
          crt: number | null
          csc_id: string | null
          csc_token: string | null
          email: string | null
          exige_op_para_nfe: boolean
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          logo_url: string | null
          logradouro: string | null
          nome_fantasia: string | null
          numero: string | null
          pais: string | null
          provedor_nfe: string | null
          proximo_numero_nfe: number | null
          razao_social: string
          regime_tributario: string
          serie_nfe: number | null
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          ambiente_nfe?: string
          bairro?: string | null
          cep?: string | null
          certificado_a1_nome?: string | null
          certificado_a1_path?: string | null
          certificado_a1_validade?: string | null
          cidade?: string | null
          cnae?: string | null
          cnpj: string
          codigo_municipio?: string | null
          complemento?: string | null
          created_at?: string
          crt?: number | null
          csc_id?: string | null
          csc_token?: string | null
          email?: string | null
          exige_op_para_nfe?: boolean
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logo_url?: string | null
          logradouro?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          pais?: string | null
          provedor_nfe?: string | null
          proximo_numero_nfe?: number | null
          razao_social: string
          regime_tributario?: string
          serie_nfe?: number | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ambiente_nfe?: string
          bairro?: string | null
          cep?: string | null
          certificado_a1_nome?: string | null
          certificado_a1_path?: string | null
          certificado_a1_validade?: string | null
          cidade?: string | null
          cnae?: string | null
          cnpj?: string
          codigo_municipio?: string | null
          complemento?: string | null
          created_at?: string
          crt?: number | null
          csc_id?: string | null
          csc_token?: string | null
          email?: string | null
          exige_op_para_nfe?: boolean
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logo_url?: string | null
          logradouro?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          pais?: string | null
          provedor_nfe?: string | null
          proximo_numero_nfe?: number | null
          razao_social?: string
          regime_tributario?: string
          serie_nfe?: number | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      empresa_filiais: {
        Row: {
          ativo: boolean | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string
          created_at: string
          email: string | null
          id: string
          inscricao_estadual: string | null
          logradouro: string | null
          matriz_id: string | null
          numero: string | null
          razao_social: string
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj: string
          created_at?: string
          email?: string | null
          id?: string
          inscricao_estadual?: string | null
          logradouro?: string | null
          matriz_id?: string | null
          numero?: string | null
          razao_social: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          created_at?: string
          email?: string | null
          id?: string
          inscricao_estadual?: string | null
          logradouro?: string | null
          matriz_id?: string | null
          numero?: string | null
          razao_social?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_filiais_matriz_id_fkey"
            columns: ["matriz_id"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      estampas: {
        Row: {
          codigo: string
          created_at: string
          estampa: string
          habilitado: boolean
          id: string
          imagem_path: string | null
          updated_at: string
          variante: number
        }
        Insert: {
          codigo: string
          created_at?: string
          estampa: string
          habilitado?: boolean
          id?: string
          imagem_path?: string | null
          updated_at?: string
          variante?: number
        }
        Update: {
          codigo?: string
          created_at?: string
          estampa?: string
          habilitado?: boolean
          id?: string
          imagem_path?: string | null
          updated_at?: string
          variante?: number
        }
        Relationships: []
      }
      fios: {
        Row: {
          cest: string | null
          codigo: string
          composicao: string | null
          composicao_id: string | null
          cor: string | null
          created_at: string
          custo: number | null
          habilitado: boolean
          id: string
          n_cabos: number | null
          n_filamentos: number | null
          ncm: string | null
          origem: string | null
          owner_id: string | null
          quebra_percent: number | null
          tipo: string | null
          titulo: number | null
          updated_at: string
        }
        Insert: {
          cest?: string | null
          codigo: string
          composicao?: string | null
          composicao_id?: string | null
          cor?: string | null
          created_at?: string
          custo?: number | null
          habilitado?: boolean
          id?: string
          n_cabos?: number | null
          n_filamentos?: number | null
          ncm?: string | null
          origem?: string | null
          owner_id?: string | null
          quebra_percent?: number | null
          tipo?: string | null
          titulo?: number | null
          updated_at?: string
        }
        Update: {
          cest?: string | null
          codigo?: string
          composicao?: string | null
          composicao_id?: string | null
          cor?: string | null
          created_at?: string
          custo?: number | null
          habilitado?: boolean
          id?: string
          n_cabos?: number | null
          n_filamentos?: number | null
          ncm?: string | null
          origem?: string | null
          owner_id?: string | null
          quebra_percent?: number | null
          tipo?: string | null
          titulo?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fios_composicao_id_fkey"
            columns: ["composicao_id"]
            isOneToOne: false
            referencedRelation: "composicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          bairro: string | null
          cargo_id: string | null
          celular: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf: string | null
          created_at: string
          email: string | null
          endereco: string | null
          habilitado: boolean
          id: string
          nome: string
          numero: string | null
          observacao: string | null
          rg: string | null
          telefone: string | null
          tipo: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cargo_id?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          habilitado?: boolean
          id?: string
          nome: string
          numero?: string | null
          observacao?: string | null
          rg?: string | null
          telefone?: string | null
          tipo?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cargo_id?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          habilitado?: boolean
          id?: string
          nome?: string
          numero?: string | null
          observacao?: string | null
          rg?: string | null
          telefone?: string | null
          tipo?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      impostos: {
        Row: {
          aliquota: number
          ativo: boolean
          created_at: string
          id: string
          nome: string
          observacao: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          aliquota?: number
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          observacao?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          aliquota?: number
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          observacao?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      lotes: {
        Row: {
          created_at: string
          data_entrada: string
          fornecedor_id: string | null
          habilitado: boolean
          id: string
          item_id: string
          numero_lote: string
          observacao: string | null
          op_id: string | null
          quantidade: number
          quantidade_disponivel: number
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_entrada?: string
          fornecedor_id?: string | null
          habilitado?: boolean
          id?: string
          item_id: string
          numero_lote: string
          observacao?: string | null
          op_id?: string | null
          quantidade?: number
          quantidade_disponivel?: number
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_entrada?: string
          fornecedor_id?: string | null
          habilitado?: boolean
          id?: string
          item_id?: string
          numero_lote?: string
          observacao?: string | null
          op_id?: string | null
          quantidade?: number
          quantidade_disponivel?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lotes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "tinturarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      maquinas: {
        Row: {
          carga_agulhas: Json
          correias: string[]
          created_at: string
          data_fabricacao: string | null
          diametro: number | null
          disposicao_agulhas: string | null
          finura: number | null
          fio_id: string | null
          habilitado: boolean
          id: string
          maquina: string
          modelo: string | null
          n_alimentadores: number | null
          numero: number
          producao_media: number | null
          tipo: string
          updated_at: string
        }
        Insert: {
          carga_agulhas?: Json
          correias?: string[]
          created_at?: string
          data_fabricacao?: string | null
          diametro?: number | null
          disposicao_agulhas?: string | null
          finura?: number | null
          fio_id?: string | null
          habilitado?: boolean
          id?: string
          maquina: string
          modelo?: string | null
          n_alimentadores?: number | null
          numero: number
          producao_media?: number | null
          tipo: string
          updated_at?: string
        }
        Update: {
          carga_agulhas?: Json
          correias?: string[]
          created_at?: string
          data_fabricacao?: string | null
          diametro?: number | null
          disposicao_agulhas?: string | null
          finura?: number | null
          fio_id?: string | null
          habilitado?: boolean
          id?: string
          maquina?: string
          modelo?: string | null
          n_alimentadores?: number | null
          numero?: number
          producao_media?: number | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      nfe_eventos: {
        Row: {
          created_at: string
          id: string
          mensagem: string | null
          motivo: string | null
          nota_fiscal_id: string | null
          payload: Json | null
          protocolo: string | null
          status: string | null
          tipo: string
          user_id: string | null
          xml_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem?: string | null
          motivo?: string | null
          nota_fiscal_id?: string | null
          payload?: Json | null
          protocolo?: string | null
          status?: string | null
          tipo: string
          user_id?: string | null
          xml_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mensagem?: string | null
          motivo?: string | null
          nota_fiscal_id?: string | null
          payload?: Json | null
          protocolo?: string | null
          status?: string | null
          tipo?: string
          user_id?: string | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfe_eventos_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_logs: {
        Row: {
          acao: string
          created_at: string
          duracao_ms: number | null
          http_status: number | null
          id: string
          nota_fiscal_id: string | null
          request: Json | null
          response: Json | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          duracao_ms?: number | null
          http_status?: number | null
          id?: string
          nota_fiscal_id?: string | null
          request?: Json | null
          response?: Json | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          duracao_ms?: number | null
          http_status?: number | null
          id?: string
          nota_fiscal_id?: string | null
          request?: Json | null
          response?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfe_logs_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_sequencias: {
        Row: {
          ambiente: string
          created_at: string
          empresa_id: string | null
          id: string
          modelo: string
          serie: number
          ultimo_numero: number
          updated_at: string
        }
        Insert: {
          ambiente?: string
          created_at?: string
          empresa_id?: string | null
          id?: string
          modelo?: string
          serie?: number
          ultimo_numero?: number
          updated_at?: string
        }
        Update: {
          ambiente?: string
          created_at?: string
          empresa_id?: string | null
          id?: string
          modelo?: string
          serie?: number
          ultimo_numero?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nfe_sequencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          base_icms: number
          cfop_id: string | null
          chave_acesso: string | null
          chave_ref: string | null
          cliente_id: string | null
          created_at: string
          danfe_url: string | null
          data_autorizacao: string | null
          data_emissao: string
          destinatario_id: string | null
          drawback: string | null
          emissor: string | null
          finalidade: string
          fornecedor_id: string | null
          frete_tipo: string | null
          id: string
          mensagem_sefaz: string | null
          modelo: string | null
          numero: string
          observacao: string | null
          op_id: string | null
          pdf_url: string | null
          peso_bruto: number | null
          peso_liquido: number | null
          placa_veiculo: string | null
          protocolo_autorizacao: string | null
          provedor_ref: string | null
          quantidade_emb: number | null
          serie: string
          status: string
          status_sefaz: string | null
          tipo: string
          tipo_embalagem: string | null
          transportadora_id: string | null
          updated_at: string
          valor_cofins: number
          valor_desconto: number
          valor_frete: number
          valor_icms: number
          valor_ipi: number
          valor_outros: number
          valor_pis: number
          valor_total: number
          xml_url: string | null
        }
        Insert: {
          base_icms?: number
          cfop_id?: string | null
          chave_acesso?: string | null
          chave_ref?: string | null
          cliente_id?: string | null
          created_at?: string
          danfe_url?: string | null
          data_autorizacao?: string | null
          data_emissao?: string
          destinatario_id?: string | null
          drawback?: string | null
          emissor?: string | null
          finalidade?: string
          fornecedor_id?: string | null
          frete_tipo?: string | null
          id?: string
          mensagem_sefaz?: string | null
          modelo?: string | null
          numero: string
          observacao?: string | null
          op_id?: string | null
          pdf_url?: string | null
          peso_bruto?: number | null
          peso_liquido?: number | null
          placa_veiculo?: string | null
          protocolo_autorizacao?: string | null
          provedor_ref?: string | null
          quantidade_emb?: number | null
          serie?: string
          status?: string
          status_sefaz?: string | null
          tipo?: string
          tipo_embalagem?: string | null
          transportadora_id?: string | null
          updated_at?: string
          valor_cofins?: number
          valor_desconto?: number
          valor_frete?: number
          valor_icms?: number
          valor_ipi?: number
          valor_outros?: number
          valor_pis?: number
          valor_total?: number
          xml_url?: string | null
        }
        Update: {
          base_icms?: number
          cfop_id?: string | null
          chave_acesso?: string | null
          chave_ref?: string | null
          cliente_id?: string | null
          created_at?: string
          danfe_url?: string | null
          data_autorizacao?: string | null
          data_emissao?: string
          destinatario_id?: string | null
          drawback?: string | null
          emissor?: string | null
          finalidade?: string
          fornecedor_id?: string | null
          frete_tipo?: string | null
          id?: string
          mensagem_sefaz?: string | null
          modelo?: string | null
          numero?: string
          observacao?: string | null
          op_id?: string | null
          pdf_url?: string | null
          peso_bruto?: number | null
          peso_liquido?: number | null
          placa_veiculo?: string | null
          protocolo_autorizacao?: string | null
          provedor_ref?: string | null
          quantidade_emb?: number | null
          serie?: string
          status?: string
          status_sefaz?: string | null
          tipo?: string
          tipo_embalagem?: string | null
          transportadora_id?: string | null
          updated_at?: string
          valor_cofins?: number
          valor_desconto?: number
          valor_frete?: number
          valor_icms?: number
          valor_ipi?: number
          valor_outros?: number
          valor_pis?: number
          valor_total?: number
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_cfop_id_fkey"
            columns: ["cfop_id"]
            isOneToOne: false
            referencedRelation: "cfop"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "tinturarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "tinturarias"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais_faturas: {
        Row: {
          created_at: string
          dias: number | null
          id: string
          intervalo: number | null
          nota_fiscal_id: string
          numero: string
          parcelas: number | null
          valor: number
          valor_complementar: number
          vencimento: string
        }
        Insert: {
          created_at?: string
          dias?: number | null
          id?: string
          intervalo?: number | null
          nota_fiscal_id: string
          numero: string
          parcelas?: number | null
          valor?: number
          valor_complementar?: number
          vencimento: string
        }
        Update: {
          created_at?: string
          dias?: number | null
          id?: string
          intervalo?: number | null
          nota_fiscal_id?: string
          numero?: string
          parcelas?: number | null
          valor?: number
          valor_complementar?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_faturas_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais_itens: {
        Row: {
          aliquota_icms: number | null
          base_icms: number | null
          cfop: string | null
          cor_id: string | null
          created_at: string
          descricao: string
          estampa_id: string | null
          id: string
          ncm: string | null
          nota_fiscal_id: string
          observacao_lote: string | null
          quantidade: number
          quantidade_embalagem: number | null
          quantidade_entrada: number | null
          quantidade_saida: number | null
          unidade: string | null
          valor_complementar: number | null
          valor_icms: number | null
          valor_total: number
          valor_unitario: number
          variante_id: string | null
        }
        Insert: {
          aliquota_icms?: number | null
          base_icms?: number | null
          cfop?: string | null
          cor_id?: string | null
          created_at?: string
          descricao: string
          estampa_id?: string | null
          id?: string
          ncm?: string | null
          nota_fiscal_id: string
          observacao_lote?: string | null
          quantidade?: number
          quantidade_embalagem?: number | null
          quantidade_entrada?: number | null
          quantidade_saida?: number | null
          unidade?: string | null
          valor_complementar?: number | null
          valor_icms?: number | null
          valor_total?: number
          valor_unitario?: number
          variante_id?: string | null
        }
        Update: {
          aliquota_icms?: number | null
          base_icms?: number | null
          cfop?: string | null
          cor_id?: string | null
          created_at?: string
          descricao?: string
          estampa_id?: string | null
          id?: string
          ncm?: string | null
          nota_fiscal_id?: string
          observacao_lote?: string | null
          quantidade?: number
          quantidade_embalagem?: number | null
          quantidade_entrada?: number | null
          quantidade_saida?: number | null
          unidade?: string | null
          valor_complementar?: number | null
          valor_icms?: number | null
          valor_total?: number
          valor_unitario?: number
          variante_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_itens_cor_id_fkey"
            columns: ["cor_id"]
            isOneToOne: false
            referencedRelation: "cores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_itens_estampa_id_fkey"
            columns: ["estampa_id"]
            isOneToOne: false
            referencedRelation: "estampas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_itens_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_itens_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "variantes"
            referencedColumns: ["id"]
          },
        ]
      }
      op_apontamentos: {
        Row: {
          created_at: string
          fim: string | null
          funcionario_id: string | null
          id: string
          inicio: string
          maquina_id: string | null
          observacao: string | null
          op_id: string
          quantidade_produzida: number
          quantidade_refugo: number
        }
        Insert: {
          created_at?: string
          fim?: string | null
          funcionario_id?: string | null
          id?: string
          inicio: string
          maquina_id?: string | null
          observacao?: string | null
          op_id: string
          quantidade_produzida?: number
          quantidade_refugo?: number
        }
        Update: {
          created_at?: string
          fim?: string | null
          funcionario_id?: string | null
          id?: string
          inicio?: string
          maquina_id?: string | null
          observacao?: string | null
          op_id?: string
          quantidade_produzida?: number
          quantidade_refugo?: number
        }
        Relationships: [
          {
            foreignKeyName: "op_apontamentos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_apontamentos_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_apontamentos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      op_consumos: {
        Row: {
          created_at: string
          id: string
          lote_id: string | null
          momento: string
          observacao: string | null
          op_id: string
          quantidade: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lote_id?: string | null
          momento?: string
          observacao?: string | null
          op_id: string
          quantidade: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lote_id?: string | null
          momento?: string
          observacao?: string | null
          op_id?: string
          quantidade?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "op_consumos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_consumos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      op_entradas_estoque: {
        Row: {
          created_at: string
          data_entrada: string
          id: string
          lote_id: string | null
          op_id: string
          product_id: string | null
          quantidade: number
          user_id: string | null
          variante_id: string | null
        }
        Insert: {
          created_at?: string
          data_entrada?: string
          id?: string
          lote_id?: string | null
          op_id: string
          product_id?: string | null
          quantidade: number
          user_id?: string | null
          variante_id?: string | null
        }
        Update: {
          created_at?: string
          data_entrada?: string
          id?: string
          lote_id?: string | null
          op_id?: string
          product_id?: string | null
          quantidade?: number
          user_id?: string | null
          variante_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "op_entradas_estoque_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_entradas_estoque_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_entradas_estoque_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_entradas_estoque_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "variantes"
            referencedColumns: ["id"]
          },
        ]
      }
      op_eventos: {
        Row: {
          created_at: string
          de_status: Database["public"]["Enums"]["op_status"] | null
          id: string
          op_id: string
          para_status: Database["public"]["Enums"]["op_status"] | null
          payload: Json | null
          tipo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          de_status?: Database["public"]["Enums"]["op_status"] | null
          id?: string
          op_id: string
          para_status?: Database["public"]["Enums"]["op_status"] | null
          payload?: Json | null
          tipo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          de_status?: Database["public"]["Enums"]["op_status"] | null
          id?: string
          op_id?: string
          para_status?: Database["public"]["Enums"]["op_status"] | null
          payload?: Json | null
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "op_eventos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      op_expedicoes: {
        Row: {
          created_at: string
          data_entrega: string | null
          data_saida: string | null
          id: string
          nota_fiscal_id: string | null
          observacao: string | null
          op_id: string
          rastreio: string | null
          status: string
          transportadora_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_entrega?: string | null
          data_saida?: string | null
          id?: string
          nota_fiscal_id?: string | null
          observacao?: string | null
          op_id: string
          rastreio?: string | null
          status?: string
          transportadora_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_entrega?: string | null
          data_saida?: string | null
          id?: string
          nota_fiscal_id?: string | null
          observacao?: string | null
          op_id?: string
          rastreio?: string | null
          status?: string
          transportadora_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "op_expedicoes_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_expedicoes_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_expedicoes_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "tinturarias"
            referencedColumns: ["id"]
          },
        ]
      }
      op_faturamento: {
        Row: {
          created_at: string
          id: string
          nota_fiscal_id: string | null
          op_id: string
          quantidade_faturada: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nota_fiscal_id?: string | null
          op_id: string
          quantidade_faturada?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nota_fiscal_id?: string | null
          op_id?: string
          quantidade_faturada?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "op_faturamento_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_faturamento_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      op_itens: {
        Row: {
          cor_id: string | null
          created_at: string
          descricao: string | null
          estampa_id: string | null
          id: string
          op_id: string
          pedido_item_id: string | null
          product_id: string | null
          quantidade_aprovada: number
          quantidade_planejada: number
          quantidade_produzida: number
          quantidade_reprovada: number
          unidade: string
          variante_id: string | null
        }
        Insert: {
          cor_id?: string | null
          created_at?: string
          descricao?: string | null
          estampa_id?: string | null
          id?: string
          op_id: string
          pedido_item_id?: string | null
          product_id?: string | null
          quantidade_aprovada?: number
          quantidade_planejada?: number
          quantidade_produzida?: number
          quantidade_reprovada?: number
          unidade?: string
          variante_id?: string | null
        }
        Update: {
          cor_id?: string | null
          created_at?: string
          descricao?: string | null
          estampa_id?: string | null
          id?: string
          op_id?: string
          pedido_item_id?: string | null
          product_id?: string | null
          quantidade_aprovada?: number
          quantidade_planejada?: number
          quantidade_produzida?: number
          quantidade_reprovada?: number
          unidade?: string
          variante_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "op_itens_cor_id_fkey"
            columns: ["cor_id"]
            isOneToOne: false
            referencedRelation: "cores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_itens_estampa_id_fkey"
            columns: ["estampa_id"]
            isOneToOne: false
            referencedRelation: "estampas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_itens_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_itens_pedido_item_id_fkey"
            columns: ["pedido_item_id"]
            isOneToOne: false
            referencedRelation: "pedido_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_itens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_itens_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "variantes"
            referencedColumns: ["id"]
          },
        ]
      }
      op_qualidade: {
        Row: {
          created_at: string
          data: string
          id: string
          inspetor_id: string | null
          motivo: string | null
          op_id: string
          quantidade_aprovada: number
          quantidade_reprovada: number
          resultado: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          inspetor_id?: string | null
          motivo?: string | null
          op_id: string
          quantidade_aprovada?: number
          quantidade_reprovada?: number
          resultado: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          inspetor_id?: string | null
          motivo?: string | null
          op_id?: string
          quantidade_aprovada?: number
          quantidade_reprovada?: number
          resultado?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "op_qualidade_inspetor_id_fkey"
            columns: ["inspetor_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_qualidade_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_producao: {
        Row: {
          created_at: string
          created_by: string | null
          data_abertura: string
          data_conclusao: string | null
          data_prevista: string | null
          funcionario_id: string | null
          id: string
          maquina_id: string | null
          numero: number
          observacao: string | null
          pedido_id: string | null
          prioridade: number
          responsavel_id: string | null
          status: Database["public"]["Enums"]["op_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_abertura?: string
          data_conclusao?: string | null
          data_prevista?: string | null
          funcionario_id?: string | null
          id?: string
          maquina_id?: string | null
          numero: number
          observacao?: string | null
          pedido_id?: string | null
          prioridade?: number
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["op_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_abertura?: string
          data_conclusao?: string | null
          data_prevista?: string | null
          funcionario_id?: string | null
          id?: string
          maquina_id?: string | null
          numero?: number
          observacao?: string | null
          pedido_id?: string | null
          prioridade?: number
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["op_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_itens: {
        Row: {
          cor_id: string | null
          created_at: string
          descricao: string | null
          estampa_id: string | null
          id: string
          pedido_id: string
          product_id: string | null
          quantidade: number
          unidade: string
          valor_total: number | null
          valor_unitario: number
          variante_id: string | null
        }
        Insert: {
          cor_id?: string | null
          created_at?: string
          descricao?: string | null
          estampa_id?: string | null
          id?: string
          pedido_id: string
          product_id?: string | null
          quantidade?: number
          unidade?: string
          valor_total?: number | null
          valor_unitario?: number
          variante_id?: string | null
        }
        Update: {
          cor_id?: string | null
          created_at?: string
          descricao?: string | null
          estampa_id?: string | null
          id?: string
          pedido_id?: string
          product_id?: string | null
          quantidade?: number
          unidade?: string
          valor_total?: number | null
          valor_unitario?: number
          variante_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_cor_id_fkey"
            columns: ["cor_id"]
            isOneToOne: false
            referencedRelation: "cores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_estampa_id_fkey"
            columns: ["estampa_id"]
            isOneToOne: false
            referencedRelation: "estampas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "variantes"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string | null
          condicao_pagamento: string | null
          created_at: string
          created_by: string | null
          data_pedido: string
          id: string
          numero: string
          observacao: string | null
          prazo_entrega: string | null
          status: string
          updated_at: string
          valor_total: number
          vendedor_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          condicao_pagamento?: string | null
          created_at?: string
          created_by?: string | null
          data_pedido?: string
          id?: string
          numero: string
          observacao?: string | null
          prazo_entrega?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          condicao_pagamento?: string | null
          created_at?: string
          created_by?: string | null
          data_pedido?: string
          id?: string
          numero?: string
          observacao?: string | null
          prazo_entrega?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          cor: string | null
          created_at: string
          estoque: number
          estoque_minimo: number
          id: string
          localizacao: string | null
          product_id: string
          sku: string
          tamanho: string | null
          updated_at: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          estoque?: number
          estoque_minimo?: number
          id?: string
          localizacao?: string | null
          product_id: string
          sku: string
          tamanho?: string | null
          updated_at?: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          estoque?: number
          estoque_minimo?: number
          id?: string
          localizacao?: string | null
          product_id?: string
          sku?: string
          tamanho?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          aliq_cofins: number | null
          aliq_icms: number | null
          aliq_ipi: number | null
          aliq_pis: number | null
          area_peca: number | null
          ativo: boolean
          categoria: string | null
          cest: string | null
          cfop_padrao: string | null
          codigo: string
          codigo_anp: string | null
          codigo_beneficio: string | null
          composicao: string | null
          created_at: string
          csosn: string | null
          cst_cofins: string | null
          cst_icms: string | null
          cst_ipi: string | null
          cst_pis: string | null
          ean: string | null
          ean_tributavel: string | null
          estoque_minimo: number | null
          ficha_tecnica: Json
          gramatura: number | null
          id: string
          img1_path: string | null
          img2_path: string | null
          largura: number | null
          ncm: string | null
          nome: string
          observacao: string | null
          origem: string | null
          peso_bruto: number | null
          peso_liquido: number | null
          peso_padrao_peca: number | null
          preco_custo: number | null
          preco_venda: number | null
          qtd_pecas_kg: number | null
          rendimento: number | null
          tipo: string | null
          unidade: string | null
          unidade_tributavel: string | null
          updated_at: string
        }
        Insert: {
          aliq_cofins?: number | null
          aliq_icms?: number | null
          aliq_ipi?: number | null
          aliq_pis?: number | null
          area_peca?: number | null
          ativo?: boolean
          categoria?: string | null
          cest?: string | null
          cfop_padrao?: string | null
          codigo: string
          codigo_anp?: string | null
          codigo_beneficio?: string | null
          composicao?: string | null
          created_at?: string
          csosn?: string | null
          cst_cofins?: string | null
          cst_icms?: string | null
          cst_ipi?: string | null
          cst_pis?: string | null
          ean?: string | null
          ean_tributavel?: string | null
          estoque_minimo?: number | null
          ficha_tecnica?: Json
          gramatura?: number | null
          id?: string
          img1_path?: string | null
          img2_path?: string | null
          largura?: number | null
          ncm?: string | null
          nome: string
          observacao?: string | null
          origem?: string | null
          peso_bruto?: number | null
          peso_liquido?: number | null
          peso_padrao_peca?: number | null
          preco_custo?: number | null
          preco_venda?: number | null
          qtd_pecas_kg?: number | null
          rendimento?: number | null
          tipo?: string | null
          unidade?: string | null
          unidade_tributavel?: string | null
          updated_at?: string
        }
        Update: {
          aliq_cofins?: number | null
          aliq_icms?: number | null
          aliq_ipi?: number | null
          aliq_pis?: number | null
          area_peca?: number | null
          ativo?: boolean
          categoria?: string | null
          cest?: string | null
          cfop_padrao?: string | null
          codigo?: string
          codigo_anp?: string | null
          codigo_beneficio?: string | null
          composicao?: string | null
          created_at?: string
          csosn?: string | null
          cst_cofins?: string | null
          cst_icms?: string | null
          cst_ipi?: string | null
          cst_pis?: string | null
          ean?: string | null
          ean_tributavel?: string | null
          estoque_minimo?: number | null
          ficha_tecnica?: Json
          gramatura?: number | null
          id?: string
          img1_path?: string | null
          img2_path?: string | null
          largura?: number | null
          ncm?: string | null
          nome?: string
          observacao?: string | null
          origem?: string | null
          peso_bruto?: number | null
          peso_liquido?: number | null
          peso_padrao_peca?: number | null
          preco_custo?: number | null
          preco_venda?: number | null
          qtd_pecas_kg?: number | null
          rendimento?: number | null
          tipo?: string | null
          unidade?: string | null
          unidade_tributavel?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          cargo: string | null
          created_at: string
          email: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email: string
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_reps: {
        Row: {
          ativo: boolean
          comissao_pct: number | null
          created_at: string
          email: string | null
          id: string
          meta_mensal: number | null
          nome: string
          regiao: string | null
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          comissao_pct?: number | null
          created_at?: string
          email?: string | null
          id?: string
          meta_mensal?: number | null
          nome: string
          regiao?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          comissao_pct?: number | null
          created_at?: string
          email?: string | null
          id?: string
          meta_mensal?: number | null
          nome?: string
          regiao?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tinturarias: {
        Row: {
          categoria: string
          cnpj: string | null
          codigo: string
          contato: string | null
          created_at: string
          estoque_minimo: number | null
          habilitado: boolean
          id: string
          ncm: string | null
          nome_fantasia: string
          observacao: string | null
          preco_custo: number | null
          preco_venda: number | null
          razao_social: string | null
          telefone: string | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          categoria?: string
          cnpj?: string | null
          codigo: string
          contato?: string | null
          created_at?: string
          estoque_minimo?: number | null
          habilitado?: boolean
          id?: string
          ncm?: string | null
          nome_fantasia: string
          observacao?: string | null
          preco_custo?: number | null
          preco_venda?: number | null
          razao_social?: string | null
          telefone?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          categoria?: string
          cnpj?: string | null
          codigo?: string
          contato?: string | null
          created_at?: string
          estoque_minimo?: number | null
          habilitado?: boolean
          id?: string
          ncm?: string | null
          nome_fantasia?: string
          observacao?: string | null
          preco_custo?: number | null
          preco_venda?: number | null
          razao_social?: string | null
          telefone?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      uf_icms: {
        Row: {
          aliquota: number
          ativo: boolean
          created_at: string
          id: string
          tipo: string
          uf_destino: string
          uf_origem: string
          updated_at: string
        }
        Insert: {
          aliquota?: number
          ativo?: boolean
          created_at?: string
          id?: string
          tipo?: string
          uf_destino: string
          uf_origem: string
          updated_at?: string
        }
        Update: {
          aliquota?: number
          ativo?: boolean
          created_at?: string
          id?: string
          tipo?: string
          uf_destino?: string
          uf_origem?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_cargos: {
        Row: {
          cargo_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          cargo_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          cargo_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cargos_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variantes: {
        Row: {
          created_at: string
          habilitado: boolean
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          habilitado?: boolean
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          habilitado?: boolean
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      baixar_estoque_nf: { Args: { _nota_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_gerente: { Args: { _user_id: string }; Returns: boolean }
      op_transicao_valida: {
        Args: {
          _de: Database["public"]["Enums"]["op_status"]
          _para: Database["public"]["Enums"]["op_status"]
        }
        Returns: boolean
      }
      op_transicionar: {
        Args: {
          _novo_status: Database["public"]["Enums"]["op_status"]
          _op_id: string
          _payload?: Json
        }
        Returns: Database["public"]["Enums"]["op_status"]
      }
      proximo_numero_nfe: {
        Args: {
          _ambiente?: string
          _empresa_id: string
          _modelo?: string
          _serie?: number
        }
        Returns: number
      }
      proximo_numero_op: { Args: never; Returns: number }
      user_has_menu_permission: {
        Args: { _url: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "gerente"
        | "vendedor"
        | "producao"
        | "financeiro"
        | "logistica"
        | "qualidade"
        | "desenvolvedor"
      op_status:
        | "planejada"
        | "programada"
        | "em_producao"
        | "parcial"
        | "aguardando_qualidade"
        | "reprovada"
        | "aprovada"
        | "pronta_estoque"
        | "pronta_faturamento"
        | "faturada"
        | "expedida"
        | "encerrada"
        | "cancelada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "gerente",
        "vendedor",
        "producao",
        "financeiro",
        "logistica",
        "qualidade",
        "desenvolvedor",
      ],
      op_status: [
        "planejada",
        "programada",
        "em_producao",
        "parcial",
        "aguardando_qualidade",
        "reprovada",
        "aprovada",
        "pronta_estoque",
        "pronta_faturamento",
        "faturada",
        "expedida",
        "encerrada",
        "cancelada",
      ],
    },
  },
} as const
