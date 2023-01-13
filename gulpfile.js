import gulpPkg from 'gulp';
const { task, src: _src, dest, watch, series, parallel } = gulpPkg;
import uglify from "gulp-uglify";
import ts from "gulp-typescript";
import sourceMapsPkg from "gulp-sourcemaps";
const { init, write } = sourceMapsPkg;
import minHTML from "gulp-minify-html";
import minCSS from "gulp-minify-css";
import {create} from "browser-sync";
var browserSync = create();
var src = "client/";
var prod = false;
var out = "dist/client/";

task("ts", function () {
	if (prod)
		return _src(src+"ts/*.ts")
			.pipe(ts("./tsconfig.json"))
			.pipe(uglify())
			.pipe(dest(out+"ts/"));
	else
		return _src("client/ts/*.ts")
			.pipe(init())
			.pipe(ts("./tsconfig.json"))
			.pipe(write(".", {sourceRoot: "client/ts"}))
			.pipe(dest("client/ts"))
			.pipe(browserSync.stream());
});

task("html", function() {
	if (prod)
		return _src(src+"index.html")
			.pipe(minHTML())
			.pipe(dest(out));
	else
		return _src("client/*.html")
			.pipe(browserSync.stream());
});

task("css", function (done) {
	// Select the CSS, minify, and move to dist
	if (prod)
		return _src(src+"css/*.css")
			.pipe(minCSS())
			.pipe(dest(out+"css/"));
	else done();
});

task("watch", function(cb) {
	watch(["client/ts/*.ts"], series("ts"));
	watch(["client/*.html"], series("html"));
	cb();
});

task("start", function() {
	browserSync.init({
		server: "./client/"
	});
});

task("server", function() {
	prod = true;
	return _src("server.ts")
			.pipe(ts("./tsconfig.json"))
			.pipe(uglify())
			.pipe(dest(out.split("/")[0]+"/"));
});

task("build:dev", series("ts", "watch", "start"));
task("build:prod", series("server", parallel("html", "css", "ts")));