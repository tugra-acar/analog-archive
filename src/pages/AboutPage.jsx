import { useNavigate } from 'react-router-dom';

const TUGRA_PHOTO = 'assets/tugra-photo.png';
const DAMLA_PHOTO = 'assets/damla-photo.png';

export default function AboutPage() {
  const navigate = useNavigate();
  
  return (
    <div className="about-page page-content fade-in">
      <h1 className="about-title">Beyond the screen...</h1>
      
      <div className="about-photos">
        <div className="about-person" onClick={() => navigate('/about/tugra')} id="about-tugra">
          <div className="about-person-photo">
            <img src={TUGRA_PHOTO} alt="Tuğra Acar" />
          </div>
          <span className="about-person-name">Tuğra Acar</span>
        </div>
        
        <div className="about-person" onClick={() => navigate('/about/damla')} id="about-damla">
          <div className="about-person-photo">
            <img src={DAMLA_PHOTO} alt="Damla Demirok" />
          </div>
          <span className="about-person-name">Damla Demirok</span>
        </div>
      </div>
      
      <div className="about-bottom">
        <div className="about-bottom-line" />
        <p className="about-bottom-text">
          Trying to carry the moment to it's own place, give them the right value and feel them fully.
        </p>
        <div className="about-bottom-line" />
      </div>
    </div>
  );
}
