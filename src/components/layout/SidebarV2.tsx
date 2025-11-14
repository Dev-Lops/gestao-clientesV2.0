import { NotificationCenter } from "@/components/NotificationCenter";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { BibleVerseWidget } from "@/features/verses/BibleVerseWidget";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ChevronDown,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  User as UserIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

function SidebarNavLink({
  href,
  icon,
  children,
  pathname,
  isOpen,
  onClose,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  pathname?: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const active = pathname?.startsWith(href);
  return (
    <Link
      href={href}
      onClick={() => {
        if (isOpen) onClose();
      }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
        active
          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow"
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
      )}
    >
      <span className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-400">
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </Link>
  );
}

export function SidebarV2({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    // Busca nome da organização
    fetch("/api/sidebar-stats").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data?.orgName) setOrgName(data.orgName);
      }
    });
  }, []);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 w-72 h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:shadow-none",
        )}
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              onClick={() => isOpen && onClose()}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  myGest
                </div>
                {orgName && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {orgName}
                  </div>
                )}
              </div>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <NotificationCenter />
              </div>
            </div>
          </div>
        </div>

        {/* User block */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 w-full text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 p-1 transition-colors"
            aria-expanded={showUserMenu ? "true" : "false"}
          >
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-sm">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {user?.displayName || user?.email || "Usuário"}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </Button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-4 top-28 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
              >
                <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user?.displayName || user?.email || "Usuário"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {user?.email}
                  </p>
                </div>
                <div className="p-2">
                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Meu Perfil
                    </span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Configurações
                    </span>
                  </Link>
                </div>
                <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sair</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
          <div className="px-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase px-3 mb-2">
              Principal
            </div>
            <div className="space-y-1">
              <SidebarNavLink
                href="/clients"
                icon={<Users className="w-4 h-4" />}
                pathname={pathname}
                isOpen={isOpen}
                onClose={onClose}
              >
                Clientes
              </SidebarNavLink>
              <SidebarNavLink
                href="/finance"
                icon={<DollarSign className="w-4 h-4" />}
                pathname={pathname}
                isOpen={isOpen}
                onClose={onClose}
              >
                Financeiro
              </SidebarNavLink>
            </div>
          </div>

          <div className="px-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase px-3 mb-2">
              Administração
            </div>
            <div className="space-y-1">
              <SidebarNavLink
                href="/admin"
                icon={<LayoutDashboard className="w-4 h-4" />}
                pathname={pathname}
                isOpen={isOpen}
                onClose={onClose}
              >
                Administração
              </SidebarNavLink>
              <SidebarNavLink
                href="/settings"
                icon={<Settings className="w-4 h-4" />}
                pathname={pathname}
                isOpen={isOpen}
                onClose={onClose}
              >
                Configurações
              </SidebarNavLink>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80">
          <div className="mb-3">
            <BibleVerseWidget compact />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="flex-1 text-left px-3 py-2 rounded-md text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Sair
              </div>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
