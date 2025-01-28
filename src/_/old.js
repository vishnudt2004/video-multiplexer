const shell = require("shelljs");
const path = require("path");
const fs = require("fs");
const { default: inquirer } = require("inquirer");

// System environment variable name or file path (path/to/mkvmerge.exe).
const MKVMERGE_PATH = "mkvmerge"; // Adjust path if necessary

// Ensure `MKVMERGE_PATH` is valid
if (!shell.which(MKVMERGE_PATH)) {
  console.error(
    `Error: mkvmerge not found! Please set MKVMERGE_PATH correctly.`
  );
  process.exit(1);
}

// Function to get user inputs
async function getUserInputs() {
  const questions = [
    {
      type: "input",
      name: "sourceDir",
      message: "Enter the source directory path:",
      default: "./_source",
    },
    {
      type: "input",
      name: "destDir",
      message: "Enter the destination directory path:",
      default: "./_destination",
    },
    {
      type: "input",
      name: "audioLanguages",
      message:
        "Enter the languages of audio tracks to keep (comma separated, e.g., en,ta):",
      default: "ta,en",
    },
    {
      type: "input",
      name: "subtitleLanguages",
      message:
        "Enter the languages of subtitle tracks to keep (comma separated, e.g., en,ta):",
      default: "en",
    },
    {
      type: "input",
      name: "filenamePattern",
      message: "Enter custom filename pattern (e.g., ShowName S02E03):",
      default: "Output",
    },
  ];

  return inquirer.prompt(questions);
}

// Ensure destination directory exists
const ensureDestinationExists = (destDir) => {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
};

// Generate unique custom file name
const generateUniqueCustomFileName = (baseName, ext, index) => {
  let destFilePath = path.join(baseName + ext);
  let counter = index || 1;

  while (fs.existsSync(destFilePath)) {
    destFilePath = `${baseName} (${counter})${ext}`;
    counter++;
  }

  return destFilePath;
};

// Function to process each video file
const multiplex = (
  filePath,
  destDir,
  audioLanguages,
  subtitleLanguages,
  filenamePattern,
  index
) => {
  const ext = path.extname(filePath);
  const customFilename =
    filenamePattern &&
    generateUniqueCustomFileName(filenamePattern, ext, index);
  const fileName = customFilename || path.basename(filePath);

  const destFilePath = path.join(destDir, fileName);
  const renameTracks = [];

  // Get tracks information using mkvmerge
  const getTracks = shell.exec(`"${MKVMERGE_PATH}" --identify "${filePath}"`, {
    silent: true,
  });

  const trackLines = getTracks.stdout
    .split("\n")
    .filter((line) => line.includes("Track ID"));

  trackLines.forEach((line) => {
    const match = line.match(/Track ID (\d+): ([\w\/]+)/);
    if (match) {
      const trackId = match[1];
      const trackType = match[2];

      if (trackType.includes("video"))
        renameTracks.push(`--track-name ${trackId}:"Video Track"`);
      else if (trackType.includes("audio"))
        renameTracks.push(`--track-name ${trackId}:"Audio Track"`);
      else if (trackType.includes("subtitles"))
        renameTracks.push(`--track-name ${trackId}:"Subtitle Track"`);
    }
  });

  // Run mkvmerge to keep only the specified tracks and rename them
  const command =
    `"${MKVMERGE_PATH}" -o "${destFilePath}" ` +
    `--language 0:und ` + // Set video track language as Undetermined
    `--audio-tracks ${audioLanguages.join(",")} ` + // Specify audio tracks
    `--subtitle-tracks ${subtitleLanguages.join(",")} ` + // Specify subtitle tracks
    `${renameTracks.join(" ")} ` + // Rename tracks
    `"${filePath}"`; // Source file path

  const resultMux = shell.exec(command);

  if (resultMux.code === 0) {
    console.log(`Processed ${filePath} successfully.`);
  } else {
    console.log(`Warnings or errors occurred while processing ${filePath}.`);
  }
};

async function main() {
  const answers = await getUserInputs();
  const {
    sourceDir,
    destDir,
    audioLanguages,
    subtitleLanguages,
    filenamePattern,
  } = answers;

  ensureDestinationExists(destDir);

  const videoFiles = fs.readdirSync(sourceDir);

  videoFiles.forEach((file, index) => {
    const filePath = path.join(sourceDir, file);
    multiplex(
      filePath,
      destDir,
      audioLanguages.split(","),
      subtitleLanguages.split(","),
      filenamePattern,
      index + 1
    );
  });
}

main();
