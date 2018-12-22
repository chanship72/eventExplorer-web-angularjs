var eventControllers = angular.module('eventControllers', []);

eventControllers.controller('searchController', 
   function eventController($scope, $http, $timeout, $window, $q, $log, moment) {
      $scope.ipAPIurl = "http://ip-api.com/json";
      $scope.rootURI = "http://eventexplorer.us-west-1.elasticbeanstalk.com";
      //$scope.rootURI = "http://localhost:8081";

      // auto complete query
      $scope.query = function(searchText) {
        return $http.get($scope.rootURI + '/autocomplete/' + searchText)
          .then(function(data) {
            var suggestList = [];
            if(data.data.attractions != undefined){
              for(var i=0; i<data.data.attractions.length;i++){
                suggestList.push(data.data.attractions[i].name);
              }
            }
            return suggestList;
          });
      };      
      $scope.detailFavBtn = false;
      $scope.form = {
        keyword: '',
        location: true,
        category: { value: 'all',label: 'All'},
        distance: 10,
        distUnit: { value: '0',label: 'Miles'},
        invalid: true,
        touched: false,
        specify: '',
        invalidLocation: false
      };
      detailInfoItems.seatMap = false;
      $scope.previousFavList = false;
      $scope.resultList = [];
      $scope.favoriteList = [];
      // detail obj
      $scope.detailInfoItems = {
        id: '',
        title: '',
        name: '',
        venue: '', 
        date: '',
        time: '',
        category: '',
        priceRange: '',
        ticketStatus: '',
        ticketOfficeURl: '',
        seatMap: '',
        num: 0
      };
      // spotify obj      
      $scope.spotifyArtist = {
        name: '',
        followers: '',
        popularity: 0,
        checkat: ''
      };
      $scope.upcomingEventList = [];

      $scope.targetLoc = {
        lat: 0.0,
        lon: 0.0
      };
      $scope.currentLoc = {
        lat: 0.0,
        lon: 0.0
      };
      $scope.upcomingEventLen = 0;
      $scope.showMore = 5;
      $scope.showMoreBtn = "Show More";

      // panel initialize
      $scope.resultInfo = false;
      $scope.getLocErr = false;
      $scope.listPanel = false;
      $scope.progressBar = false;
      $scope.resultTable = false;
      $scope.detailButton = true;
      $scope.resultPanel = true;
      $scope.detailPanel = false;
      $scope.favoriteTable = false;
      $scope.failErr = false;
      $scope.eventShow = false;
      $scope.artistShow = false; 
      $scope.venueShow = false;
      $scope.upcomingShow = false;
      $scope.photoTab = false;
      $scope.spotifyTab = false;
      
      $scope.detailIdx = -1;
      $scope.detailId = "";
      $scope.tabSelected = 1;

      $scope.activeTabIndex = 0;

      $scope.photos = [];
      $scope.venueInfo = {
        name: '',
        address: '',
        city: '',
        phoneNumber: '',
        openHours: '',
        generalRule: '',
        childRule: ''
      };
      $scope.locFound = false;
      $scope.invalid = true;
      $scope.locErr = false;      //result list error (nothing returned)

      if ($scope.form.location) {
        try{
          $http.get($scope.ipAPIurl).then(function(response) {
            $scope.currentLoc = {lat: response.data.lat, lon: response.data.lon};
            $scope.locFound = true;
          });
        }catch(e){
          $scope.getLocErr = true;
        }
      };
      $scope.categoryOptions = [{
        value: 'all',
        label: 'All'
      },{
        value: 'KZFzniwnSyZfZ7v7nJ',
        label: 'Music'  
      },{
        value: 'KZFzniwnSyZfZ7v7nE',
        label: 'Sports'  
      },{
        value: 'KZFzniwnSyZfZ7v7na',
        label: 'Arts & Theatre'  
      },{
        value: 'KZFzniwnSyZfZ7v7nn',
        label: 'Film'  
      },{
        value: 'KZFzniwnSyZfZ7v7n1',
        label: 'Miscellaneous'  
      }];
      $scope.form.category = $scope.categoryOptions[0];
      $scope.resortList = true;
      $scope.orderFields = [
        {label:'Default', value:""},
        {label:'Event Name', value: "displayName"},
        {label:'Time', value: "dateTime"},
        {label:'Artist', value: "artist"},
        {label:'Type', value: "type"}
      ];
      $scope.orderType = [
        {label:'Ascending', value:''},
        {label:'Descending', value:'reverse'}
      ];
      $scope.orderTypeSelected = $scope.orderType
      $scope.sortBy = function(propertyName) {
        $scope.resortList = false;
        $scope.fieldOrder = propertyName;
        $scope.resortList = true;
      };
      $scope.sortByOrder = function(propertyName) {
        $scope.resortList = false;
        $scope.orderTypeSelected = propertyName;
        $scope.resortList = true;
      };

      $scope.fieldOrder = $scope.orderFields[0];
      $scope.sortOrder = [
        'Ascending',
        'Descending'
      ];
      $scope.distUnitOptions = [{
        value: '0',
        label: 'Miles'
      },{
        value: '1',
        label: 'kilometers'
      }];

      // press search button
      $scope.submit = function(searchForm) {
        $scope.listPanel = true;
        $scope.progressBar = true;
        $scope.resultPanel = false;
        $scope.detailPanel = false;
        $scope.resultTable = false;
        $scope.failErr = false;        
        $scope.locErr = false;
  
        // using current location
        if (!$scope.form.location) {
          var url = $scope.rootURI + `/location/` + encodeURI($scope.form.specify);
          $http.get(url).then(function(response) {
            $scope.currentLoc = response.data;;
            $scope.discoveryEventsCall(searchForm);
          });
        }else{
          $scope.discoveryEventsCall(searchForm);
        }
      };

      // ticketmaster discovery api call
      $scope.discoveryEventsCall = function(searchForm){
        var param = {
          keyword: searchForm.keyword.$viewValue,
          segmentid: $scope.form.category.value,
          radius: $scope.form.distance,
          unit: $scope.form.distUnit.value,
          lat: $scope.currentLoc.lat,
          lon: $scope.currentLoc.lon
        }
        var url = $scope.rootURI + `/discovery`;
        //${encodeURI(searchForm.keyword.$viewValue)}/${$scope.form.category.value}/${$scope.form.distance}/${$scope.form.distUnit.value}/${$scope.currentLoc.lat}/${$scope.currentLoc.lon}`;

        $http.get(url, {params:param}).then(function(response) {
          if(response.data._embedded){
            $scope.parsingData(response.data._embedded);
            $scope.listPanel = true;
            $scope.progressBar = false;
            $scope.resultPanel = true;
            $scope.resultTable = true; 
            $scope.detailPanel = false; 
            $scope.locErr = false;
            $scope.failErr = false;
          }else{
            console.log("nothing returned");
            $scope.listPanel = true;
            $scope.progressBar = false;              
            $scope.locErr = true;
            $scope.detailPanel = false;
          }
        }, function(error){
          $scope.listPanel = true;
          $scope.progressBar = false;  
          $scope.detailPanel = false;            
          $scope.failErr = true;
          console.log(error);
        });
      };

      // ticketmaster parser
      $scope.parsingData = function(resultSet){
        var eventList = [];
        var resultData = resultSet.events;
        var i = 0;
        var existFav = false;
        var isTool = false;
        resultData.forEach(function(element){
          
          if(element.id in localStorage){
            existFav = true;
          } else {
            existFav = false;
          }
          if(element.name.length>35){
            isTool = true;
          }else{
            isTool = false;
          }

          eventList.push({
            id: element.id,
            num: ++i, 
            date: element.dates.start.localDate,
            eventName: element.name,
            category: element.classifications[0].genre.name,
            venue: element._embedded.venues[0].name,
            isFav: existFav,
            isTooltip: isTool
          });
        });
        $scope.resultList = eventList;
      };

      // display favorite panel      
      $scope.showFavorite = function(){
        $scope.failErr = false;
        $scope.resultTable = false;
        $scope.detailPanel = false;
        $scope.progressBar = true;

        $scope.favoriteList = [];
        if(localStorage.length>0){
          for (var i = 0; i < localStorage.length; i++){
            var obj = localStorage.getItem(localStorage.key(i));
            if(obj!==undefined){
              $scope.favoriteList.push(JSON.parse(obj));
            }
          }
          $scope.detailButton = true;
          $scope.progressBar = false;
          $scope.resultPanel = true;
          $scope.favoriteTable = true;
        }else{
          $scope.progressBar = false;
          $scope.locErr = true;     
          $scope.resultPanel = false;     
        }
      };
      // display main list panel    
      $scope.showResultList = function(){
        $scope.progressBar = true;
        $scope.favoriteTable = false;
        if($scope.resultList.length==0){
          $scope.locErr = true;     
          $scope.resultPanel = false;   
        }else{
          $scope.locErr = false;  
          $scope.resultPanel = true;
          $scope.resultTable = true;
        }
        $scope.detailPanel = false;
        $scope.progressBar = false;  
      };
      // display detail panel    
      $scope.showDetail = function(id, idx, eventName, fabIdx){
        $scope.tabSelected = 1;
        $scope.progressBar = true;

        $scope.detailPanel = false;
        $scope.resultTable = false;
        $scope.resultPanel = false;

        $scope.detailButton = false;
        if(idx===null){
          $scope.detailIdx = fabIdx;
        }else{
          $scope.detailIdx = idx;
        }
        $scope.detailId = id;

        if(eventName!==undefined){
          $scope.previousFavList = true;
        }else{
          $scope.previousFavList = false;
        }

        $scope.photos = [];
        $scope.retrieveDetailCall(id, idx, eventName);
      };
      // detail list parser    
      $scope.retrieveDetailCall = function(eventid, num, eventName){
        var url = $scope.rootURI + `/detailinfo/${eventid}`;
        var param = {eventid: eventid}
        if(num!==null){
          $scope.detailFavBtn = $scope.resultList[num].isFav;
        }
        $http.get(url, {params:param}).then(function(response) {
          var result = response.data;

          $scope.detailInfoItems.id = eventid;
          if(num!==null){
            $scope.detailInfoItems.title = $scope.resultList[num].eventName;
          }else{
            $scope.detailInfoItems.title = eventName;
          }

          if(result !== undefined){
            if($scope.detailInfoItems.title !== ""){
              if(result._embedded.attractions !== undefined){
                for(var i = 0; i < result._embedded.attractions.length; i++){                

                  $scope.getPhotos(result._embedded.attractions[i].name);
                  
                  if(i==0){
                    $scope.detailInfoItems.name = $scope.validateData(result._embedded.attractions[i].name);
                  }else{
                    $scope.detailInfoItems.name += " | " + $scope.validateData(result._embedded.attractions[i].name);
                  }
                }
              }else{
                $scope.detailInfoItems.name = "N/A";
              }
            }

            $scope.detailInfoItems.venue = $scope.validateData(result._embedded.venues[0].name); 
            $scope.detailInfoItems.date = $scope.dateConvert($scope.validateData(result.dates.start.localDate));
            $scope.detailInfoItems.time = $scope.validateData(result.dates.start.localTime);
            $scope.detailInfoItems.category = $scope.validateData(result.classifications[0].genre.name) + " | " + $scope.validateData(result.classifications[0].segment.name);
            if(result.priceRanges!==undefined){
              $scope.detailInfoItems.priceRange = "$" + $scope.validateData(result.priceRanges[0].min) + " ~ $" + $scope.validateData(result.priceRanges[0].max);
            }else{
              $scope.detailInfoItems.priceRange = '';
            }
            $scope.detailInfoItems.ticketStatus = $scope.capitalize($scope.validateData(result.dates.status.code));
            $scope.detailInfoItems.ticketOfficeURl = $scope.validateData(result.url);
            $scope.detailInfoItems.seatMap = $scope.validateData(result.seatmap).staticUrl;
            $scope.detailInfoItems.num = ++num;

            $scope.showEventDetail();

            var genre = result.classifications[0].segment.name.toString();
            if(genre.toLowerCase().trim()  === "music" && result._embedded.attractions !== undefined){
              $scope.spotifyTab = true;
              $scope.getSpotify(result._embedded.attractions[0].name);
            }else{
              $scope.spotifyTab = false;
            }
            $scope.getVenueInfo($scope.detailInfoItems.venue);
            $scope.getUpcomingEvent($scope.detailInfoItems.venue);

            $scope.progressBar = false;
            $scope.detailPanel = true;    
            
          }else{
            console.log("nothing returned");
          }
        }, function(error){
          $scope.listPanel = true;
          $scope.progressBar = false;  
          $scope.detailPanel = false;            
          $scope.failErr = true;
          console.log(error);
        });
      };
      $scope.dateConvert = function(date){
        return moment(date).format("x");
      };
      $scope.capitalize = function(s)
      {
          return s[0].toUpperCase() + s.slice(1);
      };
      $scope.validateData = function(data){
        return data==undefined? 'N/A':data;
      };
      // display event detail panel    
      $scope.showEventDetail = function(){
        $(function () {
          $('#detailTab li:first-child a').tab('show')
        })
        $scope.detailPanel = true;
        $scope.eventShow = true;
        $scope.errorMsg = false;
        $scope.noRecordMsg = false;
        $scope.turnOffOthers(0);        
      };
      // close other panels
      $scope.turnOffOthers = function(showing){
        $scope.showingTags = [$scope.eventShow, $scope.artistShow, $scope.venueShow, $scope.upcomingShow];
        for(var i = 0; i < $scope.showingTags.length; i++){
          if(i == showing){
            $scope.showingTags[i] = true;
          }
          else{
            $scope.showingTags[i] = false;
          }
        }
        $scope.eventShow = $scope.showingTags[0];
        $scope.artistShow = $scope.showingTags[1];
        $scope.venueShow = $scope.showingTags[2];
        $scope.upcomingShow = $scope.showingTags[3];
      };
      // display artist panel
      $scope.showArtist = function(){
        $scope.photoTab = true;
        $scope.artistShow = true;
        $scope.errorMsg = false;
        $scope.noRecordMsg = false;

        $scope.turnOffOthers(1);  
      };
      // display venue panel
      $scope.showVenue = function(){
        $scope.venueShow = true;
        $scope.errorMsg = false;
        $scope.noRecordMsg = false;

        $scope.initMap();
        $scope.turnOffOthers(2);  
      };
      // display upcoming events panel
      $scope.showUpcomingEvent = function(){        
        
        $scope.turnOffOthers(3);  

        $scope.progressBar = false;
        $scope.detailPanel = true;
        $scope.upcomingShow = true;
        $scope.errorMsg = false;
        $scope.noRecordMsg = false;
      };
      // get photolist call
      $scope.getPhotos = function(artist){
        urlartist = encodeURI(artist);
        var url = $scope.rootURI + `/photo`;
        //${urlartist}`;
        var param = {image: urlartist};
        $http.get(url, {params:param}).then(function(responsep) {
          if(responsep.data){
            var dataLeng = responsep.data.items.length;
            var photoList = [];
            for(var i = 0; i<dataLeng; i++){
              photoList.push(responsep.data.items[i].link)
            }
            var term = responsep.data.queries.request[0].searchTerms;
            $scope.photos.push({
              name: term,
              lists: photoList
            });
            rst = "";
            dataLeng = "";
            term = "";
            responsep = "";
            photoList = [];
          }else{
            console.log("nothing returned");
          }
        }, function(error){
          console.log(error);
        });
      };
      // get spotify call
      $scope.getSpotify = function(data){
        //data = encodeURI(data);
        var url = $scope.rootURI + `/artist`;
        //${data}`;
        var param = {artist: data};
        $http.get(url, {params: param}).then(function(response) {
          if(response.data.artists){
            if(response.data.artists.items.length > 0){
              var artist = response.data.artists.items[0];
              $scope.spotifyArtist.name = artist.name;
              $scope.spotifyArtist.followers = numberWithCommas(artist.followers.total);
              $scope.spotifyArtist.popularity = artist.popularity;
              $scope.spotifyArtist.checkat = artist.external_urls.spotify;
            }

            response = "";
          }else{
            console.log("nothing returned");
          }
        }, function(error){
          console.log(error);
        });
      };
      // numbering conversion (thousand comma)
      function numberWithCommas(number) {
        var result = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        return result
      } 
      // get venue info call
      $scope.getVenueInfo = function(venueName){
        $scope.venueInfo.name = venueName;
        var venueName = encodeURI(venueName);
        var url = $scope.rootURI + `/venueInfo`;
        //${venueName}`;
        var param = {venueName:venueName};
        $http.get(url, {params:param}).then(function(response) {
          if(response.data._embedded !== undefined){      
            var venue = response.data._embedded.venues[0];

            $scope.venueInfo.address = $scope.validateData(venue.address) === 'N/A'? "N/A":venue.address.line1;
            $scope.venueInfo.city = $scope.validateData(venue.city.name) + " " + $scope.validateData(venue.state.name);
            $scope.venueInfo.phoneNumber = $scope.validateData(venue.boxOfficeInfo) === 'N/A'? "N/A":venue.boxOfficeInfo.phoneNumberDetail;
            $scope.venueInfo.openHours = $scope.validateData(venue.boxOfficeInfo)=== 'N/A'?"N/A":venue.boxOfficeInfo.openHoursDetail;
            $scope.venueInfo.generalRule = $scope.validateData(venue.generalInfo)==='N/A'?"N/A":venue.generalInfo.generalRule;
            $scope.venueInfo.childRule = $scope.validateData(venue.generalInfo)==='N/A'?"N/A":venue.generalInfo.childRule;

          }else{
            console.log("nothing returned");
          }
        }, function(error){
          console.log(error);
        });
      };
      // get upcoming events call
      $scope.getUpcomingEvent = function(venue){
        //venue = encodeURI(venue);
        var url = $scope.rootURI + `/upcomingevent`;
        //${venue}`;
        var param = {venue: venue};
        $http.get(url, {params:param}).then(function(responsek) {
          if(responsek.data.resultsPage.totalEntries == 0){
            console.log("nothing returned");
          }else{
            var dataLeng = responsek.data.resultsPage.results.event.length;
            $scope.upcomingEventLen = dataLeng;

            var eventList = [];
            for(var i = 0; i<dataLeng; i++){
              var artistName = "";
              if(responsek.data.resultsPage.results.event[i].performance[0]===undefined){
                artistName = "N/A";
              }else{
                artistName = responsek.data.resultsPage.results.event[i].performance[0].displayName;
              }
              eventList.push({
                displayName: responsek.data.resultsPage.results.event[i].displayName,
                uri: responsek.data.resultsPage.results.event[i].uri,
                artist: artistName,
                date: $scope.dateConvert(responsek.data.resultsPage.results.event[i].start.date),
                time: responsek.data.resultsPage.results.event[i].start.time,
                type: responsek.data.resultsPage.results.event[i].type,
                isFav: false
              });
            }
            $scope.upcomingEventList = eventList;
            dataLeng = "";
            responsek = "";
            eventList = [];

          }
        }, function(error){
          console.log(error);
        });
      };
      // initialize venue map      
      $scope.initMap = function(){
        var url = $scope.rootURI + `/location/` + encodeURI($scope.venueInfo.address);

        $http.get(url).then(function(response) {
          $scope.targetLoc.lat = response.data.lat;
          $scope.targetLoc.lon = response.data.lon;

          $scope.markerLoc = {lat: parseFloat($scope.targetLoc.lat), lng: parseFloat($scope.targetLoc.lon)};
          $scope.dirDisplay = new google.maps.DirectionsRenderer();
          $scope.mapOptions = {
            zoom: 15,
            center: $scope.markerLoc
          }
      
          $scope.venueMap = new google.maps.Map(document.getElementById('map'), $scope.mapOptions);
      
          $scope.mapMarker = new google.maps.Marker({
            position: $scope.markerLoc,
            map: $scope.venueMap
          });
          
          $scope.panorama = $scope.venueMap.getStreetView();
          $scope.panorama.setPosition($scope.markerLoc);
      
          $scope.dirDisplay.setMap($scope.venueMap);
  
        });
      };
      // Order by Obj
      $scope.orderBy = function(order){
        $scope.sortOrder = $scope.sortingOrder[order];
        $scope.orderReverse = order % 2 == 0 ? false : true;
        $scope.orderField = order == 1 || order == 2 ? "rating" : "time";
      };   
      $scope.showMoreEvents = function(){
        $scope.resortList = false;
        $scope.resortList = true;
        if($scope.showMore == $scope.upcomingEventLen){
          //show less
          $scope.showMore = 5;
          $scope.showMoreBtn = "Show More";
        }else{
          //show more
          $scope.showMore = $scope.upcomingEventLen;
          $scope.showMoreBtn = "Show Less";
        }
      };
      // list button call
      $scope.backToResultPanel = function(){
        $scope.tabSelected = 1;
        $scope.resultTable = false;  
        $scope.progressBar = false;        
        $scope.resultPanel = true;
        $scope.listPanel = true;
        $scope.detailPanel = false;
        $scope.locErr = false;

        if($scope.previousFavList){
          $scope.favoriteTable = true;          
          $scope.detailButton = false;
        }else{
          $scope.favoriteTable = false;
          $scope.resultTable = true;
        }
      };
      // favorite icon
      $scope.toggleFavoriteBtn = function(num, id, mode){
        var idx = --num;

        if(mode==0){
          if($scope.resultList[idx].isFav){
            $scope.deleteFavorite(idx, id, 0);
          }else{
            $scope.storeFavorite(idx, id, 0);
          }
        }else{
          $scope.favManipulation(id);
        }
      };
      // delete favorite btn call
      $scope.deleteFavBtn = function(id){      
        $scope.favoriteTable = false;
        localStorage.removeItem(id);
        var idx = 0;
        if($scope.favoriteList.length>0){
          for(var j = 0; j<$scope.favoriteList.length; j++){
            if($scope.favoriteList[j]!==undefined){
              if($scope.favoriteList[j].id===id){
                idx = j;  
              }          
            }
          }
        }
        $scope.favoriteList.splice(idx,1);
        for(var i = 0; i<$scope.resultList.length; i++){
          if($scope.resultList[i].id===id){
            $scope.resultList[i].isFav = false;
          }
        }
        if($scope.favoriteList.length==0){
          $scope.locErr = true;
          $scope.resultPanel = false;
        }else{
          $scope.favoriteTable = true;        
        }
      };
      // detail page favorite btn
      $scope.detailFavoriteBtn = function(num, id){
        var idx = --num;

        if($scope.resultList[idx].isFav){
          $scope.detailFavBtn = false;
          $scope.deleteFavorite(idx, id, 0);
        }else{
          $scope.detailFavBtn = true;
          $scope.storeFavorite(idx, id, 0);
        }
        $scope.favManipulation(idx,id);
      };
      // manipulate favorite items
      $scope.favManipulation = function(idx,id){
        var fabIdx = 0;
        var existFav = false;
        $scope.favoriteList = [];
        if(localStorage.length>0){
          for (var i = 0; i < localStorage.length; i++){
            if(localStorage.key(i)===id){
              favIdx = i;
              existFav = true;
            }
            var obj = localStorage.getItem(localStorage.key(i));
            if(obj!==undefined){
              $scope.favoriteList.push(JSON.parse(obj));
            }
          }
        }
        if(existFav){
          $scope.favoriteList.splice(favIdx,1);
        }else{
          $scope.favoriteList.push($scope.resultList[idx]);
        }
      };
      // store favorite item in localstorage
      $scope.storeFavorite = function(idx, id){        
        $scope.resultList[idx].isFav = true;
        var tmpFavList = [];
        tmpFavList = $scope.favoriteList;
        tmpFavList.push($scope.resultList[idx]);
        $scope.favoriteList = tmpFavList;

        localStorage.setItem(id, JSON.stringify($scope.resultList[idx]));
      }
      // delete favorite item from localstorage    
      $scope.deleteFavorite = function(idx, id, mode){
        if(mode == 0){
          $scope.resultList[idx].isFav = false;
        }else{
          delete $scope.favoriteList[idx];
          for(var i = 0; i<$scope.resultList.length; i++){
            if($scope.resultList[i].id===id){
              $scope.resultList[i].isFav = false;
            }
          }
        }
        localStorage.removeItem(id);
      };   
      // tweeter icon call
      $scope.tweet = function(){
        $scope.twitterUrl = "https://twitter.com/intent/tweet/?";
        $scope.tweetQuote = "";

        $scope.tweetQuote += "text=Check out " + $scope.detailInfoItems.title;
        $scope.tweetQuote += " located at " + $scope.detailInfoItems.venue + ". ";
        $scope.tweetQuote += "Website: ";
        $scope.tweetUrl = $scope.detailInfoItems.ticketOfficeURl;
        $scope.tweetUrl = $scope.tweetUrl.replace(/\//g, '%2F');
        $scope.tweetUrl = $scope.tweetUrl.replace(/:/g, '%3A');
        $scope.tweetQuote += $scope.tweetUrl + " &hashtags=CSCI571EventSearch%2C";
        $scope.tweetQuote.replace(/\s/g, '%20');
    
        $scope.tweetReq = $scope.twitterUrl + $scope.tweetQuote;
    
        $window.open($scope.tweetReq, "", "width=1000px, height=800px");
      }
      // from here btn    
      $scope.resetToHere = function(){
        try{
          $http.get($scope.ipAPIurl).then(function(response) {
            $scope.currentLoc = {lat: response.data.lat, lon: response.data.lon};
            $scope.locFound = true;
            $scope.form.invalidLocation = false;
          });
        }catch(e){
          $scope.getLocErr = true;
        }
      };
    
      // Reset
      $scope.reset = function(searchForm){
        if(searchForm){
          searchForm.keyword = null;
          $scope.listPanel = false;
          $scope.form.category = $scope.categoryOptions[0];
          $scope.form.invalid = true;
          $scope.form.touched = false;
          $scope.specify = "";
          $scope.invalidLocation = false;
        }
        $scope.locErr = false;
      };
      // form field error handling
      $scope.detectChange = function(searchForm){
        if(searchForm.keyword.$viewValue.length == 0){
          $scope.form.invalid = true;
        }else{
          $scope.form.invalid = false;
        }
      };
      // form field error handling    
      $scope.detectTouch = function(){
        $scope.form.touched = true;
      };
      // form field error handling
      $scope.detectLocation = function(searchForm){
        if(searchForm.location.$viewValue.length == 0){
          $scope.form.invalidLocation = true;
        }else{
          $scope.form.invalidLocation = false;
        }
      };
});