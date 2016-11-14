var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var artistCommunityFBSchema = new Schema({
    id: String,         // Encode artist name - replace('/', '%', (Base64 artist name)) => "Q29sZHBsYXk=""
    page: {
        id: Number,     // FB ID - 15253175252
        name: String    // Page's artist name FB - "Coldplay Official"
    },
    users: { type: Array, default: [] } // Array of userSchema
});

var ArtistCommunityFB = mongoose.model('ArtistsCommunityFB', artistCommunityFBSchema);

module.exports = ArtistCommunityFB;