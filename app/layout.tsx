import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Empresa Gestor Pro",
  description: "Gestão empresarial segura e operacional.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
