var files = require("./netfsfiles"),
    fuse = require("fuse4js"),
    netfs = require("./netfs");

function getattr(path, cb)
{
  var file = files.get(path);
  var stat = {};
  if ( file == undefined )
    cb(-2, null);
  else if ( !file.__ISFILE )
  {
    stat.size = 4096;
    stat.mode = 040777;
    cb(0, stat);
  }
  else
  {
    stat.size = file.length;
    stat.mode = 0100666;
    cb(0, stat);
  }

}

function readdir(path, cb)
{
  var file = files.get(path);
  if ( file == undefined )
    cb(-22, null);
  else if ( !file.__ISFILE )
  {
    var _f = new Array();
    for ( f in file ) _f.push(f);
    cb(0, _f);
  }
  else
    cb(-22, null);
}

function open(path, flags, cb)
{
  if ( files.get(path) != undefined )
    cb(0);
  else
    cb(-2);
}

function read(path, offset, len, buf, fh, cb)
{
  var file = files.get(path);
  if ( file.__ISFILE )
  {
    files.read(path, offset, len, function(err, data)
    {
      data.copy(buf, 0, 0, len);
      cb(len);
    });
  }
  else
  {
    cb(-2);
  }
}

function release(path, fh, cb)
{
  cb(0);
}

function init(cb)
{
  cb();
}

function destroy(cb)
{
  cb();
}

var handlers = {
  getattr: getattr,
  readdir: readdir,
  open: open,
  read: read,
  release: release,
  init: init,
  destroy: destroy
};

fuse.start(netfs.mountpoint, handlers, false);
