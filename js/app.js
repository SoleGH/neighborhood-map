var locations = [{
        title: '市民中心',
        location: {
            lat: 22.541603,
            lng: 114.06101100000001
        }
    },
    {
        title: '会展中心',
        location: {
            lat: 22.534769,
            lng: 114.06110100000001
        }
    },
    {
        title: '世界之窗',
        location: {
            lat: 22.5439776,
            lng: 114.12387139999998
        }
    },
    {
        title: '莲花山公园',
        location: {
            lat: 22.548246,
            lng: 114.05406199999993
        }
    },
    {
        title: '福华新村',
        location: {
            lat: 22.53340099999999,
            lng: 114.069389
        }
    },
    {
        title: '平安国际金融中心',
        location: {
            lat: 22.533096,
            lng: 114.05586500000004
        }
    },
    {
        title: '京基100',
        location: {
            lat: 22.542218,
            lng: 114.10651400000006
        }
    },
    {
        title: '深圳站',
        location: {
            lat: 22.531844,
            lng: 114.11727300000007
        }
    }
];
var map;
var markers = locations;

// var infowindow = new google.maps.InfoWindow();
// var geocoder = new google.maps.Geocoder;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 22.541603,
            lng: 114.06101100000001
        },
        zoom: 13
    });
    // Listen for the event fired when the user selects a prediction and clicks
    // "go" more details for that place.
    document.getElementById('go-places').addEventListener('click', textSearchPlaces);
    // 数据地址信息自动提示
    var searchBox = new google.maps.places.SearchBox(
        document.getElementById('places-search'));
    searchBox.setBounds(map.getBounds());
    searchBox.addListener('places_changed', function () {
        searchBoxPlaces(this);
    });

    // 创建markers
    markers.forEach(place => {
        let position = place.location;
        let title = place.title;
        var marker = new google.maps.Marker({
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            map: map
        });
        markers.push(marker);
    });
    updateMarkersDisplay();

}


// 显示marker函数
function displayMarkers() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    markers.forEach(marker => {
        markers.setMap(map);
        bounds.extend(marker.position);
    });
    map.fitBounds(bounds);
}
// 隐藏marker函数
function hideMarkers() {
    markers.forEach(marker => {
        if (marker.map) {
            marker.setMap(null);
        }
    });
}

// This function firest when the user select "go" on the places search.
// It will do a nearby search using the entered query string or place.
function textSearchPlaces() {
    var bounds = map.getBounds();
    hideMarkers(markers);
    var placesService = new google.maps.places.PlacesService(map);
    placesService.textSearch({
        query: document.getElementById('places-search').value,
        bounds: bounds
    }, function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            createMarkersForPlaces(results);
        }
    });
}


function searchBoxPlaces(searchBox) {
    hideMarkers(markers);
    var places = searchBox.getPlaces();
    if (places.length == 0) {
        window.alert('We did not find any places matching that search!');
    } else {
        // For each place, get the icon, name and location.
        createMarkersForPlaces(places);
    }
}
// 根据搜索出的地址信息添加marker，并添加点击事件
function createMarkersForPlaces(places) {
    markers = [];
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < places.length; i++) {
        var place = places[i];
        var icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        // Create a marker for each place.
        var marker = new google.maps.Marker({
            map: map,
            icon: icon,
            title: place.name,
            position: place.geometry.location,
            id: place.place_id
        });
        // Create a single infowindow to be used with the place details information
        // so that only one is open at once.
        var placeInfoWindow = new google.maps.InfoWindow();
        // If a marker is clicked, do a place details search on it in the next function.
        marker.addListener('click', function () {
            if (placeInfoWindow.marker == this) {
                console.log("This infowindow already is on this marker!");
            } else {
                getPlacesDetails(this, placeInfoWindow);
            }
        });
        markers.push(marker);
        if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    }
    map.fitBounds(bounds);
}
// 获取地址详细信息并处理
function getPlacesDetails(marker, infowindow) {
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
        placeId: marker.id
    }, function (place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Set the marker property on this infowindow so it isn't created again.
            infowindow.marker = marker;
            var innerHTML = '<div>';
            if (place.name) {
                innerHTML += '<strong>' + place.name + '</strong>';
            }
            if (place.geometry.location) {
                innerHTML += '<br>' + place.geometry.location;
            }
            if (place.formatted_address) {
                innerHTML += '<br>' + place.formatted_address;
            }
            if (place.formatted_phone_number) {
                innerHTML += '<br>' + place.formatted_phone_number;
            }
            if (place.opening_hours) {
                innerHTML += '<br><br><strong>Hours:</strong><br>' +
                    place.opening_hours.weekday_text[0] + '<br>' +
                    place.opening_hours.weekday_text[1] + '<br>' +
                    place.opening_hours.weekday_text[2] + '<br>' +
                    place.opening_hours.weekday_text[3] + '<br>' +
                    place.opening_hours.weekday_text[4] + '<br>' +
                    place.opening_hours.weekday_text[5] + '<br>' +
                    place.opening_hours.weekday_text[6];
            }
            if (place.photos) {
                innerHTML += '<br><br><img src="' + place.photos[0].getUrl({
                    maxHeight: 100,
                    maxWidth: 200
                }) + '">';
            } else {
                innerHTML += '<br><span>no photos</span>'
            }
            innerHTML += '</div>';
            infowindow.setContent(innerHTML);
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function () {
                infowindow.marker = null;
            });
        }
    });
}
// 更新marker列表
function updateMarkersDisplay() {
    var innerHTML = '<table>';
    markers.forEach(marker => {
        innerHTML += "<tr><td>" + marker.title + "</td></tr>";
    });

    innerHTML += '</table>';
    
    $("#markers-table").ready(()=>{
        console.log($("#markers-table"));
        $("#markers-table").innerHTML = innerHTML;
    });
}


// 初始化KO
var viewModule = function () {
    var self = this;
    self.cityname = ko.observable("Neighborhood Map");
    self.markers = ko.observable(locations);

}
// 绑定view module
ko.applyBindings(new viewModule());