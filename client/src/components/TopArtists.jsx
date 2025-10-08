import React, { useState, useEffect } from 'react';
import { auth } from '../utils/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAvatarUrl } from '../utils/avatar.js';
import axios from 'axios';

const TopArtists = () => {
  const [user, setUser] = useState(null);
  const [userAvatar, setUserAvatar] = useState("");
  const [topArtists, setTopArtists] = useState([]);
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
        fetchTopArtists();
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate, timeRange, limit]);

  const fetchTopArtists = async () => {
    setIsLoading(true);
    try {
      // Check for token in localStorage first
      const token = localStorage.getItem('spotify_access_token');
      
      if (!token) {
        toast.error('Please connect your Spotify account');
        navigate('/authSpotify');
        return;
      }

      const response = await axios.get(`${url}/top/artists`, {
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
        setTopArtists(response.data.items);
        toast.success(`Loaded ${response.data.items.length} top artists!`);
      } else {
        toast.error('Failed to fetch top artists');
      }
    } catch (error) {
      console.error('Error fetching top artists:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        toast.error('Session expired. Please reconnect your Spotify account');
        navigate('/authSpotify');
      } else {
        toast.error('Failed to fetch top artists');
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

  const formatFollowers = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
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
          <p className="text-gray-300 text-xl">Loading Your Top Artists...</p>
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
            <h2 className="text-3xl font-bold text-white mb-2">Your Top Artists</h2>
            <p className="text-gray-300">Discover your most listened artists on Spotify</p>
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
              <label className="block text-sm font-medium text-gray-300">Number of Artists</label>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              >
                <option value={10}>Top 10 Artists</option>
                <option value={20}>Top 20 Artists</option>
                <option value={30}>Top 30 Artists</option>
                <option value={50}>Top 50 Artists</option>
              </select>
              
              {/* Current Selection Info */}
              <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
                <p className="text-gray-300 text-sm">
                  Showing your <span className="text-green-400 font-medium">top {limit} artists</span> from{' '}
                  <span className="text-blue-400 font-medium">
                    {timeRangeOptions.find(opt => opt.value === timeRange)?.label.toLowerCase()}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Artists Display */}
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">
              Your Top {limit} Artists
            </h3>
            <p className="text-gray-300">
              {timeRangeOptions.find(opt => opt.value === timeRange)?.label} • {topArtists.length} artists found
            </p>
          </div>

          {topArtists.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <p className="text-gray-400 text-xl">No top artists found</p>
              <p className="text-gray-500 text-sm mt-2">Try listening to more music on Spotify!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topArtists.map((artist, index) => (
                <div
                  key={artist.id}
                  className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30 hover:bg-gray-700/40 transition-all duration-200 group text-center relative"
                >
                  {/* Rank Badge */}
                  <div className={`absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
                    index === 0 ? 'bg-yellow-400 text-black' : 
                    index === 1 ? 'bg-gray-300 text-black' : 
                    index === 2 ? 'bg-orange-400 text-black' : 'bg-gray-600 text-white'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Artist Image */}
                  <div className="mb-4">
                    <img
                      src={artist.image || '/placeholder-artist.png'}
                      alt={artist.name}
                      className="w-24 h-24 rounded-full mx-auto shadow-lg group-hover:scale-105 transition-transform duration-200 border-2 border-gray-600/50"
                      onError={(e) => {
                        e.target.src = '/placeholder-artist.png';
                      }}
                    />
                  </div>

                  {/* Artist Info */}
                  <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-green-400 transition duration-200">
                    {artist.name}
                  </h3>

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30 inline-block">
                      {artist.popularity}% popular
                    </div>
                    <div className="text-gray-400 text-sm font-medium">
                      {formatFollowers(artist.followers)} followers
                    </div>
                  </div>

                  {/* Genres */}
                  {artist.genres && artist.genres.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap justify-center gap-2">
                        {artist.genres.slice(0, 3).map((genre, genreIndex) => (
                          <span
                            key={genreIndex}
                            className="bg-gray-600/50 text-gray-200 text-xs px-2 py-1 rounded-full border border-gray-600/30"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => window.open(artist.external_url, '_blank')}
                    className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 border border-green-500/30"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z"/>
                    </svg>
                    <span>Open in Spotify</span>
                  </button>
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
            <span>View Top Tracks</span>
          </button>
          <button
            onClick={() => navigate('/playlists')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50 shadow-lg inline-flex items-center space-x-2"
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
              <h3 className="text-sm font-medium text-white mb-1">About Your Top Artists</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Your top artists are calculated by Spotify based on your listening habits. You can view data from the last 4 weeks, 6 months, or all time. The popularity percentage shows how popular each artist is globally. Click on any artist to open their Spotify page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopArtists;