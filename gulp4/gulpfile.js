const {src, dest, series, parallel } = require('gulp');
var ts = require('gulp-typescript');
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
    typings: ['js/typings'], //can be an array at this version
    sassConfig: {
        includePaths: ['app/sass']
    },
    env:'DEV',
    minify: false,
    root: 'src'
};

function createTemplateCache(options){
    var pathGlob = options.html;
    return src(pathGlob)
        .pipe(templateCache({
            root: options.basePath,
            module: options.module,
            filename: options.fileName,
            transformUrl: function(url){
                return url.toLowerCase();
            } 
        }))
        .pipe(dest(options.outputPath));
}

var javascript = series(createJavascript);
var typings = series(createTypings);
var templates = series(createTemplates);


function ci_build(cb)
{
    setDev();
    cb();
}

function prod_build(cb){
    setProd();
    cb();
}

function setDev(){
    settings.env = "DEV";
    settings.minify = false;
}

function setProd(){
    settings.env = "PRODUCTION";
    profileSettings.minify = true;
}

function createJavascript(){
    var tsResult = src(settings.ts.app)
    .pipe(preprocess({context: { APP_ENV: settings.env}}))
    .pipe(ts({
        noImplicitAny: false,
        outFile: 'bundle.js'
    }));
  return  tsResult.js.pipe(gulpif(settings.minify, uglify()))
    .pipe(dest(settings.dist.js));
}

function createTypings(){
    var tsResult = src(settings.ts.app)
    .pipe(ts({
        noImplicitAny: false,
        outFile: 'testTypings.js',
        declaration: true
    }));
   return tsResult.dts
  // .pipe(replace(/js\/typings/g, '.'))   //would rename the hint path in the typings if necessary
  .pipe(dest(settings.typings));
}

function createTemplates(){
    return createTemplateCache(settings.html.app);
}

exports.default = series(ci_build, parallel(javascript, typings, templates));