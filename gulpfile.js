
const { src, dest, series, parallel, watch } = require('gulp');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const notify = require('gulp-notify');
const include = require('gulp-include');
const autoprefixer = require('gulp-autoprefixer');
const browsersync = require('browser-sync').create();

const prettier = require('gulp-prettier');

const rename = require("gulp-rename");
const fileinclude = require("gulp-file-include");
const del = require("del");

const scss = require("gulp-sass");
// const autoprefixer = require("gulp-autoprefixer");
const groupcssmediaqueries = require("gulp-group-css-media-queries");
const cleancss = require("gulp-clean-css");


const uglify = require("gulp-uglify-es").default;


const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const webphtml = require("gulp-webp-html");
const webpcss = require('gulp-webp-css');

const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fonter = require('gulp-fonter');

const fs = require('fs');

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
		dir: `./${SOURCE_DIR}/`,
		html: [`./${SOURCE_DIR}/**/*.html`, `!**/${INCLUDE_SUBDIR}/**`],
		styles: [`./${SOURCE_DIR}/${STYLES_SUBDIR}/*.scss`, `!**/${INCLUDE_SUBDIR}/**`],
		scripts: [`./${SOURCE_DIR}/${SCRIPTS_SUBDIR}/*.js`, `!**${INCLUDE_SUBDIR}**`],
		images: `./${SOURCE_DIR}/${IMAGES_SUBDIR}/**/*.{jpg,png,gif,webp,svg}`,
		fonts: `./${SOURCE_DIR}/${FONTS_SUBDIR}/*.ttf`
	},
	release: {
		dir: `./${RELEASE_DIR}/`,
		html: `./${RELEASE_DIR}/`,
		styles: `./${RELEASE_DIR}/${STYLES_SUBDIR}/`,
		scripts: `./${RELEASE_DIR}/${SCRIPTS_SUBDIR}/`,
		images: `./${RELEASE_DIR}/${IMAGES_SUBDIR}/`,
		fonts: `./${RELEASE_DIR}/${FONTS_SUBDIR}/`
	},
	build: {
		dir: `./${BUILD_DIR}/`,
		html: `./${BUILD_DIR}/`,
		styles: `./${BUILD_DIR}/${STYLES_SUBDIR}/`,
		scripts: `./${BUILD_DIR}/${SCRIPTS_SUBDIR}/`,
		images: `./${BUILD_DIR}/${IMAGES_SUBDIR}/`,
		fonts: `./${BUILD_DIR}/${FONTS_SUBDIR}/`
	},
	watch: {
		html: `./${SOURCE_DIR}/**/*.html`,
		styles: `./${SOURCE_DIR}/${STYLES_SUBDIR}/*.scss`,
		scripts: `./${SOURCE_DIR}/${SCRIPTS_SUBDIR}/*.js`,
		images: `./${SOURCE_DIR}/${IMAGES_SUBDIR}/**/*.{jpg,png,gif,webp}`,
		fonts: `./${SOURCE_DIR}/${FONTS_SUBDIR}/*.ttf`
	}
};

const cleanDirs = (cb) => {
	let promise = del([`${RELEASE_DIR}/**`, `${BUILD_DIR}/**`]);
	cb && cb();
	return promise;
}

const htmlBuild = () => {
	return src(path.source.html)
		.pipe(include())
		.pipe(prettier({ singleQuote: true }))
		.pipe(dest(path.build.html))
}

const htmlRelease = () => {
	return src(`${path.build.html}*.html`)
		.pipe(dest(path.release.html))
}

const watchHtml = () => {
	return watch(path.watch.html)
		.on('change',
			series(htmlBuild,
				parallel(htmlRelease,
					browserSyncReload)))
}

const stylesBuild = () => {
	return src(path.source.styles)
		.pipe(sass({
			outputStyle: 'expanded'
		}).on('error', sass.logError))
		// .pipe(include())
		// .pipe(autoprefixer({
		// 	overrideBrowserslist: ["last 5 versions"],
		// 	cascade: true
		// })
		// )
		.pipe(dest(path.build.styles))
}

const stylesRelease = () => {
	return src(`${path.build.styles}*.css`)
		.pipe(groupcssmediaqueries())
		.pipe(cleancss())
		.pipe(dest(path.release.styles))
}

const watchStyles = () => {
	return watch(path.source.styles)
		.on('change',
			series(stylesBuild,
				parallel(stylesRelease,
					browserSyncReload)));
}

const imagesBuild = () => {
	return src(path.source.images)
		.pipe(dest(path.build.images));
}

const fontsBuild = () => {
	return src(path.source.fonts)
		.pipe(ttf2woff())
		.pipe(dest(path.build.fonts))
		.pipe(src(path.source.fonts))
		.pipe(ttf2woff2())
		.pipe(dest(path.build.fonts))
		.pipe(src(path.source.fonts))
		.pipe(dest(path.build.fonts));
}

const otf2ttf = () => {
	return src(`./${SOURCE_DIR}/${FONTS_SUBDIR}/*.otf`)
		.pipe(fonter({
			formats: ['ttf']
		}))
		.pipe(dest(`./${SOURCE_DIR}/${FONTS_SUBDIR}/`));
}

const browserSyncInit = (cb) => {
	let instance = browsersync.init({
		server: {
			baseDir: path.build.dir
		},
		port: 5000,
		notify: false
	});
	cb && cb();
	return instance;
}

const browserSyncReload = (cb) => {
	browsersync.reload();
	cb && cb();
}

const browserSyncStream = (cb) => {
	browsersync.stream();
	cb && cb();
}

const LOG = (cb) => {
	console.log('LOG...');
	cb && cb();
}

exports.html = htmlBuild;
exports.default = series(cleanDirs, parallel(otf2ttf, htmlBuild, stylesBuild, imagesBuild, fontsBuild), parallel(htmlRelease, stylesRelease, browserSyncInit), parallel(watchHtml, watchStyles));

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

// let build = series(clean, parallel(img, js, stylesTask, html));
// let watch1 = parallel(build, watchFiles, browserSync);
