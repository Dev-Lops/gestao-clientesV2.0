// "use client";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import Link from "next/link";
// import { useRouter, useSearchParams } from "next/navigation";
// import { FormEvent, useCallback } from "react";

// export interface FilterConfig {
//   name: string;
//   type: "text" | "select" | "date";
//   placeholder?: string;
//   label?: string;
//   options?: Array<{ value: string; label: string }>;
//   defaultValue?: string;
//   className?: string;
// }

// interface FilterBarProps {
//   filters: FilterConfig[];
//   onSubmit?: (params: Record<string, string>) => void;
//   onClear?: () => void;
//   showClearButton?: boolean;
//   submitLabel?: string;
//   className?: string;
// }

// export function FilterBar({
//   filters,
//   onSubmit,
//   onClear,
//   showClearButton = true,
//   submitLabel = "Filtrar",
//   className,
// }: FilterBarProps) {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const isMounted = typeof window !== "undefined";

//   const handleSubmit = useCallback(
//     (e: FormEvent<HTMLFormElement>) => {
//       e.preventDefault();
//       const formData = new FormData(e.currentTarget);
//       const params: Record<string, string> = {};

//       filters.forEach((filter) => {
//         const value = formData.get(filter.name)?.toString();
//         if (value) {
//           params[filter.name] = value;
//         }
//       });

//       if (onSubmit) {
//         onSubmit(params);
//       } else if (isMounted) {
//         // Default behavior: update URL search params
//         const url = new URL(window.location.href);
//         Object.entries(params).forEach(([key, value]) => {
//           url.searchParams.set(key, value);
//         });
//         router.push(url.pathname + url.search);
//       }
//     },
//     [filters, onSubmit, router, isMounted]
//   );

//   const handleClear = useCallback(() => {
//     if (onClear) {
//       onClear();
//     } else if (isMounted) {
//       // Default behavior: clear all filter params
//       router.push(window.location.pathname);
//     }
//   }, [onClear, router, isMounted]);

//   const hasActiveFilters = filters.some((filter) =>
//     searchParams?.get(filter.name)
//   );

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className={className ?? "space-y-6 p-6 bg-white rounded-xl shadow-md"}
//     >
//       <div className="flex flex-col sm:flex-row gap-6 sm:gap-5 items-stretch">
//         <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:gap-3">
//           {filters.map((filter) => {
//             const currentValue = searchParams?.get(filter.name) || filter.defaultValue || "";
//             if (filter.type === "text") {
//               return (
//                 <Input
//                   key={filter.name}
//                   type="text"
//                   name={filter.name}
//                   defaultValue={currentValue}
//                   placeholder={filter.placeholder}
//                   className={filter.className ?? "flex w-full rounded-lg border bg-white px-4 py-3 text-base ring-offset-white file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 border-slate-200 focus-visible:ring-slate-950 h-12"}
//                   aria-label={filter.label || filter.placeholder}
//                 />
//               );
//             }
//             if (filter.type === "select" && filter.options) {
//               return (
//                 <select
//                   key={filter.name}
//                   name={filter.name}
//                   defaultValue={currentValue}
//                   aria-label={filter.label || filter.placeholder}
//                   className="h-12 rounded-lg border border-input bg-background px-4 py-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
//                   defaultValue={currentValue}
//                   placeholder={filter.placeholder}
//                   className={filter.className ?? "h-12 text-base w-40 rounded-lg px-4 py-3"}
//                   aria-label={filter.label || filter.placeholder}
//                 />
//               );
//             }
//             return null;
//           })}
//         </div>
//         {/* Botões de visualização e filtro */}
//         <div className="flex items-center gap-2 border rounded-lg p-2 bg-slate-50">
//           <Link className="p-2 rounded-lg bg-accent hover:bg-accent/80 transition" aria-label="Visualização em grade" href="/clients?view=grid">
//             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grid3x3 lucide-grid-3x3 h-5 w-5" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M3 15h18"></path><path d="M9 3v18"></path><path d="M15 3v18"></path></svg>
//           </Link>
//           <Link className="p-2 rounded-lg hover:bg-accent/20 transition" aria-label="Visualização em lista" href="/clients?view=list">
//             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list h-5 w-5" aria-hidden="true"><path d="M3 5h.01"></path><path d="M3 12h.01"></path><path d="M3 19h.01"></path><path d="M8 5h13"></path><path d="M8 12h13"></path><path d="M8 19h13"></path></svg>
//           </Link>
//         </div>
//         <div className="flex flex-col gap-2 justify-center items-center">
//           <Button type="submit" className="h-12 px-6 py-3 rounded-lg text-base font-semibold" size="sm" variant="default">
//             {submitLabel}
//           </Button>
//           {showClearButton && hasActiveFilters && (
//             <Button
//               type="button"
//               size="sm"
//               variant="outline"
//               onClick={handleClear}
//               className="h-12 px-6 py-3 rounded-lg text-base font-semibold"
//             >
//               Limpar
//             </Button>
//           )}
//         </div>
//       </div>
//     </form>
//   );
// }

// export default FilterBar;
