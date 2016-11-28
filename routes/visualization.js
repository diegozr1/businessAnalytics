var ArtistSpotify = require('../models/artistSpotify');

exports.index =  function(req, res, next) {
  res.render('index', { title: 'Data mining project' });
};

exports.visualization = function(req, res, next){
  ArtistSpotify.find({}, function(err, data){
      res.render('visualization', {title: 'Data mining project', data:data})
  })
};

var vehicles = function(){
    //https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json
}

/*
exports.charts = function(req,res,next){
    
    var renato = new artist({
        name : "Renato",
        id : 1
    })
    
    renato.save(function(err){
        if(err) throw err;
        
        console.log("Renato artist was saved!")
    })
    
    res.send("Renato artist was saved!")
}

exports.view = function(req,res,next){
    
    artist.find({}, function(err, data){
        if(err) throw err;
        
        console.log(data)
        res.send(data)
    })
    res.end()
}*/