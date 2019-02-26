'use strict';
module.exports = function(app) {
    var sgCourse = require('../controllers/ssDbController');

    //routes
    app.route('/courses')
    .post(sgCourse.addCourse);

    app.route('/courses/:courseId')
      .get(sgCourse.getCourse)
      .put(sgCourse.updateCourseHole);

   
    
};