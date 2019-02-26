/* ssDbModel.js
   This file defines the model for interacting with the speedgolfdb mySQL database.
   Per Node.js's model-view-routes paradigm for RESTful APIs, it defines JavaScript
   classes for addding/updating each mySQL table. It creates class methods for each type
   RESTful API request supporrted. In this case we support three API requests:
     --Add a new course to the speedgolfdb.coursesdb table (GET)
     --Get all data associated with an existing course in the speedgolfdb.coursesdb table (GET)
     --add or update data on a specific hole in an existing course in the speedgolfdb.coursesdb table (POST)
*/
'user strict';
var ObjectId = require('mongodb').ObjectId;

//Course object helps us add and update courses table in speedgolf db
var Course = function(course) {
    this.name = course.name;
    this.city = course.city;
    this.state = course.state;
    this.country = course.country;
    this.numHoles = course.numHoles;
};

//Hole object helps us add and update holes table in the speedgolf db
var Hole = function(hole) {
    this.courseId = hole.courseId;
    this.holeNum = hole.holeNum;
    this.strPar = hole.strPar;
    this.timePar = hole.timePar;
    this.golfDist = hole.golfDist;
    this.runDist = hole.runDist;
}

/*addCourse -- Try to a newCourse to the speedgolf.courses collection.
  - courses is the courses collection; it allows us to interact with the database
  - newCourse is an object containing the new course details
  - result is the return value to supply.
   
  First, we check course data to ensure it is valid. If it is not valid,
  we return a JSON object like this:
  {name: <coursename>, id: "", courseAdded: false, errorMsg: "Invalid data: ..."} 
  
  Next, we make sure that the course does not already exist. We do this by
  querying the table with the course name, city, state and country to see if there's
  a match. If there is a match, we return a JSON object like this:
  {name: <coursename>, id: "", courseAdded: false errorMsg: "Course already exists"}
  
  Finally, we add the course, returning a JSON object of the following form:
  {name: <coursename>, id: <course id in table>, courseAdded: true}
*/
Course.addCourse = function (courses, newCourse, result) {
    var testCourse, query, resultObj;
    resultObj = {name: newCourse.name, id: "", courseAdded: false};
    //1. Ensure course data is valid
    if (!(typeof newCourse.name == 'string') || newCourse.name.length < 5 ||
        !(typeof newCourse.city == 'string') || newCourse.city.length < 2 ||
        !(typeof newCourse.state == 'string') || newCourse.city.length < 2 ||
        !(typeof newCourse.country == 'string') || newCourse.country.length != 2 ||
       isNaN(newCourse.numHoles) || Number(newCourse.numHoles) < 3 ||
       Number(newCourse.numHoles > 100)) {
         //Invalid data
         resultObj.errMsg = "Error: Course could not be added because course data is invalid. Please check API definition and try again.";
         result(resultObj, null); 
    } else { //valid data 
        //2. Ensure course isn't already in db
        testCourse = {name: newCourse.name, city: newCourse.city, state: newCourse.state, country: newCourse.country};
        courses.find(testCourse).toArray(function(err, res) {
            if (err) {
                result.errMsg = "An error occurred when testing whether course exists in database."
                console.log(result.errMsg);
                result.errObj = err;
                result(resultObj.null);
            } else if (res.length > 0) { //Error: Course already in db
                resultObj.errMsg = "Could not add course to database. Course already exists in database.";
                result(resultObj, null);
            } else {
                //3. Course isn't in DB -- Add it.
                newCourse.totalStrPar = 0;
                newCourse.totalTimepar = new Date(0,0,1,0,0,0,0);
                newCourse.totalGolfDist = 0;
                newCourse.totalRunDist = 0;
                newCourse.holes = []; //no holes added yet; create empty inner collection

                courses.insertOne(newCourse, function(err2) {
                    if(err2) { //Error when addint
                        console.log("Error when adding course to database: ", err2);
                        resultObj.errMsg = err2;
                        result(resultObj, null);
                    } else { //Success!
                        resultObj.id = newCourse._id; 
                        resultObj.courseAdded = true;
                        result(resultObj,null);
                    }
                });
            }
        });   
    } 
};


/* getCourse -- Obtain all data associated with a course whose id is supplied.
   We return an error if the course could not be found in db. 
*/
Course.getCourse = function(courses, courseId, result) {
    var resultObj = {success: false, statusMsg: "", statusObj: null};
    courses.find({_id: new ObjectId(courseId)}).toArray(function(err, res) {
        if(err) {
            resultObj.statusMsg = "An error occurred when attempting to access course in database.";
            console.log(resultObj.statusMsg + ": " + JSON.stringify(err));
            resultObj.statusObj = err;
            result(resultObj, null);
        } else if (res.length == 1) { //course found
           resultObj.success = true;
           resultObj.statusMsg = "Course data successfully retrieved.";
           resultObj.data = res[0];
           result(resultObj,null);
        } else { //course not found
            resultObj.statusMsg = "Course could not be found in database";
            result(resultObj,null);
        }
    });
};

