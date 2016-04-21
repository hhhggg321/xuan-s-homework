var express = require('express');
var session = require('express-session');
var parseurl = require('parseurl');
var uuid = require('uuid')
var MyFileStore = require('./my-file-store')(session);

var app = express();

app.use(session({
  genid : function(req) {
    return uuid.v4();
  },
  secret : 'xuan',
  resave : false,
  saveUninitialized : true,
  //default session directory is ./session, can be changed through first parameter
  store : new MyFileStore('./session')
}));

app.use(function(req, res, next){
  var views = req.session.views;
  if(!views){
    views = req.session.views = {};
  }
  //get the url pathname
  var pathname = parseurl(req).pathname;
  //count the views
  views[pathname] = (views[pathname] || 0) + 1;
  next();
});

app.get('/foo', function(req, res, next){
  res.send('you viewed this page ' + req.session.views['/foo'] + ' times');
});

app.get('/bar', function(req, res, next){
  res.send('you viewed this page ' + req.session.views['/bar'] + ' times');
});

app.get('/', function(req, res, next){
  res.send('you viewed this page ' + req.session.views['/'] + ' times');
});
app.listen(3000);
console.log('Web server has started on http://127.0.0.1:3000/');
