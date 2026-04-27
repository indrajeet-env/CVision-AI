// Frontend ko backend se communicate jo package ki need padti hai is axios, so we'll install and import it here. Axios is a promise-based HTTP client for the browser and Node.js, which allows us to make HTTP requests to our backend API easily.'

import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3069';
const normalizedApiUrl = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '');

const api = axios.create({
  baseURL: normalizedApiUrl,
  withCredentials: true
})

export async function register({username, email, password}){
  const response = await api.post('/api/auth/register', {
    username, email, password
  });

  return response.data;
}

export async function login({email, password}){
  const response = await api.post('/api/auth/login', {
    email, password
  });

  return response.data;
}

export async function logout(){
  const response = await api.post('/api/auth/logout');
  return response.data;
}

export async function getMe(){
  try{
    const response = await api.get('/api/auth/get-me');
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return null; // User is not authenticated (when logout)
    }  throw error; // Other errors
  }
}


// Ye 4 functions humne create kiye hai, register, login, logout and getMe. Ye functions backend ke corresponding endpoints ke sath interact karenge.