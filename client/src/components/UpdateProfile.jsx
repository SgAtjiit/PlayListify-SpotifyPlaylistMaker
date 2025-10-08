import React, { useState, useEffect } from "react";
import { auth } from "../utils/firebase.js";
import { updateProfile, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getAvatarUrl } from "../utils/avatar.js";

const UpdateProfile = () => {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState("");
  const navigate = useNavigate();

   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setDisplayName(currentUser.displayName || "");
        setPhotoURL(currentUser.photoURL || "");
        
        // Set initial preview avatar
        const avatarUrl = getAvatarUrl(currentUser);
        setPreviewAvatar(avatarUrl);
      }
    });
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    if (user) {
      const tempUser = { ...user, displayName, photoURL };
      const avatarUrl = getAvatarUrl(tempUser);
      setPreviewAvatar(avatarUrl);
    }
  }, [displayName, photoURL, user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      toast.error("No user is currently signed in");
      return;
    }

    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || null
      });
      
      toast.success("Profile updated successfully!");
      navigate('/profile');
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateAvatarURL = (name) => {
    return `https://avatar.iran.liara.run/username?username=${encodeURIComponent(name || 'User')}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <p className="text-gray-300 text-xl mb-2">Authentication Required</p>
          <p className="text-gray-400 text-sm">Please log in to update your profile.</p>
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
              <a href="/app">
                <span>PlayListify</span>
              </a>
            </h1>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                ← Back to Profile
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
                  src={previewAvatar}
                  alt="Profile Preview"
                  className="w-24 h-24 rounded-full mx-auto border-4 border-green-500 shadow-lg"
                  onError={(e) => {
                    // Fallback to generated avatar if custom URL fails
                    const tempUser = { ...user, displayName, photoURL: "" };
                    e.target.src = getAvatarUrl(tempUser);
                  }}
                />
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800"></div>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">
                Update Profile
              </h2>
              <p className="text-gray-400 mb-6">Customize your profile information</p>
            </div>

            {/* Update Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your display name"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  placeholder="Enter photo URL (optional)"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-400">
                  Leave empty to use generated avatar based on your name
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading || !displayName.trim()}
                  className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 shadow-lg disabled:hover:scale-100 ${
                    displayName.trim() && !isLoading
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                      </svg>
                      <span>Update Profile</span>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  disabled={isLoading}
                  className="w-full bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 font-medium py-3 px-6 rounded-lg transition-all duration-200 border border-gray-500/30"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    <span>Cancel</span>
                  </div>
                </button>
              </div>
            </form>

            {/* Info Section */}
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
                  <h3 className="text-sm font-medium text-white mb-1">Profile Tips</h3>
                  <ul className="text-xs text-gray-300 leading-relaxed space-y-1">
                    <li>• Use a clear, recognizable display name</li>
                    <li>• Profile photos should be square (1:1 ratio) for best results</li>
                    <li>• Changes will be reflected across the app immediately</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Current Info Display */}
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-600/30">
                <span className="text-gray-400 text-sm">Email</span>
                <span className="text-white text-sm font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-600/30">
                <span className="text-gray-400 text-sm">Account Type</span>
                <span className="text-white text-sm font-medium">
                  {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400 text-sm">Last Updated</span>
                <span className="text-white text-sm font-medium">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile;