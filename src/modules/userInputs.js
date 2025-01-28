const { default: inquirer } = require("inquirer");
const config = require("../config");

// Destruct configurations
const {
  SOURCE_DIR,
  DESTINATION_DIR,
  CUSTOMIZE,
  AUDIO_TRACKS,
  SUBTITLE_TRACKS,
  CHANGE_TRACK_NAMES,
  CHANGE_AUDIO_TRACKS,
  CHANGE_SUBTITLE_TRACKS,
  CUSTOM_FILE_NAME,
} = config;

// Function to get user inputs
module.exports = async function getUserInputs() {
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

  const operationSelectionQuestion = [
    {
      type: "list",
      name: "operation",
      message: "Select the operation you want to perform:",
      choices: [
        {
          name: "Tracks Modifications (Keep wanted tracks & remove the rest, rename tracks)",
          value: "tracksModifications",
        },
        {
          name: "Append Tracks by Files (Merge audio/subtitle files into video as separate tracks)",
          value: "appendTracksByFiles",
        },
      ],
      default: "tracksModifications",
    },
  ];

  const { operation } = await inquirer.prompt(operationSelectionQuestion);

  // If "Tracks Modifications" is selected, proceed with customization
  if (operation === "tracksModifications") {
    const customizeQuestion = [
      {
        type: "confirm",
        name: "customize",
        message: "Do you want to customize further settings? (Choose 'No' for Default settings)",
        default: CUSTOMIZE,
      },
    ];

    const { customize } = await inquirer.prompt(customizeQuestion);

    if (customize) {
      const customizationInputs = await getTracksModificationsInputs();
      return {
        ...initialAnswers,
        operation,
        ...customizationInputs,
      };
    } else
      return {
        ...initialAnswers,
        operation,
        audioTracks: AUDIO_TRACKS,
        subtitleTracks: SUBTITLE_TRACKS,
        filenamePattern: null,
        changeTrackNames: CHANGE_TRACK_NAMES,
      };
  }

  // Return for "Append Tracks by Files" operation
  return {
    ...initialAnswers,
    operation,
  };
};

// Function to get customization inputs for Tracks Modifications
async function getTracksModificationsInputs() {
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
        "Enter the audio tracks to keep (comma-separated, ISO639-1|2 format):",
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
        "Enter the subtitle tracks to keep (comma-separated, ISO639-1|2 format):",
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
    audioTracks,
    subtitleTracks,
    filenamePattern: customizationAnswers.filenamePattern || null,
    changeTrackNames: customizationAnswers.changeTrackNames,
  };
}
