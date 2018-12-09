const appConfig = require('./config/appConfig');
const { generateObjectFromFile, saveRecordsToDatabase } = require('./metaUtils');
const mongoose = require('mongoose');
const MetaData = require("./models/metaDataSchema.js");

 beforeAll(async () => { 
    // Connect to database - create if not exists
    mongoose.connect(appConfig.db);
 });

test('Check folder 1070 - Test No Title', async () => {
  // expect.assertions(1);
  const data = await generateObjectFromFile(appConfig.testDirectory,'1070','pg1070.rdf');
  expect(data).toBeNull()
});

test('Check folder 1 - Test Multiple Subjects', async () => {
 expect.assertions(1);
 const testObjectExpectedResult = 
        {
          "author" : [ 
              "Jefferson, Thomas"
          ],
          "subject" : [ 
              "United States. Declaration of Independence", 
              "E201", 
              "JK", 
              "United States -- History -- Revolution, 1775-1783 -- Sources"
          ],
          "metaId" : 1,
          "title" : "The Declaration of Independence of the United States of America",
          "publisher" : "Project Gutenberg",
          "publicationDate" : "1971-12-01",
          "language" : "en",
          "licenseRights" : "Public domain in the USA."
        };

  const data = await generateObjectFromFile(appConfig.testDirectory,'1','pg1.rdf');
  expect(data).toEqual(testObjectExpectedResult);
});

test('Check folder 999999 - Language Not Available', async () => {
  expect.assertions(1);
  const testObjectExpectedResult = 
        {
          "author" : [ 
            "No Author(s) Provided"
          ],
          "subject" : [ 
            "No Subject(s) Provided"
          ],
          "metaId" : 999999,
          "title" : "Piccole anime",
          "publisher" : "Project Gutenberg",
          "publicationDate" : "2013-03-26",
          "language" : "NotAvailable",
          "licenseRights" : "Public domain in the USA."
        };
  const data = await generateObjectFromFile(appConfig.testDirectory,'999999','pg999999.rdf');
  expect(data).toEqual(testObjectExpectedResult);
});

test('Check folder 10008 - Test Multiple Author', async () => {
  expect.assertions(1);
  const testObjectExpectedResult = 
        {
          "author" : [ 
              "Adams, Samuel Hopkins", 
              "White, Stewart Edward"
          ],
          "subject" : [ 
              "Science fiction", 
              "PS"
          ],
          "metaId" : 10008,
          "title" : "The Mystery",
          "publisher" : "Project Gutenberg",
          "publicationDate" : "2003-11-01",
          "language" : "en",
          "licenseRights" : "Public domain in the USA."
        };
  const data = await generateObjectFromFile(appConfig.testDirectory,'10008','pg10008.rdf');
  expect(data).toEqual(testObjectExpectedResult);
});

test('Check folder 1000 - Normalish File - 1 Author & 1 Subject', async () => {
  expect.assertions(1);
  const testObjectExpectedResult = 
        {
          "author" : [ 
              "No Author(s) Provided"
          ],
          "subject" : [ 
              "No Subject(s) Provided"
          ],
          "metaId" : 1000,
          "title" : "La Divina Commedia di Dante: Complete",
          "publisher" : "Project Gutenberg",
          "publicationDate" : "1997-08-01",
          "language" : "en",
          "licenseRights" : "Public domain in the USA.",
        };
  const data = await generateObjectFromFile(appConfig.testDirectory,'1000','pg1000.rdf');
  expect(data).toEqual(testObjectExpectedResult);
});


test('Bulk Insert Into Mongo - ', async () => {
  expect.assertions(1);
  const testArray = [
                      {
                        "author" : [ 
                            "No Author(s) Provided"
                        ],
                        "subject" : [ 
                            "No Subject(s) Provided"
                        ],
                        "metaId" : 600001,
                        "title" : "zzTest La Divina Commedia di Dante: Complete",
                        "publisher" : "Project Gutenberg",
                        "publicationDate" : "1997-08-01",
                        "language" : "en",
                        "licenseRights" : "Public domain in the USA.",
                      },
                      {
                        "author" : [ 
                            "No Author(s) Provided"
                        ],
                        "subject" : [ 
                            "No Subject(s) Provided"
                        ],
                        "metaId" : 600002,
                        "title" : "zzTest La Divina Commedia di Dante: Complete",
                        "publisher" : "Project Gutenberg",
                        "publicationDate" : "1997-08-01",
                        "language" : "en",
                        "licenseRights" : "Public domain in the USA.",
                      }
                    ];
  const data = await saveRecordsToDatabase(testArray);
  expect(data).toBeTruthy();
});

// brought mongoose in just for testing to disconnect with Jest
afterAll(async (done) => {
  await MetaData.remove({metaId: 600001}).exec();
  await MetaData.remove({metaId: 600002}).exec();
  mongoose.disconnect(done)
});