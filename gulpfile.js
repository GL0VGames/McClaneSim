var gulp = require("gulp");
var ts = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var browserSync = require("browser-sync").create();

gulp.task("ts", function () {
	return gulp.src("client2/ts/*.ts")
		.pipe(sourcemaps.init())
		.pipe(ts("./tsconfig.json"))
		.pipe(sourcemaps.write(".", {sourceRoot: "client2/ts"}))
		.pipe(gulp.dest("client2/ts"))
		.pipe(browserSync.stream());
});

gulp.task("html", function() {
	return gulp.src("client2/*.html")
		.pipe(browserSync.stream());
})

gulp.task("watch", function(cb) {
	gulp.watch(["client2/ts/*.ts"], gulp.series("ts"));
	gulp.watch(["client2/*.html"], gulp.series("html"));
	cb();
});

gulp.task("start", function() {
	browserSync.init({
		server: "./client2/"
	});
});

gulp.task("build:dev", gulp.series("ts", "watch", "start"));