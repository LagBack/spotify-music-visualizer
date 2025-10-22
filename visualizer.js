const { ipcRenderer } = require('electron');

let spotifyToken = null;

const albumArtEl = document.getElementById('album-art');
const trackNameEl = document.getElementById('track-name');
const artistNameEl = document.getElementById('artist-name');

ipcRenderer.on('spotify-token', (_, token) => {
    spotifyToken = token;
    startVisualizer();
    fetchNowPlaying();
    setInterval(fetchNowPlaying, 5000); // poll every 5 seconds
});

async function fetchNowPlaying() {
    if (!spotifyToken) return;

    try {
        const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });

        if (res.status === 204) return; // no track playing
        if (!res.ok) {
            console.error('Spotify API error:', res.status, await res.text());
            return;
        }

        const data = await res.json();

        const trackName = data.item.name;
        const artistName = data.item.artists.map(a => a.name).join(', ');
        const albumArt = data.item.album.images[0].url;

        albumArtEl.src = albumArt;
        trackNameEl.textContent = trackName;
        artistNameEl.textContent = artistName;

        updateVisualizer(data.progress_ms, data.item.duration_ms);

    } catch (err) {
        console.error('Error fetching now playing:', err);
    }
}

const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

function startVisualizer() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

let barCount = 64;
let animationFrame;

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const time = Date.now() / 300;
    for (let i = 0; i < barCount; i++) {
        const x = (canvas.width / barCount) * i;
        const barHeight = Math.abs(Math.sin(time + i / 5)) * canvas.height * 0.5;
        ctx.fillStyle = `hsl(${i * 6}, 80%, 50%)`;
        ctx.fillRect(x, canvas.height - barHeight, (canvas.width / barCount) - 2, barHeight);
    }

    animationFrame = requestAnimationFrame(animate);
}


function updateVisualizer(progress, duration) {
}
