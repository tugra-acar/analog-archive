import { useEffect, useRef, useMemo, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { films, photos, locations } from '../data/mockData';

Chart.register(...registerables);

const TUGRA_DETAIL_PHOTO = '/assets/tugra-detail-photo.png';
const DAMLA_DETAIL_PHOTO = '/assets/damla-detail-photo.png';

const personConfig = {
  tugra: {
    heading: 'A map of light one moment in a time',
    photo: TUGRA_DETAIL_PHOTO,
  },
  damla: {
    heading: 'A diary written on film with grain',
    photo: DAMLA_DETAIL_PHOTO,
  },
};

export default function PersonPage({ person }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const config = personConfig[person];

  // Extract all available years for this person
  const availableYears = useMemo(() => {
    const years = new Set();
    films.forEach(film => {
      if (film.soul === person && film.date) {
        const year = new Date(film.date).getFullYear();
        if (!isNaN(year)) years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [person]);

  const [selectedYear, setSelectedYear] = useState(availableYears[0] || new Date().getFullYear());

  // Reset selected year when person changes
  useEffect(() => {
    if (availableYears.length > 0) {
      setSelectedYear(availableYears[0]);
    }
  }, [person, availableYears]);

  // Dynamically calculate "Monthly Frequency Calendar" (Photos per month for selected year)
  const monthlyData = useMemo(() => {
    const data = new Array(12).fill(0);
    photos.forEach(photo => {
      const film = films.find(f => f.id === photo.filmId);
      if (film && film.soul === person && film.date) {
        const date = new Date(film.date);
        if (date.getFullYear() === selectedYear) {
          const month = date.getMonth();
          if (!isNaN(month)) {
            data[month]++;
          }
        }
      }
    });
    return data;
  }, [person, selectedYear]);

  // Dynamically calculate "Where light gathers most" (Top 3 locations by photo count for selected year)
  const topLocations = useMemo(() => {
    const counts = {};
    photos.forEach(photo => {
      const film = films.find(f => f.id === photo.filmId);
      if (film && film.soul === person && film.date && photo.locationId) {
        const date = new Date(film.date);
        if (date.getFullYear() === selectedYear) {
          counts[photo.locationId] = (counts[photo.locationId] || 0) + 1;
        }
      }
    });

    return Object.entries(counts)
      .map(([locId, count]) => {
        const loc = locations.find(l => l.id === locId);
        return { name: loc ? loc.name : 'Unknown', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [person, selectedYear]);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Photos Taken',
            data: monthlyData,
            borderColor: '#f4f0e5',
            backgroundColor: 'rgba(244, 240, 229, 0.05)',
            borderWidth: 2,
            pointBackgroundColor: '#141a1c',
            pointBorderColor: '#f4f0e5',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // Cleaner look without legend
          },
          tooltip: {
            backgroundColor: '#2e3537',
            titleColor: '#f4f0e5',
            bodyColor: '#f4f0e5',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: {
              color: 'rgba(255,255,255,0.8)',
              font: { family: 'Inter', size: 12 },
            },
            grid: {
              color: 'rgba(255,255,255,0.06)',
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: 'rgba(255,255,255,0.8)',
              font: { family: 'Inter', size: 12 },
              stepSize: 1, // Photos count should be integers
              precision: 0,
            },
            grid: {
              color: 'rgba(255,255,255,0.06)',
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [person, monthlyData]);

  return (
    <div className="person-page page-content fade-in" key={person}>
      <h1 className="person-heading">{config.heading}</h1>

      <div className="person-layout">
        <div className="person-chart">
          <p className="person-chart-title">Monthly Frequency Calendar</p>
          <div className="chart-canvas-wrapper">
            <canvas ref={chartRef} />
          </div>

          {availableYears.length > 1 && (
            <div className="person-chart-years">
              {availableYears.map(year => (
                <button 
                  key={year}
                  className={`year-indicator-btn ${selectedYear === year ? 'active' : ''}`}
                  onClick={() => setSelectedYear(year)}
                >
                  <div className="year-graphic">
                    <div className="year-line" />
                    <div className="year-dot" />
                  </div>
                  <span className="year-label">{year}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="person-sidebar">
          <div className="top-locations">
            <p className="top-locations-title" style={{marginBottom: topLocations.length > 0 ? 0 : '10px'}}>Where light gathers most</p>
            {topLocations.length > 0 ? (
              <div className="top-locations-list" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                {topLocations.map((loc) => (
                  <div key={loc.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '20px', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '20px' }}>
                      {loc.name}
                    </span>
                    <span style={{ fontSize: '20px', fontFamily: 'var(--font-heading)', color: 'var(--line-color)', flexShrink: 0 }}>
                      {loc.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
                <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-heading)', fontSize: '14px' }}>
                    No assigned locations yet.
                </div>
            )}
          </div>
          <div className="person-photo">
            <img src={config.photo} alt={person === 'tugra' ? 'Tuğra' : 'Damla'} />
          </div>
        </div>
      </div>
    </div>
  );
}
