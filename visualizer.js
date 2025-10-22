const { ipcRenderer } = require('electron');

const artistBg = document.getElementById('artist-bg');
const albumCover = document.getElementById('album-cover');
const songName = document.getElementById('song-name');
const artistName = document.getElementById('artist-name');

let spotifyToken = null;

ipcRenderer.on('spotify-token', (_, token) => {
    spotifyToken = token;
    console.log('Received Spotify token:', spotifyToken);

    fetchNowPlaying();
    setInterval(fetchNowPlaying, 5000);
});

async function fetchNowPlaying() {
    if (!spotifyToken) return;

    try {
        const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });

        if (res.status === 204 || res.status === 202) {
            console.log('No track playing');
            return;
        }

        if (!res.ok) {
            throw new Error(`${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        if (data && data.item) {
            updateVisualizer(data.item);
        }
    } catch (err) {
        console.error('Spotify API error:', err);
    }
}

function updateVisualizer(trackData) {
    songName.textContent = trackData.name;
    artistName.textContent = trackData.artists.map(a => a.name).join(', ');
    albumCover.src = trackData.album.images[0].url;

    if (trackData.artists[0].images && trackData.artists[0].images.length > 0) {
        artistBg.src = trackData.artists[0].images[0].url;
    } else {
        artistBg.src = trackData.album.images[0].url;
    }
}
