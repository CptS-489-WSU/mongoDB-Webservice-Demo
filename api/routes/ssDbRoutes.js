/* ssDbRoutes.js -- Defines the RESTful API routes that can be used to issue requests, along
   with the types of requests that are possible using those routes. 
*/

'use strict';
module.exports = function(app) {
    var sgCourse = require('../controllers/ssDbController');

    //routes
    app.route('/courses')
    .post(sgCourse.addCourse) // API request: POST request to add a course
    .get(sgCourse.getAllCourses); //API request: GET all courses

    app.route('/courses/:courseId')
      .get(sgCourse.getCourse) //API request: GET request to get a course
      .put(sgCourse.updateCourse); //API request: PUT request to update a course
};