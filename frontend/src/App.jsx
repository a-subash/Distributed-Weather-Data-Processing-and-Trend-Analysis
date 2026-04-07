import { useEffect, useState } from "react"
import Navbar from "./components/Navbar.jsx"
import NodeStatus from "./components/NodeStatus.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Trends from "./pages/Trends.jsx"
import Predictions from "./pages/Predictions.jsx"
import LiveSearch from "./pages/LiveSearch.jsx"

function App() {
  const [page, setPage] = useState("dashboard")
  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (hash) setPage(hash)
    const onHash = () => setPage(window.location.hash.replace("#", "") || "dashboard")
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])
  return (
    <div className="min-h-screen bg-bg">
      <div className="dot-grid"></div>
      <Navbar />
      <div className="flex">
        <aside className="hidden lg:block w-80 p-4">
          <NodeStatus />
        </aside>
        <main className="flex-1 p-4 space-y-4">
          {page === "dashboard" && <Dashboard />}
          {page === "trends" && <Trends />}
          {page === "predictions" && <Predictions />}
          {page === "search" && <LiveSearch />}
        </main>
      </div>
      <footer className="p-4 text-center text-xs label">© Distributed Weather Data Processing</footer>
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        <a href="#dashboard" className="px-3 py-2 glass hover:glow-border">Dashboard</a>
        <a href="#search" className="px-3 py-2 glass hover:glow-border">Live Search</a>
        <a href="#trends" className="px-3 py-2 glass hover:glow-border">Trends</a>
        <a href="#predictions" className="px-3 py-2 glass hover:glow-border">ML</a>
      </nav>
    </div>
  )
}

export default App
