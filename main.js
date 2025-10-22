require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 300,
    webPreferences: {
      preload: path.join(__dirname, 'login.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('login.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('spotify-login', () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const scope = encodeURIComponent('user-read-currently-playing user-read-playback-state');

  function startServer(port) {
    const redirectUri = `http://127.0.0.1:${port}/callback`;
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    const authWindow = new BrowserWindow({
      width: 450,
      height: 700,
      show: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });

    authWindow.loadURL(authUrl);

    const server = http.createServer(async (req, res) => {
      if (!req.url.startsWith('/callback')) return;

      const urlObj = new URL(req.url, `http://127.0.0.1:${port}`);
      const code = urlObj.searchParams.get('code');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h2>Login successful! You can close this window.</h2>');

      if (code) {
        try {
          const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret
          });

          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
          });

          const data = await response.json();

          if (data.access_token) {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.loadFile('visualizer.html').then(() => {
                mainWindow.webContents.send('spotify-token', data.access_token);
              });
            }
          } else {
            if (mainWindow && !mainWindow.isDestroyed())
              mainWindow.webContents.send('spotify-token-error', data);
          }
        } catch (err) {
          if (mainWindow && !mainWindow.isDestroyed())
            mainWindow.webContents.send('spotify-token-error', err.message);
          console.error('Token exchange failed:', err);
        }
      }

      if (!authWindow.isDestroyed()) authWindow.close();
      server.close();
    });

    server.on('error', err => {
      if (err.code === 'EADDRINUSE') server.listen(0);
      else console.error(err);
    });

    server.listen(port, () => {
      console.log(`Listening on http://127.0.0.1:${server.address().port}/callback`);
    });
  }

  startServer(8888);
});

