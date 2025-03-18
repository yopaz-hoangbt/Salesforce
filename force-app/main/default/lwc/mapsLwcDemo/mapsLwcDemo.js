import { LightningElement, track } from 'lwc';
import LEAFLET from '@salesforce/resourceUrl/leafletjs';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';

export default class MapsLwcDemo extends LightningElement {
    latitude = 21.0285; // Hà Nội
    longitude = 105.8542;
    map;

    renderedCallback() {
        if (this.map) {
            return;
        }
        
        Promise.all([
            loadScript(this, `${LEAFLET}/leaflet.js`),
            loadStyle(this, `${LEAFLET}/leaflet.css`)
        ])
        .then(() => {
            this.initializeMap();
        })
        .catch(error => {
            console.error('Error loading Leaflet: ', error);
        });
    }

    initializeMap() {
        const mapDiv = this.template.querySelector('#map');
        this.map = L.map(mapDiv).setView([21.0285, 105.8542], 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        L.marker([21.0285, 105.8542])
            .addTo(this.map)
            .bindPopup('Vị trí của bạn')
            .openPopup();
    }

}
