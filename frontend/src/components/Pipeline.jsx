import { Database, Cog, Rocket, Cloud, LineChart as ChartIcon, Server } from "lucide-react"

const stages = [
  { name: "Data Sources", icon: Cloud },
  { name: "Kafka Queue", icon: Server },
  { name: "Spark Stream", icon: Cog },
  { name: "HDFS Storage", icon: Database },
  { name: "Analytics Engine", icon: Rocket },
  { name: "Dashboard", icon: ChartIcon },
]

export default function Pipeline({ throughput=0 }) {
  return (
    <div className="glass p-6 w-full">
      <div className="title mb-4">Big Data Pipeline</div>
      <div className="flex items-center justify-between relative">
        {stages.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.name} className="flex flex-col items-center text-center gap-2">
              <div className="w-16 h-16 rounded-full bg-cyan/10 flex items-center justify-center border border-cyan/30 relative">
                <Icon className="text-cyan" />
                <span className="absolute inset-0 rounded-full border border-cyan/30 animate-pulseRing"></span>
              </div>
              <div className="label">{s.name}</div>
              <div className="text-xs text-cyan font-mono">{throughput.toFixed(1)} rec/s</div>
            </div>
          )
        })}
        <svg className="absolute left-0 right-0 -z-10" height="64" width="100%">
          <line x1="8%" y1="32" x2="92%" y2="32" stroke="rgba(255,255,255,0.2)" strokeDasharray="6 6"></line>
          <circle r="4" cy="32" fill="var(--cyan)">
            <animate attributeName="cx" values="8%;92%" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </div>
  )
}
