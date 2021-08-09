// parameter url
function doGet(e){
  let url = e.parameter.url;
  console.log('url=%s', url);
  let lastmod;

  if(url == null || (lastmod=getLastMod(url))==null){
    return ContentService.createTextOutput('null');
  }
  
  let now = new Date();
  let diff = now - lastmod; //msec
  let diffDays = Math.floor(diff/1000/60/60/24);
  let diffMonths = Math.floor(diffDays/30);
  let diffYears = Math.floor(diffDays/365);
  
  console.log('%s(msec) | %s(days), %s(month), %s(year)', diff, diffDays, diffMonths, diffYears);

  let fullDate = Utilities.formatDate(lastmod, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
  let shortDate = Utilities.formatDate(lastmod, 'Asia/Tokyo', 'yyyy-MM-dd');

  let data = {diffYears, diffMonths, diffDays, fullDate, shortDate, url };
  let payload = JSON.stringify(data);
  let output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(payload);

  return output;
}

//for testing
function testDoGet(){
  let param = {
    //parameter:{url : 'https://kanaxx.hatenablog.jp/entry/typec-cable'}
    parameter:{url : 'https://kanaxx.hatenablog.jp/entry/hatenablog/responsive-with-cloudinary'}
  };
  let ans = doGet(param);
  console.log(ans);
}

