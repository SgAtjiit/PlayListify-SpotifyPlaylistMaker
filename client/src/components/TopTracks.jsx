import React, { useState, useEffect } from 'react';
import { auth } from '../utils/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAvatarUrl } from '../utils/avatar.js';
import axios from 'axios';

const TopTracks = () => {
  const [user, setUser] = useState(null);
  const [userAvatar, setUserAvatar] = useState("");
  const [topTracks, setTopTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('medium_term');
  const [limit, setLimit] = useState(20);
  const navigate = useNavigate();
  const url = import.meta.env.VITE_API_URL;

  // Time range options
  const timeRangeOptions = [
    { value: 'short_term', label: 'Last 4 Weeks', emoji: '📅' },
    { value: 'medium_term', label: 'Last 6 Months', emoji: '📊' },
    { value: 'long_term', label: 'All Time', emoji: '🏆' }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const avatarUrl = getAvatarUrl(currentUser);
        setUserAvatar(avatarUrl);
        fetchTopTracks();
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate, timeRange, limit]);

  const fetchTopTracks = async () => {
    setIsLoading(true);
    try {
      // Check for token in localStorage first
      const token = localStorage.getItem('spotify_access_token');
      
      if (!token) {
        toast.error('Please connect your Spotify account');
        navigate('/authSpotify');
        return;
      }

      const response = await axios.get(`${url}/top/tracks`, {
        params: {
          time_range: timeRange,
          limit: limit,
          offset: 0
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        setTopTracks(response.data.items);
        toast.success(`Loaded ${response.data.items.length} top tracks!`);
      } else {
        toast.error('Failed to fetch top tracks');
      }
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        toast.error('Session expired. Please reconnect your Spotify account');
        navigate('/authSpotify');
      } else {
        toast.error('Failed to fetch top tracks');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeRangeChange = (newTimeRange) => {
    setTimeRange(newTimeRange);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-xl">Loading Your Top Tracks...</p>
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
                <span className="hover:text-green-400 transition-colors">PlayListify</span>
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
        {/* Controls Section */}
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">Your Top Tracks</h2>
            <p className="text-gray-300">Discover your most played songs on Spotify</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Time Range Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Time Period</label>
              <div className="grid grid-cols-1 gap-2">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleTimeRangeChange(option.value)}
                    className={`p-3 rounded-lg transition-all duration-200 flex items-center space-x-3 border ${
                      timeRange === option.value
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-gray-700/30 text-gray-300 border-gray-600/30 hover:bg-gray-700/40'
                    }`}
                  >
                    <span className="text-lg">{option.emoji}</span>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Limit Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Number of Tracks</label>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              >
                <option value={10}>Top 10 Tracks</option>
                <option value={20}>Top 20 Tracks</option>
                <option value={30}>Top 30 Tracks</option>
                <option value={50}>Top 50 Tracks</option>
              </select>
              
              {/* Current Selection Info */}
              <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
                <p className="text-gray-300 text-sm">
                  Showing your <span className="text-green-400 font-medium">top {limit} tracks</span> from{' '}
                  <span className="text-blue-400 font-medium">
                    {timeRangeOptions.find(opt => opt.value === timeRange)?.label.toLowerCase()}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Tracks Display */}
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">
              Your Top {limit} Tracks
            </h3>
            <p className="text-gray-300">
              {timeRangeOptions.find(opt => opt.value === timeRange)?.label} • {topTracks.length} tracks found
            </p>
          </div>

          {topTracks.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
              </svg>
              <p className="text-gray-400 text-xl">No top tracks found</p>
              <p className="text-gray-500 text-sm mt-2">Try listening to more music on Spotify!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {topTracks.map((track, index) => (
                <div
                  key={track.id}
                  className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 hover:bg-gray-700/40 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 text-center">
                      <span className={`text-lg font-bold ${
                        index === 0 ? 'text-yellow-400' : 
                        index === 1 ? 'text-gray-300' : 
                        index === 2 ? 'text-orange-400' : 'text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                    </div>

                    {/* Album Art */}
                    <div className="flex-shrink-0">
                      <img
                        src={track.album.image || '/placeholder-album.png'}
                        alt={track.album.name}
                        className="w-16 h-16 rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.src = '/placeholder-album.png';
                        }}
                      />
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-lg truncate group-hover:text-green-400 transition duration-200">
                        {track.name}
                      </h4>
                      <p className="text-gray-300 truncate">{track.artist}</p>
                      <p className="text-gray-400 text-sm truncate">{track.album.name}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex-shrink-0 text-right space-y-1">
                      <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium border border-green-500/30">
                        {track.popularity}% popular
                      </div>
                      <div className="text-gray-400 text-sm font-medium">
                        {formatDuration(track.duration_ms)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      {track.preview_url && (
                        <button
                          onClick={() => window.open(track.preview_url, '_blank')}
                          className="bg-gray-600/50 hover:bg-gray-600/70 text-white p-2 rounded-lg transition-all duration-200 border border-gray-600/50"
                          title="Preview Track"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => window.open(track.external_url, '_blank')}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 p-2 rounded-lg transition-all duration-200 border border-green-500/30"
                        title="Open in Spotify"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => navigate('/top-artists')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50 shadow-lg inline-flex items-center space-x-2"
          >
            <span>🎤</span>
            <span>View Top Artists</span>
          </button>
          <button
            onClick={() => navigate('/playlists')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 shadow-lg inline-flex items-center space-x-2"
          >
            <span>📁</span>
            <span>View Playlists</span>
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
              <h3 className="text-sm font-medium text-white mb-1">About Your Top Tracks</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Your top tracks are calculated by Spotify based on your listening habits. You can view data from the last 4 weeks, 6 months, or all time. Click on any track to open it in Spotify or use the preview button to listen to a sample.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopTracks;