const HERO_BG = '/assets/hero-bg.png';

export default function MainPage() {
  return (
    <div className="main-page fade-in">
      <div className="main-page-bg">
        <img src={HERO_BG} alt="Sea view from Istanbul" />
      </div>
      <div className="main-page-overlay" />
      
      <div className="main-page-content">
        <span className="main-subtitle">TO OUR YOUTH</span>
        <h1 className="main-title">film Archieve</h1>
        <span className="main-subtitle-right">AROUND THE WORLD</span>
      </div>
      
      <div className="main-bottom">
        <div className="main-bottom-line" />
        <p className="main-bottom-text">These memories created by two warm hearts.</p>
        <div className="main-bottom-line" />
      </div>
    </div>
  );
}
