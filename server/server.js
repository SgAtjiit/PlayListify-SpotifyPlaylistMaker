import express from "express";
import axios from "axios";
import qs from "querystring";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8888;

// ============= YOUR CONFIG =============
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Dynamic CORS configuration for deployment
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_DEV, // for development
  "http://localhost:5173", // fallback for local development
  "http://127.0.0.1:5173"  // fallback for local development
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

const SCOPES =
  "user-read-private playlist-read-private playlist-modify-private playlist-modify-public user-top-read";
// ======================================

let access_token = "";
let refresh_token = "";

// Helper function to get token from Authorization header or server variable
function getAuthToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return access_token; // fallback to server variable
}

app.get("/", (req, res) => {
  res.send("Server is Live!!")
});

// STEP 1: Redirect user to Spotify for login
app.get("/login", (req, res) => {
  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    qs.stringify({
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      show_dialog: true,
    });

  res.redirect(authUrl);
});

// STEP 2: Spotify redirects here after login
app.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  try {
    const tokenRes = await axios.post(
      "https://accounts.spotify.com/api/token",
      qs.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    access_token = tokenRes.data.access_token;
    refresh_token = tokenRes.data.refresh_token;

    res.redirect(`${FRONTEND_URL}/app?auth=success`);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Error exchanging code for token");
  }
});

app.get("/getTokens", (req, res) => {
  if (!access_token) {
    return res.status(401).json({ error: "No tokens available" });
  }
  
  res.json({
    access_token,
    refresh_token,
    expires_in: 3600 // Spotify tokens typically expire in 1 hour
  });
});

// STEP 3: Fetch user info
async function getUserProfile(token = access_token) {
  const res = await axios.get("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

app.get("/userInfo", async (req, res) => {
  try {
    const token = getAuthToken(req);
    
    if (!token) {
      return res.status(401).json({ 
        status: "fail", 
        message: "Authentication required",
        requiresAuth: true 
      });
    }
    
    const user = await getUserProfile(token);
    res.status(200).send(user);
  } catch (error) {
    console.log(`An error occured:${error}`)
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        status: "fail", 
        message: "Token expired",
        requiresAuth: true 
      });
    }
    res.status(500).send("Error sending userInfo check your backend!!");
  }
})

// app.post("/search", async (req, res) => {
//   const token = getAuthToken(req);
  
//   if(!token) {
//     return res.status(401).json({ 
//       status: "fail", 
//       message: "Authentication required",
//       requiresAuth: true 
//     });
//   }
  
//   const songname = req.body.songname || "shape of you"
//   try {
//     const user = await getUserProfile(token);
//     const searchRes = await axios.get("https://api.spotify.com/v1/search", {
//       headers: { Authorization: `Bearer ${token}` },
//       params: { q: songname, type: "track", limit: 5 },
//     });
    
//     if (searchRes.data.tracks.items.length === 0) {
//       return res.status(404).json({
//         status: "fail",
//         message: `No songs found for "${songname}"`,
//         tracksFound: []
//       });
//     }

//     const tracks = searchRes.data.tracks.items;
//     let array = []
//     for(const item of tracks){
//       array.push({
//         "song":item.name,
//         "artist":item.artists[0].name,
//         "image":item.album.images.length > 0 ? item.album.images[0].url : null
//       })
//     }
//     return res.status(200).json({"status":"success","tracksFound":array})

//   } catch (error) {
//     console.log(`An error occured:${error}`)
    
//     // Handle token expiration
//     if (error.response?.status === 401) {
//       return res.status(401).json({ 
//         status: "fail", 
//         message: "Token expired",
//         requiresAuth: true 
//       });
//     }
    
//     return res.status(500).json({"status":"fail","message":"An error occured"})
//   }
// })

