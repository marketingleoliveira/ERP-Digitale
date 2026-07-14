import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type DanfeEmpresa = {
  razao_social: string;
  cnpj: string;
  inscricao_estadual?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  telefone?: string | null;
};

export type DanfeItem = {
  codigo?: string | null;
  descricao: string;
  ncm?: string | null;
  cfop?: string | null;
  unidade?: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
};

export type DanfeData = {
  numero: string;
  serie: string;
  natureza_operacao?: string | null;
  data_emissao: string;
  chave_acesso?: string | null;
  protocolo?: string | null;
  emissor: DanfeEmpresa;
  destinatario: {
    nome: string;
    cnpj_cpf?: string | null;
    endereco?: string | null;
    cidade?: string | null;
    uf?: string | null;
  };
  itens: DanfeItem[];
  valor_produtos: number;
  valor_frete?: number;
  valor_desconto?: number;
  valor_total: number;
  observacoes?: string | null;
};

const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(n || 0);

export function generateDanfe(nf: DanfeData): jsPDF {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const W = 210;
  let y = 8;

  // Cabeçalho
  doc.setFontSize(14).setFont("helvetica", "bold");
  doc.text("DANFE", W / 2, y + 4, { align: "center" });
  doc.setFontSize(8).setFont("helvetica", "normal");
  doc.text("Documento Auxiliar da Nota Fiscal Eletrônica", W / 2, y + 8, { align: "center" });
  y += 12;

  // Emissor
  doc.rect(8, y, W - 16, 22);
  doc.setFontSize(10).setFont("helvetica", "bold");
  doc.text(nf.emissor.razao_social, 10, y + 5);
  doc.setFontSize(8).setFont("helvetica", "normal");
  doc.text(`CNPJ: ${nf.emissor.cnpj}   IE: ${nf.emissor.inscricao_estadual ?? "-"}`, 10, y + 10);
  doc.text(
    `${nf.emissor.logradouro ?? ""} ${nf.emissor.numero ?? ""} - ${nf.emissor.bairro ?? ""}`,
    10, y + 14
  );
  doc.text(
    `${nf.emissor.cidade ?? ""}/${nf.emissor.uf ?? ""}  CEP: ${nf.emissor.cep ?? ""}  Tel: ${nf.emissor.telefone ?? "-"}`,
    10, y + 18
  );
  // Bloco número/série
  doc.text(`Nº ${nf.numero}`, W - 40, y + 6);
  doc.text(`Série ${nf.serie}`, W - 40, y + 11);
  doc.text(new Date(nf.data_emissao).toLocaleDateString("pt-BR"), W - 40, y + 16);
  y += 24;

  // Chave / protocolo
  if (nf.chave_acesso) {
    doc.rect(8, y, W - 16, 10);
    doc.setFont("helvetica", "bold").text("Chave de Acesso:", 10, y + 4);
    doc.setFont("helvetica", "normal").setFontSize(9).text(nf.chave_acesso, 10, y + 8);
    if (nf.protocolo) {
      doc.setFontSize(8).text(`Protocolo: ${nf.protocolo}`, W - 70, y + 4);
    }
    y += 12;
  }

  // Destinatário
  doc.setFontSize(8);
  doc.rect(8, y, W - 16, 14);
  doc.setFont("helvetica", "bold").text("DESTINATÁRIO", 10, y + 4);
  doc.setFont("helvetica", "normal");
  doc.text(`${nf.destinatario.nome}   CNPJ/CPF: ${nf.destinatario.cnpj_cpf ?? "-"}`, 10, y + 8);
  doc.text(
    `${nf.destinatario.endereco ?? ""}  ${nf.destinatario.cidade ?? ""}/${nf.destinatario.uf ?? ""}`,
    10, y + 12
  );
  y += 16;

  // Itens
  autoTable(doc, {
    startY: y,
    margin: { left: 8, right: 8 },
    head: [["Cód.", "Descrição", "NCM", "CFOP", "UN", "Qtd", "Vl Unit", "Vl Total"]],
    body: nf.itens.map((i) => [
      i.codigo ?? "",
      i.descricao,
      i.ncm ?? "",
      i.cfop ?? "",
      i.unidade ?? "",
      money(i.quantidade),
      money(i.valor_unitario),
      money(i.valor_total),
    ]),
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // Totais
  doc.rect(8, finalY, W - 16, 14);
  doc.setFont("helvetica", "bold").text("Vl Produtos:", 10, finalY + 5);
  doc.setFont("helvetica", "normal").text(`R$ ${money(nf.valor_produtos)}`, 40, finalY + 5);
  doc.setFont("helvetica", "bold").text("Frete:", 80, finalY + 5);
  doc.setFont("helvetica", "normal").text(`R$ ${money(nf.valor_frete ?? 0)}`, 95, finalY + 5);
  doc.setFont("helvetica", "bold").text("Desconto:", 130, finalY + 5);
  doc.setFont("helvetica", "normal").text(`R$ ${money(nf.valor_desconto ?? 0)}`, 155, finalY + 5);
  doc.setFont("helvetica", "bold").setFontSize(10).text("TOTAL:", 10, finalY + 11);
  doc.text(`R$ ${money(nf.valor_total)}`, 40, finalY + 11);

  if (nf.observacoes) {
    doc.setFont("helvetica", "bold").setFontSize(8).text("Observações:", 10, finalY + 20);
    doc.setFont("helvetica", "normal").text(nf.observacoes, 10, finalY + 24, { maxWidth: W - 20 });
  }

  return doc;
}

export function openDanfe(nf: DanfeData) {
  const doc = generateDanfe(nf);
  doc.output("dataurlnewwindow", { filename: `DANFE-${nf.numero}.pdf` });
}

export function downloadDanfe(nf: DanfeData) {
  const doc = generateDanfe(nf);
  doc.save(`DANFE-${nf.numero}.pdf`);
}
