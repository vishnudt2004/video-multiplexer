// main script - without any modules.

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

// Default Options
const SOURCE_DIR = "./_source";
const DESTINATION_DIR = "./_destination";
const CUSTOMIZE = false;
const AUDIO_TRACKS = ["en", "ta"];
const SUBTITLE_TRACKS = ["en"];
const CHANGE_TRACK_NAMES = true;
const CHANGE_AUDIO_TRACKS = true;
const CHANGE_SUBTITLE_TRACKS = true;
const CUSTOM_FILE_NAME = false;

// Function to get user inputs
async function getUserInputs() {
  const initialQuestions = [
    {
      type: "input",
      name: "sourceDir",
      message: "Enter the source directory path:",
      default: SOURCE_DIR,
    },
    {
      type: "input",
      name: "destDir",
      message: "Enter the destination directory path:",
      default: DESTINATION_DIR,
    },
  ];

  const initialAnswers = await inquirer.prompt(initialQuestions);
  const sourceDir = initialAnswers.sourceDir;

  // Check for video files in sourceDir
  const videoFiles = fs
    .readdirSync(sourceDir)
    .filter((file) =>
      [".mp4", ".mkv", ".avi"].includes(path.extname(file).toLowerCase())
    );

  if (videoFiles.length === 0) {
    console.error(
      "No video files found in the source directory. Process terminated."
    );
    process.exit(1);
  }

  const customizeQuestion = [
    {
      type: "confirm",
      name: "customize",
      message: "Do you want to customize further settings?",
      default: CUSTOMIZE,
    },
  ];

  const { customize } = await inquirer.prompt(customizeQuestion);

  if (!customize) {
    return {
      ...initialAnswers,
      audioTracks: AUDIO_TRACKS,
      subtitleTracks: SUBTITLE_TRACKS,
      filenamePattern: null,
      changeTrackNames: CHANGE_TRACK_NAMES,
    };
  }

  const audioTracks_inStr = AUDIO_TRACKS.join(", ");
  const subtitleTracks_inStr = SUBTITLE_TRACKS.join(", ");

  const customizationQuestions = [
    {
      type: "confirm",
      name: "changeTrackNames",
      message: "Do you want to change audio and subtitle track names?",
      default: CHANGE_TRACK_NAMES,
    },
    {
      type: "confirm",
      name: "changeAudioTracks",
      message: "Do you want to change audio tracks?",
      default: CHANGE_AUDIO_TRACKS,
    },
    {
      type: "input",
      name: "audioTracks",
      message:
        "Enter the audio tracks to keep (comma-separated, ISO639-1 format):",
      default: audioTracks_inStr,
      when: (answers) => answers.changeAudioTracks,
    },
    {
      type: "confirm",
      name: "changeSubtitleTracks",
      message: "Do you want to change subtitle tracks?",
      default: CHANGE_SUBTITLE_TRACKS,
    },
    {
      type: "input",
      name: "subtitleTracks",
      message:
        "Enter the subtitle tracks to keep (comma-separated, ISO639-1 format):",
      default: subtitleTracks_inStr,
      when: (answers) => answers.changeSubtitleTracks,
    },
    {
      type: "confirm",
      name: "customFileName",
      message: "Do you want to use a custom file name pattern?",
      default: CUSTOM_FILE_NAME,
    },
    {
      type: "input",
      name: "filenamePattern",
      message: "Enter custom filename pattern (e.g., MovieName):",
      default: "",
      when: (answers) => answers.customFileName,
    },
  ];

  const customizationAnswers = await inquirer.prompt(customizationQuestions);

  const audioTracks = customizationAnswers.audioTracks
    ? customizationAnswers.audioTracks.split(",").map((track) => track.trim())
    : null;
  const subtitleTracks = customizationAnswers.subtitleTracks
    ? customizationAnswers.subtitleTracks
        .split(",")
        .map((track) => track.trim())
    : null;

  return {
    ...initialAnswers,
    audioTracks,
    subtitleTracks,
    filenamePattern: customizationAnswers.filenamePattern || null,
    changeTrackNames: customizationAnswers.changeTrackNames,
  };
}

// Ensure destination directory exists
const ensureDestinationExists = (destDir) => {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
};

// Generate unique custom file name
const generateFileName = (baseName, ext, destDir) => {
  let counter = 1;
  let destFilePath = path.join(destDir, `${baseName}${ext}`);

  while (fs.existsSync(destFilePath)) {
    destFilePath = path.join(destDir, `${baseName} (${counter})${ext}`);
    counter++;
  }

  return path.basename(destFilePath);
};

// Function to process each video file
const multiplex = (
  filePath,
  destDir,
  audioTracks,
  subtitleTracks,
  filenamePattern,
  changeTrackNames
) => {
  const ext = path.extname(filePath);
  const customFilename =
    filenamePattern && generateFileName(filenamePattern, ext, destDir);
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

      if (changeTrackNames) {
        if (trackType.includes("video"))
          renameTracks.push(`--track-name ${trackId}:\"Video Track\"`);
        else if (trackType.includes("audio"))
          renameTracks.push(`--track-name ${trackId}:\"Audio Track\"`);
        else if (trackType.includes("subtitles"))
          renameTracks.push(`--track-name ${trackId}:\"Subtitle Track\"`);
      }
    }
  });

  // Run mkvmerge to keep only the specified tracks and rename them
  const command =
    `"${MKVMERGE_PATH}" -o "${destFilePath}" ` +
    `--language 0:und ` + // Set video track language as Undetermined
    (audioTracks ? `--audio-tracks ${audioTracks.join(",")} ` : "") + // Specify audio tracks
    (subtitleTracks ? `--subtitle-tracks ${subtitleTracks.join(",")} ` : "") + // Specify subtitle tracks
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
    audioTracks,
    subtitleTracks,
    filenamePattern,
    changeTrackNames,
  } = answers;

  ensureDestinationExists(destDir);

  const videoFiles = fs
    .readdirSync(sourceDir)
    .filter((file) =>
      [".mp4", ".mkv", ".avi"].includes(path.extname(file).toLowerCase())
    );

  videoFiles.forEach((file) => {
    const filePath = path.join(sourceDir, file);
    multiplex(
      filePath,
      destDir,
      audioTracks,
      subtitleTracks,
      filenamePattern,
      changeTrackNames
    );
  });
}

main();
