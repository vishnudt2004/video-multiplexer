// Default Options
module.exports = {
  // System environment variable name or file path (path/to/mkvmerge.exe).
  MKVMERGE_PATH: "mkvmerge",

  // Initial setting
  SOURCE_DIR: "./_source",
  DESTINATION_DIR: "./_destination",

  // Options for 'Tracks Modification' operation
  CUSTOMIZE: false,
  AUDIO_TRACKS: ["en", "ta"], // ISO639-1|2 format
  SUBTITLE_TRACKS: ["en"], // ISO639-1|2 format
  CHANGE_TRACK_NAMES: true,
  TRACK_NAMES_BY_TYPE: {
    video: "Video Track",
    audio: "Audio Track",
    subtitle: "Subtitle Track",
  },
  CHANGE_AUDIO_TRACKS: true,
  CHANGE_SUBTITLE_TRACKS: true,
  CUSTOM_FILE_NAME: false,

  // Files types for check & merge
  VIDEO_FILETYPES: [".mp4", ".mkv", ".avi"],
  AUDIO_FILETYPES: [".aac", ".m4a", ".mp3", ".ac3", ".mka"],
  SUBTITLE_FILETYPES: [".srt"],
};
