// "use client";

// import { Button } from "@/components/ui/button";
// import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useState } from "react";

// export interface FilterConfig {
//   name: string;
//   type: "text" | "select" | "date";
//   placeholder?: string;
//   label?: string;
//   options?: Array<{ value: string; label: string }>;
//   defaultValue?: string;
//   className?: string;
// }

// interface FilterBarModalProps {
//   filters: FilterConfig[];
//   open: boolean;
//   setOpen: (open: boolean) => void;
//   onSubmit?: (params: Record<string, string>) => void;
//   onClear?: () => void;
//   submitLabel?: string;
// }

// export function FilterBarModal({ filters, open, setOpen, onSubmit, onClear, submitLabel = "Filtrar" }: FilterBarModalProps) {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [formState, setFormState] = useState<Record<string, string>>({});

//   const handleChange = (name: string, value: string) => {
//     setFormState((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (onSubmit) {
//       onSubmit(formState);
//     } else {
//       const url = new URL(window.location.href);
//       Object.entries(formState).forEach(([key, value]) => {
//         url.searchParams.set(key, value);
//       });
//       router.push(url.pathname + url.search);
//       setOpen(false);
//     }
//   };

//   const handleClear = () => {
//     setFormState({});
//     if (onClear) {
//       onClear();
//     } else {
//       router.push(window.location.pathname);
//       setOpen(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogContent className="max-w-md p-6 rounded-xl">
//         <DialogTitle className="mb-4 text-lg font-bold text-center">Filtros avançados</DialogTitle>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           {filters.map((filter) => {
//             const value = formState[filter.name] ?? searchParams?.get(filter.name) ?? "";
//             if (filter.type === "text") {
//               return (
//                 <Input
//                   key={filter.name}
//                   type="text"
//                   name={filter.name}
//                   value={value}
//                   onChange={(e) => handleChange(filter.name, e.target.value)}
//                   placeholder={filter.placeholder}
//                   className={filter.className ?? "w-full rounded-lg border px-4 py-3 text-base"}
//                   aria-label={filter.label || filter.placeholder}
//                 />
//               );
//             }
//             if (filter.type === "select" && filter.options) {
//               return (
//                 <select
//                   key={filter.name}
//                   name={filter.name}
//                   value={value}
//                   onChange={(e) => handleChange(filter.name, e.target.value)}
//                   aria-label={filter.label || filter.placeholder}
//                   className="w-full h-12 rounded-lg border px-4 py-3 text-base"
//                 >
//                   {filter.options.map((opt) => (
//                     <option key={opt.value} value={opt.value}>
//                       {opt.label}
//                     </option>
//                   ))}
//                 </select>
//               );
//             }
//             if (filter.type === "date") {
//               return (
//                 <Input
//                   key={filter.name}
//                   type="date"
//                   name={filter.name}
//                   value={value}
//                   onChange={(e) => handleChange(filter.name, e.target.value)}
//                   placeholder={filter.placeholder}
//                   className={filter.className ?? "w-full h-12 rounded-lg px-4 py-3 text-base"}
//                   aria-label={filter.label || filter.placeholder}
//                 />
//               );
//             }
//             return null;
//           })}
//           <div className="flex gap-2 justify-end mt-4">
//             <Button type="button" variant="outline" onClick={handleClear}>
//               Limpar
//             </Button>
//             <Button type="submit" variant="default">
//               {submitLabel}
//             </Button>
//           </div>
//         </form>
//         <DialogClose asChild>
//           <Button variant="ghost" className="absolute top-4 right-4">Fechar</Button>
//         </DialogClose>
//       </DialogContent>
//     </Dialog>
//   );
// }

// export default FilterBarModal;
