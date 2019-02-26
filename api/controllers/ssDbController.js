/* ssDbController.js -- This file implements functions to process incoming GET and POST requests
   For now, the functions do not interact with a database; they just send back fake data.
   Eventually, they will interact with a database. 
*/

'use strict'; //JavaScript "strict" mode

const {Course, Hole} = require('../models/ssDbModel.js');

/* addCourse -- Process API request to add a new course to the database.
   We do this by calling on the corresponding addCourse method in the model.
 */
exports.addCourse = function(req, res) {
     /* Add course to local DB */
     var newCourse = new Course(req.body);
     Course.addCourse(req.app.locals.courses,newCourse,function(err,result) {
       if (err) {
           res.send(err);
       } else {
           res.json(result);
       }
     });
             
};

/* getCourseData -- Process API request to get all data associated with a given course.
   We do this by callin on the corresponding getCourse method in the model. 
*/
exports.getCourse = function(req, res) {
   Course.getCourse(req.app.locals.courses, req.params.courseId, function(err, result) {
       if (err) {
         res.send(err);
       } else {
         res.json(result);
       }
   });
};

/* updateCourseHole -- Process API request to update hole data.
   We do this by calling on the corresponding updateCourseHole method in the model.
*/
exports.updateCourse = function(req, res) {
    Course.updateCourse(req.app.locals.courses, req.params.courseId, new Hole(req.body), function(err,result) {
      if (err) {
          res.send(err);
      } else {
          res.json(result);
      }
    });
};