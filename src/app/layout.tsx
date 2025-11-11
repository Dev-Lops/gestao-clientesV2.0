import { UserProvider } from '@/context/UserContext'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Se você for usar Firebase Auth (frontend)


// Fonte global
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gestão de Clientes',
  description: 'Sistema completo de gestão com controle de usuários e permissões',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen`}>
        {/* Provider de autenticação global */}
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}
