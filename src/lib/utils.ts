import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Converte uma string de data no formato YYYY-MM-DD para um objeto Date
 * ajustado para o timezone local, evitando problemas de diferença de dias.
 *
 * @param dateString - Data no formato YYYY-MM-DD (do input type="date")
 * @returns Date object com a data correta no timezone local
 */
export function parseDateInput(dateString: string): Date {
  if (!dateString) return new Date();

  // Separa ano, mês e dia da string
  const [year, month, day] = dateString.split("-").map(Number);

  // Cria a data no timezone local (mês é 0-indexed no JS)
  return new Date(year, month - 1, day);
}

/**
 * Converte um objeto Date para string no formato YYYY-MM-DD
 * usado em inputs type="date", mantendo a data local correta.
 *
 * @param date - Objeto Date ou string de data
 * @returns String no formato YYYY-MM-DD
 */
export function formatDateInput(
  date: Date | string | null | undefined,
): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Converte uma data local para ISO string preservando a data local
 * (não converte para UTC, evitando mudança de dia)
 *
 * @param date - Objeto Date no timezone local
 * @returns String ISO com a data local preservada
 */
export function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");

  // Mantém 'Z' para preservar contrato dos testes: usa componentes locais
  // e marca como UTC para evitar que toISOString() desloque a data.
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
}

/**
 * Converte string ISO para Date local, tratando corretamente o timezone
 * para evitar problemas com mudança de dia na exibição
 *
 * @param isoString - String no formato ISO
 * @returns Date object com a data correta
 */
export function parseISOToLocal(isoString: string): Date {
  // Se a string vier no formato YYYY-MM-DD (sem hora), trata como data local
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    const [year, month, day] = isoString.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  // Caso contrário, converte normalmente
  return new Date(isoString);
}
