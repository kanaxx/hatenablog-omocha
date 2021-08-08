const sitemapNamespace = "http://www.sitemaps.org/schemas/sitemap/0.9";

const cellOfSitemapIndex = "B1";
const startCellOfSitemap = "D1";
const startCellOfBlogEntry = "A1";

const sitemapWorksheetName = "サイトマップ";
const dataWorksheetName = "データ";
const httpMaxRetry=5;

function bootstrap() {

  let ss = SpreadsheetApp.getActiveSpreadsheet();

  let sitemapSheet = ss.getSheetByName(sitemapWorksheetName);
  sitemapSheet.getRange('D:D').clearContent();
  let sitemapIndexUrl = sitemapSheet.getRange(cellOfSitemapIndex).getValue();

  let time = Utilities.formatDate( new Date(), 'Asia/Tokyo', 'yyyyMMdd-HHmmss');
  let newSheet = ss.insertSheet(time); 
  newSheet.getRange('D1').setValue(time);
  
  let result = fetchSitemaps(sitemapIndexUrl, sitemapSheet, newSheet);
  if(result){
    let dataSheet = ss.getSheetByName(dataWorksheetName);
    if(dataSheet){
      ss.deleteSheet(dataSheet);
    }
    newSheet.setName(dataWorksheetName);
    
  }else{
    ss.deleteSheet(newSheet);
  }
}

function fetchSitemaps(sitemapIndexUrl, sitemapSheet, dataSheet){
  console.info('サイトマップインデックスを取る')

  let response;
  response = fetch(sitemapIndexUrl)
  if(!response){
    return false;
  }
  let sitemapIndexXml = response.getContentText();

  let sitemapIndexDoc = XmlService.parse(sitemapIndexXml);
  let xmlProtocol = XmlService.getNamespace(sitemapNamespace);
  let sitemaps = sitemapIndexDoc.getRootElement().getChildren('sitemap', xmlProtocol);

  console.info('サイトマップインデックスからサイトマップURLを取る')
  let sitemapLocations = [];
  sitemaps.forEach(function(sitemap, s){
    let loc = sitemap.getChild('loc', xmlProtocol).getText();
    console.log(loc);
    sitemapLocations.push(loc);
    sitemapSheet.getRange(startCellOfSitemap).offset(s, 0).setValue(loc)
  });
  
  console.info('サイトマップからブログエントリーのURLを取る')
  let rng = dataSheet.getRange(startCellOfBlogEntry);

  for (let s in sitemapLocations) {
    let sitemapLoc = sitemapLocations[s];
    console.log('%s/%s %s',s+1, sitemapLocations.length, sitemapLoc);
    
    response = fetch(sitemapLoc);
    if(!response){
      return false;
    }

    let sitemapXml = response.getContentText();
    let sitemapDoc = XmlService.parse(sitemapXml);
    let urls = sitemapDoc.getRootElement().getChildren('url', xmlProtocol);

    for(let url of urls){
      let entryLoc = url.getChild('loc', xmlProtocol).getText();
      let lastmod = url.getChild('lastmod', xmlProtocol).getText();
      let lastmodJst = Utilities.formatDate(new Date(lastmod), "JST", "yyyy-MM-dd HH:mm:ss");

      rng.setValue(entryLoc).offset(0, 1).setValue(lastmodJst);
      rng = rng.offset(1,0)
    }
  }
  return true;
}

function getLastMod(url){
  let lastmod='';
  let dataSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(dataWorksheetName);
  let targetRange = dataSheet.getRange("A:A");
  let finder = targetRange.createTextFinder(url).matchEntireCell(true);
  let res = finder.findNext();
  if(res !== null) {
    if(!res.offset(0,1).isBlank()){
      lastmod = Utilities.formatDate(res.offset(0,1).getValue(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
    }
  }
  return lastmod;
}

function fetch(url){
  let options = {
    muteHttpExceptions: true
  };
  
  let httpcount = 0;
  let response = null;

  while(httpcount < httpMaxRetry ){
    try{
      response =  UrlFetchApp.fetch(url, options);
      let code = response.getResponseCode();
      console.log('[%s][%s] %s',httpcount, code, url);

      if(code == 200){
        return response;
      }
    }catch(e){
      console.log(e);
      console.log('[%s][error] %s',httpcount, url);
    }
    httpcount++;
  }
  return null;
}

// parameter url
function doGet(e){
  let url = e.parameter.url;
  let lastmod = "";
  if(url != null){
    lastmod=getLastMod(url);
  }
  return ContentService.createTextOutput(lastmod);
}

function testDoGet(){
  let url = 'https://kanaxx.hatenablog.jp/entry/typec-cable';
  let lastmod = getLastMod(url);
  console.log(lastmod);
}
