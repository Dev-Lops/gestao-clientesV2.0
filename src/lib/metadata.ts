import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const loginMetadata: Metadata = {
  title: "Login",
  description:
    "Entre no MyGest com sua conta Google. Sistema completo de gestão de clientes com controle de tarefas, finanças e muito mais.",
  openGraph: {
    title: "Login | MyGest",
    description: "Acesse o MyGest e gerencie seus clientes de forma eficiente.",
    url: `${baseUrl}/login`,
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const dashboardMetadata: Metadata = {
  title: "Dashboard",
  description:
    "Visão geral do seu negócio. Acompanhe métricas, tarefas pendentes e finanças em tempo real.",
  robots: {
    index: false, // Dashboard é área privada
    follow: false,
  },
};

export const clientsMetadata: Metadata = {
  title: "Clientes",
  description:
    "Gerencie todos os seus clientes em um só lugar. Visualize informações, histórico e status de cada cliente.",
  robots: {
    index: false,
    follow: false,
  },
};

export const onboardingMetadata: Metadata = {
  title: "Bem-vindo",
  description: "Configure sua conta e comece a usar o MyGest.",
  robots: {
    index: false,
    follow: false,
  },
};
