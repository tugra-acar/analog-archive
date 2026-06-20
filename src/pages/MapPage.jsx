import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { photos, locations } from '../data/mockData';
import 'leaflet/dist/leaflet.css';

// SVG Icons built inline to substitute missing Figma files
const Icons = {
  pushpin: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.0919 8.4853L17.6777 9.8995L16.9706 9.1924L12.7279 13.435L12.0208 16.9706L10.6066 18.3848L6.36396 14.1421L1.41422 19.0919L0 17.6777L4.94975 12.7279L0.70711 8.4853L2.12132 7.07107L5.65686 6.36396L9.8995 2.12132L9.1924 1.41422L10.6066 0L19.0919 8.4853Z" fill="currentColor"/>
    </svg>
  ),
  turkey: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.3891 10.3891L7.5 14.2782L3.61091 10.3891C1.46303 8.2412 1.46303 4.7588 3.61091 2.61091C5.7588 0.46303 9.2412 0.46303 11.3891 2.61091C13.537 4.7588 13.537 8.2412 11.3891 10.3891ZM7.5 8.5C8.60457 8.5 9.5 7.60457 9.5 6.5C9.5 5.39543 8.60457 4.5 7.5 4.5C6.39543 4.5 5.5 5.39543 5.5 6.5C5.5 7.60457 6.39543 8.5 7.5 8.5ZM20.3891 19.3891L16.5 23.2782L12.6109 19.3891C10.463 17.2412 10.463 13.7588 12.6109 11.6109C14.7588 9.46303 18.2412 9.46303 20.3891 11.6109C22.537 13.7588 22.537 17.2412 20.3891 19.3891ZM16.5 17.5C17.6046 17.5 18.5 16.6046 18.5 15.5C18.5 14.3954 17.6046 13.5 16.5 13.5C15.3954 13.5 14.5 14.3954 14.5 15.5C14.5 16.6046 15.3954 17.5 16.5 17.5Z" fill="currentColor"/>
    </svg>
  ),
  earth: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
};

// Scope bounds
const BOUNDS = {
  istanbul: { center: [41.015, 28.979], zoom: 10 }, // Zoom 10 covers all Istanbul
  turkey:   { center: [39.0, 35.0],     zoom: 6 },
  world:    { center: [30, 20],          zoom: 3 },
};

// Custom cluster icon
function createClusterCustomIcon(cluster) {
  const markers = cluster.getAllChildMarkers();
  let count = 0;
  markers.forEach(m => {
    count += (m.options.photoCount || 0);
  });

  let size = 40;
  if (count >= 10) size = 50;
  if (count >= 50) size = 60;

  return L.divIcon({
    html: `<div class="cluster-bubble"><span>${count}</span></div>`,
    className: 'cluster-icon-wrapper',
    iconSize: L.point(size, size, true),
  });
}

