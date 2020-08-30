// !Gulp
const { src, dest, series, parallel, watch } = require("gulp");

const browsersync = require("browser-sync").create();
const rename = require("gulp-rename");
const fileinclude = require("gulp-file-include");
const del = require("del");

// !Styles
const scss = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const groupcssmediaqueries = require("gulp-group-css-media-queries");
const cleancss = require("gulp-clean-css");

// !JS
const uglify = require("gulp-uglify-es").default;

// !Images
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const webphtml = require("gulp-webp-html");
const webpcss = require('gulp-webp-css');

const SOURCE_DIR = 'source';
const BUILD_DIR = 'build';
const RELEASE_DIR = 'release';
const INCLUDE_SUBDIR = 'include';
const STYLES_SUBDIR = 'styles';
const SCRIPTS_SUBDIR = 'scripts';
const IMAGES_SUBDIR = 'images';
const FONTS_SUBDIR = 'fonts';

const path = {
	source: {
		html: [`${SOURCE_DIR}**/*.html`, `!**${INCLUDE_SUBDIR}**`],
		styles: [`${SOURCE_DIR}/${STYLES_SUBDIR}/*.scss`, `!**${INCLUDE_SUBDIR}**`],
		scripts: [`${SOURCE_DIR}/${SCRIPTS_SUBDIR}/*.js`, `!**${INCLUDE_SUBDIR}**`],
		images: `${SOURCE_DIR}/${IMAGES_SUBDIR}/**/*.{jpg,png,gif,webp}`,
		fonts: `${SOURCE_DIR}/${FONTS_SUBDIR}/*.ttf`
	},
	release: {
		dir: `./${RELEASE_DIR}/`,
		html: `${RELEASE_DIR}/`,
		styles: `${RELEASE_DIR}/${STYLES_SUBDIR}/`,
		scripts: `${RELEASE_DIR}/${SCRIPTS_SUBDIR}/`,
		images: `${RELEASE_DIR}/${IMAGES_SUBDIR}/`,
		fonts: `${RELEASE_DIR}/${FONTS_SUBDIR}/`
	},
	build: {
		dir: `./${BUILD_DIR}/`,
		html: `${BUILD_DIR}/`,
		styles: `${BUILD_DIR}/${STYLES_SUBDIR}/`,
		scripts: `${BUILD_DIR}/${SCRIPTS_SUBDIR}/`,
		images: `${BUILD_DIR}/${IMAGES_SUBDIR}/`,
		fonts: `${BUILD_DIR}/${FONTS_SUBDIR}/`
	},
	watch: {
		html: SOURCE_DIR + "/**/*.html",
		styles: `${SOURCE_DIR}/${STYLES_SUBDIR}/*.scss`,
		scripts: `${SOURCE_DIR}/${SCRIPTS_SUBDIR}/*.js`,
		images: `${SOURCE_DIR}/${IMAGES_SUBDIR}/**/*.{jpg,png,gif,webp}`,
		fonts: `${SOURCE_DIR}/${FONTS_SUBDIR}/*.ttf`
	}
};



const browserSync = () => {
	browsersync.init({
		server: {
			baseDir: path.build.dir,
			https: false,
			notify: false
		},
		port: 5000,
		notify: false
	})
}

function html() {
	return src(path.source.html)
		.pipe(fileinclude())
		.pipe(webphtml())
		.pipe(dest(path.pub.html))
		.pipe(browsersync.stream());
	// .pipe(browsersync.reload());
}

const stylesTask = () => {
	return src(path.src.styles)
		.pipe(
			scss({
				outputStyle: "expanded"
			})
		)
		.pipe(groupcssmediaqueries())
		.pipe(autoprefixer({
			overrideBrowserslist: ["last 5 versions"],
			cascade: true
		})
		)
		.pipe(webpcss())
		.pipe(dest(path.pub.styles))
		.pipe(cleancss())
		.pipe(
			rename({
				suffix: '.min'
			})
		)
		.pipe(dest(path.pub.styles))
		.pipe(browsersync.stream());

}

function js() {
	return src(path.src.js)
		.pipe(fileinclude())
		.pipe(dest(path.pub.js))
		.pipe(uglify())
		.pipe(rename({
			extname: ".min.js"
		})
		)
		.pipe(dest(path.pub.js))
		.pipe(browsersync.stream());
}

function img() {
	return src(path.src.img)
		.pipe(webp({
			quality: 70
		})
		)
		.pipe(dest(path.pub.img))
		.pipe(src(path.src.img))
		.pipe(
			imagemin({
				progressive: true,
				// svgoPlugins: [{ removeViewBox: false }],
				interlaced: true,
				optimizationLevel: 3
			})
		)
		.pipe(dest(path.pub.img))
		.pipe(browsersync.stream());
}

// var svgSprite = require('gulp-svg-sprite');

// gulp.task('svgSprite', function () {
// 	return gulp.src('**/*.svg') // svg files for sprite
// 		.pipe(svgSprite({
// 			mode: {
// 				stack: {
// 					sprite: "../sprite.svg"  //sprite file name
// 				}
// 			},
// 		}
// 		))
// 		.pipe(dest('icons/*.svg'));
// });

function watchFiles() {
	watch(path.watch.html, html);
	// watch([path.watch.styles], stylesTask);
	watch([path.watch.js], js);
	watch([path.watch.img], img);
}

function clean() {
	return del(path.clean_pub);
}

let build = series(clean, parallel(img, js, stylesTask, html));
let watch1 = parallel(build, watchFiles, browserSync);

exports.html = html;
exports.styles = stylesTask;
exports.js = js;
exports.img = img;
exports.build = build;
exports.watch = watch1;
// exports.svgSprite = svgSprite;
exports.default = watch1;
