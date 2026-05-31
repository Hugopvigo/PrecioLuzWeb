import { ReactNode, CSSProperties } from 'react'

interface Props {
  children: ReactNode
  dark: boolean
  className?: string
  style?: CSSProperties
}

export default function GlassCard({ children, dark, className = '', style }: Props) {
  return (
    <div
      className={`rounded-2xl border backdrop-blur-md ${className}`}
      style={{
        background:   dark ? 'rgba(42,30,76,0.40)'    : 'rgba(255,255,255,0.33)',
        borderColor:  dark ? 'rgba(255,255,255,0.13)'  : 'rgba(255,255,255,0.85)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
