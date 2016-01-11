var assert = require("assert");
var expect = require("chai").expect;
var path   = require("path");
var fs     = require("fs");

var PDFImage = require("../").PDFImage;

describe("PDFImage", function () {
  var pdfPath = "/tmp/test.pdf";
  var pdfImage;

  beforeEach(function() {
     pdfImage = new PDFImage(pdfPath)
  });

  it("should have correct basename", function () {
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
    expect(pdfImage.constructConvertCommandForPage(1))
      .equal("convert '/tmp/test.pdf[1]' '/tmp/test-1.png'");
  });

  it("should use gm when you ask it to", function () {
    pdfImage = new PDFImage(pdfPath, {graphicsMagick: true})
    expect(pdfImage.constructConvertCommandForPage(1))
      .equal("gm convert '/tmp/test.pdf[1]' '/tmp/test-1.png'");
  });

  // TODO: Do page updating test
  it("should convert PDF's page to a file with the default extension", function () {
    pdfImage.convertPage(1).then(function (imagePath) {
      expect(imagePath).equal("/tmp/test-1.png");
      expect(fs.existsSync("/tmp/test-1.png")).to.be.true;
    });
    pdfImage.convertPage(10).then(function (imagePath) {
      expect(imagePath).equal("/tmp/test-10.png");
      expect(fs.existsSync("/tmp/test-10.png")).to.be.true;
    });
  });

  it("should convert PDF's page to file with a specified extension", function () {
    pdfImage.setConvertExtension("jpeg");
    pdfImage.convertPage(1).then(function (imagePath) {
      expect(imagePath).equal("/tmp/test-1.jpeg");
      expect(fs.existsSync("/tmp/test-1.jpeg")).to.be.true;
    });
  });

  it("should return # of pages", function () {
    pdfImage.numberOfPages().then(function (numberOfPages) {
      expect(numberOfPages).to.be.equal(21);
    });
  });

  it("should construct convert options correctly", function () {
    pdfImage.setConvertOptions({
      "-density": 300,
      "-trim": null
    });
    expect(pdfImage.constructConvertOptions()).equal("-density 300 -trim");
  });
});
