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
      article_bom: {
        Row: {
          article_id: string
          created_at: string
          descricao: string
          fator_perda_pct: number
          id: string
          observacao: string | null
          qtd_por_kg: number
          ref_id: string | null
          ref_tipo: string | null
          tipo: string
          unidade: string
          updated_at: string
        }
        Insert: {
          article_id: string
          created_at?: string
          descricao: string
          fator_perda_pct?: number
          id?: string
          observacao?: string | null
          qtd_por_kg?: number
          ref_id?: string | null
          ref_tipo?: string | null
          tipo: string
          unidade?: string
          updated_at?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          descricao?: string
          fator_perda_pct?: number
          id?: string
          observacao?: string | null
          qtd_por_kg?: number
          ref_id?: string | null
          ref_tipo?: string | null
          tipo?: string
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_bom_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_bom_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_codigo_id"]
          },
          {
            foreignKeyName: "article_bom_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_nome_id"]
          },
        ]
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
            foreignKeyName: "article_cores_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_codigo_id"]
          },
          {
            foreignKeyName: "article_cores_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_nome_id"]
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
            foreignKeyName: "article_fios_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_codigo_id"]
          },
          {
            foreignKeyName: "article_fios_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_nome_id"]
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
          {
            foreignKeyName: "article_lavagens_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_codigo_id"]
          },
          {
            foreignKeyName: "article_lavagens_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_nome_id"]
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
      audit_logs: {
        Row: {
          acao: string
          created_at: string
          de_status: string | null
          entidade: string
          entidade_id: string | null
          id: string
          para_status: string | null
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          de_status?: string | null
          entidade: string
          entidade_id?: string | null
          id?: string
          para_status?: string | null
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          de_status?: string | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          para_status?: string | null
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      beneficios_fiscais: {
        Row: {
          ativo: boolean
          base_legal: string | null
          created_at: string
          id: string
          ncm_prefix: string | null
          percentual: number
          tipo: string
          uf: string | null
          updated_at: string
          vigencia_fim: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          ativo?: boolean
          base_legal?: string | null
          created_at?: string
          id?: string
          ncm_prefix?: string | null
          percentual?: number
          tipo: string
          uf?: string | null
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          ativo?: boolean
          base_legal?: string | null
          created_at?: string
          id?: string
          ncm_prefix?: string | null
          percentual?: number
          tipo?: string
          uf?: string | null
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: []
      }
      calendario_produtivo: {
        Row: {
          created_at: string
          data: string
          id: string
          observacao: string | null
          tipo: string
          turno_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          observacao?: string | null
          tipo: string
          turno_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          observacao?: string | null
          tipo?: string
          turno_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendario_produtivo_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
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
      centros_custo: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificados_digitais: {
        Row: {
          ativo: boolean
          cnpj: string
          created_at: string
          created_by: string | null
          empresa_id: string | null
          id: string
          nome: string
          pfx_storage_path: string
          senha_cifrada: string
          senha_iv: string
          updated_at: string
          valido_ate: string
          valido_de: string
        }
        Insert: {
          ativo?: boolean
          cnpj: string
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          pfx_storage_path: string
          senha_cifrada: string
          senha_iv: string
          updated_at?: string
          valido_ate: string
          valido_de: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          pfx_storage_path?: string
          senha_cifrada?: string
          senha_iv?: string
          updated_at?: string
          valido_ate?: string
          valido_de?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificados_digitais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id"]
          },
        ]
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
      cliente_artigo: {
        Row: {
          artigo_id: string
          ativo: boolean
          cliente_id: string
          codigo_cliente: string | null
          condicao_pagamento: string | null
          created_at: string
          created_by: string | null
          desconto_maximo_pct: number | null
          descricao_comercial: string | null
          id: string
          observacoes: string | null
          prazo_entrega_dias: number | null
          preco_negociado: number
          produto_id: string | null
          quantidade_minima: number | null
          representante_id: string | null
          unidade: string | null
          updated_at: string
          variante_id: string | null
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          artigo_id: string
          ativo?: boolean
          cliente_id: string
          codigo_cliente?: string | null
          condicao_pagamento?: string | null
          created_at?: string
          created_by?: string | null
          desconto_maximo_pct?: number | null
          descricao_comercial?: string | null
          id?: string
          observacoes?: string | null
          prazo_entrega_dias?: number | null
          preco_negociado: number
          produto_id?: string | null
          quantidade_minima?: number | null
          representante_id?: string | null
          unidade?: string | null
          updated_at?: string
          variante_id?: string | null
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Update: {
          artigo_id?: string
          ativo?: boolean
          cliente_id?: string
          codigo_cliente?: string | null
          condicao_pagamento?: string | null
          created_at?: string
          created_by?: string | null
          desconto_maximo_pct?: number | null
          descricao_comercial?: string | null
          id?: string
          observacoes?: string | null
          prazo_entrega_dias?: number | null
          preco_negociado?: number
          produto_id?: string | null
          quantidade_minima?: number | null
          representante_id?: string | null
          unidade?: string | null
          updated_at?: string
          variante_id?: string | null
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_artigo_artigo_id_fkey"
            columns: ["artigo_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_artigo_artigo_id_fkey"
            columns: ["artigo_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_codigo_id"]
          },
          {
            foreignKeyName: "cliente_artigo_artigo_id_fkey"
            columns: ["artigo_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_nome_id"]
          },
          {
            foreignKeyName: "cliente_artigo_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_artigo_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_artigo_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_artigo"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "cliente_artigo_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "cliente_artigo_representante_id_fkey"
            columns: ["representante_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_artigo_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "variantes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_artigo_historico: {
        Row: {
          alterado_em: string
          alterado_por: string | null
          campo: string
          cliente_artigo_id: string
          id: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          alterado_em?: string
          alterado_por?: string | null
          campo: string
          cliente_artigo_id: string
          id?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          alterado_em?: string
          alterado_por?: string | null
          campo?: string
          cliente_artigo_id?: string
          id?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_artigo_historico_cliente_artigo_id_fkey"
            columns: ["cliente_artigo_id"]
            isOneToOne: false
            referencedRelation: "cliente_artigo"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes: {
        Row: {
          base_calculo: number
          created_at: string
          id: string
          nota_fiscal_id: string | null
          percentual: number
          status: string
          updated_at: string
          valor: number
          vendedor_id: string | null
        }
        Insert: {
          base_calculo?: number
          created_at?: string
          id?: string
          nota_fiscal_id?: string | null
          percentual?: number
          status?: string
          updated_at?: string
          valor?: number
          vendedor_id?: string | null
        }
        Update: {
          base_calculo?: number
          created_at?: string
          id?: string
          nota_fiscal_id?: string | null
          percentual?: number
          status?: string
          updated_at?: string
          valor?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
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
      compras_eventos: {
        Row: {
          acao: string
          created_at: string
          de_status: string | null
          entidade: string
          entidade_id: string
          id: string
          para_status: string | null
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          de_status?: string | null
          entidade: string
          entidade_id: string
          id?: string
          para_status?: string | null
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          de_status?: string | null
          entidade?: string
          entidade_id?: string
          id?: string
          para_status?: string | null
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      contas_bancarias: {
        Row: {
          agencia: string | null
          ativa: boolean
          banco: string | null
          conta: string | null
          created_at: string
          id: string
          nome: string
          observacao: string | null
          saldo_inicial: number
          tipo: string
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          ativa?: boolean
          banco?: string | null
          conta?: string | null
          created_at?: string
          id?: string
          nome: string
          observacao?: string | null
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          ativa?: boolean
          banco?: string | null
          conta?: string | null
          created_at?: string
          id?: string
          nome?: string
          observacao?: string | null
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      contas_pagar: {
        Row: {
          centro_custo_id: string | null
          conta_bancaria_id: string | null
          created_at: string
          desconto: number
          descricao: string
          documento: string | null
          forma_pagamento: string | null
          fornecedor_id: string
          id: string
          juros: number
          observacao: string | null
          pago_em: string | null
          parcela: number
          pedido_id: string | null
          recebimento_id: string | null
          status: string
          total_parcelas: number
          updated_at: string
          valor: number
          valor_pago: number | null
          vencimento: string
        }
        Insert: {
          centro_custo_id?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          desconto?: number
          descricao: string
          documento?: string | null
          forma_pagamento?: string | null
          fornecedor_id: string
          id?: string
          juros?: number
          observacao?: string | null
          pago_em?: string | null
          parcela?: number
          pedido_id?: string | null
          recebimento_id?: string | null
          status?: string
          total_parcelas?: number
          updated_at?: string
          valor: number
          valor_pago?: number | null
          vencimento: string
        }
        Update: {
          centro_custo_id?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          desconto?: number
          descricao?: string
          documento?: string | null
          forma_pagamento?: string | null
          fornecedor_id?: string
          id?: string
          juros?: number
          observacao?: string | null
          pago_em?: string | null
          parcela?: number
          pedido_id?: string | null
          recebimento_id?: string | null
          status?: string
          total_parcelas?: number
          updated_at?: string
          valor?: number
          valor_pago?: number | null
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_recebimento_id_fkey"
            columns: ["recebimento_id"]
            isOneToOne: false
            referencedRelation: "recebimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          centro_custo_id: string | null
          cliente_id: string | null
          conta_bancaria_id: string | null
          created_at: string
          desconto: number
          descricao: string | null
          documento: string | null
          forma_pagamento: string | null
          id: string
          juros: number
          nota_fiscal_id: string | null
          op_id: string | null
          pago_em: string | null
          parcela: number
          status: string
          total_parcelas: number
          updated_at: string
          valor: number
          valor_pago: number
          vencimento: string | null
        }
        Insert: {
          centro_custo_id?: string | null
          cliente_id?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          desconto?: number
          descricao?: string | null
          documento?: string | null
          forma_pagamento?: string | null
          id?: string
          juros?: number
          nota_fiscal_id?: string | null
          op_id?: string | null
          pago_em?: string | null
          parcela?: number
          status?: string
          total_parcelas?: number
          updated_at?: string
          valor?: number
          valor_pago?: number
          vencimento?: string | null
        }
        Update: {
          centro_custo_id?: string | null
          cliente_id?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          desconto?: number
          descricao?: string | null
          documento?: string | null
          forma_pagamento?: string | null
          id?: string
          juros?: number
          nota_fiscal_id?: string | null
          op_id?: string | null
          pago_em?: string | null
          parcela?: number
          status?: string
          total_parcelas?: number
          updated_at?: string
          valor?: number
          valor_pago?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "contas_receber_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
        ]
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
      cotacao_fornecedores: {
        Row: {
          condicao_pagamento: string | null
          cotacao_id: string
          created_at: string
          desconto: number | null
          escolhida: boolean
          fornecedor_id: string
          frete: number | null
          id: string
          observacao: string | null
          prazo_entrega_dias: number | null
          respondida_em: string | null
          total: number | null
          updated_at: string
        }
        Insert: {
          condicao_pagamento?: string | null
          cotacao_id: string
          created_at?: string
          desconto?: number | null
          escolhida?: boolean
          fornecedor_id: string
          frete?: number | null
          id?: string
          observacao?: string | null
          prazo_entrega_dias?: number | null
          respondida_em?: string | null
          total?: number | null
          updated_at?: string
        }
        Update: {
          condicao_pagamento?: string | null
          cotacao_id?: string
          created_at?: string
          desconto?: number | null
          escolhida?: boolean
          fornecedor_id?: string
          frete?: number | null
          id?: string
          observacao?: string | null
          prazo_entrega_dias?: number | null
          respondida_em?: string | null
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotacao_fornecedores_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacao_fornecedores_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacao_itens: {
        Row: {
          cotacao_fornecedor_id: string
          created_at: string
          descricao: string
          icms: number | null
          id: string
          ipi: number | null
          preco_unitario: number
          quantidade: number
          solicitacao_item_id: string | null
          subtotal: number | null
          unidade: string
          updated_at: string
        }
        Insert: {
          cotacao_fornecedor_id: string
          created_at?: string
          descricao: string
          icms?: number | null
          id?: string
          ipi?: number | null
          preco_unitario?: number
          quantidade: number
          solicitacao_item_id?: string | null
          subtotal?: number | null
          unidade?: string
          updated_at?: string
        }
        Update: {
          cotacao_fornecedor_id?: string
          created_at?: string
          descricao?: string
          icms?: number | null
          id?: string
          ipi?: number | null
          preco_unitario?: number
          quantidade?: number
          solicitacao_item_id?: string | null
          subtotal?: number | null
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotacao_itens_cotacao_fornecedor_id_fkey"
            columns: ["cotacao_fornecedor_id"]
            isOneToOne: false
            referencedRelation: "cotacao_fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacao_itens_solicitacao_item_id_fkey"
            columns: ["solicitacao_item_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_compra_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacoes: {
        Row: {
          created_at: string
          escolhida_fornecedor_id: string | null
          id: string
          observacao: string | null
          prazo_resposta: string | null
          solicitacao_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          escolhida_fornecedor_id?: string | null
          id?: string
          observacao?: string | null
          prazo_resposta?: string | null
          solicitacao_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          escolhida_fornecedor_id?: string | null
          id?: string
          observacao?: string | null
          prazo_resposta?: string | null
          solicitacao_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_escolhida_fornecedor_id_fkey"
            columns: ["escolhida_fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_compra"
            referencedColumns: ["id"]
          },
        ]
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
          focus_nfe_token: string | null
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
          focus_nfe_token?: string | null
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
          focus_nfe_token?: string | null
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
      entrega_eventos: {
        Row: {
          created_at: string
          data: string
          descricao: string | null
          evento: string
          id: string
          local: string | null
          nota_fiscal_id: string | null
          romaneio_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: string
          descricao?: string | null
          evento: string
          id?: string
          local?: string | null
          nota_fiscal_id?: string | null
          romaneio_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string | null
          evento?: string
          id?: string
          local?: string | null
          nota_fiscal_id?: string | null
          romaneio_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entrega_eventos_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrega_eventos_romaneio_id_fkey"
            columns: ["romaneio_id"]
            isOneToOne: false
            referencedRelation: "romaneios"
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
      estoque_movimentos: {
        Row: {
          created_at: string
          data: string
          documento_origem: string | null
          hora: string
          id: string
          item_id: string | null
          item_tipo: string | null
          lote_id: string | null
          nota_fiscal_id: string | null
          observacao: string | null
          op_id: string | null
          operacao: string
          quantidade: number
          recebimento_id: string | null
          saldo_anterior: number
          saldo_posterior: number
          tipo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: string
          documento_origem?: string | null
          hora?: string
          id?: string
          item_id?: string | null
          item_tipo?: string | null
          lote_id?: string | null
          nota_fiscal_id?: string | null
          observacao?: string | null
          op_id?: string | null
          operacao: string
          quantidade: number
          recebimento_id?: string | null
          saldo_anterior: number
          saldo_posterior: number
          tipo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: string
          documento_origem?: string | null
          hora?: string
          id?: string
          item_id?: string | null
          item_tipo?: string | null
          lote_id?: string | null
          nota_fiscal_id?: string | null
          observacao?: string | null
          op_id?: string | null
          operacao?: string
          quantidade?: number
          recebimento_id?: string | null
          saldo_anterior?: number
          saldo_posterior?: number
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_saldos"
            referencedColumns: ["lote_id"]
          },
          {
            foreignKeyName: "estoque_movimentos_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "estoque_movimentos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "estoque_movimentos_recebimento_id_fkey"
            columns: ["recebimento_id"]
            isOneToOne: false
            referencedRelation: "recebimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicao_itens_lote: {
        Row: {
          created_at: string
          expedicao_id: string
          id: string
          lote_id: string | null
          op_item_id: string | null
          pedido_item_id: string | null
          product_id: string | null
          quantidade: number
          user_id: string | null
          variante_id: string | null
        }
        Insert: {
          created_at?: string
          expedicao_id: string
          id?: string
          lote_id?: string | null
          op_item_id?: string | null
          pedido_item_id?: string | null
          product_id?: string | null
          quantidade: number
          user_id?: string | null
          variante_id?: string | null
        }
        Update: {
          created_at?: string
          expedicao_id?: string
          id?: string
          lote_id?: string | null
          op_item_id?: string | null
          pedido_item_id?: string | null
          product_id?: string | null
          quantidade?: number
          user_id?: string | null
          variante_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_itens_lote_expedicao_id_fkey"
            columns: ["expedicao_id"]
            isOneToOne: false
            referencedRelation: "op_expedicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedicao_itens_lote_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedicao_itens_lote_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_saldos"
            referencedColumns: ["lote_id"]
          },
          {
            foreignKeyName: "expedicao_itens_lote_op_item_id_fkey"
            columns: ["op_item_id"]
            isOneToOne: false
            referencedRelation: "op_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedicao_itens_lote_pedido_item_id_fkey"
            columns: ["pedido_item_id"]
            isOneToOne: false
            referencedRelation: "pedido_itens"
            referencedColumns: ["id"]
          },
        ]
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
      fornecedores: {
        Row: {
          ativo: boolean
          cep: string | null
          cidade: string | null
          cnpj: string | null
          condicao_pagamento_padrao: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          inscricao_estadual: string | null
          nome_fantasia: string | null
          observacao: string | null
          prazo_entrega_dias: number | null
          razao_social: string
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          condicao_pagamento_padrao?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome_fantasia?: string | null
          observacao?: string | null
          prazo_entrega_dias?: number | null
          razao_social: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          condicao_pagamento_padrao?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome_fantasia?: string | null
          observacao?: string | null
          prazo_entrega_dias?: number | null
          razao_social?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
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
          custo_unitario: number | null
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
          tinturaria_id: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo_unitario?: number | null
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
          tinturaria_id?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo_unitario?: number | null
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
          tinturaria_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lotes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "lotes_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "lotes_tinturaria_id_fkey"
            columns: ["tinturaria_id"]
            isOneToOne: false
            referencedRelation: "tinturarias"
            referencedColumns: ["id"]
          },
        ]
      }
      maquina_capacidade: {
        Row: {
          created_at: string
          dias_uteis_semana: number
          eficiencia_alvo_pct: number
          horas_por_turno: number
          id: string
          kg_por_hora: number
          maquina_id: string
          turnos_por_dia: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dias_uteis_semana?: number
          eficiencia_alvo_pct?: number
          horas_por_turno?: number
          id?: string
          kg_por_hora?: number
          maquina_id: string
          turnos_por_dia?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dias_uteis_semana?: number
          eficiencia_alvo_pct?: number
          horas_por_turno?: number
          id?: string
          kg_por_hora?: number
          maquina_id?: string
          turnos_por_dia?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maquina_capacidade_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: true
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maquina_capacidade_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: true
            referencedRelation: "vw_capacidade_semanal"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "maquina_capacidade_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: true
            referencedRelation: "vw_oee_maquina"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "maquina_capacidade_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: true
            referencedRelation: "vw_oee_maquina_periodo"
            referencedColumns: ["maquina_id"]
          },
        ]
      }
      maquina_turnos: {
        Row: {
          created_at: string
          maquina_id: string
          turno_id: string
        }
        Insert: {
          created_at?: string
          maquina_id: string
          turno_id: string
        }
        Update: {
          created_at?: string
          maquina_id?: string
          turno_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maquina_turnos_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maquina_turnos_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_capacidade_semanal"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "maquina_turnos_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "maquina_turnos_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina_periodo"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "maquina_turnos_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
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
      movimentos_financeiros: {
        Row: {
          centro_custo_id: string | null
          conciliado: boolean
          conciliado_em: string | null
          conta_bancaria_id: string | null
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string
          data: string
          descricao: string | null
          documento: string | null
          forma_pagamento: string | null
          id: string
          op_id: string | null
          origem: string
          tipo: string
          updated_at: string
          user_id: string | null
          valor: number
        }
        Insert: {
          centro_custo_id?: string | null
          conciliado?: boolean
          conciliado_em?: string | null
          conta_bancaria_id?: string | null
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          documento?: string | null
          forma_pagamento?: string | null
          id?: string
          op_id?: string | null
          origem: string
          tipo: string
          updated_at?: string
          user_id?: string | null
          valor: number
        }
        Update: {
          centro_custo_id?: string | null
          conciliado?: boolean
          conciliado_em?: string | null
          conta_bancaria_id?: string | null
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          documento?: string | null
          forma_pagamento?: string | null
          id?: string
          op_id?: string | null
          origem?: string
          tipo?: string
          updated_at?: string
          user_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_financeiros_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_financeiros_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_financeiros_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_financeiros_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_financeiros_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_financeiros_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "movimentos_financeiros_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
        ]
      }
      ncm_catalogo: {
        Row: {
          aliq_cofins_padrao: number | null
          aliq_ipi_padrao: number | null
          aliq_pis_padrao: number | null
          ativo: boolean
          cest_sugerido: string | null
          codigo: string
          created_at: string
          cst_cofins_padrao: string | null
          cst_ipi_padrao: string | null
          cst_pis_padrao: string | null
          descricao: string
          ex_tipi: string | null
          updated_at: string
        }
        Insert: {
          aliq_cofins_padrao?: number | null
          aliq_ipi_padrao?: number | null
          aliq_pis_padrao?: number | null
          ativo?: boolean
          cest_sugerido?: string | null
          codigo: string
          created_at?: string
          cst_cofins_padrao?: string | null
          cst_ipi_padrao?: string | null
          cst_pis_padrao?: string | null
          descricao: string
          ex_tipi?: string | null
          updated_at?: string
        }
        Update: {
          aliq_cofins_padrao?: number | null
          aliq_ipi_padrao?: number | null
          aliq_pis_padrao?: number | null
          ativo?: boolean
          cest_sugerido?: string | null
          codigo?: string
          created_at?: string
          cst_cofins_padrao?: string | null
          cst_ipi_padrao?: string | null
          cst_pis_padrao?: string | null
          descricao?: string
          ex_tipi?: string | null
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
          ambiente: string | null
          base_icms: number
          cfop_id: string | null
          chave_acesso: string | null
          chave_ref: string | null
          cliente_id: string | null
          created_at: string
          danfe_storage_path: string | null
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
          xml_storage_path: string | null
          xml_url: string | null
        }
        Insert: {
          ambiente?: string | null
          base_icms?: number
          cfop_id?: string | null
          chave_acesso?: string | null
          chave_ref?: string | null
          cliente_id?: string | null
          created_at?: string
          danfe_storage_path?: string | null
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
          xml_storage_path?: string | null
          xml_url?: string | null
        }
        Update: {
          ambiente?: string | null
          base_icms?: number
          cfop_id?: string | null
          chave_acesso?: string | null
          chave_ref?: string | null
          cliente_id?: string | null
          created_at?: string
          danfe_storage_path?: string | null
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
          xml_storage_path?: string | null
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
            foreignKeyName: "notas_fiscais_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "notas_fiscais_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
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
          motivo_refugo: string | null
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
          motivo_refugo?: string | null
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
          motivo_refugo?: string | null
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
            foreignKeyName: "op_apontamentos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_operador"
            referencedColumns: ["funcionario_id"]
          },
          {
            foreignKeyName: "op_apontamentos_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_apontamentos_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_capacidade_semanal"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "op_apontamentos_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "op_apontamentos_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina_periodo"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "op_apontamentos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_apontamentos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_apontamentos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
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
            foreignKeyName: "op_consumos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_saldos"
            referencedColumns: ["lote_id"]
          },
          {
            foreignKeyName: "op_consumos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_consumos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_consumos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
        ]
      }
      op_custos: {
        Row: {
          calculado_em: string
          created_at: string
          custo_cif: number
          custo_mao_obra: number
          custo_materia_prima: number
          custo_por_kg: number | null
          custo_total: number | null
          id: string
          observacao: string | null
          op_id: string
          quantidade_produzida: number
          updated_at: string
        }
        Insert: {
          calculado_em?: string
          created_at?: string
          custo_cif?: number
          custo_mao_obra?: number
          custo_materia_prima?: number
          custo_por_kg?: number | null
          custo_total?: number | null
          id?: string
          observacao?: string | null
          op_id: string
          quantidade_produzida?: number
          updated_at?: string
        }
        Update: {
          calculado_em?: string
          created_at?: string
          custo_cif?: number
          custo_mao_obra?: number
          custo_materia_prima?: number
          custo_por_kg?: number | null
          custo_total?: number | null
          id?: string
          observacao?: string | null
          op_id?: string
          quantidade_produzida?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "op_custos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: true
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_custos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: true
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_custos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: true
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
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
            foreignKeyName: "op_entradas_estoque_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_saldos"
            referencedColumns: ["lote_id"]
          },
          {
            foreignKeyName: "op_entradas_estoque_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_entradas_estoque_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_entradas_estoque_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_entradas_estoque_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_entradas_estoque_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_artigo"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "op_entradas_estoque_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["product_id"]
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
          {
            foreignKeyName: "op_eventos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_eventos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
        ]
      }
      op_expedicoes: {
        Row: {
          comprovante_url: string | null
          conferente_id: string | null
          created_at: string
          data_entrega: string | null
          data_saida: string | null
          divergencias: Json
          expedidor_id: string | null
          frete_tipo: string | null
          id: string
          nota_fiscal_id: string | null
          observacao: string | null
          op_id: string | null
          pedido_id: string | null
          peso_bruto: number | null
          peso_liquido: number | null
          rastreio: string | null
          romaneio_id: string | null
          separador_id: string | null
          status: string
          transportadora_id: string | null
          updated_at: string
          volumes: number | null
        }
        Insert: {
          comprovante_url?: string | null
          conferente_id?: string | null
          created_at?: string
          data_entrega?: string | null
          data_saida?: string | null
          divergencias?: Json
          expedidor_id?: string | null
          frete_tipo?: string | null
          id?: string
          nota_fiscal_id?: string | null
          observacao?: string | null
          op_id?: string | null
          pedido_id?: string | null
          peso_bruto?: number | null
          peso_liquido?: number | null
          rastreio?: string | null
          romaneio_id?: string | null
          separador_id?: string | null
          status?: string
          transportadora_id?: string | null
          updated_at?: string
          volumes?: number | null
        }
        Update: {
          comprovante_url?: string | null
          conferente_id?: string | null
          created_at?: string
          data_entrega?: string | null
          data_saida?: string | null
          divergencias?: Json
          expedidor_id?: string | null
          frete_tipo?: string | null
          id?: string
          nota_fiscal_id?: string | null
          observacao?: string | null
          op_id?: string | null
          pedido_id?: string | null
          peso_bruto?: number | null
          peso_liquido?: number | null
          rastreio?: string | null
          romaneio_id?: string | null
          separador_id?: string | null
          status?: string
          transportadora_id?: string | null
          updated_at?: string
          volumes?: number | null
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
            foreignKeyName: "op_expedicoes_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_expedicoes_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_expedicoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_expedicoes_romaneio_id_fkey"
            columns: ["romaneio_id"]
            isOneToOne: false
            referencedRelation: "romaneios"
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
          {
            foreignKeyName: "op_faturamento_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_faturamento_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
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
            foreignKeyName: "op_itens_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_itens_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
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
            foreignKeyName: "op_itens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_artigo"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "op_itens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["product_id"]
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
      op_paradas: {
        Row: {
          created_at: string
          duracao_min: number | null
          fim: string | null
          id: string
          inicio: string
          maquina_id: string | null
          motivo: string | null
          op_id: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duracao_min?: number | null
          fim?: string | null
          id?: string
          inicio: string
          maquina_id?: string | null
          motivo?: string | null
          op_id: string
          tipo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duracao_min?: number | null
          fim?: string | null
          id?: string
          inicio?: string
          maquina_id?: string | null
          motivo?: string | null
          op_id?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "op_paradas_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_paradas_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_capacidade_semanal"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "op_paradas_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "op_paradas_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina_periodo"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "op_paradas_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_paradas_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_paradas_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
        ]
      }
      op_qualidade: {
        Row: {
          causa: string | null
          created_at: string
          data: string
          defeito: string | null
          evidencias: Json
          id: string
          inspetor_id: string | null
          motivo: string | null
          observacao: string | null
          op_id: string
          quantidade_aprovada: number
          quantidade_reprocesso: number | null
          quantidade_reprovada: number
          resultado: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          causa?: string | null
          created_at?: string
          data?: string
          defeito?: string | null
          evidencias?: Json
          id?: string
          inspetor_id?: string | null
          motivo?: string | null
          observacao?: string | null
          op_id: string
          quantidade_aprovada?: number
          quantidade_reprocesso?: number | null
          quantidade_reprovada?: number
          resultado: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          causa?: string | null
          created_at?: string
          data?: string
          defeito?: string | null
          evidencias?: Json
          id?: string
          inspetor_id?: string | null
          motivo?: string | null
          observacao?: string | null
          op_id?: string
          quantidade_aprovada?: number
          quantidade_reprocesso?: number | null
          quantidade_reprovada?: number
          resultado?: string
          status?: string
          updated_at?: string
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
            foreignKeyName: "op_qualidade_inspetor_id_fkey"
            columns: ["inspetor_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_operador"
            referencedColumns: ["funcionario_id"]
          },
          {
            foreignKeyName: "op_qualidade_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_qualidade_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_qualidade_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
        ]
      }
      op_reprocessos: {
        Row: {
          created_at: string
          custo_adicional: number
          id: string
          motivo: string
          observacao: string | null
          op_filha_id: string | null
          op_origem_id: string
          quantidade: number
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          custo_adicional?: number
          id?: string
          motivo: string
          observacao?: string | null
          op_filha_id?: string | null
          op_origem_id: string
          quantidade?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          custo_adicional?: number
          id?: string
          motivo?: string
          observacao?: string | null
          op_filha_id?: string | null
          op_origem_id?: string
          quantidade?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "op_reprocessos_op_filha_id_fkey"
            columns: ["op_filha_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_reprocessos_op_filha_id_fkey"
            columns: ["op_filha_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_reprocessos_op_filha_id_fkey"
            columns: ["op_filha_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_reprocessos_op_origem_id_fkey"
            columns: ["op_origem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_reprocessos_op_origem_id_fkey"
            columns: ["op_origem_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_reprocessos_op_origem_id_fkey"
            columns: ["op_origem_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
        ]
      }
      op_reservas_lote: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          item_id: string | null
          item_tipo: string
          lote_id: string
          observacao: string | null
          op_id: string
          op_item_id: string | null
          quantidade_consumida: number
          quantidade_liberada: number
          quantidade_reservada: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          item_id?: string | null
          item_tipo: string
          lote_id: string
          observacao?: string | null
          op_id: string
          op_item_id?: string | null
          quantidade_consumida?: number
          quantidade_liberada?: number
          quantidade_reservada: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          item_id?: string | null
          item_tipo?: string
          lote_id?: string
          observacao?: string | null
          op_id?: string
          op_item_id?: string | null
          quantidade_consumida?: number
          quantidade_liberada?: number
          quantidade_reservada?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "op_reservas_lote_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_reservas_lote_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_saldos"
            referencedColumns: ["lote_id"]
          },
          {
            foreignKeyName: "op_reservas_lote_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_reservas_lote_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_reservas_lote_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_reservas_lote_op_item_id_fkey"
            columns: ["op_item_id"]
            isOneToOne: false
            referencedRelation: "op_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      operacoes_produtivas: {
        Row: {
          ativo: boolean
          centro_trabalho: string | null
          codigo: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          setup_padrao_min: number
          tempo_padrao_min: number
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          centro_trabalho?: string | null
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          setup_padrao_min?: number
          tempo_padrao_min?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          centro_trabalho?: string | null
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          setup_padrao_min?: number
          tempo_padrao_min?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
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
            foreignKeyName: "ordens_producao_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_operador"
            referencedColumns: ["funcionario_id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_capacidade_semanal"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina_periodo"
            referencedColumns: ["maquina_id"]
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
          origem_preco: string | null
          pedido_id: string
          product_id: string | null
          quantidade: number
          regra_cliente_artigo_id: string | null
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
          origem_preco?: string | null
          pedido_id: string
          product_id?: string | null
          quantidade?: number
          regra_cliente_artigo_id?: string | null
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
          origem_preco?: string | null
          pedido_id?: string
          product_id?: string | null
          quantidade?: number
          regra_cliente_artigo_id?: string | null
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
            foreignKeyName: "pedido_itens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_artigo"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "pedido_itens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "pedido_itens_regra_cliente_artigo_id_fkey"
            columns: ["regra_cliente_artigo_id"]
            isOneToOne: false
            referencedRelation: "cliente_artigo"
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
      pedidos_compra: {
        Row: {
          condicao_pagamento: string | null
          confirmado_em: string | null
          cotacao_id: string | null
          created_at: string
          criado_por: string | null
          desconto: number | null
          enviado_em: string | null
          fornecedor_id: string
          frete: number | null
          id: string
          numero: number
          observacao: string | null
          prazo_entrega: string | null
          status: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          condicao_pagamento?: string | null
          confirmado_em?: string | null
          cotacao_id?: string | null
          created_at?: string
          criado_por?: string | null
          desconto?: number | null
          enviado_em?: string | null
          fornecedor_id: string
          frete?: number | null
          id?: string
          numero?: number
          observacao?: string | null
          prazo_entrega?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          condicao_pagamento?: string | null
          confirmado_em?: string | null
          cotacao_id?: string | null
          created_at?: string
          criado_por?: string | null
          desconto?: number | null
          enviado_em?: string | null
          fornecedor_id?: string
          frete?: number | null
          id?: string
          numero?: number
          observacao?: string | null
          prazo_entrega?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_compra_itens: {
        Row: {
          cfop: string | null
          created_at: string
          descricao: string
          id: string
          ncm: string | null
          pedido_id: string
          preco_unitario: number
          quantidade: number
          quantidade_recebida: number
          ref_id: string | null
          subtotal: number | null
          tipo_ref: string | null
          unidade: string
          updated_at: string
        }
        Insert: {
          cfop?: string | null
          created_at?: string
          descricao: string
          id?: string
          ncm?: string | null
          pedido_id: string
          preco_unitario?: number
          quantidade: number
          quantidade_recebida?: number
          ref_id?: string | null
          subtotal?: number | null
          tipo_ref?: string | null
          unidade?: string
          updated_at?: string
        }
        Update: {
          cfop?: string | null
          created_at?: string
          descricao?: string
          id?: string
          ncm?: string | null
          pedido_id?: string
          preco_unitario?: number
          quantidade?: number
          quantidade_recebida?: number
          ref_id?: string | null
          subtotal?: number | null
          tipo_ref?: string | null
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_producao: {
        Row: {
          codigo: string
          created_at: string
          descricao: string | null
          id: string
          observacao: string | null
          responsavel_id: string | null
          semana_fim: string
          semana_inicio: string
          status: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: string
          observacao?: string | null
          responsavel_id?: string | null
          semana_fim: string
          semana_inicio: string
          status?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          observacao?: string | null
          responsavel_id?: string | null
          semana_fim?: string
          semana_inicio?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_producao_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_producao_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_operador"
            referencedColumns: ["funcionario_id"]
          },
        ]
      }
      plano_producao_itens: {
        Row: {
          article_id: string | null
          created_at: string
          data_prevista: string
          horas_estimadas: number | null
          id: string
          maquina_id: string | null
          observacao: string | null
          op_id: string | null
          plano_id: string
          quantidade_planejada: number
          sequencia: number
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          data_prevista: string
          horas_estimadas?: number | null
          id?: string
          maquina_id?: string | null
          observacao?: string | null
          op_id?: string | null
          plano_id: string
          quantidade_planejada?: number
          sequencia?: number
        }
        Update: {
          article_id?: string | null
          created_at?: string
          data_prevista?: string
          horas_estimadas?: number | null
          id?: string
          maquina_id?: string | null
          observacao?: string | null
          op_id?: string | null
          plano_id?: string
          quantidade_planejada?: number
          sequencia?: number
        }
        Relationships: [
          {
            foreignKeyName: "plano_producao_itens_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_producao_itens_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_codigo_id"]
          },
          {
            foreignKeyName: "plano_producao_itens_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_nome_id"]
          },
          {
            foreignKeyName: "plano_producao_itens_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_producao_itens_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_capacidade_semanal"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "plano_producao_itens_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "plano_producao_itens_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina_periodo"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "plano_producao_itens_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_producao_itens_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "plano_producao_itens_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "plano_producao_itens_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "plano_producao"
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
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_artigo"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["product_id"]
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
          article_id: string | null
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
          article_id?: string | null
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
          article_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "products_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_codigo_id"]
          },
          {
            foreignKeyName: "products_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_nome_id"]
          },
        ]
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
      recebimento_itens: {
        Row: {
          created_at: string
          id: string
          lote_fornecedor: string | null
          lote_id: string | null
          motivo_divergencia: string | null
          observacao: string | null
          pedido_item_id: string
          quantidade_aprovada: number
          quantidade_recebida: number
          quantidade_rejeitada: number
          recebimento_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lote_fornecedor?: string | null
          lote_id?: string | null
          motivo_divergencia?: string | null
          observacao?: string | null
          pedido_item_id: string
          quantidade_aprovada?: number
          quantidade_recebida?: number
          quantidade_rejeitada?: number
          recebimento_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lote_fornecedor?: string | null
          lote_id?: string | null
          motivo_divergencia?: string | null
          observacao?: string | null
          pedido_item_id?: string
          quantidade_aprovada?: number
          quantidade_recebida?: number
          quantidade_rejeitada?: number
          recebimento_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recebimento_itens_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimento_itens_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_saldos"
            referencedColumns: ["lote_id"]
          },
          {
            foreignKeyName: "recebimento_itens_pedido_item_id_fkey"
            columns: ["pedido_item_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimento_itens_recebimento_id_fkey"
            columns: ["recebimento_id"]
            isOneToOne: false
            referencedRelation: "recebimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimentos: {
        Row: {
          chave_nfe: string | null
          conferido_em: string | null
          created_at: string
          data_recebimento: string
          id: string
          nota_fornecedor: string | null
          numero: number
          observacao: string | null
          pedido_id: string
          recebedor_id: string | null
          status: string
          transportadora: string | null
          updated_at: string
          valor_nota: number | null
        }
        Insert: {
          chave_nfe?: string | null
          conferido_em?: string | null
          created_at?: string
          data_recebimento?: string
          id?: string
          nota_fornecedor?: string | null
          numero?: number
          observacao?: string | null
          pedido_id: string
          recebedor_id?: string | null
          status?: string
          transportadora?: string | null
          updated_at?: string
          valor_nota?: number | null
        }
        Update: {
          chave_nfe?: string | null
          conferido_em?: string | null
          created_at?: string
          data_recebimento?: string
          id?: string
          nota_fornecedor?: string | null
          numero?: number
          observacao?: string | null
          pedido_id?: string
          recebedor_id?: string | null
          status?: string
          transportadora?: string | null
          updated_at?: string
          valor_nota?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      regras_tributarias: {
        Row: {
          aliq_cofins: number | null
          aliq_fcp: number | null
          aliq_fcp_st: number | null
          aliq_icms: number | null
          aliq_icms_st: number | null
          aliq_ipi: number | null
          aliq_pis: number | null
          ativo: boolean
          calcula_difal: boolean
          calcula_st: boolean
          cest: string | null
          cfop: string
          created_at: string
          csosn: string | null
          cst_cofins: string | null
          cst_icms: string | null
          cst_ipi: string | null
          cst_pis: string | null
          finalidade: string | null
          id: string
          mva_pct: number | null
          ncm_prefix: string | null
          nome: string
          observacao: string | null
          prioridade: number
          red_base_icms_pct: number | null
          regime_tributario_emitente: string | null
          tipo_cliente: string | null
          tipo_operacao: string | null
          uf_destino: string | null
          uf_origem: string | null
          updated_at: string
        }
        Insert: {
          aliq_cofins?: number | null
          aliq_fcp?: number | null
          aliq_fcp_st?: number | null
          aliq_icms?: number | null
          aliq_icms_st?: number | null
          aliq_ipi?: number | null
          aliq_pis?: number | null
          ativo?: boolean
          calcula_difal?: boolean
          calcula_st?: boolean
          cest?: string | null
          cfop: string
          created_at?: string
          csosn?: string | null
          cst_cofins?: string | null
          cst_icms?: string | null
          cst_ipi?: string | null
          cst_pis?: string | null
          finalidade?: string | null
          id?: string
          mva_pct?: number | null
          ncm_prefix?: string | null
          nome: string
          observacao?: string | null
          prioridade?: number
          red_base_icms_pct?: number | null
          regime_tributario_emitente?: string | null
          tipo_cliente?: string | null
          tipo_operacao?: string | null
          uf_destino?: string | null
          uf_origem?: string | null
          updated_at?: string
        }
        Update: {
          aliq_cofins?: number | null
          aliq_fcp?: number | null
          aliq_fcp_st?: number | null
          aliq_icms?: number | null
          aliq_icms_st?: number | null
          aliq_ipi?: number | null
          aliq_pis?: number | null
          ativo?: boolean
          calcula_difal?: boolean
          calcula_st?: boolean
          cest?: string | null
          cfop?: string
          created_at?: string
          csosn?: string | null
          cst_cofins?: string | null
          cst_icms?: string | null
          cst_ipi?: string | null
          cst_pis?: string | null
          finalidade?: string | null
          id?: string
          mva_pct?: number | null
          ncm_prefix?: string | null
          nome?: string
          observacao?: string | null
          prioridade?: number
          red_base_icms_pct?: number | null
          regime_tributario_emitente?: string | null
          tipo_cliente?: string | null
          tipo_operacao?: string | null
          uf_destino?: string | null
          uf_origem?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      romaneio_itens: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nota_fiscal_id: string | null
          op_id: string | null
          pedido_id: string | null
          peso: number
          romaneio_id: string
          separacao_id: string | null
          updated_at: string
          volumes: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nota_fiscal_id?: string | null
          op_id?: string | null
          pedido_id?: string | null
          peso?: number
          romaneio_id: string
          separacao_id?: string | null
          updated_at?: string
          volumes?: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nota_fiscal_id?: string | null
          op_id?: string | null
          pedido_id?: string | null
          peso?: number
          romaneio_id?: string
          separacao_id?: string | null
          updated_at?: string
          volumes?: number
        }
        Relationships: [
          {
            foreignKeyName: "romaneio_itens_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "romaneio_itens_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "romaneio_itens_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "romaneio_itens_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "romaneio_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "romaneio_itens_romaneio_id_fkey"
            columns: ["romaneio_id"]
            isOneToOne: false
            referencedRelation: "romaneios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "romaneio_itens_separacao_id_fkey"
            columns: ["separacao_id"]
            isOneToOne: false
            referencedRelation: "separacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      romaneios: {
        Row: {
          created_at: string
          data_emissao: string
          data_entrega: string | null
          data_saida: string | null
          id: string
          motorista: string | null
          numero: number
          observacao: string | null
          peso_total: number
          status: string
          transportadora_id: string | null
          updated_at: string
          valor_frete: number
          veiculo_descricao: string | null
          veiculo_placa: string | null
          volumes_total: number
        }
        Insert: {
          created_at?: string
          data_emissao?: string
          data_entrega?: string | null
          data_saida?: string | null
          id?: string
          motorista?: string | null
          numero?: number
          observacao?: string | null
          peso_total?: number
          status?: string
          transportadora_id?: string | null
          updated_at?: string
          valor_frete?: number
          veiculo_descricao?: string | null
          veiculo_placa?: string | null
          volumes_total?: number
        }
        Update: {
          created_at?: string
          data_emissao?: string
          data_entrega?: string | null
          data_saida?: string | null
          id?: string
          motorista?: string | null
          numero?: number
          observacao?: string | null
          peso_total?: number
          status?: string
          transportadora_id?: string | null
          updated_at?: string
          valor_frete?: number
          veiculo_descricao?: string | null
          veiculo_placa?: string | null
          volumes_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "romaneios_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      roteiro_etapa_maquinas: {
        Row: {
          etapa_id: string
          maquina_id: string
        }
        Insert: {
          etapa_id: string
          maquina_id: string
        }
        Update: {
          etapa_id?: string
          maquina_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roteiro_etapa_maquinas_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "roteiro_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roteiro_etapa_maquinas_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roteiro_etapa_maquinas_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_capacidade_semanal"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "roteiro_etapa_maquinas_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "roteiro_etapa_maquinas_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina_periodo"
            referencedColumns: ["maquina_id"]
          },
        ]
      }
      roteiro_etapas: {
        Row: {
          centro_trabalho: string | null
          consumo_previsto: number
          created_at: string
          fornecedor_terceiro_id: string | null
          id: string
          maquina_preferencial_id: string | null
          nome_operacao: string
          observacao: string | null
          operacao_id: string | null
          perdas_previstas_pct: number
          qualidade_obrigatoria: boolean
          roteiro_id: string
          sequencia: number
          setup_min: number
          tempo_padrao_min: number
          terceirizada: boolean
          updated_at: string
        }
        Insert: {
          centro_trabalho?: string | null
          consumo_previsto?: number
          created_at?: string
          fornecedor_terceiro_id?: string | null
          id?: string
          maquina_preferencial_id?: string | null
          nome_operacao: string
          observacao?: string | null
          operacao_id?: string | null
          perdas_previstas_pct?: number
          qualidade_obrigatoria?: boolean
          roteiro_id: string
          sequencia: number
          setup_min?: number
          tempo_padrao_min?: number
          terceirizada?: boolean
          updated_at?: string
        }
        Update: {
          centro_trabalho?: string | null
          consumo_previsto?: number
          created_at?: string
          fornecedor_terceiro_id?: string | null
          id?: string
          maquina_preferencial_id?: string | null
          nome_operacao?: string
          observacao?: string | null
          operacao_id?: string | null
          perdas_previstas_pct?: number
          qualidade_obrigatoria?: boolean
          roteiro_id?: string
          sequencia?: number
          setup_min?: number
          tempo_padrao_min?: number
          terceirizada?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roteiro_etapas_fornecedor_terceiro_id_fkey"
            columns: ["fornecedor_terceiro_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roteiro_etapas_maquina_preferencial_id_fkey"
            columns: ["maquina_preferencial_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roteiro_etapas_maquina_preferencial_id_fkey"
            columns: ["maquina_preferencial_id"]
            isOneToOne: false
            referencedRelation: "vw_capacidade_semanal"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "roteiro_etapas_maquina_preferencial_id_fkey"
            columns: ["maquina_preferencial_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "roteiro_etapas_maquina_preferencial_id_fkey"
            columns: ["maquina_preferencial_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina_periodo"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "roteiro_etapas_operacao_id_fkey"
            columns: ["operacao_id"]
            isOneToOne: false
            referencedRelation: "operacoes_produtivas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roteiro_etapas_roteiro_id_fkey"
            columns: ["roteiro_id"]
            isOneToOne: false
            referencedRelation: "roteiros"
            referencedColumns: ["id"]
          },
        ]
      }
      roteiros: {
        Row: {
          article_id: string | null
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string
          id: string
          observacoes: string | null
          revisao: number
          setup_min: number
          tempo_padrao_min: number
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          observacoes?: string | null
          revisao?: number
          setup_min?: number
          tempo_padrao_min?: number
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          revisao?: number
          setup_min?: number
          tempo_padrao_min?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roteiros_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roteiros_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_codigo_id"]
          },
          {
            foreignKeyName: "roteiros_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_nome_id"]
          },
        ]
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
      separacao_itens: {
        Row: {
          created_at: string
          descricao: string
          divergencia: string | null
          id: string
          item_id: string | null
          item_tipo: string | null
          lote_id: string | null
          qtd_conferida: number
          qtd_separada: number
          qtd_solicitada: number
          separacao_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao: string
          divergencia?: string | null
          id?: string
          item_id?: string | null
          item_tipo?: string | null
          lote_id?: string | null
          qtd_conferida?: number
          qtd_separada?: number
          qtd_solicitada?: number
          separacao_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          divergencia?: string | null
          id?: string
          item_id?: string | null
          item_tipo?: string | null
          lote_id?: string | null
          qtd_conferida?: number
          qtd_separada?: number
          qtd_solicitada?: number
          separacao_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "separacao_itens_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "separacao_itens_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_saldos"
            referencedColumns: ["lote_id"]
          },
          {
            foreignKeyName: "separacao_itens_separacao_id_fkey"
            columns: ["separacao_id"]
            isOneToOne: false
            referencedRelation: "separacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      separacoes: {
        Row: {
          conferente_id: string | null
          conferida_em: string | null
          created_at: string
          finalizada_em: string | null
          id: string
          iniciada_em: string | null
          nota_fiscal_id: string | null
          observacao: string | null
          op_id: string | null
          pedido_id: string | null
          responsavel_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          conferente_id?: string | null
          conferida_em?: string | null
          created_at?: string
          finalizada_em?: string | null
          id?: string
          iniciada_em?: string | null
          nota_fiscal_id?: string | null
          observacao?: string | null
          op_id?: string | null
          pedido_id?: string | null
          responsavel_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          conferente_id?: string | null
          conferida_em?: string | null
          created_at?: string
          finalizada_em?: string | null
          id?: string
          iniciada_em?: string | null
          nota_fiscal_id?: string | null
          observacao?: string | null
          op_id?: string | null
          pedido_id?: string | null
          responsavel_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "separacoes_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "separacoes_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "separacoes_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "separacoes_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "separacoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_compra: {
        Row: {
          aprovada_em: string | null
          aprovador_id: string | null
          created_at: string
          id: string
          justificativa: string | null
          necessidade_em: string | null
          numero: number
          observacao: string | null
          prioridade: string
          setor: string | null
          solicitante_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          aprovada_em?: string | null
          aprovador_id?: string | null
          created_at?: string
          id?: string
          justificativa?: string | null
          necessidade_em?: string | null
          numero?: number
          observacao?: string | null
          prioridade?: string
          setor?: string | null
          solicitante_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          aprovada_em?: string | null
          aprovador_id?: string | null
          created_at?: string
          id?: string
          justificativa?: string | null
          necessidade_em?: string | null
          numero?: number
          observacao?: string | null
          prioridade?: string
          setor?: string | null
          solicitante_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      solicitacoes_compra_itens: {
        Row: {
          created_at: string
          descricao: string
          id: string
          observacao: string | null
          quantidade: number
          ref_id: string | null
          solicitacao_id: string
          tipo_ref: string | null
          unidade: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          observacao?: string | null
          quantidade: number
          ref_id?: string | null
          solicitacao_id: string
          tipo_ref?: string | null
          unidade?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          observacao?: string | null
          quantidade?: number
          ref_id?: string | null
          solicitacao_id?: string
          tipo_ref?: string | null
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_compra_itens_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_compra"
            referencedColumns: ["id"]
          },
        ]
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
      transportadoras: {
        Row: {
          antt: string | null
          ativa: boolean
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          ie: string | null
          nome_fantasia: string | null
          observacao: string | null
          razao_social: string
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          antt?: string | null
          ativa?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          ie?: string | null
          nome_fantasia?: string | null
          observacao?: string | null
          razao_social: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          antt?: string | null
          ativa?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          ie?: string | null
          nome_fantasia?: string | null
          observacao?: string | null
          razao_social?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      turnos: {
        Row: {
          ativo: boolean
          created_at: string
          dias_semana: number[]
          hora_fim: string
          hora_inicio: string
          id: string
          intervalo_min: number
          nome: string
          observacao: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dias_semana?: number[]
          hora_fim: string
          hora_inicio: string
          id?: string
          intervalo_min?: number
          nome: string
          observacao?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dias_semana?: number[]
          hora_fim?: string
          hora_inicio?: string
          id?: string
          intervalo_min?: number
          nome?: string
          observacao?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      uf_aliquotas: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          fundo_pobreza_pct: number
          icms_interestadual_pct: number
          icms_interno_pct: number
          icms_pct: number
          icms_st_pct: number
          id: string
          sigla: string
          uf: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          fundo_pobreza_pct?: number
          icms_interestadual_pct?: number
          icms_interno_pct?: number
          icms_pct?: number
          icms_st_pct?: number
          id?: string
          sigla: string
          uf: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          fundo_pobreza_pct?: number
          icms_interestadual_pct?: number
          icms_interno_pct?: number
          icms_pct?: number
          icms_st_pct?: number
          id?: string
          sigla?: string
          uf?: string
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
      v_qualidade_indicadores: {
        Row: {
          article_id: string | null
          causa: string | null
          data: string | null
          defeito: string | null
          id: string | null
          maquina_id: string | null
          op_id: string | null
          op_numero: number | null
          product_id: string | null
          quantidade_aprovada: number | null
          quantidade_reprocesso: number | null
          quantidade_reprovada: number | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "op_itens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_itens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_artigo"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "op_itens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "op_qualidade_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_qualidade_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_qualidade_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_capacidade_semanal"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina_periodo"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "products_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_codigo_id"]
          },
          {
            foreignKeyName: "products_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_nome_id"]
          },
        ]
      }
      vw_capacidade_semanal: {
        Row: {
          capacidade_efetiva_semana_kg: number | null
          capacidade_nominal_semana_kg: number | null
          dias_uteis_semana: number | null
          eficiencia_alvo_pct: number | null
          horas_por_turno: number | null
          kg_por_hora: number | null
          maquina: string | null
          maquina_id: string | null
          numero: number | null
          tipo: string | null
          turnos_por_dia: number | null
        }
        Relationships: []
      }
      vw_custo_op: {
        Row: {
          calculado_em: string | null
          custo_cif: number | null
          custo_mao_obra: number | null
          custo_materia_prima: number | null
          custo_por_kg: number | null
          custo_total: number | null
          numero: number | null
          op_id: string | null
          quantidade_produzida: number | null
          status: Database["public"]["Enums"]["op_status"] | null
        }
        Relationships: []
      }
      vw_custos_cliente: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          custo_perdas: number | null
          custo_real: number | null
          custo_retrabalho: number | null
          margem_pct: number | null
          margem_valor: number | null
          ops: number | null
          receita: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_custos_maquina: {
        Row: {
          custo_medio_kg: number | null
          custo_perdas: number | null
          custo_real: number | null
          custo_retrabalho: number | null
          maquina_id: string | null
          maquina_nome: string | null
          ops: number | null
          qtd_produzida: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_capacidade_semanal"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina_periodo"
            referencedColumns: ["maquina_id"]
          },
        ]
      }
      vw_custos_op: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          custo_cif: number | null
          custo_frete_interno: number | null
          custo_mo: number | null
          custo_mp: number | null
          custo_perdas: number | null
          custo_por_kg: number | null
          custo_real: number | null
          custo_retrabalho: number | null
          custo_terceirizacao: number | null
          maquina_id: string | null
          maquina_nome: string | null
          margem_pct: number | null
          margem_valor: number | null
          numero: number | null
          op_id: string | null
          pedido_id: string | null
          pedido_numero: string | null
          qtd_produzida: number | null
          qtd_refugo: number | null
          receita_pedido: number | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_capacidade_semanal"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "ordens_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_maquina_periodo"
            referencedColumns: ["maquina_id"]
          },
          {
            foreignKeyName: "ordens_producao_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_custos_produto: {
        Row: {
          custo_medio_un: number | null
          custo_perdas: number | null
          custo_real: number | null
          custo_retrabalho: number | null
          ops: number | null
          product_id: string | null
          produto_nome: string | null
          qtd_produzida: number | null
        }
        Relationships: [
          {
            foreignKeyName: "op_itens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_itens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_oee_artigo"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "op_itens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["product_id"]
          },
        ]
      }
      vw_fluxo_caixa: {
        Row: {
          centro_custo_id: string | null
          classe: string | null
          conta_bancaria_id: string | null
          data: string | null
          descricao: string | null
          origem: string | null
          tipo: string | null
          valor: number | null
        }
        Relationships: []
      }
      vw_lotes_saldos: {
        Row: {
          item_id: string | null
          lote_id: string | null
          numero_lote: string | null
          saldo_disponivel: number | null
          saldo_fisico: number | null
          saldo_reservado: number | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_oee_artigo: {
        Row: {
          codigo: string | null
          min_operado: number | null
          nome: string | null
          oee_pct: number | null
          performance_pct: number | null
          product_id: string | null
          qtd_produzida: number | null
          qtd_refugo: number | null
          qualidade_pct: number | null
        }
        Relationships: []
      }
      vw_oee_maquina: {
        Row: {
          disponibilidade_pct: number | null
          maquina: string | null
          maquina_id: string | null
          min_operado: number | null
          min_parado: number | null
          numero: number | null
          performance_pct: number | null
          qtd_produzida: number | null
          qtd_refugo: number | null
          qualidade_pct: number | null
        }
        Relationships: []
      }
      vw_oee_maquina_periodo: {
        Row: {
          disponibilidade_pct: number | null
          maquina_id: string | null
          min_operado: number | null
          min_parado: number | null
          nome: string | null
          numero: number | null
          oee_pct: number | null
          performance_pct: number | null
          qtd_produzida: number | null
          qtd_refugo: number | null
          qualidade_pct: number | null
        }
        Relationships: []
      }
      vw_oee_mensal: {
        Row: {
          disponibilidade_pct: number | null
          mes: string | null
          min_operado: number | null
          min_parado: number | null
          oee_pct: number | null
          performance_pct: number | null
          qtd_produzida: number | null
          qtd_refugo: number | null
          qualidade_pct: number | null
        }
        Relationships: []
      }
      vw_oee_operador: {
        Row: {
          funcionario_id: string | null
          min_operado: number | null
          nome: string | null
          oee_pct: number | null
          performance_pct: number | null
          qtd_produzida: number | null
          qtd_refugo: number | null
          qualidade_pct: number | null
        }
        Relationships: []
      }
      vw_oee_turno: {
        Row: {
          min_operado: number | null
          oee_pct: number | null
          performance_pct: number | null
          qtd_produzida: number | null
          qtd_refugo: number | null
          qualidade_pct: number | null
          turno: string | null
        }
        Relationships: []
      }
      vw_produtos_sugestao_artigo: {
        Row: {
          article_id_atual: string | null
          product_codigo: string | null
          product_id: string | null
          product_nome: string | null
          status: string | null
          sugestao_por_codigo: string | null
          sugestao_por_codigo_id: string | null
          sugestao_por_nome: string | null
          sugestao_por_nome_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_article_id_fkey"
            columns: ["article_id_atual"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_article_id_fkey"
            columns: ["article_id_atual"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_codigo_id"]
          },
          {
            foreignKeyName: "products_article_id_fkey"
            columns: ["article_id_atual"]
            isOneToOne: false
            referencedRelation: "vw_produtos_sugestao_artigo"
            referencedColumns: ["sugestao_por_nome_id"]
          },
        ]
      }
      vw_reservas_op: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string | null
          item_id: string | null
          item_tipo: string | null
          lote_id: string | null
          lote_tipo: string | null
          numero_lote: string | null
          observacao: string | null
          op_id: string | null
          op_item_id: string | null
          op_numero: number | null
          op_status: Database["public"]["Enums"]["op_status"] | null
          pendente: number | null
          quantidade_consumida: number | null
          quantidade_liberada: number | null
          quantidade_reservada: number | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "op_reservas_lote_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_reservas_lote_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_saldos"
            referencedColumns: ["lote_id"]
          },
          {
            foreignKeyName: "op_reservas_lote_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_reservas_lote_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custo_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_reservas_lote_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "vw_custos_op"
            referencedColumns: ["op_id"]
          },
          {
            foreignKeyName: "op_reservas_lote_op_item_id_fkey"
            columns: ["op_item_id"]
            isOneToOne: false
            referencedRelation: "op_itens"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      baixar_estoque_nf: { Args: { _nota_id: string }; Returns: number }
      exp_registrar_evento: {
        Args: {
          _descricao?: string
          _evento: string
          _expedicao_id: string
          _local?: string
        }
        Returns: string
      }
      exp_separar_lote: {
        Args: {
          _expedicao_id: string
          _lote_id: string
          _op_item_id: string
          _quantidade: number
        }
        Returns: string
      }
      exp_transicionar: {
        Args: { _expedicao_id: string; _motivo?: string; _novo_status: string }
        Returns: undefined
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_gerente: { Args: { _user_id: string }; Returns: boolean }
      kardex_movimentar: {
        Args: {
          _documento_origem?: string
          _lote_id: string
          _observacao?: string
          _operacao?: string
          _quantidade: number
          _tipo: string
        }
        Returns: string
      }
      liquidar_conta_pagar: {
        Args: {
          _conta_bancaria_id?: string
          _conta_id: string
          _data?: string
          _desconto?: number
          _forma_pagamento?: string
          _juros?: number
          _observacao?: string
          _valor_pago: number
        }
        Returns: string
      }
      liquidar_conta_receber: {
        Args: {
          _conta_bancaria_id?: string
          _conta_id: string
          _data?: string
          _desconto?: number
          _forma_pagamento?: string
          _juros?: number
          _observacao?: string
          _valor_pago: number
        }
        Returns: string
      }
      op_calcular_custo: { Args: { _op_id: string }; Returns: string }
      op_cancelar_reservas_op: { Args: { _op_id: string }; Returns: number }
      op_consumir_reserva: {
        Args: { _obs?: string; _quantidade: number; _reserva_id: string }
        Returns: string
      }
      op_criar_reprocesso: {
        Args: { _motivo: string; _op_id: string; _quantidade: number }
        Returns: string
      }
      op_liberar_reserva: {
        Args: { _quantidade?: number; _reserva_id: string }
        Returns: string
      }
      op_registrar_inspecao: {
        Args: {
          _causa?: string
          _defeito?: string
          _evidencias?: Json
          _observacao?: string
          _op_id: string
          _qtd_aprovada: number
          _qtd_reprocesso: number
          _qtd_reprovada: number
        }
        Returns: string
      }
      op_reservar_materiais: { Args: { _op_id: string }; Returns: Json }
      op_substituir_lote: {
        Args: { _novo_lote_id: string; _reserva_id: string }
        Returns: string
      }
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
      resolver_preco_cliente_artigo: {
        Args: {
          _artigo_id?: string
          _cliente_id: string
          _data?: string
          _produto_id?: string
          _variante_id?: string
        }
        Returns: {
          condicao_pagamento: string
          desconto_maximo_pct: number
          origem: string
          prazo_entrega_dias: number
          preco: number
          regra_id: string
        }[]
      }
      romaneio_transicionar: {
        Args: { _novo_status: string; _romaneio_id: string }
        Returns: string
      }
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
