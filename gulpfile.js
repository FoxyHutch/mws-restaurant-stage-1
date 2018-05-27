var gulp = require('gulp');

//Imagemin
var imagemin = require('gulp-imagemin');

//PNG-Qunatization
var pngquant = require('imagemin-pngquant');

//Image Resize
var imageresize = require('gulp-image-resize');

//Rename
var rename = require('gulp-rename');


gulp.task('default', ['copy-html', 'copy-images' //, 'styles', 'scripts'
], function() {
    //gulp.watch('sass/**/*.scss', ['styles']);
    gulp.watch('/index.html', ['copy-html']);
    //gulp.watch('./dist/index.html').on('change', browserSync.reload);
    //gulp.watch('./js/**/*.js', ['scripts']);

    /*
    browserSync.init({
        server: './dist/',
        browser: "google chrome"
    })
    */
});


gulp.task('copy-html', function(){
    gulp.src('./*.html')
        .pipe(gulp.dest('./dist/'));
})

//Copy Images split in different functions for different cases
gulp.task('copy-images', function() {
    gulp.src('./img/*')
        .pipe(gulp.dest('./dist/img'))
})

// -- DIST --
gulp.task('dist', [
    'copy-images-dist',
    'copy-scripts',
    'copy-html',
    'copy-styles'
])

gulp.task('copy-scripts', function(){
    gulp.src('./js/*')
        .pipe(gulp.dest('./dist/js/'));
    gulp.src('./sw.js')
        .pipe(gulp.dest('./dist/'));
})

gulp.task('copy-styles', function(){
    gulp.src('./css/*')
        .pipe(gulp.dest('./dist/css/'));
})


gulp.task('copy-images-dist', [
    'copy-images-large',
    'copy-images-medium',
    'copy-images-small',
    'copy-images-icon',
    'copy-images-svg']
);

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

