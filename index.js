// node-pdf

var Promise = require("es6-promise").Promise;

var path = require("path");
var fs   = require("fs");
var util = require("util");
var exec = require("child_process").exec;

function PDFImage(pdfFilePath, options) {
  if (!options) options = {};

  this.pdfFilePath = pdfFilePath;
  this.pdfFileBaseName = path.basename(pdfFilePath, ".pdf");

  this.setConvertOptions(options.convertOptions);
  this.setConvertExtension(options.convertExtension);
  this.useGM = options.graphicsMagick || false;

  this.outputDirectory = options.outputDirectory || path.dirname(pdfFilePath);
}

PDFImage.prototype = {
  constructGetInfoCommand: function () {
    return util.format(
      "pdfinfo '%s'",
      this.pdfFilePath
    );
  },
  parseGetInfoCommandOutput: function (output) {
    var info = {};
    output.split("\n").forEach(function (line) {
      if (line.match(/^(.*?):[ \t]*(.*)$/)) {
        info[RegExp.$1] = RegExp.$2;
      }
    });
    return info;
  },
  getInfo: function () {
    var self = this;
    var getInfoCommand = this.constructGetInfoCommand();
    var promise = new Promise(function (resolve, reject) {
      exec(getInfoCommand, function (err, stdout, stderr) {
        if (err) {
          return reject({
            message: "Failed to get PDF'S information",
            error: err,
            stdout: stdout,
            stderr: stderr
          });
        }
        return resolve(self.parseGetInfoCommandOutput(stdout));
      });
    });
    return promise;
  },
  numberOfPages: function () {
    return this.getInfo().then(function (info) {
      return info["Pages"];
    });
  },
  getOutputImagePathForPage: function (pageNumber) {
    return path.join(
      this.outputDirectory,
      this.pdfFileBaseName + "-" + pageNumber + "." + this.convertExtension
    );
  },
  setConvertOptions: function (convertOptions) {
    this.convertOptions = convertOptions || {};
  },
  setConvertExtension: function (convertExtension) {
    this.convertExtension = convertExtension || "png";
  },
  constructConvertCommandForPage: function (pageNumber) {
    var pdfFilePath = this.pdfFilePath;
    var outputImagePath = this.getOutputImagePathForPage(pageNumber);
    var convertOptionsString = this.constructConvertOptions();
    return util.format(
      "%s %s'%s[%d]' '%s'",
      this.useGM ? "gm convert" : "convert",
      convertOptionsString ? convertOptionsString + " " : "",
      pdfFilePath, pageNumber, outputImagePath
    );
  },
  constructConvertOptions: function () {
    return Object.keys(this.convertOptions).sort().map(function (optionName) {
      if (this.convertOptions[optionName] !== null) {
        return optionName + " " + this.convertOptions[optionName];
      } else {
        return optionName;
      }
    }, this).join(" ");
  },
  convertPage: function (pageNumber) {
    var pdfFilePath     = this.pdfFilePath;
    var outputImagePath = this.getOutputImagePathForPage(pageNumber);
    var convertCommand  = this.constructConvertCommandForPage(pageNumber);

    var promise = new Promise(function (resolve, reject) {
      function convertPageToImage() {
        exec(convertCommand, function (err, stdout, stderr) {
          if (err) {
            return reject({
              message: "Failed to convert page to image",
              error: err,
              stdout: stdout,
              stderr: stderr
            });
          }
          return resolve(outputImagePath);
        });
      }

      fs.stat(outputImagePath, function (err, imageFileStat) {
        var imageNotExists = err && err.code === "ENOENT";
        if (!imageNotExists && err) {
          return reject({
            message: "Failed to stat image file",
            error: err
          });
        }

        // convert when (1) image doesn't exits or (2) image exists
        // but its timestamp is older than pdf's one

        if (imageNotExists) {
          // (1)
          convertPageToImage();
          return;
        }

        // image exist. check timestamp.
        fs.stat(pdfFilePath, function (err, pdfFileStat) {
          if (err) {
            return reject({
              message: "Failed to stat PDF file",
              error: err
            });
          }

          if (imageFileStat.mtime < pdfFileStat.mtime) {
            // (2)
            convertPageToImage();
            return;
          }

          return resolve(outputImagePath);
        });
      });
    });
    return promise;
  }
};

exports.PDFImage = PDFImage;
