import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tori | Gestão",
  description: "Painel operacional seguro da Tori.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
