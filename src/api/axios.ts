import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    withCredentials: true,          // include cookies automatically
})

// Add a request interceptor to include credentials in every request
API.interceptors.request.use((config) => {
    const Token = localStorage.getItem("token");
    if (Token) {
        config.headers["Authorization"] = `Bearer ${Token}`;
    }
    return config;
});

export default API;
