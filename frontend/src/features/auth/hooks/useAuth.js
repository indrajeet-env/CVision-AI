// The Hook layer

import {useContext, useEffect, useRef} from "react"
import {AuthContext} from "../auth.context.jsx"
import {login, register, logout, getMe} from "../services/auth.api.js"

const getErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message || fallbackMessage;
};

export const useAuth = () => {
  const context =  useContext(AuthContext);
  const {user, setUser, loading, setLoading} = context;
  const hasFetchedUser = useRef(false);

// ye pura flow hai ki kaise hum user ke login ko handle krrhe hoge
  const handleLogin = async ({email, password}) => {
 
// pehle hum loading state ko true kar denge, taki UI me pata chale ki login process chal rha hai, 
// phir hum login function ko call karenge jo auth.api.js me defined hai (this is basically the API call)
// APi ka jo bhi response aayega uske andar jo bhi user ayega usey set kr denge context me, taki baki ke components me bhi user ki details available ho
// login process complete hone ke baad loading state ko false kar denge, chahe login successful ho ya fail, isliye finally block me setLoading(false) likha hai

    setLoading(true); 
    try{
      const data = await login({email, password});
      setUser(data.user); // backend ke auth.controller.js se jo user ka data milta hai (jab last mai return krte hai hum user ko bhi as response) usey set kr denge context me, taki baki ke components me bhi user ki details available ho
      return { success: true, message: data?.message };
    }catch(error){
      console.error('Login failed:', error);
      return {
        success: false,
        message: getErrorMessage(error, "Unable to login. Please try again."),
      };
    }finally{
      setLoading(false); // Login process end hone par loading false kar denge
    }
  }

// register ke liye bhi same flow follow karenge, bas register function call karenge login ki jagah, aur user ko set kar denge response se 

  const handleRegister = async({username, email, password}) => {
    setLoading(true);
    try{
      const data = await register({username, email, password});
      setUser(data.user);
      return { success: true, message: data?.message };
    }catch(error){
      console.error('Registration failed:', error);
      return {
        success: false,
        message: getErrorMessage(error, "Unable to register. Please try again."),
      };
    }finally{
      setLoading(false);
    }
  }

  const handleLogout = async() => {
    setLoading(true);
    try{
      await logout(); // logout function call karenge auth.api.js se, isme hume response se user ki details ki jarurat nahi hai, kyuki logout hone ke baad user ki details humare context se remove kar denge
      setUser(null); // logout hone ke baad user ki details context se remove kar denge, isliye setUser(null) karenge
    }catch(error){
      console.error('Logout failed:', error);
    }finally{
      setLoading(false);
    }
  }

// Fixing the page refresh wali problem, whenever we refresh page then user ki details lost ho jati thi, isliye humne useEffect me getMe function call kiya hai, taki jab bhi page refresh ho to getMe function call ho aur user ki details ko dobara set kar de context me, taki user refresh hone ke baad bhi authenticated rahe      

  useEffect(() =>{
    if (hasFetchedUser.current) {
      return;
    }
    hasFetchedUser.current = true;

    const getAndSetUser = async() => {
      try{
        const data = await getMe(); // getMe function call karenge auth.api.js se, isme hume response se user ki details milengi, agar user authenticated hai to, agar nahi hai to error aayega
        if(data && data.user){ // agar user authenticated hai to uski details ko set kar denge context me, taki baki ke components me bhi user ki details available ho
          setUser(data.user);
        } else{
          setUser(null); // agar user authenticated nahi hai to context me user ki details null set kar denge
        }
      } catch(error){
        if(error.response && error.response.status === 401){
          setUser(null); // agar error ka status 401 hai, iska matlab user authenticated nahi hai, to user ki details context se remove kar denge, isliye setUser(null) karenge
        } else{
          console.error('Error fetching user details:', error);
        }
      } finally{
        setLoading(false); // user data fetch karne ke baad loading false kar denge, chahe user authenticated ho ya nahi, isliye finally block me setLoading(false) likha hai
      }
    }
    getAndSetUser();
  }, []) // ye useEffect tab chalega jab component mount hoga, isme hum getAndSetUser function call karenge, jo ki getMe function ko call karega aur user ki details ko set karega context me, taki baki ke components me bhi user ki details available ho

  return {user, loading, handleLogin, handleRegister, handleLogout}
}

// ye hook layer ko hum humare pages ya components me use karenge, jaha bhi hume user ke login, register ya logout functionality ki jarurat hai, isse hum easily access kar sakte hai user ki details aur loading state ko, aur handleLogin, handleRegister, handleLogout functions ko call kar sakte hai jab hume unki jarurat ho.