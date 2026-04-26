// Without Protected:

// 👉 Anyone can open:
// /dashboard
// /profile
// /settings
// Even if they are not logged in ❌

import {useAuth} from "../hooks/useAuth.js";
import React, { Children, useEffect } from 'react'
import {Navigate} from "react-router-dom";


const Protected = ({children}) => {
  const {loading, user} = useAuth();

  if(loading){
    return(
      <main>
        <h1>Loading...</h1>
      </main>
    )
  }

    if(!user){
      return <Navigate to="/login" /> // Agar user authenticated nahi hai to login page pe redirect kar denge
    }


  return children;
};

export default Protected