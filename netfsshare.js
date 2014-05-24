var netfs = require("./netfs"),
    express = require("express"),
    app = express(),
    files = require("./netfsfiles"),
    deepmerge = require("deepmerge");

app.get("/", function(req, res)
{
  res.send("NetFS Server");
});

app.get("/tree", function(req, res)
{
  var data = files.get("/");
  function process(obj)
  {
    delete obj.source;
    delete obj.path;
    for ( d in obj )
    {
      if ( typeof obj[d] == "object" )
        process(obj[d]);
    }
  }
  process(data);

  res.json(files.get("/"));
});

app.get("/read", function(req, res)
{
  if ( (f = files.get(req.param("path"))) )
  {
    if ( !f.__ISFILE )
      res.send("Requested path is a directory");
    data = files.read(req.param("path"), parseInt(req.param("offset")), parseInt(req.param("length")), function(err, buf)
    {
      if ( err ) res.send(err);
      else
        res.end(buf, 'binary');
    });
  }
  else
    res.send(404);
});

app.get("/register", function(req, res)
{
  if ( req.param("tree") )
  {
    data = JSON.parse(req.param("tree"));
    function process(obj, previous)
    {
      if ( previous == undefined ) previous = "";

      delete obj.source;
      delete obj.path;
      if ( obj.__ISFILE )
      {
        obj.source = req.connection.remoteAddress+":"+req.param("port");
        obj.path = previous;
      }
      for ( d in obj )
      {
        if ( typeof obj[d] == "object" )
          process(obj[d], previous+"/"+d);
      }
    }
    process(data);
    files.register(data);

    res.send("OK");
  }
});

app.listen(netfs.port);
