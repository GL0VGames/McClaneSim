import express from "express";
import path from "path";
const app = express();
const port = 4000;

app.use(express.static("dist/client"));
app.get("/", function (_req, res) {
	res.sendFile(path.resolve("./dist/client/index.html"));
});

app.listen(port, function () {
	console.log(`Server listening on port ${port}!`);
});