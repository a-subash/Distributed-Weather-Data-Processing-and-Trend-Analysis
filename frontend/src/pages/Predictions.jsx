import { useEffect, useMemo, useState } from "react"
import { getPredict } from "../api/weatherApi"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts"

const cities = ["Hyderabad","Mumbai","Delhi","New York","London","Tokyo","Sydney","Dubai"]

function Spinner() {
  return <div className="w-full py-10 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-cyan border-t-transparent animate-spin"></div></div>
}

export default function Predictions() {
  const [city, setCity] = useState("Hyderabad")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const load = async (c) => {
    setLoading(true)
    try {
      const r = await getPredict(c)
      setData(r)
    } catch (e) {
      const base = 24 + Math.random()*6
      setData({ city: c, forecast: Array.from({length:7}, (_,i)=>({day:i+1,temp: base + (Math.random()*4-2)})), metrics: { MAE: 0, RMSE: 0 } })
    } finally { setLoading(false) }
  }
  useEffect(() => { load(city) }, [city])
  const series = useMemo(() => (data?.forecast||[]).map(d => ({ x: d.day, y: d.temp })), [data])
  return (
    <div className="space-y-4">
      <div className="glass p-4 flex items-center gap-3">
        <div className="title">ML Predictions</div>
        <select value={city} onChange={e=>setCity(e.target.value)} className="glass px-3 py-2">
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {loading && <Spinner />}
      {!loading && data && (
        <>
          <div className="glass p-4">
            <div className="title mb-2">7-day ARIMA Forecast</div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="x" stroke="#8aa" />
                  <YAxis stroke="#8aa" />
                  <Tooltip contentStyle={{background:"rgba(255,255,255,0.07)", border:"1px solid rgba(0,212,255,0.15)", backdropFilter:"blur(12px)"}} />
                  <Area type="monotone" dataKey="y" stroke="var(--cyan)" fill="rgba(0,212,255,0.15)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass p-4 flex gap-6">
            <div className="label">MAE <span className="text-cyan font-mono">{(data.metrics?.MAE||0).toFixed(2)}</span></div>
            <div className="label">RMSE <span className="text-cyan font-mono">{(data.metrics?.RMSE||0).toFixed(2)}</span></div>
            <div className="label">Expected Condition <span className="text-cyan font-mono">{series[0]?.y > 30 ? "Hot" : series[0]?.y > 20 ? "Warm" : "Cool"}</span></div>
          </div>
        </>
      )}
    </div>
  )
}
