// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// @language_out ECMASCRIPT_2017
// ==/ClosureCompiler==
javascript: (

  async function () {
    //何ページ目まで繰り返すか、各自で変えてください。
    const maxpage = 5;

    const anntena = 'https://blog.hatena.ne.jp/-/antenna';
    if (window.location.href.indexOf("https://blog.hatena.ne.jp/-/antenna") != 0) {
      alert('ページが違うで');
      window.location.href = anntena;
    }

    const bloglist = [];

    for (let p = 1; p < maxpage; p++) {
      console.info('page:%s', p);
      let html = await getHTML(anntena + '?page=' + p);

      let li = $(html).find('li.subscribed-list-list');
      console.log('li count = %s', li.length);

      if (li.length > 0) {
        for (let i = 0; i < li.length; i++) {
          bloglist.push(li[i]);
        }
      } else {
        break;
      }
    }

    console.info('blog count = %s', bloglist.length);

    let summary = "";
    for (let i in bloglist) {
      let ans = parse(bloglist[i]);
      console.log(ans);
      summary = summary +
        `<p>
                 <img src="${ans.img}" width="48">
                 <span style="font-size:130%; font-weight:bold">${ans.blogname}</span> <a href="${ans.link}">${ans.title}</a> ${ans.jsttime}
                 </p>`
    }
    //console.log(summary);
    $('div.l-admin-subscribe-wrapper-right').remove();
    $('div.pager').remove();

    $('ul.subscribed-list').remove();
    $('h1.antenna-heading').text('購読リスト' + bloglist.length);
    $('div.l-admin-subscribe-wrapper-left').append(summary);


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
)();