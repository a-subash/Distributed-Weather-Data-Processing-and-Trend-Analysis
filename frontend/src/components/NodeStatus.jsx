import { useEffect, useState } from "react"
import { getSystem, isOffline, pingBackend, setOffline } from "../api/weatherApi"

const nodes = [
  "Hyderabad","Mumbai","Delhi","New York","London","Tokyo","Sydney","Dubai"
]

export default function NodeStatus() {
  const [tp, setTp] = useState(0)
  const [records, setRecords] = useState(0)
  useEffect(() => {
    let m = true
    const load = async () => {
      if (isOffline()) return
      try {
        const s = await getSystem()
        if (!m) return
        setTp(s.kafka_throughput || 0)
        setRecords(r => r + Math.round((s.kafka_throughput || 0)))
      } catch (e) { setOffline(true) }
    }
    const boot = async () => {
      await pingBackend()
      if (!isOffline()) load()
    }
    boot()
    const t = setInterval(load, 5000)
    return () => { m = false; clearInterval(t) }
  }, [])
  return (
    <div className="space-y-3">
      <div className="glass p-4 title">Distributed Nodes</div>
      {nodes.map((n, i) => {
        const status = i % 7 === 0 ? "error" : i % 5 === 0 ? "idle" : "active"
        const color = status === "active" ? "bg-success" : status === "idle" ? "bg-yellow-400" : "bg-warn"
        return (
          <div key={n} className="glass p-3 flex items-center justify-between relative overflow-hidden">
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${color}`}></span>
              <div className="font-syne">{n}</div>
            </div>
            <div className="label text-xs">latency {(20 + i * 3)}ms • records {1000 + i*73}</div>
            {status === "active" && <span className="absolute inset-0 rounded-lg border border-cyan/30 animate-pulseRing"></span>}
          </div>
        )
      })}
      <div className="glass p-4 text-center">
        <div className="label">Throughput</div>
        <div className="text-cyan font-mono text-2xl">{tp.toFixed(1)} rec/s</div>
      </div>
      <div className="glass p-6 text-center">
        <div className="label mb-1">Total Records</div>
        <div className="text-4xl text-cyan font-mono">{records.toLocaleString()}</div>
      </div>
    </div>
  )
}
