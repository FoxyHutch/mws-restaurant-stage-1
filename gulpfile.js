var gulp = require('gulp');

//Imagemin
var imagemin = require('gulp-imagemin');

//PNG-Qunatization
var pngquant = require('imagemin-pngquant');

//Image Resize
var imageresize = require('gulp-image-resize');

//Rename
var rename = require('gulp-rename');

//Webp
var webp = require('gulp-webp');

//SASS
var sass = require('gulp-sass')

//Autoprefixer
var autoprefixer = require('gulp-autoprefixer');

//JS-Concat
var concat = require('gulp-concat');

//For Uglify
var uglifyjs = require('uglify-es');
var composer = require('gulp-uglify/composer');
var uglify = composer(uglifyjs, console);

//Babel
var babel = require('gulp-babel');

//SourceMaps
var sourcemaps = require('gulp-sourcemaps');

//Browsersync
var browserSync = require('browser-sync').create();

//Compression for GZIP
var compress = require('compression');

gulp.task('default', [
    'copy-html', 
    'copy-images-dist', 
    'copy-styles', 
    'copy-scripts', 
    'copy-manifest',
    'copy-sw-dist'], 
    function() {
    gulp.watch('sass/**/*.scss', ['copy-styles']);
    gulp.watch('./dist/css/*.css').on('change', browserSync.reload);
    gulp.watch('./*.html', ['copy-html']);
    gulp.watch('./dist/index.html').on('change', browserSync.reload);
    gulp.watch('./js/**/*.js', ['copy-scripts']);
    gulp.watch('./dist/js/*.js').on('change', browserSync.reload);
    gulp.watch('./sw.js').on('change', browserSync.reload);

    
    browserSync.init({
        server: {
            baseDir: './dist/',
            middleware: [compress()]},
        browser: "google chrome",
    })
    
});


gulp.task('copy-html', function(){
    gulp.src('./*.html')
        .pipe(gulp.dest('./dist/'));
})

// -- DIST --
gulp.task('dist', [
    'copy-images-dist',
    'copy-scripts-dist',
    'copy-sw-dist',
    'copy-html',
    'copy-styles',
    'copy-manifest'
])

gulp.task('copy-sw-dist', function() {
    gulp.src('./sw.js')
        .pipe(gulp.dest('./dist/'));
})


gulp.task('copy-scripts-dist', function() {
    gulp.src('./js/**/*.js')
        .pipe(babel())
        .pipe(uglify())
        .pipe(gulp.dest('./dist/js/'));
})

gulp.task('copy-scripts', function(){
    gulp.src('./js/*')
        .pipe(gulp.dest('./dist/js/'));
    gulp.src('./sw.js')
        .pipe(gulp.dest('./dist/'));
})

gulp.task('copy-styles', function() {
    gulp.src('./sass/styles.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(gulp.dest('./dist/css'))
});

gulp.task('copy-manifest', function() {
    gulp.src('./manifest.webmanifest')
        .pipe(gulp.dest('./dist/'))
})

gulp.task('copy-images-dist', [
    'copy-images-large',
    'copy-images-medium',
    'copy-images-small',
    'copy-images-icon',
    'copy-images-svg',
    'transform-webp']
);

gulp.task('transform-webp', function() {
    gulp.src('./dist/img/*.jpg')
        .pipe(webp())
        .pipe(gulp.dest('./dist/img/'))
})

gulp.task('copy-images-large', function() {
    gulp.src('./img/image/*')
        //Large
        .pipe(imageresize({
            width: 1920,
            upscale: false,
            crop: false,
            imageMagick: true
        }))
        .pipe(imagemin({
            progressive: true,
            use: [pngquant()]
        }))
        .pipe(rename({
            suffix: '_large'
        }))
        .pipe(gulp.dest('./dist/img'))
    }
);

gulp.task('copy-images-medium', function() {
    gulp.src('./img/image/*')
    //Medium
    .pipe(imageresize({
        width: 960,
        upscale: false,
        crop: false,
        imageMagick: true
    }))
    .pipe(imagemin({
        progressive: true,
        use: [pngquant()]
    }))
    .pipe(rename({
        suffix: '_medium'
    }))
    .pipe(gulp.dest('./dist/img'))
});

gulp.task('copy-images-small', function() {
    gulp.src('./img/image/*')
    //Small
    .pipe(imageresize({
        width: 480,
        upscale: false,
        crop: false,
        imageMagick: true
    }))
    .pipe(imagemin({
        progressive: true,
        use: [pngquant()]
    }))
    .pipe(rename({
        suffix: '_small'
    }))
    .pipe(gulp.dest('./dist/img'))
})

//Copy Icons
gulp.task('copy-images-icon', function() {
    gulp.src('./img/icon/*')
        .pipe(gulp.dest('./dist/img'))
})

//Copy svg
gulp.task('copy-images-svg', function() {
    gulp.src('./img/svg/*')
        .pipe(gulp.dest('./dist/img'))
})

