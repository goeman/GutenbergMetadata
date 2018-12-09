const fs = require('fs');
const util = require('util');
const xml2js = require('xml2js');
const stripNS = require('xml2js').processors.stripPrefix;
const nestedProperty = require("nested-property");
const MetaData = require("./models/metaDataSchema.js");

const readDir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const parseString = util.promisify(xml2js.parseString);

async function generateObjectFromFile(initialPath, currentDirectory, currentFile) {

    // Build the current file path
    let currentFilePath = initialPath + '/' + currentDirectory + '/' + currentFile;
    
    //Read in file and parse results to usable JSON
    let xmlResult = await readXMLFile(currentFilePath);
    let parsedResult = await parseString(xmlResult, { tagNameProcessors: [stripNS], attrNameProcessors: [stripNS] });
    let record = JSON.parse(JSON.stringify(parsedResult.RDF.ebook[0]));
    
    // New object for building db record
    let mdbObject = {};

    // Id (metadata ID) 0 - 5 digits (Use metaId for label since mongoose uses 'id' for string and '_id' for ObjectID)
    let recId = record.$.about;
    recId = recId.slice(recId.indexOf('/') + 1).trim();
    mdbObject.metaId = Number(recId);

    // Check if there is a Title - Object not built without title
    if (!nestedProperty.get(record, 'title.0')) {
        // Push to skippedFolders Array just as a way to review what was passed on (Do this in app.js)
        // Do not continue processing... Go to next file in loop if exists otherwise next folder
        return null;
    }

    // Title - Already validated as existing at this point
    mdbObject.title = record.title[0];

    // Author - Can be multiple
    mdbObject.author = (nestedProperty.get(record, 'creator.0.agent.0.name.0'))
                        ? await buildArray(record.creator, 'agent.0.name.0', 'author')
                        : ["No Author(s) Provided"];

    // Publish - Always Gutenberg (But let's not hardcode things :))
    mdbObject.publisher = (nestedProperty.get(record, 'publisher'))
                        ? record.publisher[0]
                        : 'Project Gutenberg';
    
    // Publication date 
    mdbObject.publicationDate = (nestedProperty.get(record, 'issued.0._'))
                                ? record.issued[0]['_']
                                : 'NotAvailable';      
    
    // Language
    mdbObject.language = (nestedProperty.get(record, 'language.0.Description.0.value.0'))
                          ? record.language[0].Description[0].value[0]['_']
                          : 'NotAvailable';

    // Subject - Can be multiple
    mdbObject.subject = (nestedProperty.get(record, 'subject.0.Description.0.value.0'))
                        ? await buildArray(record.subject, 'Description.0.value.0', 'subject')
                        : ["No Subject(s) Provided"];

    // License Rights 
    mdbObject.licenseRights = (nestedProperty.get(record, 'rights.0'))
                              ? record.rights[0]
                              : 'NotAvailable';
    return mdbObject;
}

async function readDirectory(path) {
  return await readDir(path);
}

async function readXMLFile(currentFile) {
  return await readFile(currentFile);
}

async function buildArray(data, propertyString, typeOfArray) {
    let tempArray = [];
    
    for (let x = 0; x < data.length; x++) {

        if (nestedProperty.get(data[x], propertyString)) {
            
            switch (typeOfArray) {
                case 'author':
                    tempArray.push(data[x].agent[0].name[0]);
                    break;
                case 'subject':
                    tempArray.push(data[x].Description[0].value[0]);
                    break;
                default:
                    console.log("case not defined for this type of array");
            }

        } else {
            // Doesn't have an author record - Continue
            console.log("Missing property... Continue...");
        }
    }

    return tempArray;
}

async function saveRecordsToDatabase(recordsToSave) {
  return await MetaData.insertMany(recordsToSave);
}

// exporting mongoose strictly to stop during tests
module.exports = {generateObjectFromFile, readDirectory, saveRecordsToDatabase};