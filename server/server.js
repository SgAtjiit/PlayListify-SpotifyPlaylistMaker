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
  "user-read-private playlist-read-private playlist-modify-private playlist-modify-public";
// ======================================

let access_token = "";
let refresh_token = "";

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
async function getUserProfile() {
  const res = await axios.get("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  return res.data;
}

app.get("/userInfo",async(req,res)=>{
    try {
        if (!access_token) {
            return res.status(401).json({ 
                status: "fail", 
                message: "Authentication required",
                requiresAuth: true 
            });
        }
        
        const user = await getUserProfile();
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

app.post("/search",async(req,res)=>{
    // Return JSON error instead of redirect
    if(!access_token) {
        return res.status(401).json({ 
            status: "fail", 
            message: "Authentication required",
            requiresAuth: true 
        });
    }
    
    const songname = req.body.songname||"shape of you"
   try {
    const user = await getUserProfile();
    const searchRes = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${access_token}` },
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
    console.log(`An error occured:${error}`)
    
    // Handle token expiration
    if (error.response?.status === 401) {
        return res.status(401).json({ 
            status: "fail", 
            message: "Token expired",
            requiresAuth: true 
        });
    }
    
    return res.status(500).json({"status":"fail","message":"An error occured"})
   }
})

// STEP 4: Search for song + add to playlist
app.post("/searchAndAdd", async (req, res) => {
  // Return JSON error instead of redirect
  if (!access_token) {
    return res.status(401).json({ 
        status: "fail", 
        message: "Authentication required",
        requiresAuth: true 
    });
  }
  
  const songName = req.body.songname || "shape of you";
  const playlistName = req.body.playlistName || "My API Playlist";
 
  try {
    // Fetch user info
    const user = await getUserProfile();

    const searchRes = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${access_token}` },
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
      headers: { Authorization: `Bearer ${access_token}` },
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
        { headers: { Authorization: `Bearer ${access_token}` } }
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
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    console.log("✅ Song added successfully!");

    return res.status(200).json({"status":"success","message":"Song was added succesfully!!"});
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
    
    res.status(500).json({"status":"fail","message":"An error occured !!"});
  }
});

app.listen(PORT, () =>
  console.log(`App running!!`)
);