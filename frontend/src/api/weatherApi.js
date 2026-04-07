import axios from "axios"

const storedBase = (() => {
  try {
    return localStorage.getItem("api_base") || ""
  } catch (e) {
    return ""
  }
})()

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || storedBase || "http://localhost:8000",
  timeout: 10000
})

let OFFLINE = true
export const isOffline = () => OFFLINE
export const setOffline = (v) => { OFFLINE = !!v }

let FAILS = 0
export const pingBackend = async () => {
  const candidates = []
  const env = import.meta.env.VITE_API_BASE
  if (env) candidates.push(env)
  if (api.defaults.baseURL) candidates.push(api.defaults.baseURL)
  candidates.push("http://localhost:8000")
  candidates.push("http://127.0.0.1:8000")
  candidates.push("http://localhost:8010")
  candidates.push("http://127.0.0.1:8010")
  const uniq = [...new Set(candidates)].filter(Boolean)
  try {
    for (const base of uniq) {
      api.defaults.baseURL = base
      try {
        await api.get("/api/system", { timeout: 5000 })
        OFFLINE = false
        FAILS = 0
        try {
          localStorage.setItem("api_base", base)
        } catch (e) {}
        return
      } catch (e) {}
    }
    FAILS++
    if (FAILS >= 2) OFFLINE = true
  } catch (e) {
    FAILS++
    if (FAILS >= 2) OFFLINE = true
  }
}

const guard = (fn) => (...args) => {
  if (OFFLINE) return Promise.reject(new Error("offline"))
  return fn(...args)
}

export const getSystem = guard(() => api.get("/api/system").then(r => r.data))
export const getLive = guard(() => api.get("/api/weather/live").then(r => r.data))
export const getCity = guard((city) => api.get(`/api/weather/city/${encodeURIComponent(city)}`).then(r => r.data))
export const getForecast = guard((city) => api.get(`/api/weather/forecast/${encodeURIComponent(city)}`).then(r => r.data))
export const getAQI = guard((city) => api.get(`/api/weather/aqi/${encodeURIComponent(city)}`).then(r => r.data))
export const getAnomalies = guard(() => api.get("/api/weather/anomalies").then(r => r.data))
export const getHistory = guard(() => api.get("/api/weather/history").then(r => r.data))
export const getPredict = guard((city) => api.get(`/api/predict/${encodeURIComponent(city)}`).then(r => r.data))

export const getConfig = guard(() => api.get("/api/config").then(r => r.data))
export const setApiKey = guard((apiKey) => api.post("/api/config/api-key", { api_key: apiKey }).then(r => r.data))

export default api
