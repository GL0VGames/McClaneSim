var gulp = require("gulp");
var ts = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var browserSync = require("browser-sync").create();

gulp.task("ts", function () {
	return gulp.src("client/ts/*.ts")
		.pipe(sourcemaps.init())
		.pipe(ts("./tsconfig.json"))
		.pipe(sourcemaps.write(".", {sourceRoot: "client/ts"}))
		.pipe(gulp.dest("client/ts"))
		.pipe(browserSync.stream());
});

gulp.task("html", function() {
	return gulp.src("client/*.html")
		.pipe(browserSync.stream());
})

gulp.task("watch", function(cb) {
	gulp.watch(["client/ts/*.ts"], gulp.series("ts"));
	gulp.watch(["client/*.html"], gulp.series("html"));
	cb();
});

gulp.task("start", function() {
	browserSync.init({
		server: "./client/"
	});
});

gulp.task("build:dev", gulp.series("ts", "watch", "start"));