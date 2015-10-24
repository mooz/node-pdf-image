# pdf-image

Provides an interface to convert PDF's pages to png files in Node.js
by using ImageMagick.

## Installation

    npm install pdf-image

Ensure you have `convert`, `gs`, and `pdfinfo` (part of poppler) commands.

### Ubuntu

    sudo apt-get install imagemagick ghostscript poppler-utils

### OSX (Yosemite)

    brew install imagemagick ghostscript poppler

## Usage

```javascript
var PDFImage = require("pdf-image").PDFImage;

var pdfImage = new PDFImage("/tmp/slide.pdf");
pdfImage.convertPage(0).then(function (imagePath) {
  // 0-th page (first page) of the slide.pdf is available as slide-0.png
  fs.existsSync("/tmp/slide-0.png") // => true
});
```

## Express

Following example shows an example of pdf-image in Express, which gives
URLs for each pages of a PDF like
`http://example.com:3000/tmp/slide.pdf/0.png`.

```javascript
  app.get(/(.*\.pdf)\/([0-9]+).png$/i, function (req, res) {
    var pdfPath = req.params[0];
    var pageNumber = req.params[1];

    var PDFImage = require("pdf-image").PDFImage;
    var pdfImage = new PDFImage(pdfPath);

    pdfImage.convertPage(pageNumber).then(function (imagePath) {
      res.sendFile(imagePath);
    }, function (err) {
      res.send(err, 500);
    });
  });
```
