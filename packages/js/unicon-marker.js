// Unicons SVG marker for Leaflet
// Example: green map pin with Unicons location icon
export function createUniconMarkerHtml(iconClass = 'uil-location-point', color = '#2E7D32', bg = '#fff') {
  return `
    <div style="
      width: 36px; height: 36px; border-radius: 50%; background: ${bg};
      display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); border: 2px solid ${color};
    ">
      <i class="uil ${iconClass}" style="font-size: 22px; color: ${color};"></i>
    </div>
  `;
}
