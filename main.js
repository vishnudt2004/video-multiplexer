const path = require("path");
const fs = require("fs");
const {
  VIDEO_FILETYPES,
  AUDIO_FILETYPES,
  SUBTITLE_FILETYPES,
} = require("./src/config");
const handleErrors = require("./src/modules/handleErrors");
const userInputs = require("./src/modules/userInputs");
const multiplexer = require("./src/modules/multiplexer");
const {
  formatString,
  formatConsole,
  breakLine,
} = require("./src/modules/consoleUtils");

function formatConsole_mod(key, value) {
  const format = {
    padCount: 20,
    prefix: "# ",
  };

  const stringFormat = {
    key: {
      textColor: "white",
      bgColor: "black",
      fontStyle: "normal",
      bgIntensity: "low",
      textIntensity: "low",
    },
    value: {
      textColor: "white",
      bgColor: "black",
      fontStyle: "italic",
      bgIntensity: "low",
      textIntensity: "high",
    },
  };

  return formatConsole(key, value, format, stringFormat);
}

function multiplex(inputs) {
  const {
    // Initial questions & Selected operation
    sourceDir,
    destDir,
    operation,
    // If "Tracks Modifications" is selected, proceed with customization
    audioTracks,
    subtitleTracks,
    filenamePattern,
    changeTrackNames,
  } = inputs;

  const files = fs.readdirSync(sourceDir);

  const videoFiles = files.filter((file) =>
    VIDEO_FILETYPES.includes(path.extname(file).toLowerCase())
  );

  const audioFiles = files.filter((file) =>
    AUDIO_FILETYPES.includes(path.extname(file).toLowerCase())
  );

  const subtitleFiles = files.filter((file) =>
    SUBTITLE_FILETYPES.includes(path.extname(file).toLowerCase())
  );

  videoFiles.forEach((file, index) => {
    const filePath = path.join(sourceDir, file);

    formatConsole_mod(
      "Processing Files",
      `${index + 1} / ${videoFiles.length}`
    );
    formatConsole_mod("Current File", file);

    if (operation === "tracksModifications") {
      multiplexer.tracksModifications(
        filePath,
        destDir,
        audioTracks,
        subtitleTracks,
        filenamePattern,
        changeTrackNames
      );
    } else if (operation === "appendTracksByFiles") {
      // Find matching audio files (.aac, .m4a, .mp3, .ac3)
      const matchedAudios = audioFiles
        .filter((aud) => {
          const baseVideoName = path.basename(file, path.extname(file));
          const baseSubName = path.basename(aud, path.extname(aud));
          return baseSubName.startsWith(baseVideoName);
        })
        .map((aud) => path.join(sourceDir, aud)); // Convert to absolute paths

      // Find matching subtitle files (.srt)
      const matchedSubtitles = subtitleFiles
        .filter((sub) => {
          const baseVideoName = path.basename(file, path.extname(file));
          const baseSubName = path.basename(sub, path.extname(sub));
          return baseSubName.startsWith(baseVideoName);
        })
        .map((sub) => path.join(sourceDir, sub)); // Convert to absolute paths

      multiplexer.appendTracksByFiles(
        filePath,
        destDir,
        matchedAudios,
        matchedSubtitles
      );
    }
  });

  breakLine(1);
  console.info(
    formatString(" Processing Complete ", {
      textColor: "green",
      bgColor: "white",
      fontStyle: "bold",
      bgIntensity: "low",
      textIntensity: "high",
    })
  );
}

function displayScriptInfo() {
  breakLine(1);
  console.info(
    formatString(" || VIDEO MULTIPLEXER || ", {
      textColor: "blue",
      bgColor: "black",
      fontStyle: "bold",
      bgIntensity: "low",
      textIntensity: "high",
    })
  );
  breakLine(1);

  return;
}

async function main() {
  handleErrors.checkModulePath();

  displayScriptInfo();

  const inputs = await userInputs();
  const { sourceDir, destDir } = inputs;

  handleErrors.checkSourceExistence(sourceDir);
  handleErrors.checkVideoFileExistence(sourceDir);
  handleErrors.checkDestinationExistence(destDir);

  multiplex(inputs);
}

main();
