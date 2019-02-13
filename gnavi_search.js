// -----------------------------search
// Geolocation APIに対応しているか？
if(!navigator.geolocation) {
  alert("この端末では位置情報が取得できません");
}

// 緯度と経度
var lati = 0;
var longi = 0;

// 現在地取得処理
function getPosition() {
  // 現在地を取得
  navigator.geolocation.getCurrentPosition(
    function(position) {
      lati = position.coords.latitude;
      longi = position.coords.longitude;
      alert("緯度:" + lati + ",経度:" + longi);
    },
    function(error) {
      switch(error.code) {
        case 1: //PERMISSION_DENIED
          alert("位置情報の利用が許可されていません");
          break;
        case 2: //POSITION_UNAVAILABLE
          alert("現在位置が取得できませんでした");
          break;
        case 3: //TIMEOUT
          alert("タイムアウト");
          break;
        default:
          alert("エラーコード:" + error.code);
          break;
      }
    }
  );
}

function search_html_onload() {
  $(function() {
    // 検索
    $("#search").on("click", function() {
      document.location = "result.html?latitude=" + lati + "&longitude=" + longi
                        + "&range=" + $("#range").val() + "&offset_page=1"
                        + "&freeword=" + encodeURIComponent($("#freeword").val());
    });

    // ページ更新時の処理: 現在地取得
    getPosition();

  });
}

if(location.pathname.indexOf("search.html") > 0) {
  search_html_onload();
}


// ---------------------------------------result

// GETパラメータを取得
function getQueryString() {
  if(document.location.search.length <= 1) {
    return null;
  }
  
  var params = document.location.search.substring(1).split('&');
  var result = new Object();
  for(var i = 0; i < params.length; i++) {
    var elem = params[i].split('=');
    result[decodeURIComponent(elem[0])] = decodeURIComponent(elem[1]);
  }
  return result;
}

// アクセスの文字列化
function getAccessString(access) {
  var str = access.line + access.station + access.station_exit;
  if(access.walk) {
    str += "より" + access.walk + "分";
  }
  if(access.note) {
    str += "(" + access.note + ")";
  }
  return str;
}

// 検索結果表示
function showResult(result) {
  // テーブルをヘッダ以外クリア
  $("#table td").parent().remove();
  // 検索結果を順次追加
  for(var i in result.rest) {
    var compile = _.template(document.getElementById('template').innerHTML);
    var html = compile({
        rest_id: result.rest[i].id,
        name: result.rest[i].name,
        access: getAccessString(result.rest[i].access),
        img1: result.rest[i].image_url.shop_image1,
        pr_short: result.rest[i].pr.pr_short
    });
    
    $("#table").append(html);
  }
}

// range表示
function showRange(query) {
  var range = 0;
  switch(query["range"]) {
  case "1":
    range = 300;
    break;
  case "2":
    range = 500;
    break;
  case "3":
    range = 1000;
    break;
  case "4":
    range = 2000;
    break;
  case "5":
    range = 3000;
    break;
  default:
    range = null;
    alert("範囲指定が不正です");
  }
  $("#range").html("現在地より" + range + "mの範囲にあるレストラン");
}

// 表示中のヒット番号を表示
function showHitNumbers(query, total) {
  var str = ((Number(query["offset_page"]) - 1)*10 + 1);
  if(Number(query["offset_page"])*10 < total) {
    str += "~" + (Number(query["offset_page"])*10);
  } else {
    str += "~" + total;
  }
  $(".page").html(str + "/" + total);
}

function result_html_onload() {
  $(function() {
    var query = getQueryString();
    var url = "https://api.gnavi.co.jp/RestSearchAPI/v3/";
    var params = {
      keyid: "21a74b591f5aca9b1ebde8b6c7609ebb",
      latitude: query["latitude"],
      longitude: query["longitude"],
      range: query["range"],
      offset_page: query["offset_page"],
      freeword: query["freeword"]
    };

    var total = 0;
    
    // 検索
    $.getJSON(url, params, function(result) {
      showResult(result);
      total = result.total_hit_count;
      // freeword表示
      if(query["freeword"]) {
        $("#freeword").html("フリーワード\"" + query["freeword"] + "\"で");
      }
      showRange(query);
      showHitNumbers(query, total);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
      // エラー
      alert(jqXHR.status + ":" + errorThrown);
    });
    
    // 「前」クリック
    $(".prev").click(function() {
      // 前ページがなければ何もしない
      if(query["offset_page"] <= 1) {
        return;
      }
      // 前ページに飛ぶ
      document.location = "result.html?latitude=" + query["latitude"] + "&longitude=" + query["longitude"]
            + "&range=" + query["range"] + "&offset_page=" + (Number(query["offset_page"]) - 1)
            + "&freeword=" + encodeURIComponent(query["freeword"]);
    });
    
    // 「次」クリック
    $(".next").click(function() {
      // 次ページがなければ何もしない
      if(Number(query["offset_page"])*10 >= total) {
        return;
      }
      // 次ページに飛ぶ
      document.location = "result.html?latitude=" + query["latitude"] + "&longitude=" + query["longitude"]
            + "&range=" + query["range"] + "&offset_page=" + (Number(query["offset_page"]) + 1)
            + "&freeword=" + encodeURIComponent(query["freeword"]);
    });
  });
}

if(location.pathname.indexOf("result.html") > 0) {
  result_html_onload();
}

// ---------------------------------------------------------detail
function getDevice() {
  var ua = navigator.userAgent;
  if((ua.indexOf('iPhone') > 0 || ua.indexOf('iPod') > 0
        || ua.indexOf('Android') > 0 && ua.indexOf('Mobile') > 0)
        || ua.indexOf('iPad') > 0 || ua.indexOf('Android') > 0) {
    return 'mobile';
  }else{
    return 'other';
  }
}

// 結果の表示
function showDetail(result) {
  rest = result.rest[0];
  $("#name").html(rest.name);
  $("#name_kana").html(rest.name_kana);
  $("#pr_short").html(rest.pr.pr_short);
  $("#pr_long").html(rest.pr.pr_long);
  $("#address").html(rest.address);
  $("#tel").html(rest.tel);
  $("#opentime").html(rest.opentime);
  $("#holiday").html(rest.holiday);
  $("#image").html("<img src=\"" + rest.image_url.shop_image1 + "\">"
    + "<img src=\"" + rest.image_url.shop_image2 + "\">");
  
  var device = getDevice();
  if(device == "mobile") {
    $("#url").html("<a href=\"" + rest.url_mobile + "\">" + rest.url_mobile + "</a>");
  } else {
    $("#url").html("<a href=\"" + rest.url + "\">" + rest.url + "</a>");
  }
  
}

// ページ更新時の処理
function detail_html_onload() {
  $(function() {
    var query = getQueryString();
    if(!query["rest_id"]) {
      alert("店舗idを指定してください");
      return;
    }
    
    var url = "https://api.gnavi.co.jp/RestSearchAPI/v3/";
    var params = {
      keyid: "21a74b591f5aca9b1ebde8b6c7609ebb",
      id: query["rest_id"]
    };
    $.getJSON(url, params, function(result) {
      showDetail(result);
    });
  });
}

if(location.pathname.indexOf("detail.html") > 0) {
  detail_html_onload();
}
