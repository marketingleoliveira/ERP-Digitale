// Máscaras de formatação brasileira. Aceitam entrada parcial e limitam ao formato.
const onlyDigits = (v: string) => (v ?? "").replace(/\D+/g, "");

export function maskCPF(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export function maskCNPJ(v: string): string {
  const d = onlyDigits(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

// Aplica CPF (<=11) ou CNPJ (>=12) conforme quantidade de dígitos
export function maskCpfCnpj(v: string): string {
  const d = onlyDigits(v);
  return d.length <= 11 ? maskCPF(v) : maskCNPJ(v);
}

export function maskCEP(v: string): string {
  const d = onlyDigits(v).slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, "$1-$2");
}

export function maskPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/^\((\d{2})\) (\d{4})(\d)/, "($1) $2-$3");
  }
  return d
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/^\((\d{2})\) (\d{5})(\d)/, "($1) $2-$3");
}

// RG: dígitos + eventual "X" final. Formata 00.000.000-0
export function maskRG(v: string): string {
  const raw = (v ?? "").toUpperCase().replace(/[^0-9X]/g, "").slice(0, 9);
  return raw
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})([\dX])/, "$1.$2.$3-$4");
}
