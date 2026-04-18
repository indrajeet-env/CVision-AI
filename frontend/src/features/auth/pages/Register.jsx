import React, {useState} from 'react';
import '../auth.form.scss';

import { useNavigate, Link } from 'react-router'; 
import {useAuth} from '../hooks/useAuth.js';

const Register = () => {
  const navigate = useNavigate(); // use navigate to redirect to login page after successful registration
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const {loading, handleRegister} = useAuth(); // useAuth hook se loading state aur handleRegister function ko access karenge

  const handleSubmit = async(e) => {
    e.preventDefault();
    await handleRegister({username, email, password}); // handleRegister function ko call karenge jab form submit hoga, isme username, email aur password pass karenge
    navigate('/') // Registration successful hone ke baad home page pe redirect kar denge
  }

  if(loading){
    return (
      <main>
        <h1>Loading...</h1>
      </main>
    )
  }
  return (
    <main>
      <div className="form-container">
        <h1>Register</h1>

        <form onSubmit={handleSubmit}> 
          {/* // Register asks for name, email and password */}
          <div className="input-group">
            <label htmlFor="username">User Name</label>
            <input 
              onChange={(e) => {setUsername(e.target.value)}}
              type="text" id="username" name="username" placeholder="Enter username" required />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              onChange={(e) => {setEmail(e.target.value)}}
              type="email" id="email" name="email" placeholder="Enter your email" required />
          </div>  
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              onChange={(e) => {setPassword(e.target.value)}}
              type="password" id="password" name="password" placeholder="Enter your password" required />
            </div>

          <button type="submit" className='button primary-button' >Register</button>
        </form>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </main>
  )
}

export default Register