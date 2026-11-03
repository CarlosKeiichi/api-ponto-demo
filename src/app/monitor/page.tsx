import type { Metadata } from "next";
import { Monitor } from "./monitor";

export const metadata: Metadata = {
  title: "Monitor virtual · Oficina de IA",
  description: "Tire dúvidas e mande o print do erro durante a Oficina de IA · Do problema à solução.",
};

export default function PaginaMonitor() {
  return <Monitor />;
}
