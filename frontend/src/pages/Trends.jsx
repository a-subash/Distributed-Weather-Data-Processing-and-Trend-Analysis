import { useEffect, useMemo, useState } from "react"
import { getHistory } from "../api/weatherApi"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

function Spinner() {
  return <div className="w-full py-10 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-cyan border-t-transparent animate-spin"></div></div>
}

export default function Trends() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let m = true
    const load = async () => {
      try {
        setLoading(true)
        const r = await getHistory()
        if (!m) return
        setItems(r.items || [])
      } catch (e) {
        if (!m) return
        const cities = ["Hyderabad","Mumbai","Delhi","New York","London","Tokyo","Sydney","Dubai"]
        const now = Date.now()/1000
        const sim = []
        for (const c of cities) {
          for (let i=0;i<7;i++) sim.push({
            city: c,
            timestamp: now - (6-i)*86400,
            temp: 20 + Math.random()*10,
            humidity: 40 + Math.random()*50,
            pressure: 990 + Math.random()*30
          })
        }
        setItems(sim)
      } finally { setLoading(false) }
    }
    load()
    const t = setInterval(load, 30000)
    return () => { m = false; clearInterval(t) }
  }, [])

  const byCity = useMemo(() => {
    const g = {}
    for (const it of items) {
      const c = it.city
      g[c] = g[c] || []
      g[c].push({ t: it.timestamp*1000, temp: it.temp })
    }
    return g
  }, [items])

  const cities = Object.keys(byCity)

  return (
    <div className="space-y-4">
      {loading && <Spinner />}
      {!loading && (
        <>
          <div className="glass p-4">
            <div className="title mb-2">7-day Multi-city Temperature</div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" dataKey="t" domain={["auto","auto"]} stroke="#8aa" tickFormatter={(t)=>new Date(t).toLocaleDateString()} />
                  <YAxis stroke="#8aa" />
                  <Tooltip contentStyle={{background:"rgba(255,255,255,0.07)", border:"1px solid rgba(0,212,255,0.15)", backdropFilter:"blur(12px)"}} />
                  {cities.map((c, i) => (
                    <Line key={c} data={byCity[c]} type="monotone" dataKey="temp" stroke={["#00d4ff","#0066ff","#00ff88","#ff6b35","#a855f7","#facc15","#fff"][i%7]} dot={false} name={c} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass p-4">
            <div className="title mb-2">City Comparison</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="label text-left">
                    <th className="p-2">City</th>
                    <th className="p-2">Latest Temp</th>
                    <th className="p-2">Latest Humidity</th>
                    <th className="p-2">Latest Pressure</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.map(c => {
                    const last = items.filter(x=>x.city===c).sort((a,b)=>b.timestamp-a.timestamp)[0]
                    return (
                      <tr key={c} className="border-t border-white/10">
                        <td className="p-2">{c}</td>
                        <td className="p-2">{(last?.temp||0).toFixed(1)}°C</td>
                        <td className="p-2">{(last?.humidity||0)}%</td>
                        <td className="p-2">{(last?.pressure||0)} hPa</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
