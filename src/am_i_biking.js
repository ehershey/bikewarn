#!/usr/bin/env node
// Check for recent share ride starting points
//
// A potential share ride start point is either the end of a walking activity
// or the start of a cycling activity that occurs near a bike share station.
//
// Share ride end points occuring after share ride start points invalidate
// the start point. 
//
//

var dbconfig = require('dbconfig');
var request = require('request');
var mongodb = require('mongodb');
var sharewarn = require('sharewarn');

var dburl = dbconfig.dburl;
var stations_collection = dbconfig.stations_collection;
var users_collection = dbconfig.users_collection;

var MongoClient = mongodb.MongoClient
  , Server = mongodb.Server;

var now = new Date();


MongoClient.connect(dburl, function(err, db) 
{
  
  sharewarn.get_user(db, "ernie",function(err, user) { 
    if(err) throw err;
    console.log('username: ' + user.username);
    var moves_access_token = user.moves_access_token;
  
    var request_year = now.getFullYear();
    var request_month = now.getMonth() + 1;
    if(request_month < 10) request_month = "0" + request_month;
    var request_date = now.getDate();
    if(request_date < 10) request_date = "0" + request_date;
  
    var request_date = request_year + request_month + request_date;
    var request_url = 'https://api.moves-app.com/api/v1/user/storyline/daily/' + request_date + '?trackPoints=true&access_token=' + moves_access_token;
    console.log('request_url: ' + request_url);
  
    request(request_url, 
          function (error, response, body) {
            if (!error && response.statusCode == 200) {
              var storyline = JSON.parse(body)[0];
  
              var segments = storyline.segments;
              console.log('segments.length: ' + segments.length);
  
              if(!segments) { segments = [] }
  
                for(var j = 0 ; j < segments.length ; j++) 
                {
                  total_segment_count++;
                  var segment = segments[j];
                  save_segment(db, segment);
          
                  var activities = segment.activities;
  
                  if(!activities) { activities = [] }
          
                  for(var k = 0 ; k < activities.length ; k++) 
                  {
                    total_activity_count++;
                    var activity = activities[k];
                    save_activity(db, activity);
                  }
                 }
            }
          });
   
  
  
    // sharewarn.is_point_at_station(db, longitude, latitude, function(err) { 
          // process.stdout.write("true\n");
          // db.close();
          // process.exit(0);
       // }, function(err) { 
          // process.stdout.write("false\n");
          // db.close();
          // process.exit(1);
       // });
  });
}); 