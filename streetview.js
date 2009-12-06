google.load('maps', '2');
var init = function(){
	var $pano = $('#pano');
	var loc = $('#loc');
	var panL = $('#panL');
	var panR = $('#panR');
	var panT = $('#panT');
	var $mapContainer = $('#map-container');
	var $map = $('#map');
	var $backmirrorContainer = $('#backmirror-container');
	var $backmirror = $('#backmirror');
	$('#loc-map').click(function(){
		$mapContainer.toggle();
		return false;
	});
	$('#loc-backmirror').click(function(){
		var el = $backmirrorContainer;
		var top = parseInt(el.css('top'), 10);
		if (top == 0){
			el.css('top', '-100%');
		} else {
			el.css('top', 0);
		}
		return false;
	});
	var upsidedown = false;
	$('#loc-asterisk').click(function(){
		var flip = upsidedown ? '' : 'matrix(1, 0, 0, -1, 0, 0)';
		var css = {
			transform: flip,
			'-moz-transform': flip,
			'-webkit-transform': flip
		};
		$pano.css(css);
		$backmirrorContainer.css(css);
		upsidedown = !upsidedown;
		return false;
	});
	
	var setView = function(lat, lng){
		var pano = new GStreetviewPanorama($pano[0], {
			latlng: new GLatLng(lat, lng),
			features: {
				userPhotos: true
			},
			enableFullScreen: false,
			userPhotoOptions: {
				photoRepositories: [ 'panoramio', 'picasa']
			}
		});
		
		var backMirror = new GStreetviewPanorama($backmirror[0], {
			enableFullScreen: false
		});
		
		var map = new GMap2($map[0]);
		map.disableDragging();
		map.disableInfoWindow();
		map.disableDoubleClickZoom();
		map.disablePinchToZoom();
		
		var icon = new GIcon(false, 'dot.png');
		icon.iconSize = new GSize(8, 8);
		icon.iconAnchor = new GPoint(4, 4);
		icon.infoWindowAnchor = new GPoint(4, 4);
		
		GEvent.addListener(pano, 'error', function(e){
			if (e == FLASH_UNAVAILABLE){
				alert("Error: Flash doesn't appear to be supported by your browser");
				return;
			}
		});
		
		var marker = new GMarker({}, {icon: icon});
		var once = false;
		var panoId = null;
		var svClient = new GStreetviewClient();
		GEvent.addListener(pano, 'initialized', function(l){
//			console.log('initialized');
//			console.log(l);
			loc.text('You are at ' + l.description);
			var latlng = l.latlng;
			if (!once){
				map.setCenter(latlng, 16);
			} else {
				setTimeout(function(){
					map.panTo(latlng);
				}, 1000);
			}
			map.clearOverlays();
			marker.setLatLng(latlng);
			map.addOverlay(marker);
			
			var lpov = pano.getPOV();
			var pov = {
				yaw: lpov.yaw-180,
				pitch: -lpov.pitch,
				zoom: lpov.zoom
			};
			var yaw = l.yaw;
			var oriPanoId = l.panoId;
			if (!once || !panoId){
				backMirror.setLocationAndPOV(latlng, pov);
				panoId = oriPanoId;
			} else {
				svClient.getPanoramaById(oriPanoId, function(svData){
					var links = svData.links;
					if (!links.length) return;
					var near = false;
					for (var i=0, l=links.length; i<l; i++){
						if (links[i].panoId == panoId){
							near = true;
							break;
						}
					}
					if (near){
						backMirror.followLink(yaw);
					} else {
						backMirror.setLocationAndPOV(latlng, pov);
					}
					panoId = oriPanoId;
				});
			}
			
			if (!once){
				$mapContainer.hide();
				once = true;
			}
		});
		
		var once1 = false;
		GEvent.addListener(backMirror, 'initialized', function(l){
			if (once1) return;
			once1 = true;
			$backmirrorContainer.css('top', '-100%');
		});
		
		GEvent.addListener(pano, 'yawchanged', function(yaw){
//			console.log('yawchanged');
			var deg = 360 - yaw;
			$map.css({
				transform: 'rotate(' + deg + 'deg)',
				'-moz-transform': 'rotate(' + deg + 'deg)',
				'-webkit-transform': 'rotate(' + deg + 'deg)'
			});
			
			var lpov = pano.getPOV();
			var pov = {
				yaw: yaw-180,
				pitch: -lpov.pitch,
				zoom: lpov.zoom
			};
			if (pov.yaw == backMirror.getPOV().yaw) return;
			backMirror.panTo(pov);
		});
		
		GEvent.addListener(pano, 'pitchchanged', function(pitch){
//			console.log('pitchchanged');
			var lpov = pano.getPOV();
			var pov = {
				yaw: lpov.yaw-180,
				pitch: -pitch,
				zoom: lpov.zoom
			};
			if (pov.pitch == backMirror.getPOV().pitch) return;
			backMirror.panTo(pov);
		});
		
		GEvent.addListener(pano, 'zoomchanged', function(zoom){
//			console.log('zoomchanged');
			var lpov = pano.getPOV();
			var pov = {
				yaw: lpov.yaw-180,
				pitch: -lpov.pitch,
				zoom: zoom
			};
			if (pov.zoom == backMirror.getPOV().zoom) return;
			backMirror.panTo(pov);
		});

		var timer;
		var delay;
		var duration = 200;
		var delayDuration = 500;
		var clear = function(){
			clearInterval(delay);
			clearInterval(timer);
		};
		
		loc.mouseenter(function(){
			delay = setTimeout(function(){
				timer = setInterval(function(){
					var pov = pano.getPOV();
					if (upsidedown){
						if (pov.pitch <= -90) clear();
						pov.pitch -= 5;
					} else {
						if (pov.pitch >= 90) clear();
						pov.pitch += 5;
					}
					pano.panTo(pov);
				}, duration);
			}, delayDuration);
		}).mouseleave(clear);
		
		panT.mouseenter(function(){
			delay = setTimeout(function(){
				timer = setInterval(function(){
					var pov = pano.getPOV();
					if (upsidedown){
						if (pov.pitch >= 90) clear()
						pov.pitch += 5;
					} else {
						if (pov.pitch <= -90) clear()
						pov.pitch -= 5;
					}
					pano.panTo(pov);
				}, duration);
			}, delayDuration);
		}).mouseleave(clear);
		
		panL.mouseenter(function(){
			timer = setInterval(function(){
				var pov = pano.getPOV();
				pov.yaw -= 5;
				pano.panTo(pov);
			}, duration);
		}).mouseleave(clear);
		
		panR.mouseenter(function(){
			timer = setInterval(function(){
				var pov = pano.getPOV();
				pov.yaw += 5;
				pano.panTo(pov);
			}, duration);
		}).mouseleave(clear);
		
		$(window).resize(function(){
			pano.checkResize();
			backMirror.checkResize();
			map.checkResize();
			map.setCenter(marker.getLatLng());
		});
		
		$(document).mouseleave(clear).blur(clear);
	}
	
	if (navigator.geolocation){
		navigator.geolocation.getCurrentPosition(function(position){
			var coords = position.coords;
			setView(coords.latitude, coords.longitude);
		});
	} else if (google.loader.ClientLocation){
		var cloc = google.loader.ClientLocation;
		setView(cloc.latitude, cloc.longitude);
	} else {
		setView(geoplugin_latitude(), geoplugin_longitude());
	}
};
