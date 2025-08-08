// Map timeline IDs to experience card selectors
const timelineToExperience = {
  'exp-scsu-research': '.experience__card:nth-of-type(3)',
  'exp-uiuc': null, // Add selector if exists
  'exp-sculptor': null, // Add selector if exists
  'exp-humannity-2': '.experience__card:nth-of-type(1)',
  'exp-humannity-1': '.experience__card:nth-of-type(1)',
  'exp-scsu': null, // Add selector if exists
  'exp-zs': '.experience__card:nth-of-type(2)',
  'exp-thapar': null, // Add selector if exists
  'exp-ecell': '.experience__card:nth-of-type(4)',
  'exp-uprvunl': '.experience__card:nth-of-type(5)',
  'exp-hindalco': '.experience__card:nth-of-type(6)',
  'exp-asmara': '.experience__card:nth-of-type(8)'
};

// Add click event to all .qualification__data
// Modern Unicons SVG marker for Leaflet with gradient, shadow, and bounce
function createUniconMarkerHtml(iconClass = 'uil-location-point', color = '#C62828', bg = '#fff') {
  return `
    <div class="modern-unicon-marker">
      <i class="uil ${iconClass}" style="color: #124f00;"></i>
    </div>
  `;
}

// Inject modern marker CSS if not present
if (!document.getElementById('modern-unicon-marker-style')) {
  const style = document.createElement('style');
  style.id = 'modern-unicon-marker-style';
  style.textContent = `
    .modern-unicon-marker {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      border: none;
      transition: transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s;
      cursor: pointer;
    }
    .modern-unicon-marker i.uil {
      font-size: 23px;
      color: #124f00;
      filter: drop-shadow(0 1px 0 #fff8);
    }
    .leaflet-marker-icon .modern-unicon-marker:hover {
      animation: marker-bounce 0.5s cubic-bezier(.4,2,.6,1);
      box-shadow: none;
      transform: scale(1.08) translateY(-4px);
    }
    @keyframes marker-bounce {
      0% { transform: scale(1) translateY(0); }
      40% { transform: scale(1.12) translateY(-10px); }
      60% { transform: scale(0.98) translateY(-4px); }
      100% { transform: scale(1.08) translateY(-4px); }
    }
    /* Modern map look */
    #milestone-map .leaflet-container {
      border-radius: 16px;
      box-shadow: 0 4px 32px 0 rgba(44,62,80,0.10), 0 1.5px 6px 0 rgba(0,0,0,0.10);
      filter: saturate(1.08) contrast(1.04);
    }
    .leaflet-control-attribution {
      font-size: 12px;
      color: #888;
      background: rgba(255,255,255,0.85);
      border-radius: 8px;
      padding: 2px 8px;
      margin: 4px;
      box-shadow: 0 1px 4px 0 rgba(0,0,0,0.04);
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      box-shadow: 0 2px 12px 0 rgba(44,62,80,0.10);
      background: #fff;
      font-size: 15px;
    }
    .leaflet-popup-tip {
      background: #fff;
    }
  `;
  document.head.appendChild(style);
}
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.qualification__data[id]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      const expId = el.id;
      const expSelector = timelineToExperience[expId];
      if (expSelector) {
        const expCard = document.querySelector(expSelector);
        if (expCard) {
          expCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          expCard.classList.add('highlight-map-exp');
          setTimeout(() => expCard.classList.remove('highlight-map-exp'), 2000);
        }
      }
    });
  });
});
// Timeline-to-experience scroll and highlight
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('timeline-link')) {
    e.preventDefault();
    const id = e.target.getAttribute('href');
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-map-exp');
      setTimeout(() => el.classList.remove('highlight-map-exp'), 2000);
    }
  }
});
// Add this file to initialize and configure the Leaflet map with milestone pins
// You can add more milestones by editing the markers array

document.addEventListener('DOMContentLoaded', function () {
  // Coordinates and info for each milestone
  const markers = [
    {
      coords: [40.1138, -88.2249], // UIUC
      popup: '<b>University of Illinois Urbana-Champaign</b><br>Master of Computer Science & Data Science',
      expId: 'exp-uiuc'
    },
    {
      coords: [34.0522, -118.2437], // Los Angeles
      popup: '<b>Humannity Medtec</b><br>Software Engineer I/II',
      expId: 'exp-humannity-2'
    },
    {
      coords: [40.7128, -74.0060], // New York
      popup: '<b>Sculptor Capital Management</b><br>Data Scientist/AI Engineer',
      expId: 'exp-sculptor'
    },
    {
      coords: [45.5539, -94.1632], // St Cloud, MN
      popup: '<b>St Cloud State University</b><br>Master of Engineering Management / Research',
      expId: 'exp-scsu'
    },
    {
      coords: [18.5204, 73.8567], // Pune
      popup: '<b>ZS Associates</b><br>Decision Analytics Associate',
      expId: 'exp-zs'
    },
    {
      coords: [30.3544, 76.3647], // Patiala (All experiences)
      popup: '<b>Patiala, India</b><br>' +
        '<b>Thapar Institute of Engineering and Technology</b><br>Bachelor of Electronics & Communications Engineering' +
        '<br><a href="#exp-thapar" class="map-link">View Thapar Experience</a>' +
        '<br><b>Colinkers, Entrepreneurship Cell</b>' +
        '<br><a href="#exp-ecell" class="map-link">View E-Cell Experience</a>',
      expId: ['exp-thapar', 'exp-ecell']
    },
    // India experiences
    {
      coords: [28.4595, 77.0266], // Gurgaon
      popup: '<b>Asmara</b><br>Gurgaon, India',
      expId: 'exp-asmara'
    },
    {
      coords: [24.6879, 83.0684], // Sonbhadra
      popup: '<b>Hindalco, UPRVUNL</b><br>Sonbhadra, India',
      expId: 'exp-hindalco'
    }
  ];

  // Initialize map
  var map = L.map('milestone-map').setView([20, 0], 2);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Add markers with Unicons
  const markerObjs = [];
  markers.forEach(function(marker) {
    // Use Unicons for all pins, can customize per marker if desired
    const iconHtml = createUniconMarkerHtml('uil-location-point', '#C62828', '#fff');
    const unicon = L.divIcon({
      className: '',
      html: iconHtml,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38]
    });
    const m = L.marker(marker.coords, { icon: unicon }).addTo(map).bindPopup(marker.popup);
    markerObjs.push({ marker: m, expId: marker.expId });
  });

  // Show popup on marker hover, scroll on marker click
  markerObjs.forEach(function(obj) {
    obj.marker.on('mouseover', function(e) {
      obj.marker.openPopup();
    });
    obj.marker.on('mouseout', function(e) {
      obj.marker.closePopup();
    });
    obj.marker.on('click', function(e) {
      if (Array.isArray(obj.expId)) {
        // Scroll to the first experience in the list
        const el = document.getElementById(obj.expId[0]);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-map-exp');
          setTimeout(() => el.classList.remove('highlight-map-exp'), 2000);
        }
      } else if (obj.expId) {
        const el = document.getElementById(obj.expId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-map-exp');
          setTimeout(() => el.classList.remove('highlight-map-exp'), 2000);
        }
      }
    });
  });

  // (No longer needed: Smooth scroll for map links)

  // Add Unicons CSS if not present
  if (!document.querySelector('link[href*="unicons.iconscout.com"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unicons.iconscout.com/release/v4.0.0/css/line.css';
    document.head.appendChild(link);
  }
});
