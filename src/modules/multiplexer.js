const path = require("path");
const shell = require("shelljs");
const { MKVMERGE_PATH, TRACK_NAMES_BY_TYPE } = require("../config");
const handleConflicts = require("./handleConflicts");

// Functions to process each video file

// Tracks Modifications (Keep wanted tracks, rename tracks, change output filename)
module.exports.tracksModifications = function (
  filePath,
  destDir,
  audioTracks,
  subtitleTracks,
  filenamePattern,
  changeTrackNames
) {
  const ext = path.extname(filePath);
  const customFilename =
    filenamePattern &&
    handleConflicts.generateFileName(filenamePattern, ext, destDir);
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
          renameTracks.push(
            `--track-name ${trackId}:\"${TRACK_NAMES_BY_TYPE.video}\"`
          );
        else if (trackType.includes("audio"))
          renameTracks.push(
            `--track-name ${trackId}:\"${TRACK_NAMES_BY_TYPE.audio}\"`
          );
        else if (trackType.includes("subtitles"))
          renameTracks.push(
            `--track-name ${trackId}:\"${TRACK_NAMES_BY_TYPE.subtitle}\"`
          );
      }
    }
  });

  // Run mkvmerge to perform specified operation.
  const command = [
    `"${MKVMERGE_PATH}"`, // mkvmerge path
    "-q", // --quiet mode to show less details in output
    `-o "${destFilePath}"`, // --output file path
    `--language 0:und`, // set video track language as 'undetermined' as default
    audioTracks
      ? `--audio-tracks ${audioTracks.join(",")}`
      : "--audio-tracks -1", // Specify audio tracks
    subtitleTracks
      ? `--subtitle-tracks ${subtitleTracks.join(",")}`
      : "--subtitle-tracks -1", // Specify subtitle tracks
    `${renameTracks.join(" ")}`, // Rename tracks
    `"${filePath}"`, // Source file path
  ].join(" ");

  // const command_inStr = `"${MKVMERGE_PATH}" -q -o "${destFilePath}" --language 0:und ${audioTracks ? `--audio-tracks ${audioTracks.join(",")}`: "--audio-tracks -1"} ${subtitleTracks ? `--subtitle-tracks ${subtitleTracks.join(",")}` : "--subtitle-tracks -1"} ${renameTracks.join(" ")} "${filePath}"`;
  // console.log("------------------------------------------------------------------------------");
  // console.log(command);
  // console.log("------------------------------------------------------------------------------");

  const resultMux = shell.exec(command);

  // For acknowledgement
  // if (resultMux.code === 0) {
  //   console.log(`Processed ${filePath} successfully.`);
  // } else {
  //   console.log(`Warnings or errors occurred while processing ${filePath}.`);
  // }
};

// Append Tracks by Files (Merge audio/subtitle files into video as separate tracks)
module.exports.appendTracksByFiles = function (
  filePath,
  destDir,
  audioFiles,
  subtitleFiles
) {
  // Append audio files (.mp3, .aac, etc.)
  const audioOptions = audioFiles
    .map((audio) => {
      const languageMatch = audio.match(/\[(.*?)\]/);
      const language = languageMatch ? languageMatch[1] : "und"; // Default to 'undetermined'
      return `--language 0:${language} "${audio}"`;
    })
    .join(" ");

  // Append subtitles files (.srt)
  const subtitleOptions = subtitleFiles
    .map((subtitle) => {
      const languageMatch = subtitle.match(/\[(.*?)\]/);
      const language = languageMatch ? languageMatch[1] : "und"; // Default to 'undetermined'
      return `--language 0:${language} "${subtitle}"`;
    })
    .join(" ");

  const fileName = path.basename(filePath);
  const destFilePath = path.join(destDir, fileName);

  const command = [
    `"${MKVMERGE_PATH}"`, // mkvmerge path
    "-q", // --quiet mode to show less details in output
    `-o "${destFilePath}"`, // output file path
    `--language 0:und`, // set video track language as 'undetermined' as default
    `${audioOptions}`,
    `${subtitleOptions}`,
    `"${filePath}"`, // Source file path
  ].join(" ");

  // const command_inStr = `"${MKVMERGE_PATH}" -q -o "${destFilePath}" --language 0:und ${audioOptions} ${subtitleOptions} "${filePath}"`;
  // console.log("------------------------------------------------------------------------------");
  // console.log(command);
  // console.log("------------------------------------------------------------------------------");

  const resultMux = shell.exec(command);

  // For acknowledgement
  // if (resultMux.code === 0) {
  //   console.log(`Processed ${filePath} successfully.`);
  // } else {
  //   console.log(`Warnings or errors occurred while processing ${filePath}.`);
  // }
};
