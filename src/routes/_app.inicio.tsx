import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Home, Search, TrendingUp, Users, Package, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_app/inicio")({ component: InicioPage });

type Customer = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  status: string;
  updated_at: string | null;
  created_at: string | null;
};

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtInt = (v: number) => new Intl.NumberFormat("pt-BR").format(v);
const fmtPct = (v: number) =>
  `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)} %`;

const PAGE_SIZE = 20;

function InicioPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [fNome, setFNome] = useState("");
  const [fCnpj, setFCnpj] = useState("");
  const [fTipo, setFTipo] = useState<string>("all");

  const [counts, setCounts] = useState({ funcionarios: 0, produtos: 0, artigos: 0 });

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: cust }, fCount, pCount, aCount] = await Promise.all([
      supabase
        .from("customers")
        .select("id, razao_social, nome_fantasia, cnpj, status, updated_at, created_at")
        .order("razao_social"),
      supabase.from("funcionarios").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("articles").select("id", { count: "exact", head: true }),
    ]);
    setRows((cust as Customer[]) ?? []);
    setCounts({
      funcionarios: fCount.count ?? 0,
      produtos: pCount.count ?? 0,
      artigos: aCount.count ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("inicio-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "funcionarios" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const now = new Date();
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = useMemo(() => {
    const total = rows.length;
    const isAtivo = (r: Customer) => r.status?.toLowerCase() === "ativo";
    const updatedAfter = (r: Customer, d: Date) =>
      r.updated_at ? new Date(r.updated_at) >= d : false;

    const ativos2M = rows.filter((r) => isAtivo(r) && updatedAfter(r, twoMonthsAgo)).length;
    const inativos2M = rows.filter((r) => !updatedAfter(r, twoMonthsAgo)).length;
    const ativosMes = rows.filter((r) => isAtivo(r) && updatedAfter(r, monthStart)).length;
    const pct = total > 0 ? (ativosMes / total) * 100 : 0;
    const ticket = 14815.25; // placeholder — sem módulo de faturamento
    return { total, ativos2M, inativos2M, ativosMes, pct, ticket };
  }, [rows, twoMonthsAgo, monthStart]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (fNome && !`${r.razao_social} ${r.nome_fantasia ?? ""}`.toLowerCase().includes(fNome.toLowerCase()))
        return false;
      if (fCnpj && !(r.cnpj ?? "").includes(fCnpj)) return false;
      if (fTipo !== "all") {
        const ativo = r.status?.toLowerCase() === "ativo";
        if (fTipo === "ativo" && !ativo) return false;
        if (fTipo === "inativo" && ativo) return false;
      }
      return true;
    });
  }, [rows, fNome, fCnpj, fTipo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const cards: { label: string; value: string }[] = [
    { label: "Total Clientes", value: fmtInt(stats.total) },
    { label: "Clientes Ativos (2 M)", value: fmtInt(stats.ativos2M) },
    { label: "Clientes Inativos (2 M)", value: fmtInt(stats.inativos2M) },
    { label: "Clientes Ativos Mês", value: fmtInt(stats.ativosMes) },
    { label: "% Clientes Ativos Mês", value: fmtPct(stats.pct) },
    { label: "R$ Ticket Médio Mês", value: fmtBRL(stats.ticket) },
  ];

  // Dados para gráficos (últimos 6 meses)
  const chartData = useMemo(() => {
    const months: { key: string; label: string; date: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        date: d,
      });
    }
    const monthly = months.map((m, idx) => {
      const next = idx + 1 < months.length ? months[idx + 1].date : new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const novos = rows.filter((r) => {
        if (!r.created_at) return false;
        const c = new Date(r.created_at);
        return c >= m.date && c < next;
      }).length;
      const ativos = rows.filter((r) => {
        if (!r.updated_at) return false;
        const u = new Date(r.updated_at);
        return u >= m.date && u < next && r.status?.toLowerCase() === "ativo";
      }).length;
      return { mes: m.label, novos, ativos };
    });

    const ativosCount = rows.filter((r) => r.status?.toLowerCase() === "ativo").length;
    const pie = [
      { name: "Ativos", value: ativosCount },
      { name: "Inativos", value: Math.max(0, rows.length - ativosCount) },
    ];

    const kpis = [
      { name: "Clientes", value: rows.length },
      { name: "Funcionários", value: counts.funcionarios },
      { name: "Produtos", value: counts.produtos },
      { name: "Artigos", value: counts.artigos },
    ];

    return { monthly, pie, kpis };
  }, [rows, counts, now]);


  return (
    <div className="space-y-6">
      {/* Resumo Vendas */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
          <Home className="h-4 w-4" />
          Resumo Vendas
        </h2>
        <div className="overflow-hidden rounded-md border bg-card">
          <div className="grid grid-cols-2 border-b bg-primary text-primary-foreground md:grid-cols-3 lg:grid-cols-6">
            {cards.map((c) => (
              <div key={c.label} className="border-r px-3 py-2 text-center text-xs font-semibold last:border-r-0">
                {c.label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {cards.map((c) => (
              <div key={c.label} className="border-r px-3 py-6 text-center text-2xl font-light last:border-r-0">
                {c.value}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Listagem Cliente */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
          <Home className="h-4 w-4" />
          Principal - Listagem Cliente
        </h2>
        <div className="overflow-hidden rounded-md border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-3 py-2 text-left font-semibold">Nome Fantasia</th>
                <th className="px-3 py-2 text-left font-semibold">CNPJ/CPF</th>
                <th className="px-3 py-2 text-center font-semibold">NF</th>
                <th className="px-3 py-2 text-right font-semibold">R$ Faturado</th>
                <th className="px-3 py-2 text-right font-semibold">R$ Pendente</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                pageRows.map((r, i) => (
                  <tr key={r.id} className={i % 2 ? "bg-muted/30" : ""}>
                    <td className="px-3 py-1.5 font-medium uppercase">
                      {r.nome_fantasia || r.razao_social}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs">{r.cnpj ?? "—"}</td>
                    <td className="px-3 py-1.5 text-center text-primary">0</td>
                    <td className="px-3 py-1.5 text-right">{fmtBRL(0)}</td>
                    <td className="px-3 py-1.5 text-right">{fmtBRL(0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Paginação + filtros */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/50 px-3 py-2 text-xs">
            <span>
              Página: {pageSafe} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pageSafe <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ◀ Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pageSafe >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próximo ▶
              </Button>
            </div>
            <span>Total de Registros: {fmtInt(filtered.length)}</span>
          </div>

          <div className="flex flex-wrap items-end gap-3 border-t bg-muted/30 px-3 py-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Nome/Razão:</Label>
              <Input
                value={fNome}
                onChange={(e) => {
                  setFNome(e.target.value);
                  setPage(1);
                }}
                className="h-8 w-56"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">CNPJ:</Label>
              <Input
                value={fCnpj}
                onChange={(e) => {
                  setFCnpj(e.target.value);
                  setPage(1);
                }}
                className="h-8 w-44"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Tipo Cliente:</Label>
              <Select
                value={fTipo}
                onValueChange={(v) => {
                  setFTipo(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-40">
                  <SelectValue placeholder="[SELECIONE]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">[SELECIONE]</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="ml-auto h-8" onClick={() => setPage(1)}>
              <Search className="mr-1 h-4 w-4" /> FILTRAR
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
