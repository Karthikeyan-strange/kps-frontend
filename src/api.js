import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://my-backend-gdvs.onrender.com/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default api;