Course.updateCourse = function(courses, courseId, holeData, result) {
    var hd, hdOk, numHoles, resultObj;
    resultObj = {success: false, statusMsg: "", statusObj: null};
    //First, ensure that courseId exists in DB. If not, can't add holes!
    courses.find({_id: new ObjectId(courseId)}).toArray(function(err, res) {
        if (err) { //Unexpected error in query
            resultObj.statusMsg = "Error when checking if course with id " + courseId + " exists in database.";
            resultObj.statusObj = err;
            console.log(resultObj.statusMsg + ": " + JSON.stringify(err));
            result(resultObj,null);
        } else if (res.length == 0) { //no course with id courseId
            resultObj.statusMsg = "Cannot update hole of course with id " + courseId + ". No such course exists.";
            console.log(resultObj.statusMsg);
            result(resultObj,null);
        } else {
            numHoles = res[0].numHoles;
            hd = {holeNum: holeData.holeNum, strPar: holeData.strPar, timePar: holeData.timePar, 
                  golfDist: holeData.golfDist, runDist: holeData.runDist};
            hdOk = checkHoleData(hd,numHoles);
            if (hdOk == null) { //data cannot be inserted because it's not in proper format
                resultObj.statusMsg = "Cannot update hole data for course with id " + courseId + 
                ". At least one data item not in proper format or out of bounds. Please check API definition and try again."
                console.log(resultObj.statusMsg);
                result(resultObj,null);
            } else {
                //If here, we can proceed with data add or update...
                courses.find({_id: new ObjectId(courseId), holes: {$elemMatch: {holeNum: hdOk.holeNum}}})
                  .toArray(function(err2,res2) {
                  if (err2) {
                      resultObj.statusMsg = "Error when locating hole to update in course";
                      console.log(resultObj.statusMsg + ": " + err2);
                      resultObj.statusObj = err2;
                      result(resultObj,null);
                  } else if (res2.length == 0) { //Didn't find course/hole combo; need to insert
                    courses.updateOne({_id: new ObjectId(courseId)},
                                      {$push: {holes: hdOk}},
                    function(err3,res3) {
                        if (err3) {
                            resultObj.statusMsg = "Error when attempting to add new hole to course";
                            console.log(resultObj.statusMsg + ": " + err3);
                            resultObj.statusObj = err3;
                            result(resultObj,null);
                        } else {
                          resultObj.statusMsg = "Hole successfully added to course.";
                          resultObj.success = true;
                          result(resultObj,null);
                        }
                    });
                } else { //Found course/hole combo; need to update
                    courses.updateOne({_id: new ObjectId(courseId), holes: {$elemMatch: {holeNum: hdOk.holeNum}}},
                         {$set: {
                            'holes.$.strPar' :  hdOk.strPar,
                            'holes.$.timePar': hdOk.timePar,
                            'holes.$.golfDist': hdOk.golfDist,
                            'holes.$.runDist': hdOk.runDist
                            }
                        },
                        function(err4,res4) {
                            if (err4) {
                                resultObj.statusMsg = "Error when attempting to update existing hole on course";
                                console.log(resultObj.statusMsg + ": " + err4);
                                resultObj.statusObj = err4;
                                result(resultObj,null);
                            } else {
                                resultObj.statusMsg = "Hole successfully updated in course.";
                                resultObj.success = true;
                                result(resultObj,null);
                            }
                        });
                }
            });
        }
    }
  });
};
 
 /* stringToDate: Given a timestamp string in hh:mm:ss format, converts the string to an equivalent date.
    Note: If stringDur comes in as a Date for some reason, we force its date and year to today, and reset hours
    minutes, and seconds to ensure that date comparisons can be made on equal footing.
*/
function stringToDate(stringDur) {
    var theDate = new Date(0,0,1,0,0,0,0);
    if (stringDur instanceof Date) {
      theDate.setHours(stringDur.getHours());
      theDate.setMinutes(stringDur.getMinutes());
      theDate.setSeconds(stringDur.getSeconds());
    } else { //string
      var durParts = stringDur.split(":");
      theDate.setHours(durParts[0]);
      theDate.setMinutes(durParts[1]);
      if (durParts.length >= 3)
        theDate.setSeconds(durParts[2]);
      else
        theDate.setSeconds(0);
    }
    return theDate;
  }

 /* checkHoleData: Given an object with holeNum, strPar, timePar, golfDist, and runDist
    properties, ensures that all data values are of proper type and in proper format, returning
    null if the values cannot be converted or an object with values converted to proper types and formats
 */
 function checkHoleData(data, numHoles) {
   if (isNaN(data.holeNum) || Number(data.holeNum) < 1 || Number(data.holeNum) > numHoles ||
       isNaN(data.strPar) || Number(data.strPar) < 2 || Number(data.strPar) > 6 || 
       !(typeof data.timePar == 'string') || 
       !(/(([0-9]?[0-9]:)?[0-5]?[0-9]:[0-5][0-9]){1}/.test(data.timePar)) || 
       isNaN(data.golfDist) || Number(data.golfDist) < 1 ||
       isNaN(data.runDist) || Number(data.runDist) < 1) { 
           return null; //invalid data exists!
       }
       if (data.timePar.split(":").length == 2) { //Splits into two parts; need to add leading 0...
          data.timePar = "0:" + data.timePar;
       }
       console.log("checkHoleData is returning: " + JSON.stringify(data));
       data.timePar = stringToDate(data.timePar);
       return data;
  }

module.exports = {Course, Hole};