// STEP 4: Search for song + add to playlist
app.post("/search", async (req, res) => {
  const token = getAuthToken(req);
  
  if(!token) {
    return res.status(401).json({ 
      status: "fail", 
      message: "Authentication required - no token found",
      requiresAuth: true 
    });
  }
  
  const songname = req.body.songname || "shape of you"
  try {
    const user = await getUserProfile(token);
    const searchRes = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: songname, type: "track", limit: 5 },
    });
    
    if (searchRes.data.tracks.items.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: `No songs found for "${songname}"`,
        tracksFound: []
      });
    }

    const tracks = searchRes.data.tracks.items;
    let array = []
    for(const item of tracks){
      array.push({
        "song":item.name,
        "artist":item.artists[0].name,
        "image":item.album.images.length > 0 ? item.album.images[0].url : null
      })
    }
    return res.status(200).json({"status":"success","tracksFound":array})

  } catch (error) {
    console.log(`An error occurred:${error}`)
    
    // Handle token expiration
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        status: "fail", 
        message: "Token expired",
        requiresAuth: true 
      });
    }
    
    return res.status(500).json({"status":"fail","message":"An error occurred"})
  }
})
// app.post("/searchAndAdd", async (req, res) => {
//   const token = getAuthToken(req);
  
//   if (!token) {
//     return res.status(401).json({ 
//       status: "fail", 
//       message: "Authentication required",
//       requiresAuth: true 
//     });
//   }
  
//   const songName = req.body.songname || "shape of you";
//   const playlistName = req.body.playlistName || "My API Playlist";
 
//   try {
//     // Fetch user info
//     const user = await getUserProfile(token);

//     const searchRes = await axios.get("https://api.spotify.com/v1/search", {
//       headers: { Authorization: `Bearer ${token}` },
//       params: { q: songName, type: "track", limit: 1 },
//     });

//     if (searchRes.data.tracks.items.length === 0) {
//       return res.status(404).json({
//         status: "fail",
//         message: `No songs found for "${songName}"`
//       });
//     }

//     const track = searchRes.data.tracks.items[0];
//     const trackUri = track.uri;
//     console.log(`🎵 Found: ${track.name} by ${track.artists[0].name}`);

//     // 2️⃣ Check if playlist exists
//     const playlistsRes = await axios.get("https://api.spotify.com/v1/me/playlists", {
//       headers: { Authorization: `Bearer ${token}` },
//       params: { limit: 50 },
//     });

//     let playlist = playlistsRes.data.items.find((p) => p.name === playlistName);

//     // 3️⃣ Create playlist if it doesn't exist
//     if (!playlist) {
//       const createRes = await axios.post(
//         `https://api.spotify.com/v1/users/${user.id}/playlists`,
//         {
//           name: playlistName,
//           description: "Songs added via Spotify API",
//           public: false,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       playlist = createRes.data;
//       console.log(`🆕 Created new playlist: ${playlist.name}`);
//     } else {
//       console.log(`📁 Found existing playlist: ${playlist.name}`);
//     }

//     // 4️⃣ Add track to playlist
//     await axios.post(
//       `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
//       { uris: [trackUri] },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     console.log("✅ Song added successfully!");

//     return res.status(200).json({"status":"success","message":"Song was added succesfully!!"});
//   } catch (err) {
//     console.error("⚠️ Error:", err.response?.data || err.message);
    
//     // Handle token expiration
//     if (err.response?.status === 401) {
//       return res.status(401).json({ 
//         status: "fail", 
//         message: "Token expired",
//         requiresAuth: true 
//       });
//     }
    
//     res.status(500).json({"status":"fail","message":"An error occured !!"});
//   }
// });

