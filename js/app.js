var map;
var chinesePattern = new RegExp("[\u4E00-\u9FA5]+"); //中文正则
var endlishPattern = new RegExp("[A-Za-z]+"); //英文正则

// var infowindow = new google.maps.InfoWindow();
// var geocoder = new google.maps.Geocoder;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 22.541603,
            lng: 114.06101100000001
        },
        zoom: 10
    });
}

// 初始化KO
var viewModule = function () {
    var self = this;
    self.markers = ko.observableArray([]);
    self.barMarkers = ko.observableArray([]);
    self.optBarStatus = ko.observable(true);
    self.dayPictureUrl = ko.observable("");
    self.weather = ko.observable('');
    self.temperature = ko.observable('');
    self.curTemperature = ko.observable('');

    self.cityname = ko.observable("Neighborhood Map");

    self.textSearchPlaces = function () {
        self.searchWeather();
        var bounds = map.getBounds();
        self.hideMarkers();
        var placesService = new google.maps.places.PlacesService(map);
        placesService.textSearch({
            query: document.getElementById('places-search').value,
            bounds: bounds
        }, function (results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                self.createMarkersForPlaces(results);
            }
        });
    }

    // 隐藏markers
    self.hideMarkers = function () {
        self.markers().forEach(marker => {
            if (marker.map) {
                marker.setMap(null);
            }
        });
    }
    // 显示marker函数
    self.showAllMarkers = function () {
        var bounds = new google.maps.LatLngBounds();
        // Extend the boundaries of the map for each marker and display the marker
        markers.forEach(marker => {
            markers.setMap(map);
            bounds.extend(marker.position);
        });
        map.fitBounds(bounds);
    }
    // 根据搜索出的地址信息添加marker，并添加点击事件
    self.createMarkersForPlaces = function (places) {
        self.markers().length = 0;
        let total = places.length
        if (total > 13) {
            total = 13;
        }
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < total; i++) {
            var place = places[i];
            // Create a marker for each place.
            var marker = new google.maps.Marker({
                map: map,
                // icon: icon,
                title: place.name,
                position: place.geometry.location,
                animation: google.maps.Animation.DROP,
                id: place.place_id
            });
            // Create a single infowindow to be used with the place details information
            // so that only one is open at once.
            var placeInfoWindow = new google.maps.InfoWindow();
            // 为标记添加点击事件：点击动态和获取地址详情
            marker.addListener('click', function () {
                // 添加点击动态
                self.activeMarkerBase(this.id);
                if (placeInfoWindow.marker == this) {
                    console.log("This infowindow already is on this marker!");
                } else {
                    self.getPlacesDetails(this, placeInfoWindow);
                }
            });
            self.markers.push(marker);
            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        }
        self.barMarkers(self.markers());
        map.fitBounds(bounds);
    }
    self.getPlacesDetails = function (marker, infowindow) {
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

    //只显示当前id的marker
    self.getPlaceById = function () {
        var ids = [this.id];
        self.showMarkersByIds(ids);
    }

    // 点击列表地址  地图上相应标记状态变化
    self.activeMarker = function () {
        self.activeMarkerBase(this.id);
    }

    self.activeMarkerBase = function (id) {
        self.markers().forEach(marker => {
            if (marker.id == id) {
                if (marker.getAnimation() !== null) {
                    marker.setAnimation(null);
                } else {
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                }
            } else {
                marker.setAnimation(null);
            }
        });
    }

    // 根据marker id显示地图标记
    self.showMarkersByIds = function (ids) {
        self.hideMarkers();
        var bounds = new google.maps.LatLngBounds();
        ids.forEach(id => {
            self.markers().forEach(marker => {
                if (marker.id === id) {
                    marker.setMap(map);
                    bounds.extend(marker.position);
                }
            });
        });
        map.fitBounds(bounds);
    }

    // 根据名称过滤列表中的地址
    self.filterPlaces = function () {
        var searchValueStr = $("#places-search").val();
        var searchValueArray = [];
        // if(endlishPattern.test(searchValueStr)){
        //     console.log(searchValueStr);
        //     searchValueArray = searchValueStr.split(" ");
        // }else{
        searchValueArray = searchValueStr.split("");
        // }
        self.barMarkers([]);

        var showMarkerIds = [];
        // 如果筛选条件为空则默认显示所有marker到侧边栏列表
        // if(searchValueArray.length == 0){
        //     self.barMarkers(self.markers());
        // }
        self.markers().forEach(marker => {
            var flag = 0;
            var title = marker.title;
            searchValueArray.forEach(searchVlaue => {
                if (title.indexOf(searchVlaue) != -1) {
                    flag += 1;
                }
            });
            if (flag === searchValueArray.length) {
                // 更新侧边栏列表
                self.barMarkers.push(marker);
                showMarkerIds.push(marker.id);
            }
        });
        // 更新地图标记
        // self.hideMarkers();
        self.showMarkersByIds(showMarkerIds);
    }

    // 隐藏侧边栏
    self.showHideOptBat = function () {
        if (self.optBarStatus() == true) {
            self.optBarStatus(false);
            document.getElementById("map").style.left = "0px";
            document.getElementById("float-button").style.left = "0.5%";
        } else {
            self.optBarStatus(true);
            document.getElementById("map").style.left = "26%";
            document.getElementById("float-button").style.left = "26.5%";
        }
    }

    self.searchWeather = function () {
        // 获取城市 
        var cityUrl = 'http://int.dpool.sina.com.cn/iplookup/iplookup.php?format=js';
        $.getScript(cityUrl,
            function () {
                var city = remote_ip_info.city; // 获取城市  

                // 获取天气预报  
                $.ajax({
                    url: "http://api.map.baidu.com/telematics/v3/weather?location=" + city + "&output=json&ak=EGgzZ22dsboWQEcPQ6KDQLknQd3YkkkP",
                    type: "get",
                    dataType: "jsonp",
                    scriptCharset: "utf-8",
                    success: function (baiduTQ) {
                        // 处理查询到的天气数据
                        try {
                            if (baiduTQ == null || baiduTQ.error != 0 || baiduTQ.status != "success" || baiduTQ.results.count == 0) {
                                self.temperature = "--";
                                self.weather = "--";
                                self.wind = "--";
                                return;
                            }
                            if (baiduTQ.results[0].weather_data.length > 0) {
                                var data = baiduTQ.results[0].weather_data[0];
                                self.temperature(city + "[" + data.temperature + "]");
                                self.weather(data.weather);
                                var curtempStr = data.date.split("：").pop();
                                self.curTemperature(curtempStr.substring(0, curtempStr.length - 1));
                                self.dayPictureUrl(data.dayPictureUrl);
                            }
                        } catch (err) {
                            console.log(err);
                            alert("解析天气数据异常，请重试！")
                        }
                    },
                    error: function (request, status, error) {
                        console.log(error);
                        alert('获取天气信息失败！');
                    }
                });
            });
    }
}
// 绑定view module
ko.applyBindings(new viewModule());