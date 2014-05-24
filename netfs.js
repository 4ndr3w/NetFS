var fs = require("fs");
var config = JSON.parse(fs.readFileSync("config.json"));

if ( !config.port )
{
  config.port = Math.floor((Math.random()*1000)+10000);
  fs.writeFileSync("config.json", JSON.stringify(config));
}
module.exports = config;

var netFS = {fuse: require("./netfsfuse"), files: require("./netfsfiles"), share: require("./netfsshare") };
var _ = require("underscore");
var request = require("request");

console.log("NetFS server up on "+config.port);

function checkin()
{
  request("http://"+config.tracker+"/register/"+config.port, function(err, response, body)
  {
    if ( body && !err )
    {
      _.each(JSON.parse(body), function(server)
      {
        netFS.files.registerAt(server);
      });
    }
  });
}

setInterval(checkin, 1500000);

checkin();
