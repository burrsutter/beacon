'use strict';

var Rx = require('rx')
  , convertLocation = require('./api/location/location_controllers').convertLocation
  , Scan = require('./api/scan/scan_model')
  , getUser = require('./beacon-live').getUser
  , debuglog = require('debuglog')('stomp')
  ;

var tag = 'PLAYBACK';

var counter = Rx.Observable.interval(25)
  .map(function(n) {
    var minutes = START_MINUTES + n; // increment in 1 minute increments
    return {
      n: n
    , minutes: minutes
    , timestamp: EVENT_DATE + minutes * 60 * 1000 // timestamp in ms
    }
  })
  .takeWhile(function(tick) {
    return tick.minutes <= END_MINUTES;
    // return tick.minutes <= START_MINUTES + 20;
  });


var getScanFeed = function() {
  var date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(7,30,0,0);
  console.log(date);
  var query = Scan.find({retransmit: false, timestamp: {$gte: date}})
    .sort({'timestamp': 1})
    .lean();
  return Rx.Node.fromStream(query.stream(), 'close')
  .map(function(scan) {
    scan.user = getUser(scan.beaconId);
    scan.location = convertLocation(scan.location);
    scan.timestamp = new Date(scan.timestamp).getTime();
    return scan;
  });
};

module.exports = {
  scans: getScanFeed
};