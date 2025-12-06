'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Filter, X } from 'lucide-react'
import { ReactNode } from 'react'

interface AdvancedFilterProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  dateFrom: string
  onDateFromChange: (value: string) => void
  dateTo: string
  onDateToChange: (value: string) => void
  amountMin?: string
  onAmountMinChange?: (value: string) => void
  amountMax?: string
  onAmountMaxChange?: (value: string) => void
  statusFilter?: string
  onStatusChange?: (value: string) => void
  statusOptions?: Array<{ value: string; label: string }>
  onClear: () => void
  children?: ReactNode
}

export default function AdvancedFilters({
  searchTerm,
  onSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  amountMin,
  onAmountMinChange,
  amountMax,
  onAmountMaxChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  onClear,
  children,
}: AdvancedFilterProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            type="text"
            placeholder="Descrição, cliente, categoria..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="dateFrom">Data Inicial</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="dateTo">Data Final</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </div>
        </div>

        {amountMin !== undefined && amountMax !== undefined && onAmountMinChange && onAmountMaxChange && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="amountMin">Valor Mínimo</Label>
              <Input
                id="amountMin"
                type="number"
                value={amountMin}
                onChange={(e) => onAmountMinChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="amountMax">Valor Máximo</Label>
              <Input
                id="amountMax"
                type="number"
                value={amountMax}
                onChange={(e) => onAmountMaxChange(e.target.value)}
              />
            </div>
          </div>
        )}

        {statusFilter !== undefined && onStatusChange && statusOptions && (
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              aria-label="Filtrar por status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <option value="">Todos</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {children}
      </CardContent>
    </Card>
  )
}

