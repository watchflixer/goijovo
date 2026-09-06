import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const floodMapPath = 'C:/Users/Damgo/Downloads/rizal_flood_100yr_map (2).html';

  return {
    base: '/Barangay-sanjose/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      fs: {
        allow: [path.dirname(floodMapPath)],
      },
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url?.endsWith('/rizal-flood-map.html') || !fs.existsSync(floodMapPath)) {
          next();
          return;
        }

        let floodMapHtml = fs.readFileSync(floodMapPath, 'utf8');
        floodMapHtml = floodMapHtml
          .replace('const map = L.map', 'const map = window.floodMap = L.map')
          .replace('const streetLayer =', 'const streetLayer = window.floodStreetLayer =')
          .replace('const satelliteLayer =', 'const satelliteLayer = window.floodSatelliteLayer =');
        floodMapHtml = floodMapHtml.replace('</body>', `
<style>
  #flood-controls { position: absolute; top: 12px; left: 12px; z-index: 1000; display: flex; flex-direction: column; gap: 6px; font-family: sans-serif; }
  #flood-controls button { border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #0f172a; padding: 8px 10px; font-size: 11px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 6px rgba(15, 23, 42, .18); }
  #flood-controls button:hover { background: #f8fafc; }
  #flood-settings { display: none; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; box-shadow: 0 2px 6px rgba(15, 23, 42, .18); }
  #flood-settings button { display: block; width: 100%; margin: 3px 0; box-shadow: none; }
</style>
<div id="flood-controls">
  <button id="flood-recenter">Recenter Map</button>
  <button id="flood-settings-toggle">GIS Layers &amp; Settings</button>
  <div id="flood-settings">
    <button id="flood-satellite">Satellite</button>
    <button id="flood-street">Street</button>
  </div>
  <button id="flood-locate">Show Your Location</button>
</div>
<script>
  const floodMap = window.floodMap;
  const floodSatelliteLayer = window.floodSatelliteLayer;
  const floodStreetLayer = window.floodStreetLayer;
  document.getElementById('flood-recenter').onclick = () => floodMap.flyTo([14.74, 121.14], 13, { duration: 1.2 });
  document.getElementById('flood-settings-toggle').onclick = () => {
    const panel = document.getElementById('flood-settings');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  };
  document.getElementById('flood-satellite').onclick = () => {
    if (!floodMap.hasLayer(floodSatelliteLayer)) floodMap.addLayer(floodSatelliteLayer);
    if (floodMap.hasLayer(floodStreetLayer)) floodMap.removeLayer(floodStreetLayer);
  };
  document.getElementById('flood-street').onclick = () => {
    if (!floodMap.hasLayer(floodStreetLayer)) floodMap.addLayer(floodStreetLayer);
    if (floodMap.hasLayer(floodSatelliteLayer)) floodMap.removeLayer(floodSatelliteLayer);
  };
  document.getElementById('flood-locate').onclick = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      floodMap.flyTo([position.coords.latitude, position.coords.longitude], 16, { duration: 1.6 });
      L.circleMarker([position.coords.latitude, position.coords.longitude], { radius: 7, color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: .9 }).addTo(floodMap);
    });
  };
</script>
</body>`);
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.end(floodMapHtml);
      });
    },
  };
});
