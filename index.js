// node-pdf

var Promise = require("es6-promise").Promise;

var path = require("path");
var fs   = require("fs");
var util = require("util");

function PDFImage(pdfFilePath) {
  this.pdfFilePath = pdfFilePath;
  this.pdfFileBaseName = path.basename(pdfFilePath, ".pdf");
  // TODO: make out dir customizable
  this.outputDirectory = path.dirname(pdfFilePath);
}

PDFImage.prototype = {
  getOutputImagePathForPage: function (pageNumber) {
    return path.join(
      this.outputDirectory,
      this.pdfFileBaseName + "-" + pageNumber + ".png"
    );
  },
  getConvertCommandForPage: function (pageNumber) {
    var pdfFilePath = this.pdfFilePath;
    var outputImagePath = this.getOutputImagePathForPage(pageNumber);
    return util.format(
      "convert '%s[%d]' %s",
      pdfFilePath, pageNumber, outputImagePath
    );
  },
  convertPage: function (pageNumber) {
    var pdfFilePath     = this.pdfFilePath;
    var outputImagePath = this.getOutputImagePathForPage(pageNumber);
    var convertCommand  = this.getConvertCommandForPage(pageNumber);

    var promise = new Promise(function (resolve, reject) {
      function convertPageToImage() {
        var exec = require("child_process").exec;
        exec(convertCommand, function (err, stdout, stderr) {
          if (err) { return reject(err); }
          return resolve(outputImagePath);
        });
      }

      fs.stat(outputImagePath, function (err, imageFileStat) {
        var imageNotExists = err && err.code === "ENOENT";
        if (!imageNotExists && err) { return reject(err); }

        // convert when (1) image doesn't exits or (2) image exists
        // but its timestamp is older than pdf's one

        if (imageNotExists) {
          // (1)
          convertPageToImage();
          return;
        }

        // image exist. check timestamp.
        fs.stat(pdfFilePath, function (err, pdfFileStat) {
          if (err) { return reject(err); }

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