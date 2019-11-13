const gulp = require('gulp');
const {series, parallel, src, dest} = require('gulp');
const sass = require('gulp-sass');
const browserSync = require('browser-sync').create();
const image = require('gulp-imagemin');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const csso = require('gulp-csso');
const htmlmin = require('gulp-htmlmin');
const clean = require('gulp-clean');
const size = require('gulp-size');
const htmlReplace = require('gulp-html-replace');
const sourcemaps = require('gulp-sourcemaps');
const newer = require('gulp-newer');
const Fiber = require('fibers');
const changed = require('gulp-changed');
const urlAdjuster = require('gulp-css-replace-url');

function style() {
  return src('./src/scss/*.scss')
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: 'expanded',
        fiber: Fiber,
        precision: 3,
        errLogToConsole: true
      }).on('error', sass.logError)
    )
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./src/css'))
    .pipe(browserSync.stream());
}

function watch() {
  browserSync.init({
    server: {
      baseDir: './src'
    }
  });
  gulp.watch('./src/scss/**/*.scss', style);
  gulp.watch('./src/**/*.html').on('change', browserSync.reload);
  gulp.watch('./src/js/**/*.js').on('change', browserSync.reload);
}

function minifyImage() {
  return src('./src/img/**/*')
    .pipe(newer('image/'))
    .pipe(image([
      image.gifsicle({interlaced: true}),
      image.jpegtran({progressive: true}),
      image.optipng({optimizationLevel: 5}),
      image.svgo({
        plugins: [
          { removeViewBox: true },
          { cleanupIDs: false }
        ]
      })
    ]))
    .pipe(size({
      showFiles: true
    }))
    .pipe(dest('./docs/img'))
    .pipe(dest('./src/img'));
}

function minifyJs() {
  return src('./src/js/**/*.js')
    .pipe(changed('./docs/js'))
    .pipe(
      babel({
        presets: ['@babel/env']
      })
    )
    .pipe(uglify())
    .pipe(
      rename({
        suffix: '.min'
      })
    )
    .pipe(dest('./docs/js'));
}

function minifyCss() {
  return src(['./src/scss/*.scss'])
    .pipe(changed('./docs/css'))
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: 'expanded',
        fiber: Fiber,
        imagePath: '/images/',
        precision: 3,
        errLogToConsole: true
      }).on('error', sass.logError)
    )
    .pipe(
      urlAdjuster({
        replace: ['../../', '../']
      })
    )
    .pipe(autoprefixer())
    .pipe(csso())
    .pipe(
      rename({
        suffix: '.min'
      })
    )
    .pipe(sourcemaps.write('.'))
    .pipe(
      size({
        showFiles: true
      })
    )
    .pipe(dest('./docs/css'));
}

function minifyHtml() {
  return src('./src/**/*.html')
    .pipe(changed('./docs'))
    .pipe(
      htmlReplace({
        css: 'css/main.min.css',
        js: 'js/index.min.js'
      })
    )
    .pipe(
      htmlmin({
        collapseWhitespace: true,
        removeComments: true
      })
    )
    .pipe(dest('./docs'));
}

function fontCopy() {
  return src('./src/font/*')
    .pipe(changed('./docs/font'))
    .pipe(dest('./docs/font'));
}

function libCopy() {
  return src('./src/lib/**/*')
    .pipe(changed('./docs/lib'))
	.pipe(dest('./docs/lib'));
}

function cleanDist() {
  return src('./docs', { read: false })
    .pipe(clean());

}

exports.style = style;
exports.watch = watch;
exports.minifyImage = minifyImage;
exports.minifyJs = minifyJs;
exports.minifyCss = minifyCss;
exports.minifyHtml = minifyHtml;
exports.cleanDist = cleanDist;
exports.default = series(cleanDist, parallel(
  minifyImage, parallel(
    minifyJs, parallel(
      minifyCss, parallel(
	    minifyHtml, parallel(
		  fontCopy, libCopy
	    )
	  )
	)
  )
));
