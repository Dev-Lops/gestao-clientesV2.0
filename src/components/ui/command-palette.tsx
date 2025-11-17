// "use client";

// import {
//   BadgeDollarSign,
//   FileText,
//   Home,
//   Search,
//   Users,
// } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import { Button } from "./button";
// import { Dialog, DialogContent, DialogTitle } from "./dialog";
// import { Input } from "./input";

// interface CommandItem {
//   id: string;
//   label: string;
//   href: string;
//   icon: React.ComponentType<{ className?: string }>;
//   category: string;
//   keywords?: string[];
// }

// const commands: CommandItem[] = [
//   {
//     id: "dashboard",
//     label: "Dashboard",
//     href: "/",
//     icon: Home,
//     category: "Navegação",
//   },
//   {
//     id: "clients",
//     label: "Clientes",
//     href: "/clients",
//     icon: Users,
//     category: "Navegação",
//     keywords: ["cliente", "customer"],
//   },
//   {
//     id: "billing",
//     label: "Cobrança",
//     href: "/billing",
//     icon: BadgeDollarSign,
//     category: "Navegação",
//     keywords: ["fatura", "invoice", "pagamento"],
//   },
//   {
//     id: "overdue",
//     label: "Inadimplência",
//     href: "/billing/overdue",
//     icon: FileText,
//     category: "Navegação",
//     keywords: ["vencido", "atrasado", "overdue"],
//   },
//   {
//     id: "finance",
//     label: "Financeiro",
//     href: "/finance",
//     icon: BadgeDollarSign,
//     category: "Navegação",
//     keywords: ["receita", "despesa", "finance"],
//   },
// ];

// export function CommandPalette() {
//   const [open, setOpen] = useState(false);
//   const [search, setSearch] = useState("");
//   const router = useRouter();

//   useEffect(() => {
//     const down = (e: KeyboardEvent) => {
//       if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
//         e.preventDefault();
//         setOpen((open) => !open);
//       }
//     };

//     document.addEventListener("keydown", down);
//     return () => document.removeEventListener("keydown", down);
//   }, []);

//   const filteredCommands = commands.filter((cmd) => {
//     const searchLower = search.toLowerCase();
//     return (
//       cmd.label.toLowerCase().includes(searchLower) ||
//       cmd.category.toLowerCase().includes(searchLower) ||
//       cmd.keywords?.some((k) => k.includes(searchLower))
//     );
//   });

//   const handleSelect = (href: string) => {
//     setOpen(false);
//     setSearch("");
//     router.push(href);
//   };

//   return (
//     <>
//       {/* Trigger Button */}
//       <Button
//         variant="outline"
//         className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:w-64 lg:w-80"
//         onClick={() => setOpen(true)}
//       >
//         <Search className="mr-2 h-4 w-4" />
//         <span>Buscar...</span>
//         <kbd className="pointer-events-none absolute right-2 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
//           <span className="text-xs">⌘</span>K
//         </kbd>
//       </Button>

//       {/* Dialog */}
//       <Dialog open={open} onOpenChange={setOpen}>
//         <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-2xl">
//           <DialogTitle className="sr-only">Paleta de Comandos</DialogTitle>
//           <div className="flex items-center border-b px-4">
//             <Search className="mr-2 h-5 w-5 shrink-0 text-muted-foreground" />
//             <Input
//               placeholder="Buscar páginas, clientes, faturas..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="border-0 focus-visible:ring-0 py-6 text-base"
//               autoFocus
//             />
//           </div>

//           <div className="max-h-[400px] overflow-y-auto p-2">
//             {filteredCommands.length === 0 ? (
//               <div className="py-12 text-center text-sm text-muted-foreground">
//                 Nenhum resultado encontrado.
//               </div>
//             ) : (
//               <div className="space-y-1">
//                 {filteredCommands.map((cmd) => {
//                   const Icon = cmd.icon;
//                   return (
//                     <button
//                       key={cmd.id}
//                       onClick={() => handleSelect(cmd.href)}
//                       className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors"
//                     >
//                       <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
//                         <Icon className="h-4 w-4 text-muted-foreground" />
//                       </div>
//                       <div className="flex-1">
//                         <div className="font-medium">{cmd.label}</div>
//                         <div className="text-xs text-muted-foreground">
//                           {cmd.category}
//                         </div>
//                       </div>
//                       <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
//                         Abrir
//                       </kbd>
//                     </button>
//                   );
//                 })}
//               </div>
//             )}
//           </div>

//           <div className="border-t p-3 text-xs text-muted-foreground">
//             <div className="flex items-center justify-between">
//               <span>Dica: Use ⌘K ou Ctrl+K para abrir</span>
//               <div className="flex gap-2">
//                 <kbd className="px-2 py-1 rounded bg-muted">↑↓</kbd>
//                 <span>navegar</span>
//                 <kbd className="px-2 py-1 rounded bg-muted">↵</kbd>
//                 <span>selecionar</span>
//               </div>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }
