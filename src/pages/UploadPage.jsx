import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { Reorder } from 'framer-motion';
import getCroppedImg from '../utils/cropImage';




export default function UploadPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Step 1 state
  const [filmName, setFilmName] = useState('');
  const [filmStock, setFilmStock] = useState('');
  const [filmType, setFilmType] = useState(null);
  const [filmSoul, setFilmSoul] = useState(null);
  const [filmDate, setFilmDate] = useState(new Date().toISOString().split('T')[0]);
  const [coverPreview, setCoverPreview] = useState(null);
  
  // Step 2 state
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [notes, setNotes] = useState('');

  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [tempCover, setTempCover] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [draggingStep1, setDraggingStep1] = useState(false);
  const [draggingStep2, setDraggingStep2] = useState(false);

  const handleDragOver = (e, setter) => {
    e.preventDefault();
    e.stopPropagation();
    setter(true);
  };

  const handleDragLeave = (e, setter) => {
    e.preventDefault();
    e.stopPropagation();
    setter(false);
  };

  const handleDropCover = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingStep1(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
       setTempCover(URL.createObjectURL(file));
       setShowCropModal(true);
    }
  };

  const handleDropPhotos = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingStep2(false);
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      const newPhotos = files.map(file => ({
        id: Date.now() + Math.random(),
        preview: URL.createObjectURL(file),
        file,
      }));
      setUploadedPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTempCover(URL.createObjectURL(file));
      setShowCropModal(true);
    }
    e.target.value = null; // reset input
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg(tempCover, croppedAreaPixels);
      setCoverPreview(croppedImage);
      setShowCropModal(false);
      setTempCover(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({
      id: Date.now() + Math.random(),
      preview: URL.createObjectURL(file),
      file,
    }));
    setUploadedPhotos(prev => [...prev, ...newPhotos]);
  };

  const handleRemovePhoto = (id) => {
    setUploadedPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleContinue = () => {
    if (!filmName || !filmType || !filmSoul) return;
    setStep(2);
  };

  const handleComplete = async () => {
    try {
      const formData = new FormData();
      formData.append('filmName', filmName);
      formData.append('filmStock', filmStock);
      formData.append('filmType', filmType);
      formData.append('filmSoul', filmSoul);
      formData.append('filmDate', filmDate || new Date().toISOString().split('T')[0]);
      formData.append('notes', notes);

      // Handle cover photo
      if (coverPreview) {
        // coverPreview is a blob URL
        const response = await fetch(coverPreview);
        const blob = await response.blob();
        formData.append('cover', blob, 'cover.jpg');
      }

      // Handle grid photos
      if (uploadedPhotos && uploadedPhotos.length > 0) {
        for (let i = 0; i < uploadedPhotos.length; i++) {
          const ph = uploadedPhotos[i];
          if (ph.file) {
            formData.append('photos', ph.file);
          } else {
             const response = await fetch(ph.preview);
             const blob = await response.blob();
             formData.append('photos', blob, `photo-${i}.jpg`);
          }
        }
      }

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      // Optional buffer to let dev server fully reload photos.json
      setTimeout(() => {
        navigate('/archive');
        window.location.reload(); 
      }, 500);

    } catch (err) {
      console.error(err);
      alert('An error occurred while uploading. Ensure the local backend is running.');
    }
  };



  return (
    <div className="upload-page page-content fade-in">
      <div className="upload-header">
        <h1 className="upload-title">{step === 1 ? 'Film Upload' : 'Photograph Details'}</h1>
        <div className="upload-progress">
          <div
            className="upload-progress-fill"
            style={{ width: step === 1 ? '49%' : '100%' }}
          />
        </div>
      </div>

      {step === 1 ? (
        <div className="upload-body">
          {showCropModal && (
            <div className="crop-modal-overlay">
              <div className="crop-modal">
                <div className="crop-container" style={{ position: 'relative', width: '100%', height: '400px' }}>
                  <Cropper
                    image={tempCover}
                    crop={crop}
                    zoom={zoom}
                    aspect={2 / 3}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="crop-controls">
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-label="Zoom"
                    onChange={(e) => setZoom(e.target.value)}
                    className="zoom-slider"
                  />
                  <div style={{display: 'flex', gap: '12px'}}>
                    <button className="submit-btn" style={{fontSize: '16px', padding: '4px 12px', marginTop: '10px'}} onClick={() => {setShowCropModal(false); setTempCover(null)}}>Cancel</button>
                    <button className="submit-btn" style={{fontSize: '16px', padding: '4px 12px', marginTop: '10px'}} onClick={handleCropSave}>Crop & Save</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cover Photo Upload */}
          <div className="upload-cover-area">
            <label 
              htmlFor="cover-upload" 
              className={`upload-dashed-zone ${coverPreview ? 'has-image' : ''} ${draggingStep1 ? 'dragging' : ''}`}
              onDragOver={(e) => handleDragOver(e, setDraggingStep1)}
              onDragLeave={(e) => handleDragLeave(e, setDraggingStep1)}
              onDrop={handleDropCover}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover preview" />
              ) : (
                <>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="upload-placeholder-text">Drag & drop or click to add cover</span>
                </>
              )}
            </label>
            <input
              type="file"
              id="cover-upload"
              accept="image/*"
              onChange={handleCoverUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="cover-upload" className="upload-btn">
              Film Upload
              <svg className="upload-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
              </svg>
            </label>
          </div>

          {/* Form Fields */}
          <div className="upload-form">
            <div className="form-row">
              <span className="form-label">Film Name</span>
              <input
                className="form-input"
                type="text"
                placeholder="Type the film name"
                value={filmName}
                onChange={e => setFilmName(e.target.value)}
                id="upload-film-name"
              />
            </div>

            <div className="form-row">
              <span className="form-label">Film Stock</span>
              <input
                list="film-stock-options"
                className="form-input"
                type="text"
                placeholder="e.g. APX 400, Kodak Gold 200"
                value={filmStock}
                onChange={e => setFilmStock(e.target.value)}
                id="upload-film-stock"
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

            <div className="form-row">
              <span className="form-label">Type</span>
              <div className="form-checkboxes">
                <button
                  className={`form-checkbox ${filmType === 'colored' ? 'selected' : ''}`}
                  onClick={() => setFilmType('colored')}
                >
                  <div className="form-checkbox-box" />
                  <span className="form-checkbox-label">Colored</span>
                </button>
                <button
                  className={`form-checkbox ${filmType === 'bw' ? 'selected' : ''}`}
                  onClick={() => setFilmType('bw')}
                >
                  <div className="form-checkbox-box" />
                  <span className="form-checkbox-label">Black&White</span>
                </button>
              </div>
            </div>

            <div className="form-row">
              <span className="form-label">Soul</span>
              <div className="form-checkboxes">
                <button
                  className={`form-checkbox ${filmSoul === 'damla' ? 'selected' : ''}`}
                  onClick={() => setFilmSoul('damla')}
                >
                  <div className="form-checkbox-box" />
                  <span className="form-checkbox-label">Damla</span>
                </button>
                <button
                  className={`form-checkbox ${filmSoul === 'tugra' ? 'selected' : ''}`}
                  onClick={() => setFilmSoul('tugra')}
                >
                  <div className="form-checkbox-box" />
                  <span className="form-checkbox-label">Tuğra</span>
                </button>
              </div>
            </div>

            <div className="form-row">
              <span className="form-label">Date</span>
              <input
                className="form-input"
                type="date"
                value={filmDate}
                onChange={e => setFilmDate(e.target.value)}
                style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#fff', 'colorScheme': 'dark' }}
              />
            </div>

            <button
              className="submit-btn"
              onClick={handleContinue}
              style={{ opacity: filmName && filmType && filmSoul ? 1 : 0.5 }}
              id="upload-continue-btn"
            >
              Continue to photos
              <svg className="submit-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="upload-body">
          {/* Photo Grid Upload */}
          <Reorder.Group 
            as="div"
            axis="y" 
            values={uploadedPhotos} 
            onReorder={setUploadedPhotos} 
            className={`upload-photo-grid ${draggingStep2 ? 'dragging' : ''}`}
            onDragOver={(e) => handleDragOver(e, setDraggingStep2)}
            onDragLeave={(e) => handleDragLeave(e, setDraggingStep2)}
            onDrop={handleDropPhotos}
          >
            {uploadedPhotos.map(photo => (
              <Reorder.Item 
                as="div"
                key={photo.id} 
                value={photo} 
                className="photo-upload-slot filled"
                whileDrag={{ scale: 1.05, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
              >
                <img src={photo.preview} alt="" />
                <div className="photo-upload-dot" />
                <button 
                  className="photo-remove-btn" 
                  onClick={() => handleRemovePhoto(photo.id)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(255, 69, 58, 0.8)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    zIndex: 10,
                    border: 'none'
                  }}
                  title="Remove photo"
                >
                  ✕
                </button>
              </Reorder.Item>
            ))}
            
            {/* Direct button to select photos */}
            <label htmlFor="photos-upload" className="photo-upload-slot empty-add-btn">
              <span style={{ fontSize: '48px', color: 'rgba(255,255,255,0.3)', fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>+</span>
            </label>
            <input
              type="file"
              id="photos-upload"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
              value=""
            />
          </Reorder.Group>

          {/* Details Form */}
          <div className="upload-form">
            <div className="form-row">
              <span className="form-label">Film Name</span>
              <input
                className="form-input"
                type="text"
                value={filmName}
                readOnly
                style={{ opacity: 0.6 }}
              />
            </div>



            <div className="form-row" style={{ alignItems: 'flex-start' }}>
              <span className="form-label">Notes</span>
              <textarea
                className="form-textarea"
                placeholder="Any more moments to keep"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <button
              className="submit-btn"
              onClick={handleComplete}
              id="upload-complete-btn"
            >
              Complete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
