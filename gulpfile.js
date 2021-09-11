// Пути к файлам и папка проекта
const project_folder = "build";
const source_folder = "source";
const path = {
  project_folder: {
    html: project_folder + "/",
    css: project_folder + "/css",
    js: project_folder + "/js",
    img: project_folder + "/img",
    fonts: project_folder + "/fonts",
  },
  source_folder: {
    html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
    css: source_folder + "/scss/style.scss",
    js: source_folder + "/js/**/*.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,jpeg,webp}",
    svg: source_folder + "/img/**/*.svg",
    fonts: source_folder + "/fonts/*.ttf",
  },

  watch: {
    html: source_folder + "/**/*.html",
    css: source_folder + "/scss/**/*.scss",
    js: source_folder + "/js/**/*.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,jpeg,webp}",
  },

  clean: "./" + project_folder + "/",
};

const gulp = require("gulp");
const sync = require("browser-sync").create();
const plumber = require("gulp-plumber");
const del = require("del");
const rename = require("gulp-rename");
const htmlmin = require("gulp-htmlmin");
const scss = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const sourcemap = require("gulp-sourcemaps");
const autoprefixer = require("autoprefixer");
const csso = require("postcss-csso");
const webp = require("gulp-webp");
const fileInclude = require("gulp-file-include");
const imagemin = require("gulp-imagemin");
const svgsprite = require("gulp-svgstore");
const uglify = require("gulp-uglify-es").default;
const ttf2woff = require("gulp-ttf2woff");
const ttf2woff2 = require("gulp-ttf2woff2");
const fonter = require("gulp-fonter");

// HTML

const html = () => {
  return gulp
    .src(path.source_folder.html)
    .pipe(fileInclude())
    .pipe(rename("index_src.html"))
    .pipe(gulp.dest(path.project_folder.html))
    .pipe(gulp.src(path.source_folder.html))
    .pipe(fileInclude())
    .pipe(rename("index.html"))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(path.project_folder.html));
};

// Styles

const styles = () => {
  return gulp
    .src(path.source_folder.css)
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(scss().on("error", scss.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(gulp.dest(path.project_folder.css))
    .pipe(rename("style.min.css"))
    .pipe(postcss([csso()]))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest(path.project_folder.css))
    .pipe(sync.stream());
};

exports.styles = styles;

// JS

const scripts = () => {
  return gulp
    .src(path.source_folder.js)
    .pipe(
      rename({
        extname: ".min.js",
      })
    )
    .pipe(uglify())
    .pipe(gulp.dest(path.project_folder.js))
    .pipe(gulp.src(path.source_folder.js))
    .pipe(gulp.dest(path.project_folder.js));
};

exports.scripts = scripts;

// Images

const images = () => {
  return gulp
    .src(path.source_folder.img)
    .pipe(
      webp({
        quality: 70,
      })
    )
    .pipe(gulp.dest(path.project_folder.img))
    .pipe(gulp.src(path.source_folder.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 3,
      })
    )
    .pipe(gulp.dest(path.project_folder.img))
    .pipe(sync.stream());
};

exports.images = images;

// Sprite

const sprite = () => {
  return gulp
    .src(path.source_folder.svg)
    .pipe(svgsprite())
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest(path.project_folder.img));
};

exports.sprite = sprite;

// Fonts

const otf2ttf = () =>{
  return gulp.src('source/fonts/*.otf')
    .pipe(fonter({
      formats: ['ttf']
    }))
    .pipe(gulp.dest('source/fonts/'));
}

exports.otf2ttf = otf2ttf;

const fonts = () => {
  return gulp.src(path.source_folder.fonts)
    .pipe(ttf2woff())
    .pipe(gulp.dest(path.project_folder.fonts))
    .pipe(gulp.src(path.source_folder.fonts))
    .pipe(ttf2woff2())
    .pipe(gulp.dest(path.project_folder.fonts));
};

exports.fonts = fonts;

// Clean

const clean = () => {
  return del(path.clean);
};

// Server

const server = (done) => {
  sync.init({
    server: {
      baseDir: project_folder,
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
};

exports.server = server;

// Reload

const reload = (done) => {
  sync.reload();
  done();
};

// Watcher

const watcher = () => {
  gulp.watch(path.watch.html, gulp.series(html, reload));
  gulp.watch(path.watch.css, gulp.series(styles, reload));
  gulp.watch(path.watch.js, gulp.series(scripts, reload));
};

// Build

const build = gulp.series(
  clean,
  gulp.parallel(html, styles, scripts, images, sprite, otf2ttf, fonts)
);

exports.build = build;

// Default

exports.default = gulp.series(
  gulp.parallel(html, styles, scripts),
  gulp.series(server, watcher)
);