// Component for flying to bounds
function FlyToScope({ scope }) {
  const map = useMap();
  useEffect(() => {
    const { center, zoom } = BOUNDS[scope];
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [scope, map]);
  return null;
}

// Component for forcing Leaflet to recalculate size
function MapSizeFixer() {
  const map = useMap();
  useEffect(() => {
    // Invalidate size immediately and after a short delay to handle CSS flex layout settling
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [scope, setScope] = useState('world');
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const mapRef = useRef(null);

  // We only map locations that actually have photos tied to them
  const mappableLocations = useMemo(() => {
    return locations.filter(loc => photos.some(p => p.locationId === loc.id));
  }, []);

  const selectedLocPhotos = useMemo(() => {
    if (!selectedLoc) return [];
    return photos.filter(p => p.locationId === selectedLoc.id);
  }, [selectedLoc]);

  const handleMarkerClick = (loc) => {
    setSelectedLoc(loc);
    if (mapRef.current) {
      mapRef.current.flyTo([loc.lat, loc.lng], 14, { duration: 1.2 });
    }
  };

  const currentIndex = selectedLocPhotos.findIndex(p => p.id === lightboxPhoto?.id);

  const handleNext = () => {
    if (currentIndex < selectedLocPhotos.length - 1) setLightboxPhoto(selectedLocPhotos[currentIndex + 1]);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setLightboxPhoto(selectedLocPhotos[currentIndex - 1]);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxPhoto) return;
      if (e.key === 'Escape') setLightboxPhoto(null);
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPhoto, currentIndex, selectedLocPhotos]);

  const scopes = [
    { key: 'istanbul', label: 'Istanbul', icon: Icons.pushpin },
    { key: 'turkey',   label: 'Turkey',   icon: Icons.turkey },
    { key: 'world',    label: 'World',    icon: Icons.earth },
  ];

  return (
    <div className="map-page page-content fade-in">
      <h1 className="map-title">Moment captured, place remembered .</h1>

      <div className="map-layout">
        <div className="map-sidebar">
          {scopes.map(s => (
            <div
              key={s.key}
              className={`map-scope-item ${scope === s.key ? 'active' : ''}`}
              onClick={() => { setScope(s.key); setSelectedLoc(null); }}
            >
              <span className="map-scope-icon" style={{display:'flex', alignItems:'center'}}>{s.icon}</span>
              <span className="map-scope-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="map-container-wrapper">
          <MapContainer
            center={BOUNDS.world.center}
            zoom={BOUNDS.world.zoom}
            className="leaflet-map"
            ref={mapRef}
            zoomControl={false}
            attributionControl={false}
            style={{ width: '100%', height: '100%', borderRadius: '12px' }}
          >
            <MapSizeFixer />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            <FlyToScope scope={scope} />

            <MarkerClusterGroup
              chunkedLoading
              iconCreateFunction={createClusterCustomIcon}
              maxClusterRadius={60}
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
            >
              <ClusterMarkers locations={mappableLocations} onMarkerClick={handleMarkerClick} />
            </MarkerClusterGroup>
          </MapContainer>
        </div>
      </div>

      {/* Neighborhood (Location) Detail Overlay */}
      <AnimatePresence>
        {selectedLoc && (
          <motion.div
            className="map-film-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setSelectedLoc(null)}
          >
            <motion.div
              className="map-film-card"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <button className="map-film-close" onClick={() => setSelectedLoc(null)}>✕</button>
              
              <div style={{padding: '24px 30px', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                 <h2 className="map-film-name" style={{marginBottom: '8px'}}>{selectedLoc.name} Photos</h2>
                 <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0}}>
                   Showing all {selectedLocPhotos.length} photos assigned to this neighborhood across all your films.
                 </p>
              </div>

              {/* Staggered photo gallery */}
              <div className="map-film-photos" style={{
                padding: '30px', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
                maxHeight: '500px',
                overflowY: 'auto'
              }}>
                {selectedLocPhotos.map((photo, i) => {
                  return (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                      style={{ cursor: 'pointer', position: 'relative', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexClassName: 'column' }}
                      onClick={() => setLightboxPhoto(photo)}
                    >
                      <img 
                        src={photo.thumbUrl || photo.imageUrl} 
                        alt="" 
                        className="map-film-photo" 
                        style={{ width: '100%', height: 'auto', display: 'block', margin: 0 }} 
                      />
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {lightboxPhoto && (
        <div className="lightbox" onClick={() => setLightboxPhoto(null)} style={{ zIndex: 9999 }}>
          <button className="lightbox-close" onClick={() => setLightboxPhoto(null)}>✕</button>

          {currentIndex > 0 && (
            <button
              className="lightbox-nav-btn prev"
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              style={{ position: 'fixed', left: '40px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, transition: 'all 0.3s' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          )}
          {currentIndex < selectedLocPhotos.length - 1 && (
            <button
              className="lightbox-nav-btn next"
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              style={{ position: 'fixed', right: '40px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, transition: 'all 0.3s' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}

          <div className="lightbox-content" onClick={e => e.stopPropagation()} style={{ background: 'transparent' }}>
            <div className="lightbox-image-container" onClick={() => setLightboxPhoto(null)}>
               <img src={lightboxPhoto.imageUrl} alt="" onClick={e => e.stopPropagation()} />
            </div>
            
            <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '16px', alignItems: 'center', zIndex: 10 }}>
               <button 
                 className="submit-btn" 
                 onClick={() => navigate(`/archive/${lightboxPhoto.filmId}?photoId=${lightboxPhoto.id}`)}
                 style={{ padding: '10px 24px', fontSize: '14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
               >
                 Go to Film Archive
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Separate component so it renders inside MapContainer context
function ClusterMarkers({ locations, onMarkerClick }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const clusterGroup = L.markerClusterGroup({
      iconCreateFunction: createClusterCustomIcon,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      animate: true,
    });

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    locations.forEach(loc => {
      const locPhotosCount = photos.filter(p => p.locationId === loc.id).length;
      
      const dynamicSingleIcon = L.divIcon({
        html: `<div class="cluster-bubble" style="transform: scale(0.85); background: rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.2);"><span>${locPhotosCount}</span></div>`,
        className: 'cluster-icon-wrapper',
        iconSize: L.point(40, 40, true),
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: dynamicSingleIcon, photoCount: locPhotosCount });
      marker.on('click', () => onMarkerClick(loc));
      marker.bindTooltip(loc.name, {
        direction: 'top',
        offset: [0, -14],
        className: 'map-tooltip',
      });
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    clusterRef.current = clusterGroup;

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }
    };
  }, [map, locations, onMarkerClick]);

  return null;
}
