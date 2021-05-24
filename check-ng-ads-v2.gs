const sitemapNamespace = "http://www.sitemaps.org/schemas/sitemap/0.9";
const cellOfSitemapIndex = "A2";
const startCellOfSitemap = "A5";
const startCellOfBlogEntry = "C2";
const targetWorksheetName = "シート1";
const sheet = SpreadsheetApp.getActive().getSheetByName(targetWorksheetName);
const intervalSecond = 0.5;

function myFunction() {
  cleanOrContinue();
  checkBlogEntry();
}

function cleanOrContinue(){
  if(!sheet.getRange(startCellOfBlogEntry).isBlank()){
    var ans = Browser.msgBox('リセット確認','過去のデータが残っているようですが全部クリアしますか？いいえの場合はシートの未検査分の実行します。',Browser.Buttons.YES_NO);
    if(ans=='no'){
      return;
    }else if(ans == 'cancel'){
      throw new Error('キャンセルが押されたので終了');
    }
  }
  cleanSheet();
  prepare();

 
}
function cleanSheet(){
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
  entryRange = entryRange.offset(0,4);
  delNotation = startCellOfBlogEntry+':' + entryRange.getA1Notation();
  console.log(delNotation);
  sheet.getRange(delNotation).clearContent();

  
}
function prepare(){
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
    r++;

    if( !entryRange.offset(0,2).isBlank() ){
      console.log('skip %s', entryRange.getValue() );
      entryRange = entryRange.offset(1,0);
      continue;
    }

    var now = Utilities.formatDate(new Date(),'JST', 'yyyy/MM/dd HH:mm:ss');
    console.log('%s/%s %s', r, entryCount, url);

    var html = UrlFetchApp.fetch(url).getContentText();
    var amazon = html.match(/\[asin:[^\]]*\]/g);
    var rakuten = html.match(/\[rakuten:[^\]]*\]/g);
    entryRange.offset(0,2).setValue(now).offset(0,1).setValue(amazon).offset(0,1).setValue(rakuten);
    entryRange = entryRange.offset(1,0);
    Utilities.sleep(intervalSecond*1000);
  }
}
