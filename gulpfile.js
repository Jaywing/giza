const gulp = require("gulp");
const gulpif = require("gulp-if");
const path = require("path");
const clean = require("del").sync;
const nunjucksRender = require("gulp-nunjucks-render");
const sass = require("gulp-sass");
const plumber = require("gulp-plumber");
const sourcemaps = require("gulp-sourcemaps");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const svgstore = require("gulp-svgstore");
const webpackStream = require("webpack-stream");
const webpack = require("webpack");
const browser = require("browser-sync");
const port = process.env.SERVER_PORT || 3000;

const CONFIG = require("./config");

function projectPath(...paths) {
  return path.resolve(process.env.INIT_CWD, ...paths);
}

let production = false;

const html_paths = {
  src: [
    projectPath(CONFIG.BASE, CONFIG.html.src, "**/*.html"),
    "!" +
      projectPath(
        CONFIG.BASE,
        CONFIG.html.src,
        "**/{components,layouts,shared,macros,data}/**"
      )
  ],
  src_render: [projectPath(CONFIG.BASE, CONFIG.html.src)],
  dest: projectPath(CONFIG.dest),
  dist: projectPath(CONFIG.dist)
};

const stylesheets_paths = {
  src: projectPath(CONFIG.BASE, CONFIG.stylesheets.src, "**/*.scss"),
  dest: projectPath(CONFIG.dest, CONFIG.stylesheets.dest),
  dist: projectPath(CONFIG.dist, CONFIG.stylesheets.dest)
};

const javascripts_paths = {
  src: projectPath(CONFIG.BASE, CONFIG.javascripts.src, "**/*.js"),
  dest: projectPath(CONFIG.dest, CONFIG.javascripts.dest),
  dist: projectPath(CONFIG.dist, CONFIG.javascripts.dest)
};

const images_paths = {
  src: projectPath(CONFIG.BASE, CONFIG.images.src, "**/*{jpg,png,svg}"),
  dest: projectPath(CONFIG.dest, CONFIG.images.dest),
  dist: projectPath(CONFIG.dist, CONFIG.images.dest)
};

const fonts_paths = {
  src: projectPath(CONFIG.BASE, CONFIG.fonts.src, "/**/*"),
  dest: projectPath(CONFIG.dest, CONFIG.fonts.dest),
  dist: projectPath(CONFIG.dist, CONFIG.fonts.dest)
};

const icons_paths = {
  src: projectPath(CONFIG.BASE, CONFIG.icons.src, "*.svg"),
  dest: projectPath(CONFIG.dest, CONFIG.icons.dest),
  dist: projectPath(CONFIG.dist, CONFIG.icons.dest)
};

var webpackConfig = {
  mode: "development",
  context: path.resolve("javascripts/"),
  entry: {
    app: ["babel-polyfill", "giza.js"]
  },
  output: {
    path: path.resolve("_build/site/javascripts/"),
    filename: "giza.js",
    publicPath: "/javascripts/"
  },
  resolve: {
    modules: [path.resolve("javascripts/"), path.resolve("node_modules")]
  },
  module: {
    rules: [
      {
        loader: "babel-loader",
        test: /\.js$/,
        exclude: path.resolve("node_modules")
        // query: {
        //   presets: [["es2015", { modules: false }], "stage-1"]
        // }
      }
    ]
  }
};

gulp.task("clean_build", function() {
  clean([CONFIG.dest]);
});

gulp.task("clean_dist", function() {
  clean([CONFIG.dist]);
});

gulp.task("html", function() {
  return gulp
    .src(html_paths.src)
    .pipe(nunjucksRender({ path: html_paths.src_render }))
    .pipe(gulpif(!production, gulp.dest(html_paths.dest)))
    .pipe(gulpif(production, gulp.dest(html_paths.dist)));
});

gulp.task("stylesheets", function() {
  return gulp
    .src(stylesheets_paths.src)
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(
      sass({
        includePaths: ["node_modules", "scss"]
      }).on("error", sass.logError)
    )
    .pipe(
      postcss([
        autoprefixer({
          grid: true,
          browsers: ["last 2 versions", "ie >= 9", "Android >= 2.3", "ios >= 7"]
        })
      ])
    )
    .pipe(sourcemaps.write("."))
    .pipe(gulpif(!production, gulp.dest(stylesheets_paths.dest)))
    .pipe(gulpif(production, gulp.dest(stylesheets_paths.dist)));
});

gulp.task("javascripts", function() {
  return gulp
    .src(javascripts_paths.src)
    .pipe(webpackStream(webpackConfig, webpack))
    .pipe(gulpif(!production, gulp.dest(javascripts_paths.dest)))
    .pipe(gulpif(production, gulp.dest(javascripts_paths.dist)));
});

gulp.task("images", function() {
  return gulp
    .src(images_paths.src)
    .pipe(gulpif(!production, gulp.dest(images_paths.dest)))
    .pipe(gulpif(production, gulp.dest(images_paths.dist)));
});

gulp.task("fonts", function() {
  return gulp
    .src(fonts_paths.src)
    .pipe(gulpif(!production, gulp.dest(fonts_paths.dest)))
    .pipe(gulpif(production, gulp.dest(fonts_paths.dist)));
});

gulp.task("icons", function() {
  return gulp
    .src(icons_paths.src)
    .pipe(svgstore())
    .pipe(gulpif(!production, gulp.dest(icons_paths.dest)))
    .pipe(gulpif(production, gulp.dest(icons_paths.dist)));
});

gulp.task("watch", function() {
  gulp.watch(html_paths.src, ["html", browser.reload]);
  gulp.watch(stylesheets_paths.src, ["stylesheets", browser.reload]);
  gulp.watch(javascripts_paths.src, ["javascripts", browser.reload]);
  gulp.watch(images_paths.src, ["images", browser.reload]);
  gulp.watch(fonts_paths.src, ["fonts", browser.reload]);
});

gulp.task("serve", ["build"], function() {
  browser.init({ server: "./_build", port: port, open: false });
});

gulp.task("build", [
  "clean_build",
  "html",
  "stylesheets",
  "javascripts",
  "images",
  "fonts",
  "icons"
]);

gulp.task("build_dist", function() {
  production = true;

  gulp.start([
    "clean_dist",
    "html",
    "stylesheets",
    "javascripts",
    "images",
    "fonts",
    "icons"
  ]);
});

gulp.task("default", ["serve", "watch"]);

gulp.task("dist", ["build_dist"]);
