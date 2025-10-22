const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const spotifyBtn = document.getElementById('spotify-btn');
    const status = document.getElementById('status');

    let spotifyToken = null;

    spotifyBtn.addEventListener('click', () => {
        status.textContent = 'Opening Spotify login...';
        ipcRenderer.send('spotify-login');
    });

    ipcRenderer.on('spotify-token', (_, token) => {
        spotifyToken = token;
        status.textContent = 'Logged in successfully!';
        console.log('Received Spotify Token:', token);

        fetchNowPlaying();
        setInterval(fetchNowPlaying, 5000);
    });

    ipcRenderer.on('spotify-token-error', (_, error) => {
        console.error('Spotify login error:', error);
        status.textContent = 'Spotify login failed. Check console.';
    });

    lastfmBtn.addEventListener('click', () => {
        status.textContent = 'Last.fm login click';
    });

    async function fetchNowPlaying() {
        if (!spotifyToken) return;

        try {
            const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: { 'Authorization': `Bearer ${spotifyToken}` }
            });

            if (res.status === 204) {
                console.log('No track currently playing');
                return;
            }

            if (!res.ok) {
                console.error('Error fetching now playing:', res.status, await res.text());
                return;
            }

            const data = await res.json();

            const trackName = data.item.name;
            const artistName = data.item.artists.map(a => a.name).join(', ');
            const albumArt = data.item.album.images[0].url;

            console.log(`Now playing: ${trackName} by ${artistName}`);
            console.log('Album art URL:', albumArt);

            updateVisualizer(trackName, artistName, albumArt, data.progress_ms, data.item.duration_ms);

        } catch (err) {
            console.error('Error fetching now playing:', err);
        }
    }

    function updateVisualizer(track, artist, albumArt, progress, duration) {
        
        console.log('Updating visualizer...', { track, artist, progress, duration });
    }
});


