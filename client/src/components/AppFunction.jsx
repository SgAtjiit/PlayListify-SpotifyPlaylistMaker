import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../utils/firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "./Navbar.jsx";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { getAvatarUrl } from "../utils/avatar.js";

const AppFunction = () => {
  const [tsongname, setTSongname] = useState("");
  const [songname, setSongname] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [uname, setUname] = useState("");
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const url = import.meta.env.VITE_API_URL;
  const [simisongs, setsimisongs] = useState([]);
  const [user, setUser] = useState(null);
  const [userAvatar, setUserAvatar] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [componentLoading, setComponentLoading] = useState(true);
  const [tokensFetched, setTokensFetched] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "tsongname") {
      setTSongname(value);
    } else {
      setPlaylistName(value);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      checkAvailability();
    }
  };

  const checkAvailability = async () => {
    if (!tsongname.trim()) {
      toast.error("Enter a song name first!!");
      return;
    }
    
    // Check if Spotify is connected before searching
    if (!isSpotifyConnected) {
      toast.error("Please connect your Spotify account first!");
      navigate('/authSpotify');
      return;
    }

    try {
      // Get the token from localStorage
      const token = localStorage.getItem('spotify_access_token');
      
      if (!token) {
        toast.error('Please reconnect your Spotify account');
        setIsSpotifyConnected(false);
        navigate('/authSpotify');
        return;
      }

      const res = await axios.post(`${url}/search`, {
        songname: tsongname,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setsimisongs(res.data.tracksFound);
      setIsAvailable(true);
      if (res.data.tracksFound.length === 0) {
        toast.error("No similar songs found!");
      } else {
        toast.success("Songs found! Choose one to add.");
      }
    } catch (error) {
      console.error("Search error:", error);
      
      if (error.response?.status === 401) {
        toast.error("Spotify session expired. Please reconnect!");
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        setIsSpotifyConnected(false);
        navigate('/authSpotify');
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again or reconnect Spotify.");
      } else {
        toast.error("Search failed. Please try again!");
      }
    }
  };

  const addToQueue = () => {
    if (!isSpotifyConnected) {
      toast.error("Please connect your Spotify account first!");
      navigate('/authSpotify');
      return;
    }
    if (simisongs.length === 0) {
      toast.error("Please search first and choose a song from results!");
      return;
    }
    toast.error("You can only add from the found songs below!");
  };

  const addSimilarToQueue = (songTitle) => {
    setSongs([...songs, songTitle]);
    setSongname(songTitle);
    setsimisongs([]);
    setTSongname("");
    setIsAvailable(false);
    toast.success(`Added "${songTitle}" to queue!`);
  };

  const removeSong = (index) => {
    setSongs(songs.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (songs.length === 0 || !playlistName) {
      toast.error("Enter at least one song name and a playlist name first!!");
      return;
    }

    // Check if Spotify is connected before creating playlist
    if (!isSpotifyConnected) {
      toast.error("Please connect your Spotify account first!");
      navigate('/authSpotify');
      return;
    }

    const token = localStorage.getItem('spotify_access_token');
    
    if (!token) {
      toast.error('Please reconnect your Spotify account');
      setIsSpotifyConnected(false);
      navigate('/authSpotify');
      return;
    }

    setIsLoading(true);
    try {
      for (let song of songs) {
        await axios.post(`${url}/searchAndAdd`, {
          songname: song,
          playlistName: playlistName,
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      toast.success(`Successfully added ${songs.length} songs to playlist "${playlistName}"!`);
      setSongs([]);
      setPlaylistName("");
      setSongname("");
      setTSongname("");
    } catch (error) {
      console.error("Playlist creation error:", error);
      
      if (error.response?.status === 401) {
        toast.error("Spotify session expired. Please reconnect!");
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        setIsSpotifyConnected(false);
        navigate('/authSpotify');
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again or reconnect Spotify.");
      } else {
        toast.error("Failed to create playlist. Please try again!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkSpotifyAuth = () => {
    const token = localStorage.getItem('spotify_access_token');
    console.log('🔍 Checking Spotify auth, token found:', !!token);
    setIsSpotifyConnected(!!token);
    return !!token;
  };

  const fetchSpotifyTokens = async () => {
    console.log('🔄 Fetching Spotify tokens from server...');
    try {
      const response = await axios.get(`${url}/getTokens`);
      const { access_token, refresh_token } = response.data;
      
      console.log('✅ Tokens received from server:', {
        access_token: access_token ? 'present' : 'missing',
        refresh_token: refresh_token ? 'present' : 'missing'
      });
      
      if (access_token) {
        localStorage.setItem('spotify_access_token', access_token);
        console.log('💾 Access token saved to localStorage');
      }
      
      if (refresh_token) {
        localStorage.setItem('spotify_refresh_token', refresh_token);
        console.log('💾 Refresh token saved to localStorage');
      }
      
      setIsSpotifyConnected(true);
      setTokensFetched(true);
      toast.success('Spotify connected successfully!');
      
      // Verify tokens are actually saved
      const savedToken = localStorage.getItem('spotify_access_token');
      console.log('🔍 Verification - token in localStorage:', !!savedToken);
      
    } catch (error) {
      console.error('❌ Failed to fetch tokens:', error);
      toast.error('Failed to connect Spotify!');
      setIsSpotifyConnected(false);
      setTokensFetched(true);
    }
  };

  useEffect(() => {
    console.log('🚀 AppFunction useEffect triggered');
    
    // Check if user came from Spotify auth
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    
    console.log('🔍 Auth success from URL:', authSuccess);
    
    if (authSuccess === 'success') {
      console.log('✅ Auth success detected, fetching tokens...');
      // Fetch tokens from backend
      fetchSpotifyTokens();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // If not coming from auth, just check existing tokens
      console.log('📋 No auth success, checking existing tokens...');
      checkSpotifyAuth();
      setTokensFetched(true);
    }

    // Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('👤 Firebase user state changed:', !!currentUser);
      setUser(currentUser);
      setUname(currentUser?.displayName || currentUser?.email || 'User');
      
      // Generate and cache avatar URL once
      if (currentUser) {
        const avatarUrl = getAvatarUrl(currentUser);
        setUserAvatar(avatarUrl);
      }
      setComponentLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Separate useEffect to handle redirection after tokens are fetched
  useEffect(() => {
    if (tokensFetched && !isSpotifyConnected && !componentLoading && user) {
      console.log('⚠️ No Spotify connection detected, showing info message');
      toast.error("Please connect your Spotify account to continue");
      // Don't auto-redirect, let user click connect button
    }
  }, [tokensFetched, isSpotifyConnected, componentLoading, user, navigate]);

  // Check if user is authenticated
  if (!user || componentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-xl">
            {!user ? 'Loading User...' : 'Loading App...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        {/* Header - Fully Responsive */}
        <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-black"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z" />
                  </svg>
                </div>
                <button onClick={() => navigate('/app')}>
                  <span className="hover:text-green-400 transition-colors">
                    <span className="hidden sm:inline">PlayListify</span>
                    <span className="sm:hidden">PL</span>
                  </span>
                </button>
              </h1>

              {/* Right side - Mobile Optimized */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Spotify Connection Status - Responsive */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {isSpotifyConnected ? (
                    <div className="flex items-center space-x-1 sm:space-x-2 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs sm:text-sm font-medium">
                        <span className="hidden sm:inline">Connected</span>
                        <span className="sm:hidden">✓</span>
                      </span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => navigate('/authSpotify')}
                      className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/30 text-xs sm:text-sm font-medium transition-colors"
                    >
                      <span className="hidden sm:inline">Connect</span>
                      <span className="sm:hidden">⚠</span>
                    </button>
                  )}
                </div>
                
                <a href="/profile" className="flex-shrink-0">
                  <img
                    src={userAvatar}
                    alt="Profile"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-green-500 hover:border-green-400 transition-colors"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${(user.displayName || user.email || 'U').charAt(0)}&background=22c55e&color=000&size=200&bold=true`;
                    }}
                  />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Spotify Connection Warning - Mobile Optimized */}
        {!isSpotifyConnected && (
          <div className="bg-yellow-500/20 border-l-4 border-yellow-500 p-3 sm:p-4 mx-4 sm:mx-6 mt-4 rounded-r-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <p className="text-yellow-200 text-xs sm:text-sm flex-1">
                <span className="hidden sm:inline">Spotify account not connected. Please connect to create playlists.</span>
                <span className="sm:hidden">Connect Spotify to continue</span>
              </p>
              <button
                onClick={() => navigate('/authSpotify')}
                className="ml-2 sm:ml-4 bg-yellow-500 hover:bg-yellow-600 text-black px-2 sm:px-3 py-1 rounded text-xs font-medium transition-colors flex-shrink-0"
              >
                Connect
              </button>
            </div>
          </div>
        )}


        {/* Main Content - Same as before */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Add Songs Section */}
            <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-gray-700/50">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Add Songs to Queue
                </h2>
                <p className="text-gray-300 text-sm sm:text-base">
                  Build your playlist by adding multiple songs
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Song Name Input - Better Text Visibility */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Song Name
                  </label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Enter song name (e.g., Shape of You)"
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
                        name="tsongname"
                        value={tsongname}
                        disabled={!isSpotifyConnected}
                        className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 sm:px-4 py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 font-medium ${
                          !isSpotifyConnected ? 'opacity-50 cursor-not-allowed' : ''
                        } [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
                        style={{
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden'
                        }}
                        title={tsongname} // Shows full text on hover
                      />
                      {/* Character count indicator */}
                      {tsongname.length > 30 && (
                        <div className="absolute -bottom-5 right-0 text-xs text-gray-500">
                          {tsongname.length} chars
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={checkAvailability}
                        disabled={!tsongname.trim() || !isSpotifyConnected}
                        className={`flex-1 sm:flex-none ${
                          tsongname.trim() && isSpotifyConnected
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-gray-600 cursor-not-allowed"
                        } text-white font-semibold px-3 sm:px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1 text-sm sm:text-base`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <span>Search</span>
                      </button>

                      <button
                        onClick={addToQueue}
                        disabled={simisongs.length === 0 || !isSpotifyConnected}
                        className={`flex-1 sm:flex-none ${
                          simisongs.length === 0 || !isSpotifyConnected
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600"
                        } text-black font-semibold px-4 sm:px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1 text-sm sm:text-base`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Similar Songs Display - Better Song Name Visibility */}
                {simisongs.length > 0 && (
                  <div className="bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-gray-600/50">
                    <h4 className="text-white font-medium mb-3 flex items-center space-x-2 text-sm sm:text-base">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                      <span>Found Songs ({simisongs.length}):</span>
                    </h4>
                    <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                      {simisongs.map((song, index) => (
                        <div
                          key={index}
                          className="bg-gray-800/50 rounded-lg p-2 sm:p-3 border border-gray-600/30 flex items-center justify-between hover:bg-gray-800/70 transition-colors group"
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                            {song.image && (
                              <img
                                src={song.image}
                                alt={song.song}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p 
                                className="text-white font-medium text-xs sm:text-sm truncate hover:text-green-400 transition-colors cursor-pointer"
                                title={song.song} // Shows full song name on hover
                              >
                                {song.song}
                              </p>
                              <p 
                                className="text-gray-400 text-xs truncate"
                                title={song.artist} // Shows full artist name on hover
                              >
                                {song.artist}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => addSimilarToQueue(song.song)}
                            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium px-2 sm:px-3 py-1 rounded text-xs transition-all duration-200 border border-green-500/30 flex-shrink-0 group-hover:scale-105"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Playlist Name Input - Better Text Visibility */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Playlist Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter playlist name (e.g., My Favorites)"
                      onChange={handleChange}
                      name="playlistName"
                      value={playlistName}
                      disabled={!isSpotifyConnected}
                      className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 sm:px-4 py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 font-medium ${
                        !isSpotifyConnected ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title={playlistName} // Shows full text on hover
                    />
                    {/* Character count indicator */}
                    {playlistName.length > 25 && (
                      <div className="absolute -bottom-5 right-0 text-xs text-gray-500">
                        {playlistName.length} chars
                      </div>
                    )}
                  </div>
                </div>

                {/* Create Playlist Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || songs.length === 0 || !playlistName.trim() || !isSpotifyConnected}
                  className={`w-full font-semibold py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 shadow-lg disabled:hover:scale-100 text-sm sm:text-base ${
                    songs.length > 0 && playlistName.trim() && !isLoading && isSpotifyConnected
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {isLoading ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    )}
                    <span>
                      {isLoading
                        ? "Creating Playlist..."
                        : `Create Playlist (${songs.length} songs)`}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Songs Queue Section - Better Song Name Visibility */}
            <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-gray-700/50">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Songs Queue
                </h3>
                <p className="text-gray-300 text-sm sm:text-base">
                  {songs.length} songs ready to be added
                </p>
              </div>

              {songs.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <svg
                    className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                  <p className="text-gray-400 text-sm sm:text-base">No songs added yet</p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    Add some songs to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
                  {songs.map((song, index) => (
                    <div
                      key={index}
                      className="bg-gray-700/30 rounded-lg p-3 sm:p-4 flex items-center justify-between border border-gray-600/30 hover:bg-gray-700/40 transition-colors group"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-green-400 font-semibold text-xs sm:text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <span 
                          className="text-white font-medium text-sm sm:text-base truncate hover:text-green-400 transition-colors cursor-pointer"
                          title={song} // Shows full song name on hover
                        >
                          {song}
                        </span>
                      </div>
                      <button
                        onClick={() => removeSong(index)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1 flex-shrink-0 group-hover:scale-110"
                        title="Remove song"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {songs.length > 0 && (
                <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-600/50">
                  <button
                    onClick={() => setSongs([])}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium py-2 px-4 rounded-lg transition-all duration-200 border border-red-500/30 text-sm sm:text-base"
                  >
                    Clear All Songs
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="mt-6 sm:mt-8 bg-gray-700/30 rounded-lg p-4 sm:p-6 border border-gray-600/50">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white mb-1">How to Use</h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  1. Connect your Spotify account first<br />
                  2. Enter a song name and click <span className="text-blue-400">Search</span> to find similar songs<br />
                  3. Select songs from the results to add them to your queue<br />
                  4. Enter a playlist name and click <span className="text-green-400">Create Playlist</span> to add all songs to Spotify
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppFunction;