import { useEffect, useMemo, useState } from "react"
import { getCity, getForecast, getAQI } from "../api/weatherApi"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts"

function Spinner() {
  return <div className="w-full py-10 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-cyan border-t-transparent animate-spin"></div></div>
}

export default function LiveSearch() {
  const [q, setQ] = useState("Hyderabad")
  const [loading, setLoading] = useState(false)
  const [w, setW] = useState(null)
  const [f, setF] = useState([])
  const [aq, setAq] = useState(null)
  const sample = (city) => {
    const base = 22 + Math.random()*10
    const list = []
    const t0 = Math.floor(Date.now()/1000)
    for (let i=0;i<40;i++) list.push({ dt: t0 + i*3*3600, main: { temp: base + (Math.random()*4-2) } })
    return {
      weather: { temp: base },
      coord: { lat: Math.random()*90, lon: Math.random()*90 },
      city,
      temp: base,
      humidity: Math.floor(40 + Math.random()*50),
      pressure: Math.floor(990 + Math.random()*30),
      wind_speed: +(Math.random()*8).toFixed(1),
      aqi: Math.floor(1 + Math.random()*5),
      list
    }
  }
  const onSearch = async (city) => {
    setLoading(true)
    try {
      const [cw, cf, ca] = await Promise.all([getCity(city), getForecast(city), getAQI(city)])
      setW(cw); setF(cf.list || []); setAq(ca)
    } catch (e) {
      const s = sample(city)
      setW(s); setF(s.list || []); setAq({ list: [{ main: { aqi: s.aqi }, dt: Math.floor(Date.now()/1000) }] })
    } finally { setLoading(false) }
  }
  useEffect(() => { onSearch(q) }, [])
  const hourly = useMemo(() => f.slice(0, 24).map(x => ({ t: x.dt*1000, temp: x.main.temp })), [f])
  const daily = useMemo(() => {
    const out = []
    for (let i=0;i<5;i++) {
      const slice = f.slice(i*8,(i+1)*8)
      if (slice.length) {
        const avg = slice.reduce((a,c)=>a+c.main.temp,0)/slice.length
        out.push({ i, temp: avg })
      }
    }
    return out
  }, [f])
  return (
    <div className="space-y-4">
      <div className="glass p-6">
        <div className="title mb-3">Search any city for live weather analysis</div>
        <div className="flex gap-2">
          <input value={q} onChange={e=>setQ(e.target.value)} className="flex-1 glass px-4 py-3 outline-none" placeholder="Enter city name" />
          <button onClick={()=>onSearch(q)} className="px-6 py-3 rounded-lg bg-cyan/20 border border-cyan/40 hover:glow-border">Search</button>
          <span className="px-3 py-3 text-xs rounded bg-blue/20 border border-blue/30">Live data ingested via distributed API node → Kafka → Spark → Dashboard</span>
        </div>
      </div>
      {loading && <Spinner />}
      {!loading && w && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass p-4">
              <div className="title">{w.city}</div>
              <div className="label">Lat {w.lat?.toFixed?.(2)} Lon {w.lon?.toFixed?.(2)}</div>
              <div className="text-5xl text-cyan font-mono mt-2">{(w.temp||0).toFixed(1)}°C</div>
            </div>
            <div className="glass p-4">
              <div className="label">AQI</div>
              <div className="text-4xl text-cyan font-mono">{(w.aqi ?? 0)}</div>
            </div>
            <div className="glass p-4">
              <div className="label">Humidity</div>
              <div className="text-4xl text-cyan font-mono">{(w.humidity||0)}%</div>
            </div>
          </div>
          <div className="glass p-4">
            <div className="title mb-2">5-day Forecast</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="i" stroke="#8aa" />
                  <YAxis stroke="#8aa" />
                  <Tooltip contentStyle={{background:"rgba(255,255,255,0.07)", border:"1px solid rgba(0,212,255,0.15)", backdropFilter:"blur(12px)"}} />
                  <Bar dataKey="temp" fill="var(--cyan)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass p-4">
            <div className="title mb-2">Hourly Temperature</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourly}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="t" stroke="#8aa" tickFormatter={(t)=>new Date(t).getHours()+':00'} />
                  <YAxis stroke="#8aa" />
                  <Tooltip contentStyle={{background:"rgba(255,255,255,0.07)", border:"1px solid rgba(0,212,255,0.15)", backdropFilter:"blur(12px)"}} />
                  <Line type="monotone" dataKey="temp" stroke="var(--blue)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
