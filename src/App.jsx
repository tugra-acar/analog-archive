import { HashRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import MainPage from './pages/MainPage';
import ArchivePage from './pages/ArchivePage';
import FilmDetailPage from './pages/FilmDetailPage';
import MapPage from './pages/MapPage';
import AboutPage from './pages/AboutPage';
import PersonPage from './pages/PersonPage';
import UploadPage from './pages/UploadPage';

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <div className="page-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/archive/:filmId" element={<FilmDetailPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/about/tugra" element={<PersonPage person="tugra" />} />
          <Route path="/about/damla" element={<PersonPage person="damla" />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
