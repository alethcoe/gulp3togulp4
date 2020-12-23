var gulp = require('gulp');
var ts = require('gulp-typescript');
//var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var preprocess = require('gulp-preprocess');
var templateCache = require('gulp-angular-templatecache');
var through2 = require('through2');


var gulpif = function(condition, action){
    var execute = false;
    if(typeof condition === 'boolean'){
        execute = condition;
    }
    return execute ? action: through2.obj();
}

var settings = {
    ts:{
        app: ['app/**/*.ts']
    },
    html:{
        app: {outputPath: 'dist/html', module: 'base', fileName: 'base.template.js', html : ['app/**/*.html']}
    },
    css:{
        app: ['app/**/*.scss']
    },
    dist:{
        js: 'dist/js/',
        css: 'dist/css',
    },
    typings: 'js/typings', //string with this verison
    sassConfig: {
        includePaths: ['app/sass']
    },
    env:'DEV',
    minify: false,
    root: 'src'
};

function createTemplateCache(options){
    var pathGlob = options.html;
    return gulp.src(pathGlob)
        .pipe(templateCache({
            root: options.basePath,
            module: options.module,
            filename: options.fileName,
            transformUrl: function(url){
                return url.toLowerCase();
            } 
        }))
        .pipe(gulp.dest(options.outputPath));
}

gulp.task('javascript', ['createJavascript']);
gulp.task('typings', ['createTypings']);
gulp.task('templates', ['createTemplates']);


gulp.task('ci_build', function(cb)
{
    setDev();
    cb();
});

gulp.task('prod_build', function(cb)
{
    setProd();
    cb();
});

function setDev(){
    settings.env = "DEV";
    settings.minify = false;
}

function setProd(){
    settings.env = "PRODUCTION";
    profileSettings.minify = true;
}


gulp.task('createJavascript', function()
{
    var tsResult = gulp.src(settings.ts.app)
    .pipe(preprocess({context: { APP_ENV: settings.env}}))
    .pipe(ts({
        noImplicitAny: false,
        outFile: 'bundle.js'
    }));
  return  tsResult.js.pipe(gulpif(settings.minify, uglify()))
    .pipe(gulp.dest(settings.dist.js));
});

gulp.task('createTypings', ['ci_build'], function()
{
    var tsResult = gulp.src(settings.ts.app)
    .pipe(ts({
        noImplicitAny: false,
        outFile: 'testTypings.js',
        declaration: true
    }));
   return tsResult.dts
  .pipe(gulp.dest(settings.typings));
});

gulp.task('createTemplates',['javascript', 'typings'], function(){
    return createTemplateCache(settings.html.app);
});

gulp.task('default', ['templates']);