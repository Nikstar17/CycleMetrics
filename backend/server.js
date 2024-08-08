const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const xml2js = require("xml2js");

const app = express();
const port = 3000;

const upload = multer({ dest: "uploads/" });

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, "../frontend")));

// Serve index.html on the root route
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Helper function to format time
function formatTime(seconds) {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);
	return `${hours}h ${minutes}m ${secs}s`;
}

// Endpoint for file upload
app.post("/upload", upload.single("file"), (req, res) => {
	if (!req.file) {
		return res.status(400).send("No file uploaded.");
	}

	const filePath = req.file.path;

	fs.readFile(filePath, "utf8", (err, data) => {
		if (err) {
			return res.status(500).send("Error reading file.");
		}

		xml2js.parseString(data, (error, result) => {
			if (error) {
				return res.status(500).send("Error parsing XML file.");
			}

			const generalInfo = result.Activity.GeneralInformation[0];
			const totalDistance = parseFloat(generalInfo.distance[0]) / 1000;
			const totalTimeInSeconds = (parseFloat(generalInfo.exerciseTime[0]) - parseFloat(generalInfo.pauseTime[0])) / 100;
			const averageSpeed = parseFloat(generalInfo.averageSpeed[0]) * 3.6;
			const averageHeartRate = parseFloat(generalInfo.averageHeartrate[0]);
			const formattedTime = formatTime(totalTimeInSeconds);

			res.json({
				message: "File processed successfully.",
				data: {
					distance: totalDistance,
					time: formattedTime,
					speed: averageSpeed,
					heartRate: averageHeartRate,
				},
			});
		});
	});
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
