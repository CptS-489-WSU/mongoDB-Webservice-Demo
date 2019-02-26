/* ssDbRoutes.js -- Defines the RESTful API routes that can be used to issue requests, along
   with the types of requests that are possible using those routes. 
*/

'use strict';
module.exports = function(app) {
    var sgCourse = require('../controllers/ssDbController');

    //routes
    app.route('/courses')
    .post(sgCourse.addCourse); // API request 1: POST request to add a course

    app.route('/courses/:courseId')
      .get(sgCourse.getCourse) //API rqeuest 2: GET request to get a course
      .put(sgCourse.updateCourse); //API request 2: PUT request to update a course
};