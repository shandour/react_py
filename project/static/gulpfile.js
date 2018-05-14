// requirements
var gulp = require('gulp');
var gulpBrowser = require("gulp-browser");
var reactify = require('babelify');
var del = require('del');
var size = require('gulp-size');


// tasks

gulp.task('transform', function () {
  var stream = gulp.src('./jsx/index.js')
    .pipe(gulpBrowser.browserify({transform: ['babelify', {presets: ["es2015", "react"]}]}))
    .pipe(gulp.dest('./js/'))
    .pipe(size());
  return stream;
});

gulp.task('del', function () {
  return del(['./js']);
});

gulp.task('default', ['del'], function () {
  gulp.start('transform');
  gulp.watch('./jsx/*.js', ['transform']);
});


 
