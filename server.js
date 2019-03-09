const https = require("https");
const express = require('express');
const cors = require("cors");
const geohash = require('ngeohash');
const spotifyClient = require("spotify-web-api-node");

const ticketmasterApiKey = "eePh4DjcfI7g2qZLAH0iHUcBEurozHTW";
const googleApiKey = "AIzaSyASkeq3CB5KbrpTJNo-Zbv9VgoIR5DnT20";
const songkickApiKey = "pItOrDqhfeIIVJ6p";
const googleCustomAPIkey = "AIzaSyCsovVzjZSpHECQUB7e4P6ISM2w2YHUAtY";
const googleCustomAPIID = "009548188721184461648:wi4ufclh7ka";

const app = express();
var port = 8081;

app.use('/', express.static('./public/'));
app.use(cors());

//  API#0 : SpotifyAPI (Internal API)
//  Refreshing spotify token
//  URI   : /refresh
app.get('/refresh', function(req, res) {
    // Spotify Client Initialize
    var spotifyApi = new spotifyClient({
        clientId: '4a958602383f42d5acca2e21265ad650',
        clientSecret: '665552c893034b4a8ddfe73d40582fa2'
    });
    
    // Spotify Client: Update Token
    // desc: token was renewed in every 24hours 
    var getNewToken = function(){
        spotifyApi.clientCredentialsGrant().then(
            function(data) {
                console.log('The access token expires in ' + data.body['expires_in']);
                console.log('The access token is ' + data.body['access_token']);

                // Save the access token so that it's used in future calls
                spotifyApi.setAccessToken(data.body['access_token']);
            },
            function(err) {
                console.log('Something went wrong when retrieving an access token', err);
            }
        );
        setTimeout(getNewToken, 1800000);
    };
    getNewToken();
});

//  API#1 : SpotifyAPI
//  Retrieve artist information by name
//  URI   : /sArtist/:artist
app.get('/artist', function(req, res5) {
    console.log(req.query.artist)
    spotifyApi.searchArtists(req.query.artist)
      .then(function(data) {
        console.log('Search artists by "Love"', data.body);
        res5.json(data.body);

      }, function(err) {
        console.error(err);        
      });
});


//  API#2 : TicketmasterAPI discovery
//  URI   : /discovery/:keyword/:radius/:unit(0/1)/:lat/:lon 
//  ex    : https://app.ticketmaster.com/discovery/v2/events.json?apikey=eePh4DjcfI7g2qZLAH0iHUcBEurozHTW&keyword=usc&segmentId=&radius=10000&unit=miles&geoPoint=ww8p1r4t8 
//  usage : http://localhost:9000/discovery/usc/10000/0/34.0266/-118.2831
app.get('/discovery', function(req, res1){

    console.log(req.query);
    var geoLoc = geohash.encode(req.query.lat, req.query.lon)
    console.log(geoLoc);
    var units='miles';
    if(req.query.unit == '1'){
        units = 'km';
    }
    if(req.query.segmentid == 'all'){

    url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${ticketmasterApiKey}&keyword=` 
            + encodeURIComponent(req.query.keyword) + `&radius=` + req.query.radius + `&unit=`
            + units + `&geoPoint=` + encodeURIComponent(geoLoc) + `&sort=date,asc`;
    }else{
        url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${ticketmasterApiKey}&keyword=` 
        + encodeURIComponent(req.query.keyword) + `&segmentId=${req.query.segmentid}&radius=${req.query.radius}&unit=`
        + units + `&geoPoint=` + encodeURIComponent(geoLoc) + `&sort=date,asc`;

    }
    var resbody1 = "";
    
    console.log(url);
    https.get(url, res=>{
        res.setEncoding("UTF-8");
        
        res.on("data", data => {
           resbody1 += data; 
        });
        
        res.on("end", () => {
            resbody1 = JSON.parse(resbody1);
            res1.json(resbody1);

            resbody1 = "";
            res1 = null;
        });
    }); 
});

//  API#3 : TicketmasterAPI getDetail
//  URI   : /detailinfo/:eventid
//  ex    : https://app.ticketmaster.com/discovery/v2/events/".$event_id."?apikey=".$api_key
//  usage : http://localhost:9000/detailinfo/Z698xZC2Z1717_6
app.get('/detailinfo/:eventid', function(req, res2){
    // resp.setHeader('Access-Control-Allow-Origin','*');
    url = `https://app.ticketmaster.com/discovery/v2/events/` + encodeURIComponent(req.params.eventid) + `?apikey=${ticketmasterApiKey}`;

    var resbody2 = "";
    
    console.log(url);
    https.get(url, res=>{
        res.setEncoding("UTF-8");
        
        res.on("data", data => {
           resbody2 += data; 
        });
        
        res.on("end", () => {
            resbody2 = JSON.parse(resbody2);
            res2.json(resbody2);

            resbody2 = "";
            res2 = null;
        });
    }); 
});
//  API#4 : TicketmasterAPI venueDetail
//  URI   : /venueInfo/:venue
//  ex    : https://app.ticketmaster.com/discovery/v2/venues?apikey=".rawurlencode($api_key)."&keyword=
//  usage : http://localhost:9000/venueInfo/TD+Garden
app.get('/venueInfo', function(req, res3){
    // resp.setHeader('Access-Control-Allow-Origin','*');
    url = `https://app.ticketmaster.com/discovery/v2/venues?apikey=${ticketmasterApiKey}&keyword=` + req.query.venueName;

    var resbody3 = "";
    
    console.log(url);
    https.get(url, res=>{
        res.setEncoding("UTF-8");
        
        res.on("data", data => {
           resbody3 += data; 
        });
        
        res.on("end", () => {
            console.log(resbody3);            
            resbody3 = JSON.parse(resbody3);
            res3.json(resbody3);
            
            resbody3 = "";
            resq3 = null;
        });
    }); 
});

