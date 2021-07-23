<?php
//set your information
$hatenaId = 'kanaxx43';
$hatenaDomain = 'kanaxx43.hatenablog.com';
$password = '';

$ch = curl_init();
curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER,false);
curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
curl_setopt($ch, CURLOPT_USERPWD, "$hatenaId:$password");

$result = [];
$url = "https://blog.hatena.ne.jp/$hatenaId/$hatenaDomain/atom/entry";
$next = '';

do{
    echo "◆◆" . $url . PHP_EOL;
    $_ = getData($ch, $url);
    echo ''. $_['code'] . PHP_EOL;

    $xml = new SimpleXMLElement($_['result']);
    $ns = $xml->getNamespaces(true);
    
    $next = (string)getLinkHref($xml->link, 'next');
    echo 'next=' . $next . PHP_EOL;
    echo '--- entry ---' . PHP_EOL;

    foreach($xml->entry as $n=>$entry){
        $id =  (string)$entry->id;
        $atomurl = (string)getLinkHref($entry->link, 'edit');
        $title = (string)$entry->title;
        $content = (string)$entry->content;
        $updated = (string)$entry->updated;
        $categories = [];
        foreach($entry->category as $n=>$tag){
            $categories[] = (string)$tag['term'];
        }

        echo $title . PHP_EOL;
        echo $updated . PHP_EOL;
        echo $atomurl . PHP_EOL;
        
        $draft = (string)$entry->children("app", true)->control->draft;
        if($draft==='yes'){
            echo '[skip] this entry is DRAFT' . PHP_EOL;
            $cnt = $result['draft']??0;
            $result['draft']=$cnt+1;
            continue;
        }

        echo 'call update api' .PHP_EOL;
        $postResult = postDataToHatena($ch, $atomurl, $title, $content, $updated, $categories);
        $code = $postResult['code'];
        
        $cnt = $result[$code]??0;
        $result[$code]=$cnt+1;
        echo $code . '|' . $postResult['error'] .PHP_EOL.PHP_EOL;
    }
    if(!empty($next)){
        $url = $next;
    }
}while(!empty($next));

curl_close($ch);
echo '----' .PHP_EOL;
foreach($result as $code=>$cnt){
    echo "$code:$cnt" .PHP_EOL;
}
echo 'end of program.' . PHP_EOL;

//----------

function getLinkHref($links, $rel){
    foreach($links as $n=>$link){
        if($link['rel']==$rel){
            return $link['href'];
        }
    }
    return null;
}

function getData($curl, $url){
    curl_setopt($curl, CURLOPT_URL,$url);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'GET');
    curl_setopt($curl, CURLOPT_POST, false);

    $result = curl_exec($curl);
    $code = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    return ['code'=>$code, 'result'=>$result];
}

function postDataToHatena($curl, $url, $title, $content, $updated, $categories){
    $categoryTag = '';
    foreach($categories as $n=>$name){
        $categoryTag .= "<category term=\"$name\"></category>";
    }

    $postxml = <<<EOD
<?xml version="1.0" encoding="utf-8"?><entry xmlns="http://www.w3.org/2005/Atom" xmlns:app="http://www.w3.org/2007/app">
<title>{$title}</title>
<updated>{$updated}</updated>
{$categoryTag}
<content type="text/plain"><![CDATA[ $content ]]></content>
</entry>
EOD;

    curl_setopt($curl, CURLOPT_POST, TRUE);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_POSTFIELDS, $postxml);
    // curl_setopt($curl, CURLOPT_VERBOSE, 1);

    $result = curl_exec($curl);
    $code = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    
    return ['code'=>$code, 'result'=>$result, 'error'=>$error];
}