// STEP 4: Search for song + add to playlist
app.post("/searchAndAdd", async (req, res) => {
  const token = getAuthToken(req);
  
  if (!token) {
    return res.status(401).json({ 
      status: "fail", 
      message: "Authentication required - no token found",
      requiresAuth: true 
    });
  }
  
  const songName = req.body.songname || "shape of you";
  const playlistName = req.body.playlistName || "My API Playlist";
 
  try {
    // Fetch user info
    const user = await getUserProfile(token);

    const searchRes = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: songName, type: "track", limit: 1 },
    });

    if (searchRes.data.tracks.items.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: `No songs found for "${songName}"`
      });
    }

    const track = searchRes.data.tracks.items[0];
    const trackUri = track.uri;
    console.log(`🎵 Found: ${track.name} by ${track.artists[0].name}`);

    // 2️⃣ Check if playlist exists
    const playlistsRes = await axios.get("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 50 },
    });

    let playlist = playlistsRes.data.items.find((p) => p.name === playlistName);

    // 3️⃣ Create playlist if it doesn't exist
    if (!playlist) {
      const createRes = await axios.post(
        `https://api.spotify.com/v1/users/${user.id}/playlists`,
        {
          name: playlistName,
          description: "Songs added via Spotify API",
          public: false,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      playlist = createRes.data;
      console.log(`🆕 Created new playlist: ${playlist.name}`);
    } else {
      console.log(`📁 Found existing playlist: ${playlist.name}`);
    }

    // 4️⃣ Add track to playlist
    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
      { uris: [trackUri] },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("✅ Song added successfully!");

    return res.status(200).json({"status":"success","message":"Song was added successfully!!"});
  } catch (err) {
    console.error("⚠️ Error:", err.response?.data || err.message);
    
    // Handle token expiration
    if (err.response?.status === 401) {
      return res.status(401).json({ 
        status: "fail", 
        message: "Token expired",
        requiresAuth: true 
      });
    }
    
    res.status(500).json({"status":"fail","message":"An error occurred !!"});
  }
});
// STEP 5: Get User's Top Items (Tracks or Artists)
app.get("/top/:type", async (req, res) => {
  const token = getAuthToken(req);
  
  if (!token) {
    return res.status(401).json({ 
      status: "fail", 
      message: "Authentication required",
      requiresAuth: true 
    });
  }

  const { type } = req.params;
  const { time_range = 'medium_term', limit = 20, offset = 0 } = req.query;

  // Validate type parameter
  if (!['tracks', 'artists'].includes(type)) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid type. Must be 'tracks' or 'artists'",
      validTypes: ['tracks', 'artists']
    });
  }

  // Validate time_range parameter
  const validTimeRanges = ['short_term', 'medium_term', 'long_term'];
  if (!validTimeRanges.includes(time_range)) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid time_range. Must be 'short_term', 'medium_term', or 'long_term'",
      validTimeRanges: validTimeRanges
    });
  }

  // Validate limit parameter
  const limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid limit. Must be between 1 and 50",
      providedLimit: limit
    });
  }

  // Validate offset parameter
  const offsetNum = parseInt(offset);
  if (isNaN(offsetNum) || offsetNum < 0) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid offset. Must be 0 or greater",
      providedOffset: offset
    });
  }

  try {
    console.log(`🎯 Fetching top ${type} for time_range: ${time_range}, limit: ${limitNum}, offset: ${offsetNum}`);

    const topItemsRes = await axios.get(`https://api.spotify.com/v1/me/top/${type}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { 
        time_range: time_range,
        limit: limitNum,
        offset: offsetNum
      },
    });

    const data = topItemsRes.data;
    
    // Format the response based on type
    let formattedItems = [];
    
    if (type === 'tracks') {
      formattedItems = data.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        artists: track.artists.map(artist => ({
          id: artist.id,
          name: artist.name
        })),
        album: {
          id: track.album.id,
          name: track.album.name,
          image: track.album.images.length > 0 ? track.album.images[0].url : null
        },
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        external_url: track.external_urls.spotify,
        uri: track.uri,
        preview_url: track.preview_url
      }));
    } else if (type === 'artists') {
      formattedItems = data.items.map(artist => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers.total,
        image: artist.images.length > 0 ? artist.images[0].url : null,
        external_url: artist.external_urls.spotify,
        uri: artist.uri
      }));
    }

    console.log(`✅ Found ${formattedItems.length} top ${type}`);

    return res.status(200).json({
      status: "success",
      type: type,
      time_range: time_range,
      pagination: {
        total: data.total,
        limit: data.limit,
        offset: data.offset,
        next: data.next,
        previous: data.previous
      },
      items: formattedItems,
      raw_spotify_response: process.env.NODE_ENV === 'development' ? data : undefined
    });

  } catch (error) {
    console.error(`❌ Error fetching top ${type}:`, error.response?.data || error.message);
    
    // Handle token expiration
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        status: "fail", 
        message: "Token expired",
        requiresAuth: true 
      });
    }

    // Handle insufficient permissions
    if (error.response?.status === 403) {
      return res.status(403).json({
        status: "fail",
        message: "Insufficient permissions. The 'user-top-read' scope is required.",
        requiredScope: "user-top-read"
      });
    }
    
    return res.status(500).json({
      status: "fail",
      message: `Failed to fetch top ${type}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// STEP 7: Get User's Playlists
app.get("/playlists", async (req, res) => {
  const token = getAuthToken(req);
  
  if (!token) {
    return res.status(401).json({ 
      status: "fail", 
      message: "Authentication required",
      requiresAuth: true 
    });
  }

  const { limit = 20, offset = 0 } = req.query;

  // Validate limit parameter
  const limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid limit. Must be between 1 and 50",
      providedLimit: limit
    });
  }

  // Validate offset parameter
  const offsetNum = parseInt(offset);
  if (isNaN(offsetNum) || offsetNum < 0) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid offset. Must be 0 or greater",
      providedOffset: offset
    });
  }

  try {
    console.log(`🎵 Fetching user playlists with limit: ${limitNum}, offset: ${offsetNum}`);

    const playlistsRes = await axios.get("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: `Bearer ${token}` },
      params: { 
        limit: limitNum,
        offset: offsetNum
      },
    });

    const data = playlistsRes.data;
    
    // Format the response
    const formattedPlaylists = data.items.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      collaborative: playlist.collaborative,
      public: playlist.public,
      owner: {
        id: playlist.owner.id,
        display_name: playlist.owner.display_name,
        external_url: playlist.owner.external_urls?.spotify
      },
      tracks: {
        total: playlist.tracks.total,
        href: playlist.tracks.href
      },
      images: playlist.images,
      image: playlist.images.length > 0 ? playlist.images[0].url : null,
      external_url: playlist.external_urls.spotify,
      uri: playlist.uri,
      snapshot_id: playlist.snapshot_id
    }));

    console.log(`✅ Found ${formattedPlaylists.length} playlists`);

    return res.status(200).json({
      status: "success",
      pagination: {
        total: data.total,
        limit: data.limit,
        offset: data.offset,
        next: data.next,
        previous: data.previous,
        href: data.href
      },
      playlists: formattedPlaylists,
      raw_spotify_response: process.env.NODE_ENV === 'development' ? data : undefined
    });

  } catch (error) {
    console.error(`❌ Error fetching playlists:`, error.response?.data || error.message);
    
    // Handle token expiration
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        status: "fail", 
        message: "Token expired",
        requiresAuth: true 
      });
    }

    // Handle insufficient permissions
    if (error.response?.status === 403) {
      return res.status(403).json({
        status: "fail",
        message: "Insufficient permissions. The 'playlist-read-private' scope is required.",
        requiredScope: "playlist-read-private"
      });
    }
    
    return res.status(500).json({
      status: "fail",
      message: "Failed to fetch playlists",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// STEP 8: Get specific playlist tracks
app.get("/playlist/:playlistId/tracks", async (req, res) => {
  const token = getAuthToken(req);
  
  if (!token) {
    return res.status(401).json({ 
      status: "fail", 
      message: "Authentication required",
      requiresAuth: true 
    });
  }

  const { playlistId } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  try {
    const tracksRes = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit, offset },
    });

    const formattedTracks = tracksRes.data.items.map(item => ({
      added_at: item.added_at,
      track: {
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists[0]?.name,
        artists: item.track.artists,
        album: {
          id: item.track.album.id,
          name: item.track.album.name,
          image: item.track.album.images[0]?.url
        },
        duration_ms: item.track.duration_ms,
        popularity: item.track.popularity,
        external_url: item.track.external_urls.spotify,
        preview_url: item.track.preview_url
      }
    }));

    return res.status(200).json({
      status: "success",
      tracks: formattedTracks,
      pagination: {
        total: tracksRes.data.total,
        limit: tracksRes.data.limit,
        offset: tracksRes.data.offset,
        next: tracksRes.data.next,
        previous: tracksRes.data.previous
      }
    });

  } catch (error) {
    console.error(`❌ Error fetching playlist tracks:`, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        status: "fail", 
        message: "Token expired",
        requiresAuth: true 
      });
    }
    
    return res.status(500).json({
      status: "fail",
      message: "Failed to fetch playlist tracks",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.listen(PORT, () =>
  console.log(`App running!!`)
);