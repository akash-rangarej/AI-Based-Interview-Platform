import { createContext, useContext, useState } from "react";

export const AuthContext = createContext();//holds the user’s authentication state and any associated functions to update it.

export const useAuthContext = () => {
	return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
	const [authUser, setAuthUser] = useState(JSON.parse(localStorage.getItem("token")) || null);//gets the data from localstorage and sets it in authuser.it will have the loggedin user data
    
	return <AuthContext.Provider value={{ authUser, setAuthUser }}>
        {children}
        </AuthContext.Provider>;
};//children is a special prop in React that contains all elements or components nested inside this component in the JSX.
 // here the children is app which  contains all elements 