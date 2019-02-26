/* server.js -- The code that starts the server and processes incoming server requests. 
*/

const express = require('express'); //we are using express.js to process GET and POST requests
const app = express(); //instantiate an express app.
const MongoClient = require('mongodb').MongoClient;

const bodyParser = require('body-parser'); //bodyParser helps us to parse the bodies of incoming requests
const port = process.env.PORT || 3000; //create a port for listening for requests...

app.use(bodyParser.urlencoded({extended: true})); //init body parser
app.use(bodyParser.json());

var routes = require("./api/routes/ssDbRoutes"); //Define  routes 
routes(app); //Register routes with the app

MongoClient.connect("mongodb://localhost:27017/speedgolf",
                    {useNewUrlParser: true})
.then(client => {
    const db = client.db('speedgolf');
    const courses = db.collection('courses');
    app.locals.courses = courses; //store courses collection as a local app variable for use later.
    app.listen(port); //Listens for requests (asynchronous!)
    console.log('Speedgolf Database RESTful API server (MongoDB version) started on local port ' + port);
}).catch(error => console.error(error));
