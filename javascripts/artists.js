// Initialize Firebase
var config = {
 apiKey: "AIzaSyB5BuTPSwcEHm2cS0xPWIWvSKx0jH07VEU",
 authDomain: "data-mining-70fc9.firebaseapp.com",
 databaseURL: "https://data-mining-70fc9.firebaseio.com",
	storageBucket: "data-mining-70fc9.appspot.com",
 messagingSenderId: "1010601239996"
};

firebase.initializeApp(config);
var database = firebase.database();

const FINAL_DAY = "28";
const FINAL_MONTH = "10";
const FINAL_YEAR = "2016";
const FINAL_DATE =
	moment(FINAL_YEAR + FINAL_MONTH + FINAL_DAY, "YYYYMMDD");

var artists = {};

function fetchArtists() {
	var day = "12";
	var month = "08";
	var year = "2016";
	var date = moment(year + month + day, "YYYYMMDD");
	
	while (parseInt(date.format("YYYYMMDD")) <=
		parseInt(FINAL_DATE.format("YYYYMMDD"))) {
		console.log(date.format("YYYYMMDD"));
		retrieveCSV(date);
	}
}

function retrieveCSV(date) {
	var link = "https://spotifycharts.com/regional/mx/weekly/" +
		date.format("YYYY-MM-DD") + "--" +
		date.add(7, "days").format("YYYY-MM-DD") + "/download";
	
	var file = $.get("https://jsonp.afeld.me/?url=" + link,
		function(data) {
		data = data.split("\n");

		for (var i = 1; i < (data.length - 1); i++) {
			var artist = data[i].split(",")[2];
			
			if (artists[artist] == undefined) {
				artists[artist] = 1;
			} else {
				artists[artist]++;
			}
/*
			database.ref("artists").child(artist).set({
				count: artists[artist]
			})*/
			console.log(data[i]);
			console.log(artist + ": " + artists[artist]);
		}
	});
}

fetchArtists();