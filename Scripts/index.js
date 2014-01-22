/*global require, requirejs*/
/*jslint browser:true, regexp:true, white:true*/


requirejs.config({
	baseUrl: "Scripts",
	paths: {
		"terraformer": "//cdn-geoweb.s3.amazonaws.com/terraformer/1.0.2/terraformer.min",
		"terraformer-arcgis-parser": "//cdn-geoweb.s3.amazonaws.com/terraformer-arcgis-parser/1.0.1/terraformer-arcgis-parser.min"
	},
	shim: {
		"terraformer": {
			exports: "Terraformer"
		},
		"terraformer-arcgis-parser": {
			deps: ["terraformer"],
			exports: "Terraformer.ArcGIS"
		}

	},
	packages: [
		{
			name: "leaflet",
			location: "//cdn.leafletjs.com/leaflet-0.7.2",
			main: "leaflet"
		}
	]
});

require(["leaflet"], function (L) {
	"use strict";

	var map, stopsLayer;

	function createMap() {

		var osmLayer, mapQuestOsmLayer, mapQuestOALayer, openCycleMapLayer, ocmTransportLayer, ocmLandscapeLayer,
			ocmOutdoorsLayer, osmAttrib, mqAttrib, ocmAttrib, layerList;

		// Define attribution strings that are common to multiple basemap layers.
		osmAttrib = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';
		mqAttrib = osmAttrib + '<p>Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png"></p>';
		ocmAttrib = osmAttrib + '<p>Tiles Courtesy of <a href="http://www.thunderforest.com/" target="_blank">Thunderforest</a></p>';

		// Create the basemap layers.
		osmLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: osmAttrib,
			maxZoom: 18
		});

		mapQuestOsmLayer = L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
			subdomains: ["otile1", "otile2", "otile3", "otile4"],
			attribution: mqAttrib,
			maxZoom: 18
		});

		mapQuestOALayer = L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg', {
			subdomains: ["otile1", "otile2", "otile3", "otile4"],
			attribution: mqAttrib,
			maxZoom: 18
		});

		mapQuestOALayer = L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg', {
			subdomains: ["otile1", "otile2", "otile3", "otile4"],
			attribution: mqAttrib,
			maxZoom: 18
		});

		openCycleMapLayer = L.tileLayer('http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', {
			attribution: ocmAttrib,
			maxZoom: 18
		});

		ocmTransportLayer = L.tileLayer('http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png', {
			attribution: ocmAttrib,
			maxZoom: 18
		});

		ocmLandscapeLayer = L.tileLayer('http://{s}.tile3.opencyclemap.org/landscape/{z}/{x}/{y}.png', {
			attribution: ocmAttrib,
			maxZoom: 18
		});

		ocmOutdoorsLayer = L.tileLayer('http://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png', {
			attribution: ocmAttrib,
			maxZoom: 18
		});

		stopsLayer = L.geoJson();

		// Create the map. If geolocation is supported, it will be zoomed to the user's current location.
		map = L.map('map', {
			center: [47.41322033015946, -120.80566406246835],
			zoom: 7,
			layers: [osmLayer, stopsLayer]
		}).locate({ setView: true, maxZoom: 16 });

		window.theMap = map;

		// Create the layer list control and add it to the map.
		layerList = L.control.layers({
			OpenStreetMap: osmLayer,
			"MapQuest OSM": mapQuestOsmLayer,
			"MapQest Open Aerial": mapQuestOALayer,
			"OpenCycleMap": openCycleMapLayer,
			"OpenCycleMap Transport": ocmTransportLayer,
			"OpenCycleMap Landscape": ocmLandscapeLayer,
			"OpenCycleMap Outdoors": ocmOutdoorsLayer
		}, {
			"Stops": stopsLayer
		}).addTo(map);

		return map;
	}

	/**
	 * @typedef {Object} Event
	 * @property {string} type - The event type (e.g., 'click')
	 * @property {Object} target - The object that fired the event.
	*/

	/**
	 * @typedef {Event} MouseEvent
	 * @property {LatLng} latlng - The geographical point where the mouse event occured.
	 * @property {Point} layerPoint - Pixel coordinates of the point where the mouse event occured relative to the map layer.
	 * @property {Point} containerPoint - Pixel coordinates of the point where the mouse event occured relative to the map container.
	 * @property {DOMMouseEvent} originalEvent - The original DOM mouse event fired by the browser.
	*/

	/** Creates a URL for a reverse geocode request.
	 * @param {LatLng} latlng - Leaflet LatLng value.
	 * @param {number} [distance]
	*/
	function createReverseGeocodeRequestUrl(latlng, distance) {
		var baseUrl = "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode";
		var params = [];
		params.push("location=" + encodeURIComponent([latlng.lng, latlng.lat].join(",")));
		if (typeof distance === "number") {
			params.push("distance=" + distance);
		}
		params.push("f=json");
		params = params.join("&");
		params = params;
		return [baseUrl, params].join("?");
	}

	/** @typedef {ArcGisSpatialReference}
	 * @property {number} wkid
	 * @property {number} latestWkid
	 */

	/** @typedef {ArcGisPoint}
	 * @property {number} x
	 * @property {number} y
	 * @property {ArcGisSpatialReference} spatialReference
	 */

	/** @typedef {GeocodeResult}
	 * @property {Object.<string, string>} address
	 * @property {ArcGisPoint} location
	 */

	/**
	 * @param {GeocodeResult} geocodeResult
	 */
	function geocodeResultToGeoJson(geocodeResult) {
		var output = {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [geocodeResult.location.x, geocodeResult.location.y]
			},
			properties: geocodeResult.address
		};
		return output;
	}

	/**
	 * @this {XMLHttpRequest}
	 */
	var handleGeocodeResult = function () {
		var result;
		if (this.status === 200) {
			result = JSON.parse(this.response);
			stopsLayer.addData(geocodeResultToGeoJson(result));
		}
	};

	/** Handles the mouse click event.
	 * @param {MouseEvent} e
	*/
	function handleMapClick(e) {
		var req = new XMLHttpRequest();
		req.onload = handleGeocodeResult;
		req.open("get", createReverseGeocodeRequestUrl(e.latlng));
		req.send();
	}

	map = createMap();

	// Setup map on-click event.
	map.on('click', handleMapClick);
});
