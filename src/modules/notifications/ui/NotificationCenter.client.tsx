// "use client";

// import { Button } from "@/components/ui/button";
// import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
// import { Bell } from "lucide-react";
// import Link from "next/link";
// import { useEffect, useRef, useState } from "react";

// export function NotificationCenter() {
//   const [open, setOpen] = useState(false);
//   type Notification = {
//     id: string;
//     title: string;
//     message: string;
//     link?: string;
//     timeISO?: string;
//     unread: boolean;
//   };
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [markingAll, setMarkingAll] = useState(false);
//   const firstUnreadRef = useRef<HTMLLIElement>(null);

//   // Busca notificações reais
//   useEffect(() => {
//     if (!open) return;
//     setLoading(true);
//     (async () => {
//       try {
//         const r = await fetch("/api/notifications");
//         if (!r.ok) throw new Error("Erro ao buscar notificações");
//         const data = await r.json();
//         setNotifications(data.notifications || []);
//       } catch {
//         setNotifications([]);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [open]);

//   // Marca como lida ao abrir
//   useEffect(() => {
//     if (open && notifications.some((n) => n.unread)) {
//       fetch("/api/notifications", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ action: "mark_multiple_read", ids: notifications.filter((n) => n.unread).map((n) => n.id) }),
//       }).then(() => {
//         setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
//       });
//     }
//   }, [open, notifications]);

//   // Marcar todas como lidas
//   const handleMarkAllRead = async () => {
//     setMarkingAll(true);
//     await fetch("/api/notifications", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ action: "mark_all_read" }),
//     });
//     setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
//     setMarkingAll(false);
//   };

//   // Acessibilidade: foco no primeiro não lido
//   useEffect(() => {
//     if (open && firstUnreadRef.current) {
//       firstUnreadRef.current.focus();
//     }
//   }, [open, notifications]);

//   return (
//     <div className="relative">
//       <Button variant="ghost" className="rounded-full p-2" onClick={() => setOpen(true)} aria-label="Notificações">
//         <Bell className="w-6 h-6" />
//         {notifications.some((n: any) => n.unread) && (
//           <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500" />
//         )}
//       </Button>
//       <Dialog open={open} onOpenChange={setOpen}>
//         <DialogContent className="max-w-sm p-4">
//           <DialogTitle className="mb-2 text-base font-bold">Notificações</DialogTitle>
//           <div className="flex justify-between items-center mb-2">
//             <span className="text-xs text-muted-foreground">{loading ? "Carregando..." : `${notifications.length} notificações`}</span>
//             <Button size="sm" variant="outline" onClick={handleMarkAllRead} disabled={markingAll || loading}>
//               Marcar todas como lidas
//             </Button>
//           </div>
//           <ul className="space-y-3 max-h-80 overflow-y-auto">
//             {notifications.length === 0 ? (
//               <li className="text-sm text-muted-foreground">Nenhuma notificação.</li>
//             ) : (
//               notifications.map((n: any, idx: number) => (
//                 <li
//                   key={n.id}
//                   tabIndex={n.unread ? 0 : -1}
//                   ref={n.unread && !notifications.slice(0, idx).some((x: any) => x.unread) ? firstUnreadRef : undefined}
//                   className={`p-3 rounded-lg border flex flex-col gap-1 ${n.unread ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200"}`}
//                 >
//                   <div className="font-semibold text-sm mb-1 flex justify-between items-center">
//                     <span>{n.title}</span>
//                     <span className="text-xs text-muted-foreground">{n.timeISO ? new Date(n.timeISO).toLocaleString("pt-BR") : ""}</span>
//                   </div>
//                   <div className="text-xs text-muted-foreground">{n.message}</div>
//                   {n.link && (
//                     <Link href={n.link} className="text-xs text-blue-600 underline mt-1">Ver mais</Link>
//                   )}
//                 </li>
//               ))
//             )}
//           </ul>
//           <DialogClose asChild>
//             <Button variant="outline" className="mt-4 w-full">Fechar</Button>
//           </DialogClose>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
