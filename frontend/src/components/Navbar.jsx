import { useEffect, useState } from "react"
import { Zap, KeyRound } from "lucide-react"
import { getConfig, setApiKey, isOffline, pingBackend } from "../api/weatherApi"

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return <span className="font-mono">{now.toLocaleTimeString()}</span>
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [haveKey, setHaveKey] = useState(false)
  const [keyVal, setKeyVal] = useState("")
  const [online, setOnline] = useState(false)
  const load = async () => {
    try { 
      await pingBackend()
      if (!isOffline()) {
        const r = await getConfig()
        setHaveKey(r.has_key)
      }
    } catch (e) {}
  }
  useEffect(() => { 
    load() 
    const t = setInterval(async () => {
      await pingBackend()
      setOnline(!isOffline())
    }, 3000)
    return () => clearInterval(t)
  }, [])
  const save = async () => {
    try {
      await pingBackend()
      if (!isOffline()) {
        await setApiKey(keyVal)
      }
      setHaveKey(true)
      setOpen(false)
      localStorage.setItem("owm_has_key", "1")
    } catch (e) {}
  }
  return (
    <div className="sticky top-0 z-50 glass backdrop-blur-md border-b border-cyan/20">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-cyan/20 text-cyan"><Zap size={18} /></div>
          <div className="title tracking-widest">BIG DATA WEATHER ANALYTICS</div>
        </div>
        <div className="label">{<Clock />}</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-ping"></span>
          <span className="px-3 py-1 rounded-full bg-success/20 text-success font-mono text-xs">SYSTEM OPERATIONAL</span>
          <span className={`px-3 py-1 rounded-full ${online ? "bg-success/20 text-success" : "bg-warn/20 text-warn"} font-mono text-xs`}>{online ? "BACKEND ONLINE" : "BACKEND OFFLINE"}</span>
          <button onClick={()=>setOpen(v=>!v)} className="px-2 py-1 rounded-lg bg-blue/20 border border-blue/40 hover:glow-border flex items-center gap-1">
            <KeyRound size={14} /><span className="text-xs">{haveKey ? "API Key Set" : "Set API Key"}</span>
          </button>
        </div>
      </div>
      {open && (
        <div className="max-w-screen-2xl mx-auto px-4 pb-4">
          <div className="glass p-3 flex items-center gap-2">
            <input className="flex-1 bg-transparent outline-none px-3 py-2" placeholder="Paste OpenWeatherMap API Key" value={keyVal} onChange={e=>setKeyVal(e.target.value)} />
            <button onClick={save} className="px-3 py-2 rounded-lg bg-cyan/20 border border-cyan/40 hover:glow-border">Save</button>
          </div>
        </div>
      )}
    </div>
  )
}
