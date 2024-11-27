/* eslint-disable @typescript-eslint/no-var-requires */
/* Just to print classes for typeorm config entities */
const testFolder = "./entities/";
const fs = require("fs");

fs.readdir(testFolder, (err, files) => {
  files.forEach((file) => {
    console.log(file?.replace(".ts", ","));
  });
});
