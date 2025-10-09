import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  RefreshCcw,
  Trash2,
  Music2,
  Pencil,
  X,
} from "lucide-react";

const ManagePlaylist = () => {
  const apiBase = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("spotify_access_token");

  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [selectedTrackUris, setSelectedTrackUris] = useState(new Set());
  const [metaForm, setMetaForm] = useState({
    name: "",
    description: "",
    publicFlag: false,
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    publicFlag: false,
  });
  const [processing, setProcessing] = useState(false);
  const [refreshingTracks, setRefreshingTracks] = useState(false);

  const authGuard = () => {
    if (!accessToken) {
      toast.error("Spotify connect required");
      return false;
    }
    return true;
  };

  const fetchPlaylists = useCallback(async () => {
    if (!authGuard()) return;
    setLoadingPlaylists(true);
    try {
      const res = await axios.get(`${apiBase}/playlists`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 50 },
      });
      setPlaylists(res.data.playlists || []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load playlists");
    } finally {
      setLoadingPlaylists(false);
    }
  }, [apiBase, accessToken]);

  const fetchTracks = useCallback(
    async (plId) => {
      if (!authGuard()) return;
      setTracksLoading(true);
      try {
        const res = await axios.get(
          `https://api.spotify.com/v1/playlists/${plId}/tracks`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { limit: 100 },
          }
        );
        const mapped = (res.data.items || [])
          .map((it) => ({
            uri: it.track?.uri,
            id: it.track?.id,
            name: it.track?.name,
            artists: (it.track?.artists || []).map((a) => a.name).join(", "),
            albumImg: it.track?.album?.images?.[0]?.url || null,
            durationMs: it.track?.duration_ms,
          }))
          .filter((t) => t.uri);
        setTracks(mapped);
      } catch {
        toast.error("Failed to load tracks");
      } finally {
        setTracksLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const openPlaylist = (pl) => {
    setSelected(pl);
    setMetaForm({
      name: pl.name || "",
      description: pl.description || "",
      publicFlag: !!pl.public,
    });
    setSelectedTrackUris(new Set());
    fetchTracks(pl.id);
  };

  const backToGrid = () => {
    setSelected(null);
    setTracks([]);
    setRemoveMode(false);
  };

  const doAction = async (payload, success) => {
    if (!authGuard()) return;
    setProcessing(true);
    try {
      const res = await axios.post(`${apiBase}/manage-playlist`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success(success);
      if (["create", "update", "unfollow"].includes(res.data.action)) {
        await fetchPlaylists();
      }
      if (res.data.action === "create") {
        setCreateModalOpen(false);
        openPlaylist({
          id: res.data.playlist.id,
          name: res.data.playlist.name,
          description: res.data.playlist.description,
          public: res.data.playlist.public,
          image: res.data.playlist.image,
        });
      }
      if (res.data.action === "unfollow") backToGrid();
      return res.data;
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    } finally {
      setProcessing(false);
    }
  };

  const saveMeta = () => {
    if (!selected) return;
    doAction(
      {
        action: "update",
        playlistId: selected.id,
        name: metaForm.name.trim(),
        description: metaForm.description.trim(),
        public: metaForm.publicFlag,
      },
      "Updated"
    );
  };

  const removeSelectedTracks = () => {
    if (!selected) return;
    if (!selectedTrackUris.size) return toast.error("No tracks selected");
    const uris = Array.from(selectedTrackUris);
    doAction(
      {
        action: "remove-tracks",
        playlistId: selected.id,
        trackUris: uris,
      },
      `Removed ${uris.length}`
    ).then(() => {
      setSelectedTrackUris(new Set());
      setRefreshingTracks(true);
      fetchTracks(selected.id).finally(() => setRefreshingTracks(false));
      setRemoveMode(false);
    });
  };

  const unfollow = () => {
    if (!selected) return;
    if (!confirm("Unfollow this playlist?")) return;
    doAction({ action: "unfollow", playlistId: selected.id }, "Unfollowed");
  };

  const toggleTrack = (uri) => {
    setSelectedTrackUris((prev) => {
      const next = new Set(prev);
      next.has(uri) ? next.delete(uri) : next.add(uri);
      return next;
    });
  };

  function msToTime(ms) {
    if (!ms) return "0:00";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  const FloatingCreateButton = () => (
    <button
      onClick={() => setCreateModalOpen(true)}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg hover:shadow-green-500/40 flex items-center justify-center text-black hover:scale-105 transition"
      title="Create Playlist"
    >
      <Plus className="w-7 h-7" />
    </button>
  );

  const CreateModal = () =>
    createModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => !processing && setCreateModalOpen(false)}
        />
        <div className="relative bg-gray-900/90 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">
              Create New Playlist
            </h3>
            <button
              onClick={() => !processing && setCreateModalOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-3">
            <input
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Playlist Name"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <textarea
              rows={3}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Description"
              value={createForm.description}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, description: e.target.value }))
              }
            />
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                className="rounded"
                checked={createForm.publicFlag}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    publicFlag: e.target.checked,
                  }))
                }
              />
              <span>Public Playlist</span>
            </label>
            <button
              disabled={!createForm.name.trim() || processing}
              onClick={() =>
                doAction(
                  {
                    action: "create",
                    name: createForm.name.trim(),
                    description: createForm.description.trim(),
                    public: createForm.publicFlag,
                  },
                  "Created"
                )
              }
              className={`w-full py-2 rounded-lg font-medium text-sm transition ${
                createForm.name.trim() && !processing
                  ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              {processing ? "Creating..." : "Create Playlist"}
            </button>
          </div>
        </div>
      </div>
    );

  // GRID VIEW
  if (!selected) {
    return (
      <>
        <div className="mt-10 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Your Playlists</h2>
            <button
              onClick={fetchPlaylists}
              disabled={loadingPlaylists}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 font-medium ${
                loadingPlaylists && "opacity-60 cursor-not-allowed"
              }`}
            >
              <RefreshCcw
                size={16}
                className={loadingPlaylists ? "animate-spin" : ""}
              />
              {loadingPlaylists ? "Loading..." : "Reload"}
            </button>
          </div>

          {/* Updated Grid (max 3 per row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
  {loadingPlaylists
    ? Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[4/3] rounded-2xl bg-gray-800/60 animate-pulse border border-gray-700"
        />
      ))
    : playlists.map((pl) => (
        <button
          key={pl.id}
          onClick={() => openPlaylist(pl)}
          className="group relative flex flex-col overflow-hidden rounded-2xl bg-gray-800/50 border border-gray-700/60 hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300"
        >
          {/* Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            {pl.image ? (
              <img
                src={pl.image}
                alt={pl.name}
                className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                <Music2 className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
            <span className="absolute top-3 right-3 text-[10px] tracking-wide px-2 py-1 rounded-full bg-gray-900/70 border border-gray-700 text-gray-300 group-hover:bg-green-500/20 group-hover:text-green-300 group-hover:border-green-500/40 transition">
              {pl.public ? "PUBLIC" : "PRIVATE"}
            </span>
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 p-4">
            <h4 className="text-sm font-semibold text-white mb-1 line-clamp-1 group-hover:text-green-400 transition">
              {pl.name}
            </h4>
            <p className="text-xs text-gray-400 mb-2 line-clamp-2 leading-relaxed">
              {pl.description || "No description available."}
            </p>

            <div className="mt-auto flex items-center justify-between text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 fill-current opacity-70"
                >
                  <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm1 9.268V7.5a1 1 0 10-2 0v5.25c0 .314.148.611.4.8l3.75 2.813a1 1 0 001.2-1.6L13 12.268z" />
                </svg>
                {pl.tracks?.total ?? 0} tracks
              </span>
              <span className="truncate max-w-[50%] text-right">
                {pl.owner?.display_name || "Unknown"}
              </span>
            </div>
          </div>

          {/* Hover Action Overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/40 backdrop-blur-[1px] transition">
            <span className="px-4 py-2 rounded-lg text-xs font-semibold bg-green-500 text-black shadow-lg">
              Manage
            </span>
          </div>
        </button>
      ))}
</div>

        </div>
        <FloatingCreateButton />
        <CreateModal />
      </>
    );
  }

  // DETAIL VIEW
  return (
    <>
      <div className="mt-8 space-y-8">
        <div className="flex flex-wrap items-center gap-6">
          <button
            onClick={backToGrid}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-4 flex-1">
            {selected.image ? (
              <img
                src={selected.image}
                alt=""
                className="w-24 h-24 rounded-lg object-cover border border-gray-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700">
                <Music2 size={38} className="text-gray-500" />
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {selected.name}
              </h2>
              <p className="text-sm text-gray-400 max-w-xl line-clamp-2">
                {selected.description || "No description"}
              </p>
              <div className="text-xs text-gray-500 mt-2">
                {tracks.length} tracks
                {refreshingTracks && (
                  <span className="ml-2 text-green-400">Refreshing...</span>
                )}
              </div>
            </div>

            <div className="ml-auto flex gap-3">
              <button
                onClick={() => {
                  setRefreshingTracks(true);
                  fetchTracks(selected.id).finally(() =>
                    setRefreshingTracks(false)
                  );
                }}
                className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm flex items-center gap-2"
              >
                <RefreshCcw
                  size={14}
                  className={refreshingTracks ? "animate-spin" : ""}
                />
                Tracks
              </button>
              <button
                onClick={unfollow}
                className="px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm flex items-center gap-2"
              >
                <Trash2 size={14} />
                Unfollow
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Pencil size={18} className="text-green-400" />
              <h3 className="text-sm font-semibold text-white">Metadata</h3>
            </div>
            <input
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-green-500 outline-none"
              value={metaForm.name}
              onChange={(e) =>
                setMetaForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <textarea
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-green-500 outline-none resize-none"
              value={metaForm.description}
              onChange={(e) =>
                setMetaForm((f) => ({ ...f, description: e.target.value }))
              }
            />
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input
                type="checkbox"
                checked={metaForm.publicFlag}
                onChange={(e) =>
                  setMetaForm((f) => ({ ...f, publicFlag: e.target.checked }))
                }
              />
              Public
            </label>
            <button
              onClick={saveMeta}
              disabled={processing}
              className="w-full py-2 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition"
            >
              {processing ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Remove Tracks
              </h3>
              <button
                onClick={() => {
                  setRemoveMode((r) => !r);
                  setSelectedTrackUris(new Set());
                }}
                className={`text-xs px-3 py-1 rounded-lg border ${
                  removeMode
                    ? "bg-red-600/80 border-red-500 text-white"
                    : "bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800"
                }`}
              >
                {removeMode ? "Cancel" : "Select"}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              {removeMode
                ? "Click tracks below to select for removal."
                : "Activate select mode to remove multiple tracks."}
            </p>
            <button
              onClick={removeSelectedTracks}
              disabled={!removeMode || !selectedTrackUris.size || processing}
              className={`w-full py-2 rounded-lg text-xs font-medium transition ${
                removeMode && selectedTrackUris.size && !processing
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              {processing
                ? "Removing..."
                : `Remove ${selectedTrackUris.size || ""} Selected`}
            </button>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            Tracks
            {tracksLoading && (
              <span className="text-xs text-gray-400">Loading…</span>
            )}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tracks.map((t) => {
              const active = selectedTrackUris.has(t.uri);
              return (
                <div
                  key={t.uri}
                  onClick={() => removeMode && toggleTrack(t.uri)}
                  className={`group flex items-center gap-4 p-3 rounded-xl border bg-gray-900/60 hover:bg-gray-900 transition ${
                    active
                      ? "border-red-500/70 shadow-inner shadow-red-500/20"
                      : "border-gray-800"
                  } ${removeMode ? "cursor-pointer" : ""}`}
                >
                  <div className="relative shrink-0">
                    {t.albumImg ? (
                      <img
                        src={t.albumImg}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center">
                        <Music2 size={20} className="text-gray-500" />
                      </div>
                    )}
                    {removeMode && (
                      <div
                        className={`absolute inset-0 rounded-lg flex items-center justify-center text-[10px] font-semibold ${
                          active
                            ? "bg-red-600/80 text-white"
                            : "bg-black/50 text-gray-200 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {active ? "Selected" : "Select"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">
                      {t.name}
                    </div>
                    <div className="text-[11px] text-gray-400 truncate">
                      {t.artists}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {msToTime(t.durationMs)}
                    </div>
                  </div>
                  {removeMode && !active && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTrack(t.uri);
                      }}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
            {!tracksLoading && !tracks.length && (
              <div className="col-span-full text-center py-10 text-gray-400 text-sm border border-dashed border-gray-700 rounded-xl">
                No tracks found
              </div>
            )}
          </div>
        </div>
      </div>
      <FloatingCreateButton />
      <CreateModal />
    </>
  );
};

export default ManagePlaylist;