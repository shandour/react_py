// requirements
var gulp = require('gulp');
var gulpBrowser = require("gulp-browser");
var reactify = require('babelify');
var del = require('del');
var size = require('gulp-size');


// tasks

gulp.task('transform', function () {
  var stream = gulp.src('./project/static/jsx/*.js')
    .pipe(gulpBrowser.browserify({transform: ['babelify', {presets: ["es2015", "react"]}]}))
    .pipe(gulp.dest('./project/static/js/'))
    .pipe(size());
  return stream;
});

gulp.task('del', function () {
  return del(['./project/static/js']);
});

gulp.task('default', ['del'], function () {
  gulp.start('transform');
  gulp.watch('./project/static/jsx/*.js', ['transform']);
});


 
