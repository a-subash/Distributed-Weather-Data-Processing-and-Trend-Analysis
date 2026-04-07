import { useEffect, useRef, useState } from "react"
import { getAnomalies, isOffline, pingBackend, setOffline } from "../api/weatherApi"

function Badge({ sev }) {
  const map = {
    LOW: "bg-blue/20 text-blue",
    MEDIUM: "bg-yellow-500/20 text-yellow-400",
    HIGH: "bg-warn/20 text-warn",
    CRITICAL: "bg-red-600/30 text-red-400"
  }
  return <span className={`px-2 py-1 rounded-full text-xs font-mono ${map[sev] || "bg-blue/20 text-blue"}`}>{sev}</span>
}

export default function AnomalyFeed() {
  const [items, setItems] = useState([])
  const first = useRef(true)
  useEffect(() => {
    let m = true
    const load = async () => {
      if (isOffline()) return
      try {
        const r = await getAnomalies()
        if (!m) return
        const next = r.items || []
        const sliced = next.slice(0, 8)
        setItems(sliced)
      } catch (e) { setOffline(true) }
    }
    const boot = async () => {
      await pingBackend()
      if (!isOffline()) load()
    }
    boot()
    const t = setInterval(load, 10000)
    return () => { m = false; clearInterval(t) }
  }, [])
  return (
    <div className="glass p-4 border-warn/30 border">
      <div className="title mb-3">Anomalies</div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {items.map((a, i) => (
          <div key={i} className="animate-slideIn flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div className="flex items-center gap-3">
              <Badge sev={a.severity || "LOW"} />
              <div className="font-syne">{a.city}</div>
            </div>
            <div className="label text-xs">{a.description}</div>
            <div className="label text-xs">{new Date((a.timestamp || 0) * 1000).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
