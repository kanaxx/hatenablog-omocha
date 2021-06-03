const sitemapNamespace = "http://www.sitemaps.org/schemas/sitemap/0.9";
const hatenaStarAPI = 'https://s.hatena.com/entry.json';

const cellOfSitemapIndex = "A2";
const startCellOfSitemap = "A5";
const startCellOfBlogEntry = "A2";

const sitemapWorksheetName = "サイトマップ";
const dataWorksheetName = "データ";

let sitemapSheet;
let dataSheet;

function bootstrap() {
  setupSheet();
  if(sitemapSheet.getRange(cellOfSitemapIndex).isBlank()){
    Browser.msgBox(sitemapWorksheetName + 'シートの' + cellOfSitemapIndex + 'にサイトマップインデックスのURLを入れて再実行してください');
    sitemapSheet.activate();
    sitemapSheet.getRange(cellOfSitemapIndex).activate();
    return;
  }

  var startCell = startCellOfBlogEntry;

  if(!dataSheet.getRange(startCellOfBlogEntry).offset(0,2).isBlank()){
    var ans = Browser.msgBox('前回の結果が残っているようです。続きから実行しますか？', Browser.Buttons.YES_NO_CANCEL);

    if(ans=='yes'){
      //最終チェック日の最初の空白を探して、その続きをスタートにする
      var r = findFirstEmptyRange(dataSheet.getRange(startCellOfBlogEntry).offset(0,2));
      startCell = r.offset(0,-2).getA1Notation();
    }else if(ans=='no'){
      cleanSheet();
      prepareSitemaps();
      //こっちの場合はクリアしているから、スタートは一番上
      startCell = startCellOfBlogEntry;
    }else{
      return;
    }
  }
  var count= checkEntry(startCell);
  Browser.msgBox('終わりました。実施件数' + count + '件');

}


function setupSheet(){
  sitemapSheet = getSheet(sitemapWorksheetName);
  sitemapSheet.getRange('A1').setValue('サイトマップインデックス');
  sitemapSheet.getRange('A4').setValue('サイトマップ');

  dataSheet = getSheet(dataWorksheetName);  
  dataSheet.getRange(startCellOfBlogEntry)
  .offset(-1,0).setValue('URL')
  .offset(0,1).setValue('記事更新日')
  .offset(0,1).setValue('スターチェック日')
  .offset(0,1).setValue('ノーマルスター')
  .offset(0,1).setValue('グリーン')
  .offset(0,1).setValue('レッド')
  .offset(0,1).setValue('ブルー')
}

function cleanSheet(){
  var lastRange = findFirstEmptyRange(sitemapSheet.getRange(startCellOfSitemap));
  var delNotation = startCellOfSitemap+':'+lastRange.getA1Notation();
  console.log(delNotation);
  sitemapSheet.getRange(delNotation).clearContent();

  lastRange = findFirstEmptyRange(dataSheet.getRange(startCellOfBlogEntry));
  lastRange = lastRange.offset(0,6);
  var delNotation = startCellOfBlogEntry+':'+lastRange.getA1Notation();
  console.log(delNotation);
  dataSheet.getRange(delNotation).clearContent();

}

function prepareSitemaps(){
  var sitemapIndexUrl = sitemapSheet.getRange(cellOfSitemapIndex).getValue();
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
    sitemapSheet.getRange(startCellOfSitemap).offset(s, 0).setValue(loc)
  });
  
  console.info('サイトマップからブログエントリーのURLを取る')
  var entryLocations = [];
  sitemapLocations.forEach(function(sitemapLoc, s){
    console.log('%s/%s %s',s+1, sitemapLocations.length, sitemapLoc);
    var sitemapXml = UrlFetchApp.fetch(sitemapLoc).getContentText();
    var sitemapDoc = XmlService.parse(sitemapXml);
    var urls = sitemapDoc.getRootElement().getChildren('url', xmlProtocol);

    var rng = dataSheet.getRange(startCellOfBlogEntry);
    for(var url of urls){
      var entryLoc = url.getChild('loc', xmlProtocol).getText();
      var lastmod = url.getChild('lastmod', xmlProtocol).getText();
      var lastmodJst = Utilities.formatDate(new Date(lastmod), "JST", "yyyy-MM-dd HH:mm:ss");

      rng.offset(entryLocations.length, 0).setValue(entryLoc);
      rng.offset(entryLocations.length, 1).setValue(lastmodJst);
      entryLocations.push(entryLoc);
    }
  });
}

function checkEntry(startCellAddress){
  console.info('ブログエントリーからはてなスターを調べる。%sから開始', startCellAddress);
  
  var entryRange = dataSheet.getRange(startCellAddress);
  var lastRange = findFirstEmptyRange(entryRange);
  console.log('start=%s, end=%s',entryRange.getRow(), lastRange.getRow());
  var entryCount = lastRange.getRow() - entryRange.getRow();
  console.log('行数'+entryCount);

  var r=0;
  while( !entryRange.isBlank()) {
    var url = entryRange.getValue();
    console.log('%s/%s %s', ++r, entryCount, url);

    var now = Utilities.formatDate(new Date(),'JST', 'yyyy/MM/dd HH:mm:ss');
    var hatenaUrl = hatenaStarAPI + '?uri=' + encodeURI(url);
    
    var data = UrlFetchApp.fetch(hatenaUrl).getContentText();
    var json = JSON.parse(data);

    console.log(json);

    var normalStars = 0;
    var colorStars = {'green':0, 'red':0, 'blue':0};
    
    if(json.entries.length != 0){
      var entry = json.entries[0];
      normalStars = entry.stars.length;
      if( entry.hasOwnProperty('colored_stars')){
        for(var c in entry.colored_stars ){
          var color = entry.colored_stars[c].color;
          var stars = entry.colored_stars[c].stars.length; 
          console.log('%sスターは%s個', color, stars);
          colorStars[color]=stars;
        }
      }
      // console.log(color.size);
    }

    entryRange.offset(0,2).setValue(now)
      .offset(0,1).setValue(normalStars)
      .offset(0,1).setValue(colorStars.green)
      .offset(0,1).setValue(colorStars.red)
      .offset(0,1).setValue(colorStars.blue);

    entryRange = entryRange.offset(1,0);
  }
  return entryCount;
}

function getSheet(name){
  //同じ名前のシートがなければ作ってから参照を返す
  var sheet = SpreadsheetApp.getActive().getSheetByName(name);
  if(sheet){
    return sheet;
  }
  sheet=SpreadsheetApp.getActiveSpreadsheet().insertSheet();
  sheet.setName(name);
  return sheet;
}

function findFirstEmptyRange(startRange){

  var r = startRange;
  while( !r.isBlank()) {
    r = r.offset(1,0);
  }
  return r;
}

