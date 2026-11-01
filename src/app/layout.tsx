import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "API de ponto de demonstração · Vila Tempero",
  description:
    "API fictícia de controle de ponto do restaurante Vila Tempero, usada em aula. Dados determinísticos, sem banco de dados.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
