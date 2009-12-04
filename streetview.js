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
		
		var guyIcon = new GIcon(false, 'dot.png');
		guyIcon.iconSize = new GSize(8, 8);
		guyIcon.iconAnchor = new GPoint(4, 4);
		guyIcon.infoWindowAnchor = new GPoint(4, 4);
		
		GEvent.addListener(pano, 'error', function(e){
			if (e == FLASH_UNAVAILABLE){
				alert("Error: Flash doesn't appear to be supported by your browser");
				return;
			}
		});
		
		var once = false;
		GEvent.addListener(pano, 'initialized', function(l){
//			console.log(l);
			loc.text('You are at ' + l.description);
			map.setCenter(l.latlng, 16);
			map.clearOverlays();
			var marker = new GMarker(l.latlng, {icon: guyIcon});
			map.addOverlay(marker);
			
			var lpov = pano.getPOV();
			var pov = {
				yaw: lpov.yaw-180,
				pitch: -lpov.pitch,
				zoom: lpov.zoom
			};
			backMirror.setLocationAndPOV(l.latlng, pov);
			
			if (!once){
				setTimeout(function(){
					$backmirrorContainer.css('top', '-100%');
				}, 1000);
				$mapContainer.hide();
				once = true;
			}
		});
		
		GEvent.addListener(pano, 'yawchanged', function(yaw){
//			console.log('yawchanged');
			var deg = 360 - yaw;
			$map.css({
				transform: 'rotate(' + deg + 'deg)',
				'-moz-transform': 'rotate(' + deg + 'deg)',
				'-webkit-transform': 'rotate(' + deg + 'deg)'
			});
			
			setTimeout(function(){
				var lpov = pano.getPOV();
				var pov = {
					yaw: yaw-180,
					pitch: -lpov.pitch,
					zoom: lpov.zoom
				};
				backMirror.setPOV($.extend(pov, {
					yaw: yaw-180
				}));
			}, 10);
		});
		
		GEvent.addListener(pano, 'pitchchanged', function(pitch){
//			console.log('pitchchanged');
			setTimeout(function(){
				var lpov = pano.getPOV();
				var pov = {
					yaw: lpov.yaw-180,
					pitch: -pitch,
					zoom: lpov.zoom
				};
				backMirror.setPOV(pov);
			}, 20);
		});
		
		GEvent.addListener(pano, 'zoomchanged', function(zoom){
//			console.log('zoomchanged');
			setTimeout(function(){
				var lpov = pano.getPOV();
				var pov = {
					yaw: lpov.yaw-180,
					pitch: -lpov.pitch,
					zoom: zoom
				};
				backMirror.setPOV(pov);
			}, 30);
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
