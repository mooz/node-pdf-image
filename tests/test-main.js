var assert = require("assert");
var expect = require("chai").expect;
var path   = require("path");
var fs     = require("fs");

var PDFImage = require("../").PDFImage;

describe("PDFImage", function () {
  var pdfPath = "/tmp/test.pdf";
  var pdfImage = new PDFImage(pdfPath);

  it("should has correct basename", function () {
    expect(pdfImage.pdfFileBaseName).equal("test");
  });

  it("should return correct page path", function () {
    expect(pdfImage.getOutputImagePathForPage(1))
      .equal("/tmp/test-1.png");
    expect(pdfImage.getOutputImagePathForPage(2))
      .equal("/tmp/test-2.png");
    expect(pdfImage.getOutputImagePathForPage(1000))
      .equal("/tmp/test-1000.png");
  });

  it("should return correct convert command", function () {
    expect(pdfImage.getConvertCommandForPage(1))
      .equal("convert '/tmp/test.pdf[1]' /tmp/test-1.png");
  });

  // TODO: Do page updating test
  it("should convert PDF's page to png file", function () {
    pdfImage.convertPage(1).then(function (imagePath) {
      expect(imagePath).equal("/tmp/test-1.png");
      expect(fs.existsSync("/tmp/test-1.png")).to.be.true;
    });
    pdfImage.convertPage(10).then(function (imagePath) {
      expect(imagePath).equal("/tmp/test-10.png");
      expect(fs.existsSync("/tmp/test-10.png")).to.be.true;
    });
  });
});
