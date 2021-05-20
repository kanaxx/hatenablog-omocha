const sitemapNamespace = "http://www.sitemaps.org/schemas/sitemap/0.9";
const cellOfSitemapIndex = "A2";
const startCellOfSitemap = "A5";
const startCellOfBlogEntry = "C2";
const targetWorksheetName = "シート1";

function myFunction() {
  cleanSheet();
  prepare();
  checkBlogEntry();
}

function cleanSheet(){
  var sheet = SpreadsheetApp.getActive().getSheetByName(targetWorksheetName);
  var r =0;
  var sitemapRange = sheet.getRange(startCellOfSitemap);
  while( !sitemapRange.isBlank()) {
    sitemapRange = sitemapRange.offset(1,0);
  }
  var delNotation = startCellOfSitemap+':'+sitemapRange.getA1Notation();
  console.log(delNotation);
  sheet.getRange(delNotation).clearContent();

  var entryRange = sheet.getRange(startCellOfBlogEntry);
  r=0;
  while( !entryRange.offset(r,0).isBlank()) {
    entryRange = entryRange.offset(1,0);
  }
  entryRange = entryRange.offset(0,3);
  delNotation = startCellOfBlogEntry+':' + entryRange.getA1Notation();
  console.log(delNotation);
  sheet.getRange(delNotation).clearContent();

  
}
function prepare(){
  var sheet = SpreadsheetApp.getActive().getSheetByName(targetWorksheetName);
  var sitemapIndexUrl = sheet.getRange(cellOfSitemapIndex).getValue();
  console.log(sitemapIndexUrl);

  var sitemapIndexXml = UrlFetchApp.fetch(sitemapIndexUrl).getContentText();
  var sitemapIndexDoc = XmlService.parse(sitemapIndexXml);
  var xmlProtocol = XmlService.getNamespace(sitemapNamespace);
  var sitemaps = sitemapIndexDoc.getRootElement().getChildren('sitemap', xmlProtocol);

  console.info('サイトマップインデックスからサイトマップURLを取る')
  var sitemapLocations = [];
  sitemaps.forEach(function(sitemap, s){
    var loc = sitemap.getChild('loc', xmlProtocol).getText();
    console.log(loc);
    sitemapLocations.push(loc);
    sheet.getRange(startCellOfSitemap).offset(s, 0).setValue(loc)
  });
  
  console.info('サイトマップからブログエントリーのURLを取る')
  var entryLocations = [];
  sitemapLocations.forEach(function(sitemapLoc, s){
    console.log('%s/%s %s',s+1, sitemapLocations.length, sitemapLoc);
    var sitemapXml = UrlFetchApp.fetch(sitemapLoc).getContentText();
    var sitemapDoc = XmlService.parse(sitemapXml);
    var urls = sitemapDoc.getRootElement().getChildren('url', xmlProtocol);

    var rng = sheet.getRange(startCellOfBlogEntry);
    for(var url of urls){
      var entryLoc = url.getChild('loc', xmlProtocol).getText();
      var lastmod = url.getChild('lastmod', xmlProtocol).getText();

      rng.offset(entryLocations.length, 0).setValue(entryLoc);
      rng.offset(entryLocations.length, 1).setValue(lastmod);
      entryLocations.push(entryLoc);
    }
  });
}

function checkBlogEntry(){
  var sheet = SpreadsheetApp.getActive().getSheetByName(targetWorksheetName);

  console.info('ブログエントリーからHTMLを取って調べる')
  
  var entryRange = sheet.getRange(startCellOfBlogEntry);

  //URLの数を数えるためだけのコード（しかもログに進捗出すためだけ）
  var entryCount = 0;
  while( !entryRange.isBlank()) {
    entryCount++;
    entryRange = entryRange.offset(1,0);
  }

  entryRange = sheet.getRange(startCellOfBlogEntry);
  var r=0;
  while( !entryRange.isBlank()) {
    var url = entryRange.getValue();
    console.log('%s/%s %s', ++r, entryCount, url);

    var html = UrlFetchApp.fetch(url).getContentText();
    var amazon = html.match(/\[asin:[^\]]*\]/g);
    var rakuten = html.match(/\[rakuten:[^\]]*\]/g);

    //setValueがRange返すので、チェーンできちゃう
    entryRange.offset(0,2).setValue(amazon).offset(0,1).setValue(rakuten);
    entryRange = entryRange.offset(1,0);
  }
}
