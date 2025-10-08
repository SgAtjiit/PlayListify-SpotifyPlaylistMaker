import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const Authenticate = () => {
  const url = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  // Check if Spotify is authenticated
  const checkSpotifyAuth = () => {
    const token = localStorage.getItem('spotify_access_token');
    return !!token;
  };

  // Validate token with Spotify API
  const validateSpotifyToken = async (token) => {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.status === 200;
    } catch (error) {
      console.log('Token validation failed:', error);
      return false;
    }
  };

  const fetchSpotifyTokens = async () => {
    try {
      const response = await axios.get(`${url}/getTokens`);
      const { access_token, refresh_token } = response.data;
      
      localStorage.setItem('spotify_access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('spotify_refresh_token', refresh_token);
      }
      
      console.log('✅ Spotify tokens stored successfully');
      toast.success('Spotify connected successfully!');
      navigate('/app');
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      toast.error('Failed to connect Spotify!');
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      // Check if user came from Spotify auth
      const urlParams = new URLSearchParams(window.location.search);
      const authSuccess = urlParams.get('auth');
      
      if (authSuccess === 'success') {
        // Fetch tokens from backend
        await fetchSpotifyTokens();
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // Check if token exists in localStorage
      const hasToken = checkSpotifyAuth();
      
      if (hasToken) {
        const token = localStorage.getItem('spotify_access_token');
        
        // Validate the token
        const isValid = await validateSpotifyToken(token);
        
        if (isValid) {
          toast.success('Already authenticated! Redirecting...');
          navigate('/app');
          return;
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('spotify_access_token');
          localStorage.removeItem('spotify_refresh_token');
          toast.error('Session expired. Please authenticate again.');
        }
      }
      
      setIsChecking(false);
    };

    checkAuthentication();
  }, [navigate]);

  const handleSpotifyLogin = () => {
    window.location.href = `${url}/login`; // backend ka /login route
  };

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-xl">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-gray-700/50 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Spotify-like logo/icon */}
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.32 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Spotify Playlist Maker
          </h1>
          
          <p className="text-gray-300 mb-8">
            Connect your Spotify account to create and manage playlists
          </p>
          
          <button 
            onClick={handleSpotifyLogin}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 shadow-lg"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.32 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <span>Connect with Spotify</span>
            </div>
          </button>
          
          <p className="text-gray-400 text-sm mt-4">
            Secure authentication powered by Spotify
          </p>
        </div>
      </div>
    </div>
  )
}

export default Authenticate