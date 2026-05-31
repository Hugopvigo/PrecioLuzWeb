interface Props { dark: boolean }

export default function AuroraBackground({ dark }: Props) {
  const bg = dark ? '#080912' : '#E9EDF6'
  const blobs = dark
    ? [
        { color: '#7C3AFF55', top: '5%',  left: '20%', w: '55vw', h: '45vw', delay: '0s' },
        { color: '#1E6BFF44', top: '40%', left: '55%', w: '50vw', h: '40vw', delay: '-5s' },
        { color: '#00D3A433', top: '60%', left: '5%',  w: '45vw', h: '35vw', delay: '-10s' },
        { color: '#FF2D8430', top: '15%', left: '65%', w: '40vw', h: '30vw', delay: '-15s' },
      ]
    : [
        { color: '#FFB3D166', top: '5%',  left: '20%', w: '55vw', h: '45vw', delay: '0s' },
        { color: '#B4D2FF55', top: '40%', left: '55%', w: '50vw', h: '40vw', delay: '-5s' },
        { color: '#B2FFE444', top: '60%', left: '5%',  w: '45vw', h: '35vw', delay: '-10s' },
        { color: '#FFECB055', top: '15%', left: '65%', w: '40vw', h: '30vw', delay: '-15s' },
      ]

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: bg }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          className="aurora-blob"
          style={{
            background: `radial-gradient(ellipse, ${b.color} 0%, transparent 70%)`,
            top: b.top, left: b.left,
            width: b.w, height: b.h,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  )
}
