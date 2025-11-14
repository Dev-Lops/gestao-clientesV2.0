import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { useUser } from "@/context/UserContext";
import { BibleVerseWidget } from "@/features/verses/BibleVerseWidget";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Sparkles,
  User as UserIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface SidebarV3Props {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemGroup {
  label: string;
  items: Array<{ href: string; label: string; icon: React.ReactNode }>;
}

const groups: NavItemGroup[] = [
  {
    label: "Principal",
    items: [
      {
        href: "/clients",
        label: "Clientes",
        icon: <Users className="w-4 h-4" />,
      },
      {
        href: "/finance",
        label: "Financeiro",
        icon: <DollarSign className="w-4 h-4" />,
      },
    ],
  },
  {
    label: "Administração",
    items: [
      {
        href: "/admin",
        label: "Administração",
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
      {
        href: "/settings",
        label: "Configurações",
        icon: <Settings className="w-4 h-4" />,
      },
    ],
  },
];

export function SidebarV3({ isOpen, onClose }: SidebarV3Props) {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const [orgName, setOrgName] = useState("");
  const { collapsed, toggleCollapsed } = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showVerse, setShowVerse] = useState(true);
  const [search, setSearch] = useState("");
  // theme toggle removed (unused) — keep implementation commented for future use
  // Keyboard shortcuts: Ctrl+B collapse/expand, Ctrl+U toggle user menu
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        setProfileOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  const userInitials = (user?.displayName || user?.email || "U")
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  useEffect(() => {
    fetch("/api/sidebar-stats").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data?.orgName) setOrgName(data.orgName);
      }
    });
  }, []);

  // const toggleTheme = () => {
  //   const next = theme === 'light' ? 'dark' : 'light'
  //   setTheme(next)
  //   if (next === 'dark') document.documentElement.classList.add('dark')
  //   else document.documentElement.classList.remove('dark')
  // }

  const filteredGroups = groups.map((g) => ({
    ...g,
    items: g.items.filter((i) =>
      i.label.toLowerCase().includes(search.toLowerCase()),
    ),
  }));

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
          // Keep sidebar fixed on all breakpoints so it does not scroll with page content
          "fixed left-0 top-0 z-50 h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-300",
          collapsed ? "w-20" : "w-72",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // On large screens ensure it is visible (no translate off-screen). Removed lg:static to prevent scrolling.
          "lg:translate-x-0",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl",
            collapsed
              ? "px-2 pt-4 pb-4 flex flex-col items-center gap-3"
              : "flex items-center gap-2 px-4 pt-5 pb-3",
          )}
        >
          <Link
            href="/"
            onClick={() => isOpen && onClose()}
            className={cn(
              "flex items-center gap-3 min-w-0",
              collapsed && "justify-center",
            )}
          >
            <div className="w-10 h-10 shrink-0 rounded-lg bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="text-base font-bold bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  myGest
                </div>
                {orgName && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                    {orgName}
                  </div>
                )}
              </div>
            )}
          </Link>
          {/* Collapse button: repositioned below logo when collapsed to avoid overlap */}
          {collapsed ? (
            <div className="w-full flex items-center justify-center">
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  onClick={toggleCollapsed}
                  aria-label="Expandir sidebar"
                  title="Expandir (Ctrl+B)"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900/90 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity dark:bg-slate-700/90">
                  Expandir
                </span>
              </div>
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  onClick={toggleCollapsed}
                  aria-label="Colapsar sidebar"
                  title="Colapsar (Ctrl+B)"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-200" />
                </Button>
                <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900/90 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity dark:bg-slate-700/90">
                  Colapsar
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div
          className={cn(
            "px-4 py-3 border-b border-slate-200 dark:border-slate-800",
            collapsed && "hidden",
          )}
        >
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {filteredGroups.map((group) => (
            <div key={group.label} className="px-1">
              {!collapsed && (
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase px-3 mb-2 tracking-wide">
                  {group.label}
                </div>
              )}
              <div className="space-y-1">
                {group.items.length === 0 && !collapsed && (
                  <div className="text-xs text-slate-400 px-3 py-2 italic">
                    Nada encontrado
                  </div>
                )}
                {group.items.map((item) => {
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => isOpen && onClose()}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-blue-50 dark:bg-blue-800/40 text-blue-700 dark:text-blue-200 shadow-inner"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                      )}
                    >
                      <span className="w-5 h-5 flex items-center justify-center text-slate-500 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-100">
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                      {active && !collapsed && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Verse / Utilities */}
        <div className={cn("px-4 pb-3 space-y-3")}>
          {!collapsed && (
            <>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-3 text-slate-700 dark:text-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
                    Versículo
                  </span>
                  <button
                    onClick={() => setShowVerse((v) => !v)}
                    className="text-[11px] px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200"
                  >
                    {showVerse ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <AnimatePresence initial={true}>
                  {showVerse && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs"
                    >
                      <BibleVerseWidget compact />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="flex items-center gap-2 rounded-md px-3 py-2 w-full justify-center text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                >
                  {theme === 'light' ? (
                    <><Moon className="w-4 h-4" /><span className="text-xs">Dark</span></>
                  ) : (
                    <><Sun className="w-4 h-4 dark:text-slate-300" /><span className="text-xs dark:text-slate-300">Light</span></>
                  )}
                </Button>
              </div> */}
            </>
          )}
        </div>

        {/* User footer */}
        <div className="mt-auto border-t border-slate-200 dark:border-slate-800 p-3 relative">
          <DropdownMenu
            open={profileOpen}
            onOpenChange={setProfileOpen}
            side="top"
            align="start"
          >
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  profileOpen && "bg-slate-100 dark:bg-slate-800",
                  collapsed
                    ? "mx-auto w-12 h-12 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                    : "w-full flex items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors",
                )}
                aria-haspopup="menu"
                title={
                  profileOpen ? "Fechar menu (Ctrl+U)" : "Abrir menu (Ctrl+U)"
                }
              >
                <div
                  className={cn(
                    "rounded-full bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-sm text-xs font-semibold select-none",
                    collapsed ? "w-10 h-10" : "w-9 h-9",
                  )}
                >
                  {userInitials || <UserIcon className="w-4 h-4 text-white" />}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
                      {user?.displayName || user?.email || "Usuário"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-300 truncate">
                      {user?.email}
                    </div>
                  </div>
                )}
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-slate-500 transition-transform",
                      profileOpen && "rotate-180",
                    )}
                  />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" sideOffset={12}>
              <DropdownMenuLabel>
                <div className="font-medium text-slate-900 dark:text-slate-100 text-sm leading-tight">
                  {user?.displayName || user?.email || "Usuário"}
                </div>
                {user?.email && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                    {user.email}
                  </div>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = "/profile";
                  }}
                >
                  <UserIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span>Perfil</span>
                  <DropdownMenuShortcut>Ctrl+P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = "/settings";
                  }}
                >
                  <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span>Configurações</span>
                  <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-red-600 dark:text-red-400">Sair</span>
                <DropdownMenuShortcut>Ctrl+Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}

export default SidebarV3;
