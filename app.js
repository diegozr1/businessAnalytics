var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

/*
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
// Connection URL
var url = 'mongodb://localhost:27017/data-mining';

var db;
*/

var app = express();
var router = express.Router();
var index = require('./routes/index');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/*
var initDB = function(callback) {
  MongoClient.connect(url, function(err, conn) {
    assert.equal(null, err);
    console.log("Connected successfully to server");
    db = conn;
    callback();
  });
}

router.use(function(req, res, next) {
  console.log("Database connected");
	req.db = db;
	next();
});
*/

router.route('/')
      .get(index.index);
      
router.route('/getTopArtists')      
      .get(index.getTopArtists);
      
router.route('/getCommunity')
      .post(index.getCommunity);

router.route('/getTecCommunity')
      .get(index.getTecCommunity);

router.route('/getArtistsCommunity')
      .get(index.getArtistsCommunity);
     
router.route('/getArtistFBPage')
      .post(index.getArtistFBPage);

router.route('/matchUsers')
      .post(index.matchUsers);

router.route('/deleteNode')
      .post(index.deleteNode);

app.use('/', router);

/*
var init = function() {
  initDB(function() {
    app.listen(process.env.PORT, function(){
      console.log("Server running "+process.env.PORT)
    });
  })
}
*/

var init = function(){
  app.listen(process.env.PORT, function(){
    console.log('Server running ' + process.env.PORT)
  });
};

init();