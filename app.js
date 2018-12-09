// Import
const appConfig = require('./config/appConfig');
const mongoose = require('mongoose');
const { generateObjectFromFile, saveRecordsToDatabase, readDirectory } = require('./metaUtils');

// Connect to database - create if not exists
mongoose.connect(appConfig.db);


// A few things to be able to iterate more quickly
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  // Drop collection at the start in case of re-run
  mongoose.connection.db.dropCollection('metadatas', function(err, result) {
    if (err) {
        console.log("Collection doesn't exist yet. Continue.");
    } else {
        console.log("Collection metadatas dropped for code re-usability");
    }
  });
});


// Global - Declare some specifics regarding initial working directory and directories to exclude
const initialPath = appConfig.workingDirectory;
const excludedDir = appConfig.excludedDirs;
let listOfFolders = [];
let skippedFolders = [];
let databaseObjects = [];

// The main function where the magic happens :D!
async function main() {

    // Populate folder structure to serve as a queue
    listOfFolders = await readDirectory(initialPath);

    // Start chewing through folders queue
    while (listOfFolders.length > 0) {

        let currentDirectory = listOfFolders.shift();

        try {

            console.log("Attempting to process directory: " + currentDirectory);
            
            // If an excluded directory just ignore and continue on; The shift will remove it from the queue
            // Also, appears that directories with additional naming appended may not be intended to exist
            if (excludedDir.indexOf(currentDirectory) != -1 || !Number(currentDirectory)) {
                continue;
            }

            // Read in the files in the current directory
            let dirFiles = await readDirectory(initialPath + '/' + currentDirectory + '/');   
            
            // Loop through the files in the current directory
            for (let y = 0; y < dirFiles.length; y++) {

                // Function that can handle a single file to generate desired output
                let newDbObject = await generateObjectFromFile(initialPath, currentDirectory, dirFiles[y]);

                // Defer database updates for later
                if (newDbObject != null) {
                    databaseObjects.push(newDbObject);    
                } else {
                    skippedFolders.push(currentDirectory + ' - No Title Found');
                }

                /* Used for single record saves - I think mongo is pretty fast so this would probably be fine
                But I'm still going to try for the bulk save at the end */
                // await MetaData.create(newDbObject);
            }
        } 
        catch(e) {
            console.log("Error occurred...")
            console.log(e);
            skippedFolders.push(currentDirectory + ' - An Error occurred - ' + e);
            // Continue to run.
        }
    }

    console.log("Finished processing the Gutenberg Library!");

    if (skippedFolders.length > 0) {
        console.log("These folders were skipped:");
        for (let x = 0; x < skippedFolders.length; x++) {
            console.log(skippedFolders[x]);
        } 
    } else {
        console.log("No folders were skipped during processing :).");        
    }
    
    // Begin database bulk operation - Trying this as a more efficient operation to make one call to the database
    console.log("Writing records to the database...");

    try {
        const finalResult = await saveRecordsToDatabase(databaseObjects);
        console.log("Bulk save complete!");
        console.log("Shutting down... Good bye :)");
        process.exit();
    } 
    catch (error) {
        console.log("There was an error on the batch save...");
        console.log(error);
        console.log("Shutting down please review the error on save");
        process.exit();
    }

}

// It's alive!
console.log("running app.js...");

// Execute main function
main();
