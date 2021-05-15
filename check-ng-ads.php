<?php

$sitemapUrl = 'https://kanaxx.hatebablog.jp/sitemap_index.xml';
$sitemapOrIndexUrls[] = $sitemapUrl;
$entryList = [];

do{
    $url = array_shift($sitemapOrIndexUrls);
    echo '-getting XML >> ' . $url . PHP_EOL;
    $xml = file_get_contents($url);
    $urlSet = new SimpleXMLElement($xml);
    echo ' got ' . count($urlSet) . ' entries.' . PHP_EOL;

    foreach($urlSet as $name=>$data){
        $loc =  (String)$data->loc;
        if($name == 'sitemap'){
            $sitemapOrIndexUrls[] = $loc;
            echo ' sitemap URL :' . $loc . PHP_EOL;
        }elseif($name == 'url'){
            $entryList[] = (string)$data->loc;
        }else{
            echo " somethign wrong <$name> tag." . PHP_EOL;
        }
    }
}while(!empty($sitemapOrIndexUrls));

$errorList=[];

foreach($entryList as $n=>$entryUrl){
    $html = file_get_contents($entryUrl);
    echo $entryUrl . PHP_EOL;
    if(preg_match_all('@\[asin\:[^:]*\:[^]]*\]@', $html, $_)){
        $errorList[]=['url'=>$entryUrl,'error'=>$_[0]];
    }
    if(preg_match_all('@\[rakuten\:[^:]*\:[^:]*\:[^]]*]@', $html, $_)){
        $errorList[]=['url'=>$entryUrl,'error'=>$_[0]];
    }
    usleep(50000);
}

echo "■結果".PHP_EOL;
echo "チェックしたURL：" .count($entryList) .PHP_EOL;
echo "エラーURL：" .count($errorList).PHP_EOL;
echo "■詳細：".PHP_EOL;

foreach($errorList as $n=>$result){
    echo $result['url'].PHP_EOL;
    foreach($result['error']??[] as $n=>$e){
        echo " $e" . PHP_EOL;
    }
}