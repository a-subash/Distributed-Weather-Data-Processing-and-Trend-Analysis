import { useEffect, useMemo, useState } from "react"
import { getLive, getSystem } from "../api/weatherApi"
import MetricCard from "../components/MetricCard.jsx"
import AnomalyFeed from "../components/AnomalyFeed.jsx"
import Pipeline from "../components/Pipeline.jsx"
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts"

function Spinner() {
  return <div className="w-full py-10 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-cyan border-t-transparent animate-spin"></div></div>
}

export default function Dashboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [tp, setTp] = useState(0)

  const sample = () => {
    const cities = ["Hyderabad","Mumbai","Delhi","New York","London","Tokyo","Sydney","Dubai"]
    return cities.map(c => ({
      city: c,
      temp: +(20 + Math.random()*10).toFixed(1),
      humidity: Math.floor(40 + Math.random()*50),
      pressure: Math.floor(990 + Math.random()*30),
      wind_speed: +(Math.random()*10).toFixed(1),
      aqi: Math.floor(1 + Math.random()*5),
      rain_1h: +(Math.random()*5).toFixed(1)
    }))
  }

  const load = async () => {
    try {
      setLoading(true)
      const r = await getLive()
      setData(r.data || [])
      setLoading(false)
    } catch (e) {
      setData(sample())
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
    const t1 = setInterval(load, 30000)
    const t2 = setInterval(async () => {
      try {
        const s = await getSystem()
        setTp(s.kafka_throughput || 0)
      } catch (e) {}
    }, 2000)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  const metrics = useMemo(() => {
    const spark = (k) => data.map((d,i) => ({ v: d[k] || 0, i }))
    const f = (k, unit="") => ({
      value: data.reduce((a,c)=>a+(c[k]||0),0)/Math.max(1,data.length),
      unit,
      spark: spark(k)
    })
    return {
      temp: f("temp","°C"),
      humidity: f("humidity","%"),
      wind: f("wind_speed"," m/s"),
      pressure: f("pressure"," hPa"),
      aqi: f("aqi",""),
      rain: f("rain_1h"," mm")
    }
  }, [data])

  const lineData = useMemo(() => {
    return data.map(d => ({ name: d.city, temp: d.temp }))
  }, [data])

  return (
    <div className="space-y-4">
      {loading && <Spinner />}
      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricCard title="Temperature" value={metrics.temp.value} unit={metrics.temp.unit} data={metrics.temp.spark} color="cyan" />
            <MetricCard title="Humidity" value={metrics.humidity.value} unit={metrics.humidity.unit} data={metrics.humidity.spark} color="blue" />
            <MetricCard title="Wind" value={metrics.wind.value} unit={metrics.wind.unit} data={metrics.wind.spark} color="success" />
            <MetricCard title="Pressure" value={metrics.pressure.value} unit={metrics.pressure.unit} data={metrics.pressure.spark} color="cyan" />
            <MetricCard title="AQI" value={metrics.aqi.value} unit={metrics.aqi.unit} data={metrics.aqi.spark} color="warn" />
            <MetricCard title="Rain" value={metrics.rain.value} unit={metrics.rain.unit} data={metrics.rain.spark} color="blue" />
          </div>
          <div className="glass p-4">
            <div className="title mb-2">Multi-city Temperature</div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="city" stroke="#8aa" />
                  <YAxis stroke="#8aa" />
                  <Tooltip contentStyle={{background:"rgba(255,255,255,0.07)", border:"1px solid rgba(0,212,255,0.15)", backdropFilter:"blur(12px)"}} />
                  <Legend />
                  <Line type="monotone" dataKey="temp" stroke="var(--cyan)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Pipeline throughput={tp} />
            </div>
            <AnomalyFeed />
          </div>
        </>
      )}
    </div>
  )
}
