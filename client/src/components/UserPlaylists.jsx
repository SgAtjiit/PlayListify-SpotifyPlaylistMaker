import React, { useState, useEffect } from 'react';
import { auth } from '../utils/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAvatarUrl } from '../utils/avatar.js';
import axios from 'axios';

const UserPlaylists = () => {
  const [user, setUser] = useState(null);
  const [userAvatar, setUserAvatar] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const url = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const avatarUrl = getAvatarUrl(currentUser);
        setUserAvatar(avatarUrl);
        fetchPlaylists();
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      // Check for token in localStorage first
      const token = localStorage.getItem('spotify_access_token');
      
      if (!token) {
        toast.error('Please connect your Spotify account');
        navigate('/authSpotify');
        return;
      }

      const response = await axios.get(`${url}/playlists`, {
        params: {
          limit: 50,
          offset: 0
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        setPlaylists(response.data.playlists);
        toast.success(`Loaded ${response.data.playlists.length} playlists!`);
      } else {
        toast.error('Failed to fetch playlists');
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        toast.error('Session expired. Please reconnect your Spotify account');
        navigate('/authSpotify');
      } else if (error.response?.status === 403) {
        toast.error('Insufficient permissions. Please reconnect your Spotify account.');
        navigate('/authSpotify');
      } else {
        toast.error('Failed to fetch playlists. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaylistTracks = async (playlistId) => {
    setIsLoadingTracks(true);
    try {
      const token = localStorage.getItem('spotify_access_token');
      
      if (!token) {
        toast.error('Please connect your Spotify account');
        navigate('/authSpotify');
        return;
      }

      const response = await axios.get(`${url}/playlist/${playlistId}/tracks`, {
        params: {
          limit: 50,
          offset: 0
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        setPlaylistTracks(response.data.tracks);
      } else {
        toast.error('Failed to fetch playlist tracks');
      }
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        toast.error('Session expired. Please reconnect your Spotify account');
        navigate('/authSpotify');
      } else {
        toast.error('Failed to fetch playlist tracks');
      }
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handlePlaylistClick = async (playlist) => {
    setSelectedPlaylist(playlist);
    setShowModal(true);
    await fetchPlaylistTracks(playlist.id);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-xl">Loading Your Playlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      {/* Header - Same style as AppFunction */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z"/>
                </svg>
              </div>
              <button onClick={() => navigate('/app')}>
                <span className="hover:text-green-400 transition-colors"> PlayListify</span>
              </button>
            </h1>

            <div className="flex items-center space-x-4">
              {/* Back to App Button */}
              <button
                onClick={() => navigate('/app')}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Back to App
              </button>
              
              {/* Profile Link */}
              <a href="/profile" className="flex-shrink-0">
                <img
                  src={userAvatar}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-green-500 hover:border-green-400 transition-colors"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${(user.displayName || user.email || 'U').charAt(0)}&background=22c55e&color=000&size=200&bold=true`;
                  }}
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Same container style as AppFunction */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Playlists Section */}
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Your Spotify Playlists
            </h2>
            <p className="text-gray-300">
              {playlists.length} playlists found
            </p>
          </div>

          {playlists.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
              </svg>
              <p className="text-gray-400 text-xl">No playlists found</p>
              <p className="text-gray-500 text-sm mt-2">Create some playlists on Spotify first!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => handlePlaylistClick(playlist)}
                  className="bg-gray-700/30 rounded-xl p-4 hover:bg-gray-700/40 transition-all duration-200 cursor-pointer group border border-gray-600/30"
                >
                  {/* Playlist Image */}
                  <div className="mb-4">
                    <img
                      src={playlist.image || '/placeholder-playlist.png'}
                      alt={playlist.name}
                      className="w-full aspect-square rounded-lg shadow-lg group-hover:scale-105 transition duration-200"
                      onError={(e) => {
                        e.target.src = '/placeholder-playlist.png';
                      }}
                    />
                  </div>

                  {/* Playlist Info */}
                  <h3 className="text-white font-semibold text-lg mb-2 truncate group-hover:text-green-400 transition duration-200">
                    {playlist.name}
                  </h3>
                  
                  {playlist.description && (
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                      {playlist.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{playlist.tracks.total} tracks</span>
                    <div className="flex items-center space-x-2">
                      {playlist.public ? (
                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs border border-green-500/30">
                          Public
                        </span>
                      ) : (
                        <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full text-xs border border-gray-500/30">
                          Private
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-500 text-xs mt-1">
                    By {playlist.owner.display_name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => navigate('/top-tracks')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 shadow-lg inline-flex items-center space-x-2"
          >
            <span>🎵</span>
            <span>Top Tracks</span>
          </button>
          <button
            onClick={() => navigate('/top-artists')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50 shadow-lg inline-flex items-center space-x-2"
          >
            <span>🎤</span>
            <span>Top Artists</span>
          </button>
        </div>

        {/* Info Card - Same style as AppFunction */}
        <div className="mt-8 bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Your Playlists</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Click on any playlist to view its tracks and details. You can open playlists directly in Spotify or explore your music collection here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Details Modal */}
      {showModal && selectedPlaylist && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-gray-700/50 shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedPlaylist.image || '/placeholder-playlist.png'}
                    alt={selectedPlaylist.name}
                    className="w-16 h-16 rounded-lg shadow-lg"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedPlaylist.name}</h2>
                    <p className="text-gray-400">{selectedPlaylist.tracks.total} tracks</p>
                    {selectedPlaylist.description && (
                      <p className="text-gray-500 text-sm mt-1">{selectedPlaylist.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {isLoadingTracks ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading tracks...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {playlistTracks.map((item, index) => (
                    <div
                      key={`${item.track.id}-${index}`}
                      className="flex items-center space-x-4 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all duration-200 border border-gray-600/30"
                    >
                      <div className="flex-shrink-0 w-8 text-center">
                        <span className="text-gray-400 text-sm font-medium">{index + 1}</span>
                      </div>
                      
                      <img
                        src={item.track.album.image || '/placeholder-album.png'}
                        alt={item.track.album.name}
                        className="w-12 h-12 rounded shadow-lg"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{item.track.name}</h4>
                        <p className="text-gray-400 text-sm truncate">{item.track.artist}</p>
                        <p className="text-gray-500 text-xs truncate">{item.track.album.name}</p>
                      </div>
                      
                      <div className="text-gray-400 text-sm font-medium">
                        {formatDuration(item.track.duration_ms)}
                      </div>
                      
                      <button
                        onClick={() => window.open(item.track.external_url, '_blank')}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 p-2 rounded-lg transition-all duration-200 border border-green-500/30"
                        title="Open in Spotify"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700/50 flex items-center justify-between">
              <button
                onClick={() => window.open(selectedPlaylist.external_url, '_blank')}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-semibold px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 shadow-lg"
              >
                Open in Spotify
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-600/50 hover:bg-gray-600/70 text-white px-6 py-2 rounded-lg transition-all duration-200 border border-gray-600/50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPlaylists;