var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userTecCommunitySchema = new Schema({
    id: Number,         // FB ID - 536399586558220
    name: String,       // User name - "Gaby Pineda Silva"
    counter: Number     // # of reactions & comments in page - 13
});

var UserTecCommunityFB = mongoose.model('TecCommunityFB', userTecCommunitySchema);

module.exports = UserTecCommunityFB;