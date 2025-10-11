import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../utils/firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { getAvatarUrl } from "../utils/avatar.js";

const NewAppFunction = () => {
  const [bulkInput, setBulkInput] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [user, setUser] = useState(null);
  const [userAvatar, setUserAvatar] = useState("");
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [componentLoading, setComponentLoading] = useState(true);
  const [tokensFetched, setTokensFetched] = useState(false);

  const [queries, setQueries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [queue, setQueue] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const url = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const checkSpotifyAuth = () => {
    const token = localStorage.getItem("spotify_access_token");
    setIsSpotifyConnected(!!token);
    return !!token;
  };

  const fetchSpotifyTokens = async () => {
    try {
      const response = await axios.get(`${url}/getTokens`);
      const { access_token, refresh_token } = response.data;
      if (access_token) localStorage.setItem("spotify_access_token", access_token);
      if (refresh_token) localStorage.setItem("spotify_refresh_token", refresh_token);
      setIsSpotifyConnected(true);
      setTokensFetched(true);
      toast.success("Spotify connected");
    } catch (err) {
      console.error(err);
      setIsSpotifyConnected(false);
      setTokensFetched(true);
      toast.error("Failed to connect Spotify");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authSuccess = params.get("auth");
    if (authSuccess === "success") {
      fetchSpotifyTokens();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      checkSpotifyAuth();
      setTokensFetched(true);
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setUserAvatar(getAvatarUrl(u));
      }
      setComponentLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const parseBulkInput = (text) =>
    text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const startMultiSearch = async () => {
    if (!bulkInput.trim()) {
      toast.error("Enter song names (comma separated)");
      return;
    }
    if (!checkSpotifyAuth()) {
      toast.error("Connect Spotify first");
      navigate("/authSpotify");
      return;
    }

    const parsed = parseBulkInput(bulkInput);
    if (!parsed.length) {
      toast.error("No valid song names found");
      return;
    }
    setQueries(parsed);
    setCurrentIdx(0);
    setQueue([]);
    setModalOpen(true);
    await loadSuggestionsForIndex(0, parsed);
  };

  const loadSuggestionsForIndex = async (index, overrideQueries) => {
    const qs = overrideQueries || queries;
    if (!qs?.[index]) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const token = localStorage.getItem("spotify_access_token");
      const res = await axios.post(
        `${url}/search`,
        { songname: qs[index] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const found = (res.data.tracksFound || []).slice(0, 5);
      setSuggestions(found);
      if (!found.length) toast.error(`No suggestions for "${qs[index]}"`);
    } catch (err) {
      console.error("search error", err);
      toast.error("Search failed. Try reconnecting Spotify.");
    } finally {
      setIsSearching(false);
    }
  };

  const addSuggestionToQueue = (item) => {
    const exists = queue.some((q) => (q.uri && item.uri && q.uri === item.uri) || q.song === item.song);
    if (exists) {
      toast("Already in queue");
      return;
    }
    setQueue((s) => [...s, item]);
    toast.success(`Added "${item.song}"`);
  };

  const removeFromQueue = (idx) => {
    setQueue((s) => s.filter((_, i) => i !== idx));
  };

  const goNext = async () => {
    const next = currentIdx + 1;
    if (next >= queries.length) {
      setModalOpen(false);
      toast.success("Finished suggestions. Review queue and create playlist.");
      return;
    }
    setCurrentIdx(next);
    await loadSuggestionsForIndex(next);
  };

  const goPrev = async () => {
    const prev = Math.max(0, currentIdx - 1);
    setCurrentIdx(prev);
    await loadSuggestionsForIndex(prev);
  };

  const createPlaylistFromQueue = async () => {
    if (!playlistName.trim()) return toast.error("Enter playlist name");
    if (!queue.length) return toast.error("Queue is empty");
    if (!checkSpotifyAuth()) {
      toast.error("Connect Spotify first");
      navigate("/authSpotify");
      return;
    }

    setIsCreating(true);
    try {
      const token = localStorage.getItem("spotify_access_token");
      for (let item of queue) {
        const payload = item.uri ? { uri: item.uri, playlistName } : { songname: item.song, playlistName };
        await axios.post(`${url}/searchAndAdd`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      toast.success(`Playlist "${playlistName}" created with ${queue.length} songs`);
      setQueue([]);
      setBulkInput("");
      setPlaylistName("");
      setModalOpen(false);
    } catch (err) {
      console.error("create error", err);
      toast.error("Failed to create playlist. Try reconnecting Spotify.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!user || componentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-xl">{!user ? "Loading User..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      {/* Header / Navbar (referenced from AppFunction theme) */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
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

            <div className="flex items-center space-x-2 sm:space-x-4">
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

      {/* Spotify warning (same style as AppFunction) */}
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700">
            <label className="text-sm text-gray-300 mb-2 block">Paste song titles (comma separated)</label>
            <textarea
              rows={4}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="e.g. Shape of You, Blinding Lights, Smells Like Teen Spirit"
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500"
              disabled={!isSpotifyConnected}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={startMultiSearch}
                disabled={!bulkInput.trim() || !isSpotifyConnected}
                className={`px-4 py-2 rounded-md font-medium ${bulkInput.trim() && isSpotifyConnected ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-600 cursor-not-allowed"} text-white`}
              >
                {isSearching ? "Searching..." : "Search & Suggest"}
              </button>

              <button
                onClick={() => {
                  setBulkInput("");
                  setQueries([]);
                }}
                className="px-4 py-2 rounded-md bg-red-600/20 text-red-300 hover:bg-red-600/30"
              >
                Clear
              </button>
            </div>

            <div className="mt-6">
              <label className="text-sm text-gray-300 block mb-2">Playlist name</label>
              <input
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="My Bulk Playlist"
                className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-sm text-white focus:ring-2 focus:ring-green-500"
                disabled={!isSpotifyConnected}
              />
              <div className="mt-3 flex gap-3">
                <button
                  onClick={createPlaylistFromQueue}
                  disabled={!playlistName.trim() || !queue.length || isCreating}
                  className={`flex-1 py-2 rounded-md font-medium ${playlistName.trim() && queue.length && !isCreating ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gray-600 cursor-not-allowed"} text-black`}
                >
                  {isCreating ? "Creating..." : `Create Playlist (${queue.length})`}
                </button>
                <button
                  onClick={() => {
                    setQueue([]);
                    toast.success("Queue cleared");
                  }}
                  disabled={!queue.length}
                  className="py-2 px-3 rounded-md bg-red-600/20 text-red-300"
                >
                  Clear Queue
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700">
            <h3 className="text-lg text-white font-semibold mb-3">Selected Queue ({queue.length})</h3>
            {queue.length === 0 ? (
              <div className="text-gray-400 text-sm">No songs selected yet. Use "Search & Suggest" to begin.</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {queue.map((q, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-900/50 p-2 rounded-md border border-gray-700">
                    <div className="flex items-center gap-3 min-w-0">
                      {q.image && <img src={q.image} alt={q.song} className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate" title={q.song}>{q.song}</div>
                        <div className="text-xs text-gray-400 truncate" title={q.artist}>{q.artist}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromQueue(i)} className="text-red-400 px-2 py-1 rounded hover:bg-red-600/10">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-xs text-gray-400">
              Workflow: paste titles → Search & Suggest → pick best suggestions for each title → Create playlist.
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="relative bg-gray-900 rounded-xl w-full max-w-3xl mx-4 p-4 border border-gray-700">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg text-white font-semibold">
                  Suggestions for "{queries[currentIdx]}"
                </h4>
                <div className="text-xs text-gray-400 mt-1">
                  {currentIdx + 1} of {queries.length}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setModalOpen(false); }} className="text-xs text-gray-300 px-3 py-1 rounded bg-gray-800/40">Close</button>
              </div>
            </div>

            <div className="mt-4">
              {isSearching ? (
                <div className="text-gray-400">Loading suggestions...</div>
              ) : suggestions.length === 0 ? (
                <div className="text-gray-400">No suggestions found for this query.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
                  {suggestions.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-800/50 p-3 rounded-md border border-gray-700">
                      {s.image && <img src={s.image} alt={s.song} className="w-12 h-12 rounded object-cover" />}
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate" title={s.song}>{s.song}</div>
                        <div className="text-xs text-gray-400 truncate" title={s.artist}>{s.artist}</div>
                        <div className="text-[11px] text-gray-500 mt-1">{s.album || ""}</div>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => addSuggestionToQueue(s)}
                          className="px-3 py-1 rounded bg-green-500 text-black text-xs font-medium"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={currentIdx === 0}
                  className="px-3 py-1 rounded bg-gray-800/50 text-sm text-gray-300 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={goNext}
                  className="px-3 py-1 rounded bg-blue-600 text-sm text-white"
                >
                  {currentIdx + 1 >= queries.length ? "Finish" : "Next"}
                </button>
                <button
                  onClick={() => {
                    loadSuggestionsForIndex(currentIdx);
                  }}
                  className="px-3 py-1 rounded bg-gray-800/50 text-sm text-gray-300"
                >
                  Retry
                </button>
              </div>

              <div className="text-sm text-gray-400">
                Selected: {queue.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewAppFunction;
