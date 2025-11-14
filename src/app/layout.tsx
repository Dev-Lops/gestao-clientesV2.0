import AppLayoutClient from "@/components/layout/AppLayoutClient";
import { UserProvider } from "@/context/UserContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Se você for usar Firebase Auth (frontend)

// Fonte global
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "MyGest - Sistema de Gestão de Clientes",
    template: "%s | MyGest",
  },
  description:
    "Sistema completo de gestão de clientes com controle de tarefas, finanças, reuniões e branding. Aumente a produtividade da sua equipe com ferramentas intuitivas.",
  keywords: [
    "gestão de clientes",
    "CRM",
    "gerenciamento de projetos",
    "controle financeiro",
    "gestão de tarefas",
    "sistema de gestão",
    "produtividade",
    "organização empresarial",
  ],
  authors: [{ name: "MyGest Team" }],
  creator: "MyGest",
  publisher: "MyGest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MyGest - Sistema de Gestão de Clientes",
    description:
      "Sistema completo de gestão de clientes com controle de tarefas, finanças, reuniões e branding.",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "MyGest",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MyGest - Sistema de Gestão de Clientes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyGest - Sistema de Gestão de Clientes",
    description:
      "Sistema completo de gestão de clientes com controle de tarefas, finanças, reuniões e branding.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Adicione aqui os códigos de verificação quando disponíveis
    // google: 'google-verification-code',
    // yandex: 'yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground antialiased transition-colors`}
      >
        {/* Provider de autenticação global + Sidebar (apenas para usuários autenticados) */}
        <UserProvider>
          <AppLayoutClient>{children}</AppLayoutClient>
        </UserProvider>
        <Toaster
          position="top-right"
          expand={true}
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              background: "white",
              color: "#1e293b",
              border: "1px solid #e2e8f0",
            },
            className: "toast-custom",
          }}
        />
      </body>
    </html>
  );
}
