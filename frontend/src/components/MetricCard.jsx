import { LineChart, Line, ResponsiveContainer } from "recharts"
import { useEffect, useRef, useState } from "react"

function useCountUp(value, duration = 600) {
  const [v, setV] = useState(value || 0)
  const ref = useRef()
  useEffect(() => {
    const start = performance.now()
    const init = v
    const delta = (value || 0) - init
    let af
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration)
      setV(init + delta * p)
      if (p < 1) af = requestAnimationFrame(tick)
    }
    af = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(af)
  }, [value])
  return v
}

export default function MetricCard({ title, value, unit, data, color="cyan" }) {
  const v = useCountUp(value ?? 0)
  return (
    <div className="glass card-grad glow-border p-4">
      <div className="label mb-1">{title}</div>
      <div className="text-5xl font-mono text-cyan">{Number.isFinite(v) ? v.toFixed(1) : "--"}{unit}</div>
      <div className="h-12 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="v" stroke={`var(--${color})`} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
