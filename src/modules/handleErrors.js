const path = require("path");
const fs = require("fs");
const shell = require("shelljs");
const { MKVMERGE_PATH, VIDEO_FILETYPES } = require("../config");

// Ensure `MKVMERGE_PATH` is valid
function checkModulePath() {
  if (!shell.which(MKVMERGE_PATH)) {
    console.error(
      `Error: mkvmerge not found! Please set MKVMERGE_PATH correctly.`
    );
    process.exit(1);
  }

  return;
}

// Ensure source directory exists
function checkSourceExistence(sourceDir) {
  if (!fs.existsSync(sourceDir)){
    console.error("Source directory is not found. Process terminated.");
    process.exit(1);
  }

  return;
}

// Check for video files in sourceDir
function checkVideoFileExistence(sourceDir) {
  const videoFiles = fs
    .readdirSync(sourceDir)
    .filter((file) =>
      VIDEO_FILETYPES.includes(path.extname(file).toLowerCase())
    );

  if (videoFiles.length === 0) {
    console.error(
      "No video files found in the source directory. Process terminated."
    );
    process.exit(1);
  }

  return;
}

// Ensure destination directory exists
function checkDestinationExistence(destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
}

module.exports = {
  checkModulePath,
  checkSourceExistence,
  checkVideoFileExistence,
  checkDestinationExistence,
};
