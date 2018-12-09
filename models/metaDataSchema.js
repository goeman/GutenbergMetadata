const mongoose = require('mongoose');

// define the schema for our metaData model
var metaData = mongoose.Schema({
	metaId: { 
		type: mongoose.Schema.Types.Number,
		unique: true,
		integer: true,
		range: [{
			min: 1,
			max: 99999
		}]
	},
	title: String,
	author: Array,
	publisher: String,
	publicationDate: String, // Leaving as a string for now intentionally
	language: String,
	subject: Array,
	licenseRights: String
});

// create the model for metaData and expose it
module.exports = mongoose.model('MetaData', metaData);