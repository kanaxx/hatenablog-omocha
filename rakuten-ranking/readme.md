# ブログにランキングを埋めこむスクリプト
ブログページなどの静的ページに楽天のランキング情報を差し込むスクリプト

動作確認用のページ
https://kanaxx.github.io/rakuten-ranking/

# 設定
動かすすために必要なものが２つ

## テンプレートHTML
スクリプトが動作したあとに、HTMLを仕上げるための枠組み。

例

```HTML
 <div id="rakuten-aff-parts">
    <h3>楽天市場のリアルタイムランキング</h3>
    <div class="rakuten-aff-item">
      <span><span data-raku="rank"></span> 位</span><br>
      <span><span data-raku="itemPrice"></span> 円</span><br>
      <a href="" data-raku="affiliateUrl">
        <img src="" data-raku="mediumImageUrls" style="float:left">
        <span data-raku="itemName" class="font-size:70%;"></span>
      </a>
      <br style="clear: left;">
    </div>
  </div>
```

### ルール

- 一番大きな枠組は`id=rakuten-aff-parts`を付ける。ページ内に1つだけ
- rakuten-aff-partsの内側に、`class="rakuten-aff-item"`を作る
- class="rakuten-aff-item"の内側にデータ表示用のタグを作る。データ用のタグには、data-raku="APIのプロパティ名" にする

class="rakuten-aff-item"はランキング表示数だけコピーします。10位までなら10回繰り返します。繰り返されることを前提にデザインを組み立ててください。

# 値の埋め込み
テンプレートHTMLには、以下のルールにのっとってAPIの値を埋めこみます。

## 通常のテキスト
対象プロパティ：全般

サンプル
- &lt;span data-raku="itemName">&lt;/span>
- &lt;b data-raku="itemName" style="font-size:110%">&lt;/b>

タグに追加のスタイルや別のclassを定義しても問題ない

結果；
- &lt;span data-raku="itemName">実際の商品名&lt;/span>
- &lt;b data-raku="itemName">実際の商品名&lt;/b>   と置換されます。

## URL
対象プロパティ：itemUrl, affiliateUrl, shopUrlの3種

ルール：
aタグのdata-rakuにプロパティ名を付ける。

サンプル：
- &lt;a data-raku="raku_itemUrl" href="">&lt;/a>

結果：
- &lt;a data-raku="raku_itemUrl" href="https//item.rakuten.co.jp/xxx">&lt;/a>


## image
対象プロパティ：mediumImageUrls、smallImageUrlsの2つ

ルール：
imgタグにdata-rakuを付けるとsrcの値として展開される。

サンプル：
- &lt;img data-raku="raku_smallImageUrls" src="">

結果：
- &lt;img data-raku="raku_smallImageUrls" href="https//image.rakuten.co.jp/xxx">&lt;/a>


imgタグのsrcに画像URLが入る。ただし、画像が複数枚あるときでも1枚目を使う。


# 設定の変更
スクリプトに初期値を定義できるが、特定のページだけ動作を変えたい場合には追加で定義する。

```HTML
<div id="rakuten-aff-config">
  <input type="hidden" name="genreId" value="100316"> <!-- 楽天のジャンルID -->
  <input type="hidden" name="display" value="10">     <!-- 表示件数 -->
</div>
```

# 注意点
HTMLテンプレートが画面表示したタイミングで発火します。最下部にテンプレートを置いた場合は、一番下にスクロールするまで発火しません。



# 説明ページ
https://kanaxx.hatenablog.jp/entry/realtime-ranking-parts
