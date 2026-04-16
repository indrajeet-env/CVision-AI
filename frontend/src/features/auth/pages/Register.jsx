import React from 'react'
import '../auth.form.scss'

import { useNavigate, Link } from 'react-router'

const Register = () => {
  const navigate = useNavigate(); // use navigate to redirect to login page after successful registration

  const handleSubmit = (e) => {
    e.preventDefault();
  }
  return (
    <main>
      <div className="form-container">
        <h1>Register</h1>

        <form> 
          {/* // Register asks for name, email and password */}
          <div className="input-group">
            <label htmlFor="username">User Name</label>
            <input type="text" id="username" name="username" placeholder="Enter username" required />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" placeholder="Enter your email" required />
          </div>  
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter your password" required />
          </div>

          <button type="submit" className='button primary-button' >Register</button>
        </form>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </main>
  )
}

export default Register