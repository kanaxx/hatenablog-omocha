// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// @language_out ECMASCRIPT_2017
// ==/ClosureCompiler==
javascript: (

  async function (pages,windows) {
    //何ページ目まで繰り返すか、各自で変えてください。
    let maxpage = 5;
    //ボタンのクリックで開くウィンドウの数
    let maxwindows = 5;

    if(Number.isInteger(pages)){
      maxpage=pages;
    }
    if(Number.isInteger(windows)){
      maxwindows=windows;
    }

    const anntena = 'https://blog.hatena.ne.jp/-/antenna';
    if (window.location.href.indexOf("https://blog.hatena.ne.jp/-/antenna") != 0) {
      let ans = confirm('ページが違います。購読リストへ移動します');
      if(ans){
        window.location.href = anntena;
        return;
      }
    }

    $('div.l-admin-subscribe-wrapper-left').remove();
    $('div.l-admin-subscribe-wrapper-right').remove();
    
    const bloglist = [];

    for (let p = 1; p <= maxpage; p++) {
      console.info('page:%s', p);
      updateCaption(`${p}/${maxpage} ページ目`);
      let html = await getHTML(anntena + '?page=' + p);

      let li = $(html).find('li.subscribed-list-list');
      console.log('li count = %s', li.length);

      for (let i = 0; i < li.length; i++) {
        bloglist.push(li[i]);
      }
    }

    updateCaption(`リスト作成中...`);
    console.info('blog count = %s', bloglist.length);

    let summary = "";
    for (let i in bloglist) {
      let ans = parse(bloglist[i]);
      console.log(ans);
      summary += 
        `<div style="display: flex;">
          <div style="width:60px;">
          <img src="${ans.img}" width="48" >
          </div>
          <div style="margin-bottom:10px; width: calc(100% - 60px);">
          <span style="font-size:115%; font-weight:bold">${ans.blogname}</span><br>
          <a href="${ans.link}" target="_blank" rel="noopener noreferrer" class="x_x" data-opened="0">${ans.title}</a> ${ans.jsttime}
          </div>
        </div>`
    }

    updateCaption(bloglist.length);
    $('div.l-admin-subscribe-wrapper').append(summary);

    $('nav.service-nav-actions').prepend(
      `<button class="service-nav-action-item action-item-edit" id="x_x_open">${maxwindows}個のリンクを開く
      <span class="badge badge-new" id="x_x_remains"></span>
      </button>`
    );
    $('#x_x_open').on('click', function(){
      let links = $('a.x_x[data-opened="0"]');
      for(let i=0; i<links.length && i<maxwindows; i++){
        links[i].dataset.opened='1';
        links[i].textContent = '✅'+ links[i].textContent;
        window.open(links[i].href);
      }
      updateButtonCaption();
    });

    updateButtonCaption();

    function updateButtonCaption(text){
      let remains = $('a.x_x[data-opened="0"]').length;
      $('span#x_x_remains').text(remains);
    }
    function updateCaption(text){
      $('h1.antenna-heading').text('購読リスト：' + text);
    }
    //liタグ（ブログ1個分）を解析する
    function parse(li) {
      const target = $(li);
      const blogname = target.find('a.entry-unit-blog-name').text().trim();
      const a = target.find('div.entry-unit-content h3.entry-unit-entry-title > a');
      const title = a.text().trim();
      const link = a.attr('href');
      const time = target.find('div.entry-unit-content div.entry-unit-entry-footer time.entry-unit-post-time');
      const utctime = time.attr('datetime');
      const jsttime = new Date(utctime).toLocaleString();
      const diff = time.text();

      const img = target.find('img.subscribed-list-icon').attr('src');
      return { blogname, title, link, utctime, jsttime, diff, img };
    }

    //HTMLを取りに行く
    async function getHTML(url) {
      const response = await fetch(url);
      const html = await response.text();
      return html;
    }
  }
)(5,5);
