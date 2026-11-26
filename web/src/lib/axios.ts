import axios from "axios"
const baseURL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(
  /\/$/,
  ""
)
export const httpClient = axios.create({ baseURL, timeout: 20000 })
export const refreshClient = axios.create({ baseURL, timeout: 20000 })
