/*global require, requirejs*/
/*jslint browser:true, regexp:true, white:true*/


requirejs.config({
	baseUrl: "Scripts",
	paths: {
		leaflet: "//cdn.leafletjs.com/leaflet-0.7.1/leaflet"
	}
});

// Check to make sure the browser supports WebWorkers. If it doesn't, inform the user that they need to upgrade.
require(["leaflet"], function (L) {
	"use strict";
	var map, osmLayer, mapQuestOsmLayer, mapQuestOALayer, openCycleMapLayer, ocmTransportLayer, ocmLandscapeLayer,
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

	// Create the map. If geolocation is supported, it will be zoomed to the user's current location.
	map = L.map('map', {
		center: [47.41322033015946, -120.80566406246835],
		zoom: 7,
		layers: [osmLayer]
	}).locate({ setView: true, maxZoom: 16 });

	// Create the layer list control and add it to the map.
	layerList = L.control.layers({
		OpenStreetMap: osmLayer,
		"MapQuest OSM": mapQuestOsmLayer,
		"MapQest Open Aerial": mapQuestOALayer,
		"OpenCycleMap": openCycleMapLayer,
		"OpenCycleMap Transport": ocmTransportLayer,
		"OpenCycleMap Landscape": ocmLandscapeLayer,
		"OpenCycleMap Outdoors": ocmOutdoorsLayer
	}).addTo(map);



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

	/** Handles the mouse click event.
	 * @param {MouseEvent} e
	*/
	function handleMapClick(e) {
		var req = new XMLHttpRequest();
		req.onload = function () {
			var result;
			if (this.status === 200) {
				result = JSON.parse(this.response);
				console.log(result);
			}
		};
		req.open("get", createReverseGeocodeRequestUrl(e.latlng));
		req.send();
	}

	// Setup map on-click event.
	map.on('click', handleMapClick);
});