//  API#5 : GoogleMapAPI
//  URI   : /location/loc
//  ex    : https://maps.googleapis.com/maps/api/geocode/json?address=".$address."&key=".$map_key
//  usage : http://localhost:9000/location/new+york
app.get('/location/:loc', function(req, res4){
   
    url = `https://maps.googleapis.com/maps/api/geocode/json?address=` +  encodeURIComponent(req.params.loc)+`&key=${googleApiKey}`;
    var resbody4 = "";
    var result4 = "";

    console.log(url);

    https.get(url, res=>{
        res.setEncoding("UTF-8");
        
        res.on("data", data => {
           resbody4 += data; 
        });
        
        res.on("end", () => {
            resbody4 = JSON.parse(resbody4);
            var result4 = {lat: resbody4.results[0].geometry.location.lat, lon: resbody4.results[0].geometry.location.lng};
            console.log(result4);
            res4.json(result4);

            resbody4 = "";
            result4 = "";
            res4 = null;
        });
    });
});

//  API#6 : GoogleCustomAPI
//  URI   : /photo/:image
//  ex    : https://www.googleapis.com/customsearch/v1?q=USC+Trojans&cx=009548188721184461648:wi4ufclh7ka&num=9&searchType=image&key=AIzaSyCsovVzjZSpHECQUB7e4P6ISM2w2YHUAtY
app.get('/photo', function(req, res6){
    console.log(req.query.image)
    var url = `https://www.googleapis.com/customsearch/v1?q=`+req.query.image +`&cx=${googleCustomAPIID}&num=8&searchType=image&key=${googleCustomAPIkey}`;
    var resbody6 = "";
    
    console.log(url);

    https.get(url, res=>{
        res.setEncoding("UTF-8");
        
        res.on("data", data => {
            resbody6 += data; 
        });
        
        res.on("end", () => {
            resbody6 = JSON.parse(resbody6);
            res6.json(resbody6);

            resbody6 = "";
            res6 = null;
        });
    });
});

//  API#7 : SongkickAPI upcomingevent
//  URI   : /upcomingevent/:venue
//  ex    : https://api.songkick.com/api/3.0/search/venues.json?query=colloseum&apikey=pItOrDqhfeIIVJ6p
//  usage : http://localhost:9000/upcomingevent/colloseum
app.get('/upcomingevent', function(req, res7){
   console.log(req);
    url = `https://api.songkick.com/api/3.0/search/venues.json?query=`+encodeURIComponent(req.query.venue)+`&apikey=${songkickApiKey}`;
    var resbody7 = "";
    var venue_id = "";
    var calendarurl = "";
    var resbody72 = "";

    console.log(url);

    https.get(url, res=>{
        res.setEncoding("UTF-8");
        
        res.on("data", data => {
            resbody7 += data; 
        });
        
        res.on("end", () => {
            resbody7 = JSON.parse(resbody7);
            console.log(resbody7);
            console.log(resbody7.resultsPage.totalEntries);
            console.log(resbody7.resultsPage.totalEntries == 0);
            if(resbody7.resultsPage.totalEntries == 0){
                res7.json(resbody7);
            }else{
                venue_id = resbody7.resultsPage.results.venue[0].id;
                console.log("venue_id"+venue_id);
                
                calendarurl = `https://api.songkick.com/api/3.0/venues/${venue_id}/calendar.json?apikey=${songkickApiKey}`;
                https.get(calendarurl, res => {
                    res.setEncoding("utf8");

                    res.on("data", data => {
                        resbody72 += data;
                    });
                    res.on("end", () => {
                        resbody72 = JSON.parse(resbody72);
                        console.log(resbody72);

                        res7.json(resbody72);
                    });

                    resbody72 = "";
                    calendarurl = "";
                    venue_id = "";
                });       
            }
            resbody7 = "";
        });
    });
});

//  API#8 : TicketmasterAPI autocomplete
//  URI   : /autocomplete/:keyword
//  ex    : https://app.ticketmaster.com/discovery/v2/suggest?apikey=YOUR_API_KEY&keyword=laker
app.get('/autocomplete/:keyword', function(req, res8){
   
    var url = `https://app.ticketmaster.com/discovery/v2/suggest?apikey=${ticketmasterApiKey}&keyword=` + req.params.keyword;
    var resbody8 = "";
    
    console.log(url);

    https.get(url, res=>{
        res.setEncoding("UTF-8");
        
        res.on("data", data => {
            resbody8 += data; 
        });
        
        res.on("end", () => {
            resbody8 = JSON.parse(resbody8);
            console.log(resbody8._embedded.attractions);
            res8.json(resbody8._embedded);

            resbody8 = "";
            res8 = null;
        });
    });
});

app.listen(port, () =>{ 
    console.log(`listening on port ${port}!`)
});
