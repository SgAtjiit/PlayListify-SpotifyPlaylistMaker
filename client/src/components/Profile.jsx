import React, { useEffect, useState } from "react";
import { auth } from "../utils/firebase.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getAvatarUrl } from "../utils/avatar.js";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userAvatar, setUserAvatar] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // Generate and cache avatar URL once
      if (currentUser) {
        const avatarUrl = getAvatarUrl(currentUser);
        setUserAvatar(avatarUrl);
      }
      setIsLoading(false); // Set loading to false after auth check
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-xl">Loading Profile...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <p className="text-gray-300 text-xl mb-2">Authentication Required</p>
          <p className="text-gray-400 text-sm mb-4">Please log in to view your profile.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-green-500 hover:bg-green-600 text-black font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
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
              <button
                onClick={() => navigate('/app')}
                className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                <span>Back to App</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex justify-center">
          <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 w-full max-w-md">
            {/* Profile Header */}
            <div className="text-center mb-8">
              <div className="relative mb-6">
                <img
                  src={userAvatar}
                  alt="Profile"
                  className="w-24 h-24 rounded-full mx-auto border-4 border-green-500 shadow-lg"
                  onError={(e) => {
                    // Fallback if avatar fails to load
                    e.target.src = `https://ui-avatars.com/api/?name=${(user.displayName || user.email || 'U').charAt(0)}&background=22c55e&color=000&size=200&bold=true`;
                  }}
                />
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">
                {user.displayName || "Music Lover"}
              </h2>
              <p className="text-gray-400 mb-6">{user.email}</p>
              
              {/* User Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/50 hover:bg-gray-700/40 transition-colors">
                  <div className="text-green-400 font-semibold text-lg">∞</div>
                  <div className="text-gray-400 text-xs">Playlists</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/50 hover:bg-gray-700/40 transition-colors">
                  <div className="text-green-400 font-semibold text-lg">♪</div>
                  <div className="text-gray-400 text-xs">Songs Added</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* Spotify Connect Button */}
              

              {/* Update Profile Button */}
              <button
                onClick={() => navigate('/update-profile')}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium py-3 px-6 rounded-lg transition-all duration-200 border border-blue-500/30"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  <span>Update Profile</span>
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium py-3 px-6 rounded-lg transition-all duration-200 border border-red-500/30"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  <span>Sign Out</span>
                </div>
              </button>
            </div>

            {/* Profile Info */}
            <div className="mt-8 bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-400 mt-0.5"
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
                  <h3 className="text-sm font-medium text-white mb-1">Account Status</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Your account is active and ready to create amazing playlists. 
                    Connect your Spotify account to start building your music collection.
                  </p>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-600/30">
                <span className="text-gray-400 text-sm">Account Type</span>
                <span className="text-white text-sm font-medium">
                  {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-600/30">
                <span className="text-gray-400 text-sm">Member Since</span>
                <span className="text-white text-sm font-medium">
                  {new Date(user.metadata.creationTime).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400 text-sm">Last Sign In</span>
                <span className="text-white text-sm font-medium">
                  {new Date(user.metadata.lastSignInTime).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;