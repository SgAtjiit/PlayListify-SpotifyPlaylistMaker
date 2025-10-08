import React, { useState } from "react";
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail 
} from "firebase/auth";
import { auth, provider } from "../utils/firebase.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation function
  const isValidPassword = (password) => {
    return password.length >= 6;
  };

  // Check if form is valid
  const isFormValid = () => {
    return isValidEmail(email) && isValidPassword(password);
  };

  // Google Login
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      console.log("Firebase ID Token:", token);
      toast.success(`Welcome ${result.user.displayName}!`);
      navigate('/authSpotify');
    } catch (err) {
      console.error("Google Login Error:", err);
      toast.error("Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Email/Password Login or Signup
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      if (!isValidEmail(email)) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (!isValidPassword(password)) {
        toast.error("Password must be at least 6 characters long");
        return;
      }
    }

    setIsLoading(true);
    try {
      let userCred;
      
      if (isLogin) {
        console.log("Attempting login with:", email);
        
        // First check if user exists
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.length === 0) {
            toast.error("No account found with this email. Please sign up first.");
            setIsLogin(false);
            setIsLoading(false);
            return;
          }
        } catch (checkError) {
          console.log("Error checking user existence:", checkError);
          // Continue with login attempt if check fails
        }
        
        userCred = await signInWithEmailAndPassword(auth, email, password);
        toast.success(`Welcome back!`);
      } else {
        console.log("Attempting signup with:", email);
        
        // Check if user already exists before signup
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.length > 0) {
            toast.error("Email already in use. Try signing in instead.");
            setIsLogin(true);
            setIsLoading(false);
            return;
          }
        } catch (checkError) {
          console.log("Error checking user existence:", checkError);
          // Continue with signup attempt if check fails
        }
        
        userCred = await createUserWithEmailAndPassword(auth, email, password);
        toast.success(`Account created successfully!`);
      }
      
      const token = await userCred.user.getIdToken();
      console.log("Firebase ID Token:", token);
      navigate('/authSpotify');
      
    } catch (err) {
      console.error("Auth Error Details:", err);
      
      // Handle specific Firebase errors
      switch (err.code) {
        case 'auth/user-not-found':
          toast.error("No account found with this email. Please sign up first.");
          setIsLogin(false);
          break;
        case 'auth/wrong-password':
          toast.error("Incorrect password. Please try again.");
          break;
        case 'auth/email-already-in-use':
          toast.error("Email already in use. Try signing in instead.");
          setIsLogin(true);
          break;
        case 'auth/weak-password':
          toast.error("Password should be at least 6 characters");
          break;
        case 'auth/invalid-email':
          toast.error("Invalid email address format");
          break;
        case 'auth/too-many-requests':
          toast.error("Too many failed attempts. Please try again later.");
          break;
        case 'auth/network-request-failed':
          toast.error("Network error. Please check your connection.");
          break;
        case 'auth/invalid-credential':
          toast.error("Invalid email or password. Please check your credentials.");
          break;
        case 'auth/user-disabled':
          toast.error("This account has been disabled. Please contact support.");
          break;
        case 'auth/operation-not-allowed':
          toast.error("Email/password authentication is not enabled.");
          break;
        default:
          toast.error(`Authentication failed: ${err.message}`);
          console.error("Unhandled error code:", err.code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-gray-700/50 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-gray-300">
            {isLogin ? "Sign in to your account" : "Create a new account to get started"}
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !isFormValid()}
            className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 shadow-lg disabled:hover:scale-100 ${
              isFormValid() && !isLoading
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              )}
              <span>
                {isLoading 
                  ? (isLogin ? "Signing In..." : "Creating Account...") 
                  : (isLogin ? "Sign In" : "Create Account")
                }
              </span>
            </div>
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="mt-4 w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300/50 shadow-lg disabled:hover:scale-100 disabled:opacity-50"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </div>
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>

        
        
      </div>
    </div>
  );
};

export default LoginPage;