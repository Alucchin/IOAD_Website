const map = L.map('map',{
center:[20,0],
zoom:2,
worldCopyJump:false,
maxBounds:[
[-90,-180],
[90,180]
]
});

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
maxZoom:18,
noWrap:true
}
).addTo(map);

async function loadCSV(){

const response = await fetch("IOAD research centers.csv");
const csv = await response.text();

const data = Papa.parse(csv,{
header:true,
skipEmptyLines:true
}).data;

const bounds = [];

// piccolo offset per evitare sovrapposizione marker
const jitter = () => (Math.random()-0.5)*0.02;

data.forEach(row => {

const name = row.Name;
const country = row.Country;

const lat = parseFloat(row.Latitude);
const lon = parseFloat(row.Longitude);

// colonna del sito (cambia se il nome nel CSV è diverso)
const website = row.Website || row.URL || row.Site || "";

if(isNaN(lat) || isNaN(lon)){
console.log("Riga scartata:",row);
return;
}

const marker = L.circleMarker(
[lat + jitter(), lon + jitter()],
{
radius:6,
color:"#2ecc71",
fillColor:"#2ecc71",
fillOpacity:0.9
}).addTo(map);

const websiteHTML = website
  ? `<br><a href="${website}" target="_blank">Visit website</a>`
  : "";

// Include research type(s) from the CSV (last two columns)
const researchTypes = [row.type_research, row.type_research_2]
  .filter(Boolean)
  .map(s => s.trim())
  .filter(Boolean);
const researchHTML = researchTypes.length
  ? `<br><b>Research focus:</b> ${researchTypes.join(' | ')}`
  : "";

marker.bindPopup(
  `<b>${name}</b><br>${country}${researchHTML}${websiteHTML}`
);

bounds.push([lat,lon]);

});

if(bounds.length){
map.fitBounds(bounds,{padding:[40,40]});
}

}

loadCSV();