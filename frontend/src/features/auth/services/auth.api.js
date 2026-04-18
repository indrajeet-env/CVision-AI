// Frontend ko backend se communicate jo package ki need padti hai is axios, so we'll install and import it here. Axios is a promise-based HTTP client for the browser and Node.js, which allows us to make HTTP requests to our backend API easily.'

import axios from 'axios';
const api = axios.create({
  baseURL: 'http://localhost:3069',
  withCredentials: true
})

export async function register({username, email, password}){
  try{
    const reponse = await api.post('/api/auth/register', {
      username, email, password
    })

    return reponse.data;
  }
  catch(error){
    console.error('Error registering user:', error);
  }
}

export async function login({email, password}){
  try{
    const response = await api.post('/api/auth/login', {
      email, password
    })

    return response.data;
  }catch(error){
    console.error('Error logging in user:', error);
  }
}

export async function logout(){
  try{
    const response = await api.post('/api/auth/logout');

    return response.data;
  }catch(error){
    console.error('Error logging out user:', error);
  }
}

export async function getMe(){
  try{
    const response = await api.get('/api/auth/get-me');

    return response.data;
  }catch(error){
    console.error('Error fetching user details:', error);
  }
}


// Ye 4 functions humne create kiye hai, register, login, logout and getMe. Ye functions backend ke corresponding endpoints ke sath interact karenge.