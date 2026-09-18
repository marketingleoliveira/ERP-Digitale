import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/inicio", replace: true });
  },
  head: () => ({
    meta: [
      { title: "ERP Digitale Têxtil" },
      { name: "description", content: "Sistema de gestão industrial da Digitale Têxtil." },
      { property: "og:title", content: "ERP Digitale Têxtil" },
      { property: "og:description", content: "Sistema de gestão industrial da Digitale Têxtil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

