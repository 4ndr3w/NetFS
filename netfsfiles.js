var fs = require("fs"),
    request = require("request"),
    deepmerge = require("deepmerge"),
    netfs = require("./netfs");

var directoryData = {};

function processDir(path, ptr)
{
  if ( ptr == undefined )
    directoryData = ptr = {};
  var dir = fs.readdirSync(path);
  for ( d in dir )
  {
    s = fs.statSync(path+"/"+dir[d]);
    if ( s.isDirectory() && dir[d] != "__ISFILE" )
    {
      ptr[dir[d]] = {};
      processDir(path+"/"+dir[d], ptr[dir[d]]);
    }
    else if ( dir[d] != "__ISFILE" )
    {
      ptr[dir[d]] = {__ISFILE: true, source: "local", path: path+"/"+dir[d], length: s.size};
    }
  }
}
exports.processDir = processDir;

function get(path)
{
  if ( path == "/")
    return directoryData;
  var dirs = path.substring(1).split("/");
  var ptr = directoryData;
  for ( d in dirs )
  {
    if ( ptr[dirs[d]] != undefined )
      ptr = ptr[dirs[d]];
    else
      return undefined;
  }
  return ptr;
}
exports.get = get;

function exists(path)
{
  p = get(path);
  if ( p == undefined )
    return false;
  return p;
}
exports.exists = exists;

function open(path)
{
  if ( exists(path) )
    return -1;
  return 0;
}
exports.open = open;

function read(path, offset, len, cb)
{
  p = get(path);
  if ( p.source == "local" )
  {
    (function (p, offset, len, cb)
    {
      fs.open(p.path, 'r', function(err, fd)
      {
        if ( err ) cb(err, null);
        else
        {
          var buffer = new Buffer(len);
          fs.read(fd, buffer, 0, len, offset, function(err, bytesRead, buffer)
          {
            fs.close(fd, function(err)
            {
              cb(err, buffer);
            });

          });
        }
      });
    })(p, offset, len, cb);
  }
  else
  {
    console.log("Requesting http://"+p.source+":8080/read?offset="+offset+"&length="+len+"&path="+path);
    var reqSettings = {
      method:"GET",
      url:"http://"+p.source+"/read?offset="+offset+"&length="+len+"&path="+path,
      encoding: null
    };
    request(reqSettings, function(err, response, body)
    {
      if ( !err && response.statusCode == 200 )
      {
        cb(err, body);
      }
      else
        cb(err, null);
    })
  }
}
exports.read = read;

function register(remoteDirectoryData)
{
  directoryData = deepmerge(remoteDirectoryData, directoryData);
}
exports.register = register;

function registerAt(remoteAddress)
{
  request("http://"+remoteAddress+"/register?port="+netfs.port+"&tree="+JSON.stringify(get("/")), function (err, status, body)
  {
    if ( !err && status && status.statusCode == 200 )
      console.log("Registration status code is "+status.statusCode);
    else
      console.log("Registration failed at "+remoteAddress);
  });
}
exports.registerAt = registerAt;

processDir("test");
