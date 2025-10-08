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
  const [componentLoading,setComponentLoading] = useState(false)
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

//   const checkAvailability = async () => {
//     if (!tsongname.trim()) {
//       toast.error("Enter a song name first!!");
//       return;
//     }
    
//     // Check if Spotify is connected before searching
//     if (!isSpotifyConnected) {
//       toast.error("Please connect your Spotify account first!");
//       navigate('/authSpotify');
//       return;
//     }

//     try {
//       const res = await axios.post(`${url}/search`, {
//         songname: tsongname,
//       });
//       setsimisongs(res.data.tracksFound);
//       setIsAvailable(true);
//       if (res.data.tracksFound.length === 0) {
//         toast.error("No similar songs found!");
//       } else {
//         toast.success("Songs found! Choose one to add.");
//       }
//     } catch (error) {
//       toast.error("Oops some error occurred!!");
//       console.log("An error occurred!!", error);
//       // If token expired, redirect to auth
//       if (error.response?.status === 401) {
//         toast.error("Spotify session expired. Please reconnect!");
//         localStorage.removeItem('spotify_access_token');
//         localStorage.removeItem('spotify_refresh_token');
//         navigate('/authSpotify');
//       }
//     }
//   };

  // Disable normal Add button, only allow from similar songs list
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
        navigate('/authSpotify');
        return;
      }

      const res = await axios.post(`${url}/search`, {
        songname: tsongname,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
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
      toast.error("Oops some error occurred!!");
      console.log("An error occurred!!", error);
      // If token expired, redirect to auth
      if (error.response?.status === 401) {
        toast.error("Spotify session expired. Please reconnect!");
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        setIsSpotifyConnected(false);
        navigate('/authSpotify');
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

//   const handleSubmit = async () => {
//     if (songs.length === 0 || !playlistName) {
//       toast.error("Enter at least one song name and a playlist name first!!");
//       return;
//     }

//     // Check if Spotify is connected before creating playlist
//     if (!isSpotifyConnected) {
//       toast.error("Please connect your Spotify account first!");
//       navigate('/authSpotify');
//       return;
//     }

//     setIsLoading(true);
//     try {
//       for (let song of songs) {
//         await axios.post(`${url}/searchAndAdd`, {
//           songname: song,
//           playlistName: playlistName,
//         });
//       }
//       toast.success(`Successfully added ${songs.length} songs to playlist!`);
//       setSongs([]);
//       setPlaylistName("");
//       setSongname("");
//       setTSongname("");
//     } catch (error) {
//       toast.error("Oops an error occurred!!");
//       console.log(`An error occurred: ${error}`);
//       // If token expired, redirect to auth
//       if (error.response?.status === 401) {
//         toast.error("Spotify session expired. Please reconnect!");
//         localStorage.removeItem('spotify_access_token');
//         localStorage.removeItem('spotify_refresh_token');
//         setIsSpotifyConnected(false);
//         navigate('/authSpotify');
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

  // Check if Spotify is authenticated
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
            'Authorization': `Bearer ${token}`
          }
        });
      }
      toast.success(`Successfully added ${songs.length} songs to playlist!`);
      setSongs([]);
      setPlaylistName("");
      setSongname("");
      setTSongname("");
    } catch (error) {
      toast.error("Oops an error occurred!!");
      console.log(`An error occurred: ${error}`);
      // If token expired, redirect to auth
      if (error.response?.status === 401) {
        toast.error("Spotify session expired. Please reconnect!");
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        setIsSpotifyConnected(false);
        navigate('/authSpotify');
      }
    } finally {
      setIsLoading(false);
    }
  };
  const checkSpotifyAuth = () => {
    const token = localStorage.getItem('spotify_access_token');
    setIsSpotifyConnected(!!token);
    return !!token;
  };

   useEffect(() => {
    // Check if user came from Spotify auth
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    
    if (authSuccess === 'success') {
      // Fetch tokens from backend
      fetchSpotifyTokens();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setUname(currentUser?.displayName || currentUser?.email || 'User');
      
      // Generate and cache avatar URL once
      if (currentUser) {
        const avatarUrl = getAvatarUrl(currentUser);
        setUserAvatar(avatarUrl);
      }
      setComponentLoading(false); // Set loading to false after user is set
    });

    // Check Spotify authentication status
    const isAuthenticated = checkSpotifyAuth();
    
    // If user is not authenticated with Spotify, redirect to auth
    if (!isAuthenticated && !authSuccess) {
      toast.info("Please connect your Spotify account to continue");
      navigate('/authSpotify');
    }

    return () => unsubscribe();
  }, [navigate]);


    
  const fetchSpotifyTokens = async () => {
    try {
      const response = await axios.get(`${url}/getTokens`);
      const { access_token, refresh_token } = response.data;
      
      localStorage.setItem('spotify_access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('spotify_refresh_token', refresh_token);
      }
      
      setIsSpotifyConnected(true);
      console.log('✅ Spotify tokens stored successfully');
      toast.success('Spotify connected successfully!');
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      toast.error('Failed to connect Spotify!');
      setIsSpotifyConnected(false);
      navigate('/authSpotify');
    }
  };

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-xl">Loading...</p>
        </div>
      </div>
    );
  }
   if (componentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-xl">Loading App...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700/50">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-black"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z" />
                  </svg>
                </div>
                <button onClick={() => navigate('/app')}>
                  <span className="hover:text-green-400 transition-colors">PlayListify</span>
                </button>
              </h1>

              <div className="flex items-center space-x-4">
                {/* Spotify Connection Status */}
               <div className="flex items-center space-x-2">
                  {isSpotifyConnected ? (
                    <span className="text-green-400 text-sm flex items-center space-x-1">
                      
                      <span>Connected with Spotify!!</span>
                    </span>
                  ) : (
                    <button 
                      onClick={() => navigate('/authSpotify')}
                      className="text-gray-400 hover:text-white text-sm flex items-center space-x-1 transition-colors"
                    >
                      <span>Connect Spotify</span>
                    </button>
                  )}
                </div>
                <a href="/profile" className="flex-shrink-0">
                  <img
                    src={userAvatar}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-green-500 hover:border-green-400 transition-colors"
                    onError={(e) => {
                      // Fallback if avatar fails to load
                      e.target.src = `https://ui-avatars.com/api/?name=${(user.displayName || user.email || 'U').charAt(0)}&background=22c55e&color=000&size=200&bold=true`;
                    }}
                  />
                </a>
                 

              </div>
            </div>
          </div>
        </div>

        {/* Spotify Connection Warning */}
        {!isSpotifyConnected && (
          <div className="bg-yellow-500/20 border-l-4 border-yellow-500 p-4 mx-6 mt-4 rounded-r-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <p className="text-yellow-200 text-sm">
                Spotify account not connected. Please connect to create playlists.
              </p>
              <button
                onClick={() => navigate('/authSpotify')}
                className="ml-4 bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded text-xs font-medium transition-colors"
              >
                Connect Now
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Add Songs Section */}
            <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Add Songs to Queue
                </h2>
                <p className="text-gray-300">
                  Build your playlist by adding multiple songs
                </p>
              </div>

              <div className="space-y-6">
                {/* Song Name Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Song Name
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Enter song name (e.g., Shape of You)"
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
                        name="tsongname"
                        value={tsongname}
                        disabled={!isSpotifyConnected}
                        className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                          !isSpotifyConnected ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                    <button
                      onClick={checkAvailability}
                      disabled={!tsongname.trim() || !isSpotifyConnected}
                      className={`${
                        tsongname.trim() && isSpotifyConnected
                          ? "bg-blue-500 hover:bg-blue-600"
                          : "bg-gray-600 cursor-not-allowed"
                      } text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-1`}
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

                    {/* Add button disabled until results appear */}
                    <button
                      onClick={addToQueue}
                      disabled={simisongs.length === 0 || !isSpotifyConnected}
                      className={`${
                        simisongs.length === 0 || !isSpotifyConnected
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600"
                      } text-black font-semibold px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-1`}
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

                {/* Similar Songs Display */}
                {simisongs.length > 0 && (
                  <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                    <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-green-400"
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
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {simisongs.map((song, index) => (
                        <div
                          key={index}
                          className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/30 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            {song.image && (
                              <img
                                src={song.image}
                                alt={song.song}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="text-white font-medium text-sm">
                                {song.song}
                              </p>
                              <p className="text-gray-400 text-xs">
                                {song.artist}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => addSimilarToQueue(song.song)}
                            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium px-3 py-1 rounded text-xs transition-all duration-200 border border-green-500/30"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Playlist Name Input */}
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
                      className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                        !isSpotifyConnected ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Create Playlist Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || songs.length === 0 || !playlistName.trim() || !isSpotifyConnected}
                  className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 shadow-lg disabled:hover:scale-100 ${
                    songs.length > 0 && playlistName.trim() && !isLoading && isSpotifyConnected
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg
                        className="w-5 h-5"
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

            {/* Songs Queue Section */}
            <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Songs Queue
                </h3>
                <p className="text-gray-300">
                  {songs.length} songs ready to be added
                </p>
              </div>

              {songs.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
                  <p className="text-gray-400">No songs added yet</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Add some songs to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {songs.map((song, index) => (
                    <div
                      key={index}
                      className="bg-gray-700/30 rounded-lg p-4 flex items-center justify-between border border-gray-600/30 hover:bg-gray-700/40 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-green-400 font-semibold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-white font-medium">{song}</span>
                      </div>
                      <button
                        onClick={() => removeSong(index)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                        title="Remove song"
                      >
                        <svg
                          className="w-5 h-5"
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
                <div className="mt-6 pt-4 border-t border-gray-600/50">
                  <button
                    onClick={() => setSongs([])}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium py-2 px-4 rounded-lg transition-all duration-200 border border-red-500/30"
                  >
                    Clear All Songs
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="mt-8 bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-blue-400 mt-0.5"
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
                <p className="text-sm text-gray-300 leading-relaxed">
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