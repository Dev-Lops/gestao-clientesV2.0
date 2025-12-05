/**
 * Barrel export para componentes base
 * Facilita importação: import { Button, Card } from '@/components/atoms'
 */

export { Button, buttonVariants } from './Button'
export type { ButtonProps } from './Button'

export { Input, inputVariants } from './Input'
export type { InputProps } from './Input'

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './Card'

export { Badge, badgeVariants } from './Badge'
export type { BadgeProps } from './Badge'

export {
  CardSkeleton,
  LoadingOverlay,
  Skeleton,
  Spinner,
  TableRowSkeleton,
} from './Loading'

export { EmptyState } from './EmptyState'
export type { EmptyStateProps } from './EmptyState'
