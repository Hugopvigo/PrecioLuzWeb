import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '' }: Props) {
  return (
    <div className={`rounded-2xl border border-line bg-surface ${className}`}>
      {children}
    </div>
  )
}
