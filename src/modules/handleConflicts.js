const path = require("path");
const fs = require("fs");

// Generate unique custom file name
function generateFileName(baseName, ext, destDir) {
  let counter = 1;
  let destFilePath = path.join(destDir, `${baseName}${ext}`);

  while (fs.existsSync(destFilePath)) {
    destFilePath = path.join(destDir, `${baseName} (${counter})${ext}`);
    counter++;
  }

  return path.basename(destFilePath);
}

module.exports = {
  generateFileName,
};
