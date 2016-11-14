var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var artistSpotifySchema = new Schema({
    id: String,         // Encode artist name - replace('/', '%', (Base64 artist name)) => "Q29sZHBsYXk=""
    name: String,       // Artist name - "Coldplay"
    counter: Number     // # songs in top 200 - 40
}, { collection: 'ArtistsSpotify' });

var ArtistSpotify = mongoose.model('ArtistsSpotify', artistSpotifySchema);

module.exports = ArtistSpotify;