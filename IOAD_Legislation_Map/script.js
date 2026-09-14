const map = L.map('map', {
  center: [22, 0],
  zoom: 2,
  minZoom: 2,
  maxZoom: 10,
  worldCopyJump: false,
  maxBounds: [
    [-62, -180],
    [85, 180]
  ],
  maxBoundsViscosity: 1.0
});

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    maxZoom: 18,
    noWrap: true,
    opacity: 0.75,
    attribution: '&copy; OpenStreetMap contributors'
  }
).addTo(map);

const COLORS = {
  Green: '#4F9D69',
  Yellow: '#E9B44C',
  Grey: '#8C939A'
};

const hoverInfo =
  document.getElementById('hover-info');

let worldLayer;

function getMapColor(assistedDying) {
  const value =
    String(assistedDying || '')
      .trim()
      .toLowerCase();

  if (value === 'allowed') {
    return 'Green';
  }

  if (
    value === 'allowed with exceptions'
  ) {
    return 'Yellow';
  }

  return 'Grey';
}

function showInfo(event, data) {
  const status =
    data.status ||
    (data.assistedDying === 'No'
      ? 'Not allowed'
      : '');

  let html = `
    <div class="hover-country">
      ${data.name}
    </div>
  `;

  if (status) {
    html += `
      <div class="hover-label">
        Status
      </div>

      <div class="hover-status">
        ${status}
      </div>
    `;
  }

  if (data.notes) {
    html += `
      <div class="hover-notes">
        ${data.notes}
      </div>
    `;
  }

  hoverInfo.innerHTML = html;
  hoverInfo.style.display = 'block';

  moveInfo(event);
}

function moveInfo(event) {
  const mouseX =
    event.originalEvent.clientX;

  const mouseY =
    event.originalEvent.clientY;

  const boxWidth =
    hoverInfo.offsetWidth;

  const boxHeight =
    hoverInfo.offsetHeight;

  const gap = 22;

  let left =
    mouseX + gap;

  let top =
    mouseY - 25;

  if (
    left + boxWidth >
    window.innerWidth - 20
  ) {
    left =
      mouseX -
      boxWidth -
      gap;
  }

  if (
    top + boxHeight >
    window.innerHeight - 20
  ) {
    top =
      window.innerHeight -
      boxHeight -
      20;
  }

  if (top < 20) {
    top = 20;
  }

  hoverInfo.style.left =
    `${left}px`;

  hoverInfo.style.top =
    `${top}px`;
}

function hideInfo() {
  hoverInfo.style.display = 'none';
}

async function loadMap() {
  try {
    const csvResponse =
      await fetch('MAP_DATA.csv');

    if (!csvResponse.ok) {
      throw new Error(
        'Could not load MAP_DATA.csv'
      );
    }

    const csvText =
      await csvResponse.text();

    const rows =
      Papa.parse(
        csvText,
        {
          header: true,
          skipEmptyLines: true
        }
      ).data;

    const countryData = {};

    rows.forEach(row => {
      const iso3 =
        String(row.ISO3 || '').trim();

      if (!iso3) {
        return;
      }

      countryData[iso3] = {
        name:
          String(row.Country || '').trim(),

        assistedDying:
          String(
            row['Assisted Dying'] || 'No'
          ).trim(),

        status:
          String(
            row['Implementation Status'] || ''
          ).trim(),

        notes:
          String(row.Notes || '').trim()
      };
    });

    const geoResponse =
      await fetch(
        'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
      );

    if (!geoResponse.ok) {
      throw new Error(
        'Could not load world boundaries'
      );
    }

    const geoData =
      await geoResponse.json();

    worldLayer =
      L.geoJSON(
        geoData,
        {
          style: function(feature) {
            const iso3 =
              feature.properties[
                'ISO3166-1-Alpha-3'
              ];

            const data =
              countryData[iso3];

            const mapColor =
              getMapColor(
                data?.assistedDying
              );

            return {
              color: '#ffffff',
              weight: 0.9,
              fillColor:
                COLORS[mapColor],
              fillOpacity:
                mapColor === 'Green'
                  ? 1
                  : 0.72
            };
          },

          onEachFeature:
            function(feature, layer) {
              const countryName =
                feature.properties.name ||
                'Unknown';

              const iso3 =
                feature.properties[
                  'ISO3166-1-Alpha-3'
                ];

              const data =
                countryData[iso3] || {
                  name: countryName,
                  assistedDying: 'No',
                  status: '',
                  notes: ''
                };

              const mapColor =
                getMapColor(
                  data.assistedDying
                );

              layer.on({
                mouseover:
                  function(e) {
                    e.target.setStyle({
                      weight: 2,
                      color: '#ffffff',
                      fillOpacity:
                        mapColor === 'Green'
                          ? 1
                          : 0.88
                    });

                    e.target.bringToFront();

                    showInfo(
                      e,
                      {
                        name:
                          data.name ||
                          countryName,

                        assistedDying:
                          data.assistedDying,

                        status:
                          data.status,

                        notes:
                          data.notes
                      }
                    );
                  },

                mousemove:
                  function(e) {
                    moveInfo(e);
                  },

                mouseout:
                  function(e) {
                    worldLayer.resetStyle(
                      e.target
                    );

                    hideInfo();
                  },

                click:
                  function() {
                    map.fitBounds(
                      layer.getBounds(),
                      {
                        padding:
                          [40, 40]
                      }
                    );
                  }
              });
            }
        }
      ).addTo(map);

    map.fitBounds(
      [
        [-55, -175],
        [82, 175]
      ],
      {
        padding: [25, 25]
      }
    );

  } catch (error) {
    console.error(
      'Error loading map:',
      error
    );
  }
}

loadMap();