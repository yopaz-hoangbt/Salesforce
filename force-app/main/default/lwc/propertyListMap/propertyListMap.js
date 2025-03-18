/* global L */
import { LightningElement, wire, track } from 'lwc';
import {
    publish,
    subscribe,
    unsubscribe,
    MessageContext
} from 'lightning/messageService';
import FILTERS_CHANGED from '@salesforce/messageChannel/FiltersChange__c';
import PROPERTY_SELECTED from '@salesforce/messageChannel/PropertySelected__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import LEAFLET from '@salesforce/resourceUrl/leafletjs';
import getListLocation from '@salesforce/apex/EmployeeController.getListLocation';
import createLocation from '@salesforce/apex/EmployeeController.createLocation';
import { refreshApex } from '@salesforce/apex';

const LEAFLET_NOT_LOADED = 0;
const LEAFLET_LOADING = 1;
const LEAFLET_READY = 2;

export default class PropertyListMap extends LightningElement {
    @track isModalOpen = false;
    @track name = '';
    @track latitude = '';
    @track longitude = '';
    properties = [];

    // Map
    leafletState = LEAFLET_NOT_LOADED;
    map;
    propertyLayer;

    // Filters
    searchKey = '';
    maxPrice = null;
    minBedrooms = null;
    minBathrooms = null;
    pageNumber = null;
    pageSize = null;
    @track locationCustom = [];
    wiredLocations;

    @wire(getListLocation)
    listViewHandler({data, error}){
        this.wiredLocations = data;
        if(data){
            console.log(data)
            this.locationCustom = data;
        }
        if(error){
            console.error(error)
        }
    }

    @wire(MessageContext)
    messageContext;

    //@wire(getPagedPropertyList, {
    //    searchKey: '$searchKey',
    //    maxPrice: '$maxPrice',
    //    minBedrooms: '$minBedrooms',
    //    minBathrooms: '$minBathrooms',
    //    pageSize: '$pageSize',
    //    pageNumber: '$pageNumber'
    //})
    //wiredProperties({ error, data }) {
    //    if (data) {
    //        this.properties = data.records;
    //        // Display properties on map
    //        this.displayProperties();
    //    } else if (error) {
    //        this.properties = [];
    //        this.dispatchEvent(
    //            new ShowToastEvent({
    //                title: 'Error loading properties',
    //                message: error.message,
    //                variant: 'error'
    //            })
    //        );
    //    }
    //}

    connectedCallback() {
        this.subscription = subscribe(
            this.messageContext,
            FILTERS_CHANGED,
            (message) => {
                this.handleFilterChange(message);
            }
        );
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({ title, message, variant });
        this.dispatchEvent(event);
    }

    closeModal() {
        this.isModalOpen = false;
    }

    handleChange(event) {
        const field = event.target.dataset.field;
        this[field] = event.target.value;
    }

    saveLocation() {
        console.log(`Saved: Name=${this.name}, Latitude=${this.latitude}, Longitude=${this.longitude}`);
        createLocation({ 
            name: this.name, 
            latitude: parseFloat(this.latitude),
            longitude: parseFloat(this.longitude)
        })
        .then(() => {
            this.showToast('Success', 'Location added successfully!', 'success');
            this.closeModal();
            return refreshApex(this.wiredLocations);
        })
        .catch(error => {
            this.showToast('Error', error.body.message, 'error');
        });
    }

    disconnectedCallback() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    async renderedCallback() {
        if (this.leafletState === LEAFLET_NOT_LOADED) {
            await this.initializeLeaflet();
        }
    }

    async initializeLeaflet() {
        try {
            // Leaflet is loading
            this.leafletState = LEAFLET_LOADING;

            // Load resource files
            await Promise.all([
                loadScript(this, `${LEAFLET}/leaflet.js`),
                loadStyle(this, `${LEAFLET}/leaflet.css`)
            ]);

            // Configure map
            const mapElement = this.template.querySelector('.map');
            this.map = L.map(mapElement, {
                zoomControl: true,
                tap: false
                // eslint-disable-next-line no-magic-numbers
            });
            this.map.setView([21.0285, 105.8542], 11);
            this.map.scrollWheelZoom.disable();
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap',
                scrollWheelZoom: true
            }).addTo(this.map);

            // Leaflet is ready
            this.map.on('click', (event) => {
                const { lat, lng } = event.latlng;
                console.log("Tọa độ:", lat, lng)
                this.isModalOpen = true;
                this.latitude = lat;
                this.longitude = lng;
            });
            this.leafletState = LEAFLET_READY;

            // Display properties
            this.displayProperties();
        } catch (error) {
            const message = error.message || error.body.message;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error while loading Leaflet',
                    message,
                    variant: 'error'
                })
            );
        }
    }

    displayProperties() {
        // Stop if leaflet isn't ready yet
        if (this.leafletState !== LEAFLET_READY) {
            return;
        }

        // Remove previous property layer form map if it exits
        if (this.propertyLayer) {
            this.map.removeLayer(this.propertyLayer);
        }

        // Prepare property icon
        const icon = L.divIcon({
            className: 'my-div-icon',
            html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 52 52"><path fill="#DB4437" d="m26 2c-10.5 0-19 8.5-19 19.1 0 13.2 13.6 25.3 17.8 28.5 0.7 0.6 1.7 0.6 2.5 0 4.2-3.3 17.7-15.3 17.7-28.5 0-10.6-8.5-19.1-19-19.1z m0 27c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"></path></svg>'
        });

        // Prepare click handler for property marker
        const markerClickHandler = (event) => {
            // Send message using the Lightning Message Service
            const message = { propertyId: event.target.propertyId };
            publish(this.messageContext, PROPERTY_SELECTED, message);
        };

        // Prepare property markers
        console.log(this.locationCustom)
        if(this.locationCustom) {
            const markers = this.locationCustom.map((property) => {
                const latLng = [
                    property.Latitude__c,
                    property.Longitude__c
                ];
                const tooltipMarkup = this.getTooltipMarkup(property);
                const marker = L.marker(latLng, { icon });
                marker.propertyId = property.Id;
                marker.on('click', markerClickHandler);
                marker.bindTooltip(tooltipMarkup, { offset: [45, -40] });
                return marker;
            });
    
            // Create a layer with property markers and add it to map
            this.propertyLayer = L.layerGroup(markers);
            this.propertyLayer.addTo(this.map);
        }
    }

    handleFilterChange(filters) {
        this.searchKey = filters.searchKey;
        this.maxPrice = filters.maxPrice;
        this.minBedrooms = filters.minBedrooms;
        this.minBathrooms = filters.minBathrooms;
    }

    getTooltipMarkup(property) {
        return `<div class="tooltip-picture" style="background-image:url(${property.Image__c || 'https://i.pinimg.com/736x/01/7c/44/017c44c97a38c1c4999681e28c39271d.jpg'})">  
  <div class="lower-third">
    <h1>${property.Name}</h1>
  </div>
</div>`;
    }
}
