import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import L from 'leaflet';
import { films, photos, locations } from '../data/mockData';

const geosearchProvider = new OpenStreetMapProvider();

const singleIcon = L.divIcon({
  html: `<div class="single-marker"><div class="single-marker-dot"></div></div>`,
  className: 'single-marker-wrapper',
  iconSize: L.point(22, 22, true),
  iconAnchor: L.point(11, 11),
});

// Component to dynamically set map center
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function FilmDetailPage() {
  const { filmId } = useParams();
  const navigate = useNavigate();
  // Store the actual photo object to mutate its locationId
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedStock, setEditedStock] = useState('');
  const [editedNotes, setEditedNotes] = useState('');

  const film = films.find(f => f.id === filmId);
  const filmPhotos = photos.filter(p => p.filmId === filmId);

  // Synchronize lightbox state with URL (Source of Truth)
  useEffect(() => {
    const photoIdFromUrl = searchParams.get('photoId');

    // If URL has an ID and it's different from current state, update state
    if (photoIdFromUrl && photoIdFromUrl !== lightboxPhoto?.id) {
      if (filmPhotos.length > 0) {
        const targetPhoto = filmPhotos.find(p => p.id === photoIdFromUrl);
        if (targetPhoto) {
          setLightboxPhoto(targetPhoto);
        } else {
          setLightboxPhoto(null);
        }
      }
    }
    // If URL has NO ID but state DOES, close the lightbox
    else if (!photoIdFromUrl && lightboxPhoto) {
      setLightboxPhoto(null);
    }
  }, [searchParams, filmPhotos, lightboxPhoto]);

  // Reset and pre-fill search state when lightbox opens
  useEffect(() => {
    if (lightboxPhoto) {
      if (lightboxPhoto.locationId) {
        const loc = locations.find(l => l.id === lightboxPhoto.locationId);
        if (loc) {
          setSelectedPlace({ label: loc.name, x: loc.lng, y: loc.lat });
        }
      } else {
        setSelectedPlace(null);
      }
      setSearchText('');
      setSearchResults([]);
    }
  }, [lightboxPhoto]);

  // Prevent background scrolling when lightbox is open
  useEffect(() => {
    if (lightboxPhoto) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; }
  }, [lightboxPhoto]);

  useEffect(() => {
    setActiveSearchIndex(-1);
  }, [searchResults]);

  const currentIndex = filmPhotos.findIndex(p => p.id === lightboxPhoto?.id);

  const handleNext = () => {
    if (currentIndex < filmPhotos.length - 1) {
      setSearchParams({ photoId: filmPhotos[currentIndex + 1].id });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSearchParams({ photoId: filmPhotos[currentIndex - 1].id });
    }
  };

  const handleCloseLightbox = () => {
    setSearchParams({}); // Lightbox will close via useEffect when URL is cleared
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxPhoto) return;

      if (e.key === 'Escape') {
        handleCloseLightbox();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowDown') {
        if (searchResults.length > 0) {
          e.preventDefault();
          setActiveSearchIndex(prev => (prev < Math.min(searchResults.length, 5) - 1 ? prev + 1 : prev));
        }
      } else if (e.key === 'ArrowUp') {
        if (searchResults.length > 0) {
          e.preventDefault();
          setActiveSearchIndex(prev => (prev > 0 ? prev - 1 : 0));
        }
      } else if (e.key === 'Enter') {
        if (activeSearchIndex >= 0 && searchResults[activeSearchIndex]) {
          e.preventDefault();
          handleSelectPlace(searchResults[activeSearchIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPhoto, currentIndex, searchResults, activeSearchIndex, filmPhotos]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchText) return;
    const results = await geosearchProvider.search({ query: searchText });
    setSearchResults(results);
  };

  const handleSelectPlace = async (place) => {
    setIsSaving(true);
    try {
      const placeName = place.label.split(',')[0].trim();

      const res = await fetch('/api/tag-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: lightboxPhoto.id,
          location: {
            name: placeName,
            lat: place.y,
            lng: place.x
          }
        })
      });

      if (!res.ok) throw new Error('Failed to save location');

      const data = await res.json();

      // Update local in-memory data as well so it feels instant
      let targetLoc = locations.find(l => l.name.toLowerCase() === placeName.toLowerCase());
      if (!targetLoc) {
        targetLoc = { id: data.locationId, name: placeName, lat: place.y, lng: place.x };
        locations.push(targetLoc);
      }

      const targetPhoto = photos.find(p => p.id === lightboxPhoto.id);
      if (targetPhoto) {
        targetPhoto.locationId = targetLoc.id;
        // Update state to trigger re-render
        setLightboxPhoto({ ...targetPhoto });
      }

      setSelectedPlace(place);
      setSearchResults([]);
      setSearchText('');

    } catch (err) {
      console.error(err);
      alert('Error saving location. Is the backend running?');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (film) {
      setEditedName(film.name);
      setEditedStock(film.filmStock || '');
      setEditedNotes(film.notes || '');
    }
  }, [film]);

  const handleDeleteFilm = async () => {
    if (!window.confirm('Are you sure you want to delete this film and all its photos? This action cannot be undone.')) return;

    try {
      console.log('Attempting to delete film:', filmId);
      const res = await fetch(`/api/film/${filmId}`, {
        method: 'DELETE'
      });

      const result = await res.json();
      console.log('Delete response:', result);

      if (!res.ok) {
        throw new Error(result.error || `Server returned ${res.status}`);
      }

      alert('Film deleted successfully. Redirecting...');
      navigate('/archive');
      // Delay reload slightly to ensure navigation state is handled
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      console.error('Frontend Delete Error:', err);
      alert(`Deletion failed: ${err.message}. Please check if the server is running on port 3001.`);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;

    try {
      console.log('Attempting to delete photo:', photoId);
      const res = await fetch(`/api/photo/${photoId}`, {
        method: 'DELETE'
      });

      const result = await res.json();
      console.log('Delete photo response:', result);

      if (!res.ok) {
        throw new Error(result.error || `Server returned ${res.status}`);
      }

      setLightboxPhoto(null);
      alert('Photo deleted successfully.');
      window.location.reload();
    } catch (err) {
      console.error('Frontend Photo Delete Error:', err);
      alert(`Deletion failed: ${err.message}. Please check if the server is running on port 3001.`);
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/film/${filmId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filmName: editedName,
          filmStock: editedStock,
          notes: editedNotes
        })
      });

      if (!res.ok) throw new Error('Update failed');

      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Error saving changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!film) {
    return (
      <div className="film-detail page-content fade-in">
        <p style={{ color: 'var(--text-secondary)', fontSize: 24 }}>Film not found.</p>
        <button className="film-detail-back" onClick={() => navigate('/archive')}>
          ← Back to Archive
        </button>
      </div>
    );
  }

  return (
    <div className="film-detail page-content fade-in">
      <div className="film-detail-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="film-detail-back" onClick={() => navigate('/archive')}>
            ← Back to Archive
          </button>
          {!isEditing ? (
            <button
              className="edit-btn"
              onClick={() => setIsEditing(true)}
              style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
            >
              Edit Details
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{ padding: '8px 16px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="submit-btn"
                style={{ padding: '8px 16px', fontSize: '14px', marginTop: 0 }}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div style={{ marginTop: '24px' }}>
            <input
              value={editedName}
              onChange={e => setEditedName(e.target.value)}
              className="form-input"
              style={{ fontSize: '32px', fontFamily: 'var(--font-heading)', width: '100%', height: '54px', padding: '10px 20px', marginBottom: '16px' }}
              placeholder="Film Name"
            />
            <input
              list="film-stock-options"
              value={editedStock}
              onChange={e => setEditedStock(e.target.value)}
              className="form-input"
              style={{ fontSize: '18px', width: '100%', height: '44px', padding: '10px 20px', marginBottom: '16px' }}
              placeholder="Film Stock (e.g. APX 400)"
            />
            <datalist id="film-stock-options">
              <option value="Kodak ColorPlus 200" />
              <option value="Kodak Gold 200" />
              <option value="Kodak Ultramax 400" />
              <option value="Kodak Portra 160" />
              <option value="Kodak Portra 400" />
              <option value="Kodak Portra 800" />
              <option value="Kodak Tri-X 400" />
              <option value="Kodak T-Max 400" />
              <option value="Fuji C200" />
              <option value="Fujicolor Superia X-TRA 400" />
              <option value="Fujifilm PRO 400H" />
              <option value="Ilford HP5 Plus 400" />
              <option value="Ilford FP4 Plus 125" />
              <option value="Ilford Delta 400" />
              <option value="Ilford Delta 3200" />
              <option value="Agfa APX 100" />
              <option value="Agfa APX 400" />
              <option value="Fomapan 100" />
              <option value="Fomapan 200" />
              <option value="Fomapan 400" />
              <option value="Cinestill 400D" />
              <option value="Cinestill 800T" />
              <option value="Cinestill BwXX" />
              <option value="Kentmere Pan 100" />
              <option value="Kentmere Pan 400" />
              <option value="Harman Phoenix 200" />
              <option value="Rollei Retro 400S" />
              <option value="Silberra U200" />
              <option value="Lomography Color Negative 400" />
              <option value="Lomography Lady Grey 400" />
            </datalist>
          </div>
        ) : (
          <h1 className="film-detail-title">{film.name}</h1>
        )}

        <div className="film-detail-info">
          <span className="film-card-badge" style={{ fontSize: 13, padding: '4px 10px' }}>
            {film.type === 'bw' ? 'Black & White' : 'Colored'}
          </span>
          <span className="film-card-badge" style={{ fontSize: 13, padding: '4px 10px' }}>
            {film.soul === 'tugra' ? 'Tuğra' : 'Damla'}
          </span>
          <span className="film-card-badge" style={{ fontSize: 13, padding: '4px 10px' }}>
            {film.date}
          </span>
          {film.filmStock && (
            <span className="film-card-badge" style={{ fontSize: 13, padding: '4px 10px', background: 'rgba(255,255,255,0.1)' }}>
              {film.filmStock}
            </span>
          )}
        </div>

        {isEditing ? (
          <textarea
            className="form-textarea"
            value={editedNotes}
            onChange={e => setEditedNotes(e.target.value)}
            style={{ width: '100%', minHeight: '120px', marginTop: '16px', fontSize: '20px' }}
            placeholder="Add some notes about this film..."
          />
        ) : (
          film.notes && <p className="film-detail-notes">{film.notes}</p>
        )}
      </div>

      <div className="photo-grid">
        {filmPhotos.length > 0 ? filmPhotos.map(photo => (
          <div
            key={photo.id}
            className="photo-item"
            onClick={() => setSearchParams({ photoId: photo.id })}
          >
            <img src={photo.thumbUrl || photo.imageUrl} alt="" loading="lazy" />
          </div>
        )) : (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', fontSize: 20, padding: 40 }}>
            No photos uploaded yet for this film.
          </div>
        )}
      </div>

      {lightboxPhoto && (
        <div className="lightbox" onClick={handleCloseLightbox}>
          <button className="lightbox-close" onClick={handleCloseLightbox}>✕</button>

          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <button
              className="lightbox-nav-btn prev"
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              style={{ position: 'fixed', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, transition: 'all 0.3s' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          )}
          {currentIndex < filmPhotos.length - 1 && (
            <button
              className="lightbox-nav-btn next"
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              style={{ position: 'fixed', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, transition: 'all 0.3s' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}

          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <div className="lightbox-image-container" onClick={handleCloseLightbox}>
              <img src={lightboxPhoto.imageUrl} alt="" onClick={e => e.stopPropagation()} />
            </div>

            {/* Location Assigner Section below the fold */}
            <div className="lightbox-picker-section" style={{ width: '100%', maxWidth: '1000px', padding: '40px 20px', marginTop: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '28px', fontWeight: 300, letterSpacing: '2px', textTransform: 'uppercase' }}>
                  Location Identity
                </h2>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  {selectedPlace && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '18px', fontFamily: 'var(--font-body)', letterSpacing: '0.5px' }}>
                      {isSaving ? (
                        <span style={{ color: 'var(--accent-color)', fontWeight: 500 }}>Saving changes...</span>
                      ) : (
                        <>Currently Assigned: <strong style={{ color: '#fff', fontWeight: 400 }}>{locations.find(l => l.id === lightboxPhoto.locationId)?.name || selectedPlace.label.split(',')[0]}</strong></>
                      )}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeletePhoto(lightboxPhoto.id); }}
                    style={{
                      background: 'rgba(255, 69, 58, 0.1)',
                      color: '#ff453a',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: '1px solid rgba(255, 69, 58, 0.2)',
                      cursor: 'pointer'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                    Delete Photo
                  </button>
                </div>
              </div>

              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <input
                  type="text"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="Search for a neighborhood or city to map this frame..."
                  style={{ flex: 1, padding: '18px 24px', background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', outline: 'none', fontSize: '16px', fontFamily: 'var(--font-body)', fontWeight: 300, letterSpacing: '0.4px' }}
                />
                <button type="submit" className="submit-btn" style={{ padding: '0 40px', fontSize: '14px', letterSpacing: '1px' }}>Search</button>
              </form>
              {searchResults.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: '24px' }}>
                  {searchResults.slice(0, 5).map((res, i) => (
                    <div
                      key={i}
                      onClick={() => handleSelectPlace(res)}
                      style={{
                        padding: '16px 24px',
                        borderBottom: i !== searchResults.slice(0, 5).length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        color: i === activeSearchIndex ? '#fff' : 'rgba(255,255,255,0.8)',
                        fontSize: '15px',
                        background: i === activeSearchIndex ? 'rgba(255,255,255,0.1)' : 'transparent'
                      }}
                      onMouseEnter={() => setActiveSearchIndex(i)}
                    >
                      {res.label}
                    </div>
                  ))}
                </div>
              )}

              {/* Mini Map Preview */}
              <div style={{ height: '420px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', opacity: selectedPlace ? 1 : 0.4, transition: 'opacity 0.4s' }}>
                {selectedPlace ? (
                  <MapContainer center={[selectedPlace.y, selectedPlace.x]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={[selectedPlace.y, selectedPlace.x]} icon={singleIcon} />
                    <MapUpdater center={[selectedPlace.y, selectedPlace.x]} />
                  </MapContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-heading)', fontSize: '20px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    No location selected.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' }}>
        <button
          className="delete-btn"
          onClick={handleDeleteFilm}
          style={{
            background: 'rgba(255, 69, 58, 0.05)',
            color: '#ff453a',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid rgba(255, 69, 58, 0.15)',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.05)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
          Delete Film
        </button>
      </div>
    </div>
  );
}
