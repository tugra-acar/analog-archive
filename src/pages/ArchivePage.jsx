import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { films } from '../data/mockData';

export default function ArchivePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateSort, setDateSort] = useState('newest'); // 'newest' or 'oldest'
  const [colorFilter, setColorFilter] = useState(null); // 'colored' or 'bw'
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  const filteredFilms = useMemo(() => {
    let result = [...films];

    // Search
    if (searchQuery) {
      result = result.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Favorites
    if (showFavorites) {
      result = result.filter(f => f.isFavorite);
    }

    // Color filter
    if (colorFilter) {
      result = result.filter(f => f.type === colorFilter);
    }

    // Date sort
    if (dateSort === 'newest') {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (dateSort === 'oldest') {
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return result;
  }, [searchQuery, dateSort, colorFilter, showFavorites]);


  return (
    <div className="archive-page page-content fade-in">
      {/* Search Bar */}
      <div className="archive-search">
        <div className="search-bar">
          <svg className="search-bar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by film name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            id="archive-search-input"
          />
        </div>
      </div>

      <div className="archive-layout">
        {/* Filter Panel */}
        <div className="filter-panel">
          {/* All */}
          <div
            className={`filter-item ${!showFavorites && !colorFilter ? 'active' : ''}`}
            onClick={() => { setShowFavorites(false); setColorFilter(null); }}
            id="filter-all"
          >
            <div className="filter-item-left">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="filter-icon">
                <path d="M4 3.25H9C9.41421 3.25 9.75 3.58579 9.75 4V4.25H14C14.3831 4.25 14.6991 4.53743 14.7441 4.9082L14.7773 5.17969L15.0449 5.12305L17.8232 4.53223C18.2284 4.44611 18.6268 4.70519 18.7129 5.11035L21.624 18.8037C21.7101 19.2089 21.451 19.6073 21.0459 19.6934L17.1338 20.5254C16.7286 20.6115 16.3302 20.3524 16.2441 19.9473L15.2441 15.2451L14.75 15.2969V20C14.75 20.4142 14.4142 20.75 14 20.75H4C3.58579 20.75 3.25 20.4142 3.25 20V4C3.25 3.58579 3.58579 3.25 4 3.25ZM4.75 19.25H8.25V16.75H4.75V19.25ZM9.75 19.25H13.25V15.75H9.75V19.25ZM19.2363 15.9893L17.2803 16.4053L17.0352 16.457L17.0879 16.7012L17.5029 18.6572L17.5557 18.9023L17.7998 18.8506L19.7559 18.4346L20.001 18.3828L19.9492 18.1377L19.5332 16.1816L19.4805 15.9375L19.2363 15.9893ZM4.75 15.25H8.25V4.75H4.75V15.25ZM17.1572 6.20801L15.2012 6.62305L14.9561 6.67578L15.0088 6.91992L16.6719 14.7451L16.7236 14.9902L16.9688 14.9375L18.9248 14.5225L19.1689 14.4697L19.1172 14.2256L17.4541 6.40039L17.4014 6.15527L17.1572 6.20801ZM9.75 14.25H13.25V5.75H9.75V14.25Z" fill="#A5A59E" stroke="#181F21" strokeWidth="0.5"/>
              </svg>
              <span className="filter-label">All</span>
            </div>
            <div className="filter-checkbox" />
          </div>

          {/* Favorites */}
          <div
            className={`filter-item ${showFavorites ? 'active' : ''}`}
            onClick={() => setShowFavorites(!showFavorites)}
            id="filter-favorites"
          >
            <div className="filter-item-left">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="filter-icon">
                <path d="M12.168 4.71484C14.4187 2.69449 17.8975 2.76136 20.0654 4.93359C22.2341 7.10678 22.3075 10.5686 20.291 12.8262L12 21.1309L3.70801 12.8262C1.69158 10.5685 1.76724 7.1019 3.93457 4.93457C6.10438 2.76476 9.5765 2.69132 11.834 4.71484L12.001 4.86426L12.168 4.71484ZM19.0039 5.99316C17.4108 4.39697 14.8393 4.33257 13.1699 5.83105L12.001 6.87891L10.833 5.83203C9.15903 4.33158 6.5925 4.39774 4.99512 5.99512C3.41245 7.57778 3.33227 10.1123 4.79102 11.7871L4.79688 11.7939L4.80273 11.7998L11.8232 18.8311L12 19.0078L12.1768 18.8311L19.1973 11.7998L19.2031 11.7939L19.209 11.7871C20.6684 10.1115 20.5884 7.58105 19.0039 5.99316Z" fill="#93948E" stroke="#181F21" strokeWidth="0.5"/>
              </svg>
              <span className="filter-label">Favorites</span>
            </div>
            <div className="filter-checkbox" />
          </div>

          {/* Date Filter */}
          <div
            className={`filter-item ${dateSort ? 'active' : ''}`}
            onClick={() => setShowDateMenu(!showDateMenu)}
            id="filter-date"
          >
            <div className="filter-item-left">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className="filter-icon">
                <path d="M6.75 0.25V2.25H13.25V0.25H14.75V2.25H19C19.4142 2.25 19.75 2.58579 19.75 3V19C19.75 19.4142 19.4142 19.75 19 19.75H1C0.585788 19.75 0.25 19.4142 0.25 19V3C0.25 2.58579 0.585791 2.25 1 2.25H5.25V0.25H6.75ZM1.75 18.25H18.25V9.75H1.75V18.25ZM15.75 12.25V13.75H14.25V12.25H15.75ZM10.75 12.25V13.75H9.25V12.25H10.75ZM5.75 12.25V13.75H4.25V12.25H5.75ZM1.75 8.25H18.25V3.75H14.75V5.75H13.25V3.75H6.75V5.75H5.25V3.75H1.75V8.25Z" fill="#93948E" stroke="#181F21" strokeWidth="0.5"/>
              </svg>
              <span className="filter-label">to Date</span>
            </div>
            <svg className={`filter-arrow ${showDateMenu ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </div>
          <div className={`filter-submenu ${showDateMenu ? 'open' : ''}`}>
            <div
              className={`filter-suboption ${dateSort === 'oldest' ? 'active' : ''}`}
              onClick={() => setDateSort(dateSort === 'oldest' ? null : 'oldest')}
            >
              Oldest to newest
            </div>
            <div
              className={`filter-suboption ${dateSort === 'newest' ? 'active' : ''}`}
              onClick={() => setDateSort(dateSort === 'newest' ? null : 'newest')}
            >
              Newest to oldest
            </div>
          </div>

          {/* Color Filter */}
          <div
            className={`filter-item ${colorFilter ? 'active' : ''}`}
            onClick={() => setShowColorMenu(!showColorMenu)}
            id="filter-color"
          >
            <div className="filter-item-left">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="filter-icon">
                <path d="M12 2.25C17.4126 2.25 21.7499 6.14264 21.75 10.8887C21.75 13.8173 19.373 16.1943 16.4443 16.1943H14.4775C13.4174 16.1945 12.5615 17.0511 12.5615 18.1113C12.5616 18.5995 12.7535 19.0464 13.0459 19.377H13.0469C13.2763 19.6351 13.4169 19.9662 13.417 20.333C13.417 21.1151 12.7641 21.75 12 21.75C6.61585 21.75 2.25 17.3841 2.25 12C2.25 6.61585 6.61585 2.25 12 2.25ZM12 3.75C7.44428 3.75 3.75 7.44428 3.75 12C3.75 16.3209 7.07311 19.8664 11.3027 20.2207L11.7861 20.2617L11.5391 19.8447C11.2321 19.3272 11.0616 18.73 11.0615 18.1113C11.0615 16.2227 12.5889 14.6945 14.4775 14.6943H16.4443C18.5445 14.6943 20.25 12.9889 20.25 10.8887C20.2499 6.96934 16.5717 3.75 12 3.75ZM7.5 9.25C8.19036 9.25 8.75 9.80964 8.75 10.5C8.75 11.1903 8.19036 11.75 7.5 11.75C6.80964 11.75 6.25 11.1903 6.25 10.5C6.25 9.80964 6.80964 9.25 7.5 9.25ZM16.5 9.25C17.1903 9.25 17.75 9.80964 17.75 10.5C17.75 11.1903 17.1903 11.75 16.5 11.75C15.8097 11.75 15.25 11.1903 15.25 10.5C15.25 9.80964 15.8097 9.25 16.5 9.25ZM12 6.25C12.6903 6.25 13.25 6.80964 13.25 7.5C13.25 8.19036 12.6903 8.75 12 8.75C11.3097 8.75 10.75 8.19036 10.75 7.5C10.75 6.80964 11.3097 6.25 12 6.25Z" fill="#93948E" stroke="#181F21" strokeWidth="0.5"/>
              </svg>
              <span className="filter-label">to Color</span>
            </div>
            <svg className={`filter-arrow ${showColorMenu ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </div>
          <div className={`filter-submenu ${showColorMenu ? 'open' : ''}`}>
            <div
              className={`filter-suboption ${colorFilter === 'bw' ? 'active' : ''}`}
              onClick={() => setColorFilter(colorFilter === 'bw' ? null : 'bw')}
            >
              Black&White
            </div>
            <div
              className={`filter-suboption ${colorFilter === 'colored' ? 'active' : ''}`}
              onClick={() => setColorFilter(colorFilter === 'colored' ? null : 'colored')}
            >
              Colored
            </div>
          </div>
        </div>

        {/* Film Grid */}
        <div className="film-grid">
          {filteredFilms.map((film, i) => (
            <div
              key={film.id}
              className="film-card slide-up"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => navigate(`/archive/${film.id}`)}
              id={`film-card-${film.id}`}
            >
              <img src={film.coverThumbUrl || film.coverPhotoUrl} alt={film.name} loading="lazy" />
              <div className="film-card-overlay">
                <span className="film-card-name">{film.name}</span>
                <div className="film-card-meta">
                  <span className="film-card-badge">{film.type === 'bw' ? 'B&W' : 'Color'}</span>
                  <span className="film-card-badge">{film.soul}</span>
                  {film.filmStock && <span className="film-card-badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{film.filmStock}</span>}
                </div>
              </div>
              {film.isFavorite && (
                <svg className="film-card-fav favorited" viewBox="0 0 24 24" fill="#f4f0e5" stroke="none">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
