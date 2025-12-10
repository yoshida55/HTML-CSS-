// 右クリックされた要素を保存
var lastRightClickedElement = null;
var sizeOverlayVisible = false;

// Ctrl+クリック距離測定用
var distanceMeasureFirstElement = null;
var distanceMeasureHighlight = null;

console.log("CSS Jumper: content.js読み込み完了");

// 右クリック時に要素を記録
document.addEventListener("contextmenu", function(event) {
  lastRightClickedElement = event.target;
  console.log("CSS Jumper: 右クリック要素記録", lastRightClickedElement.className);
});

// Alt+クリックでVS Codeを開く
document.addEventListener("click", function(event) {
  if (event.altKey) {
    event.preventDefault();
    event.stopPropagation();
    
    var clickedElement = event.target;
    var classAttr = clickedElement.className;
    var classString = "";
    
    if (typeof classAttr === "string") {
      classString = classAttr;
    } else if (classAttr && classAttr.baseVal !== undefined) {
      classString = classAttr.baseVal;
    }
    
    if (!classString || !classString.trim()) {
      console.log("CSS Jumper: Alt+クリック - クラスなし");
      return;
    }
    
    var classes = classString.trim().split(/\s+/);
    var className = classes[0] || null;
    var allClasses = classes;
    
    console.log("CSS Jumper: Alt+クリック", className, allClasses);
    
    chrome.runtime.sendMessage({
      action: "classNameResult",
      className: className,
      allClasses: allClasses
    });
  }
}, true);

// Ctrl+クリックで要素からビューポート端までの距離を表示
document.addEventListener("click", function(event) {
  if (event.ctrlKey && !event.altKey && !event.shiftKey) {
    event.preventDefault();
    event.stopPropagation();
    
    var clickedElement = event.target;
    
    // CSS Jumperのオーバーレイは除外
    if (clickedElement.classList.contains("css-jumper-size-overlay") ||
        clickedElement.classList.contains("css-jumper-spacing-overlay") ||
        clickedElement.classList.contains("css-jumper-distance-overlay")) {
      return;
    }
    
    // 既存の距離表示を削除
    var existingOverlays = document.querySelectorAll(".css-jumper-distance-overlay");
    for (var i = 0; i < existingOverlays.length; i++) {
      existingOverlays[i].remove();
    }
    
    var rect = clickedElement.getBoundingClientRect();
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;
    
    // 各方向の距離を計算
    var distanceLeft = Math.round(rect.left);
    var distanceRight = Math.round(viewportWidth - rect.right);
    var distanceTop = Math.round(rect.top);
    var distanceBottom = Math.round(viewportHeight - rect.bottom);
    
    // 要素をハイライト
    var highlight = document.createElement("div");
    highlight.className = "css-jumper-distance-overlay";
    highlight.style.cssText = 
      "position: fixed;" +
      "left: " + rect.left + "px;" +
      "top: " + rect.top + "px;" +
      "width: " + rect.width + "px;" +
      "height: " + rect.height + "px;" +
      "border: 3px solid #9C27B0;" +
      "background: rgba(156, 39, 176, 0.1);" +
      "z-index: 999998;" +
      "pointer-events: none;" +
      "box-sizing: border-box;";
    document.body.appendChild(highlight);
    
    // 左端までの距離ライン
    if (distanceLeft > 5) {
      var leftLine = document.createElement("div");
      leftLine.className = "css-jumper-distance-overlay";
      leftLine.style.cssText = 
        "position: fixed;" +
        "left: 0;" +
        "top: " + (rect.top + rect.height / 2) + "px;" +
        "width: " + rect.left + "px;" +
        "height: 2px;" +
        "background: #E91E63;" +
        "z-index: 999999;";
      document.body.appendChild(leftLine);
      
      var leftLabel = document.createElement("div");
      leftLabel.className = "css-jumper-distance-overlay";
      leftLabel.textContent = "←" + distanceLeft + "px";
      leftLabel.style.cssText = 
        "position: fixed;" +
        "left: " + (rect.left / 2 - 25) + "px;" +
        "top: " + (rect.top + rect.height / 2 - 20) + "px;" +
        "background: #E91E63;" +
        "color: white;" +
        "padding: 4px 8px;" +
        "font-size: 12px;" +
        "font-family: monospace;" +
        "border-radius: 4px;" +
        "z-index: 999999;";
      document.body.appendChild(leftLabel);
    }
    
    // 右端までの距離ライン
    if (distanceRight > 5) {
      var rightLine = document.createElement("div");
      rightLine.className = "css-jumper-distance-overlay";
      rightLine.style.cssText = 
        "position: fixed;" +
        "left: " + rect.right + "px;" +
        "top: " + (rect.top + rect.height / 2) + "px;" +
        "width: " + (viewportWidth - rect.right) + "px;" +
        "height: 2px;" +
        "background: #E91E63;" +
        "z-index: 999999;";
      document.body.appendChild(rightLine);
      
      var rightLabel = document.createElement("div");
      rightLabel.className = "css-jumper-distance-overlay";
      rightLabel.textContent = distanceRight + "px→";
      rightLabel.style.cssText = 
        "position: fixed;" +
        "left: " + (rect.right + (viewportWidth - rect.right) / 2 - 25) + "px;" +
        "top: " + (rect.top + rect.height / 2 - 20) + "px;" +
        "background: #E91E63;" +
        "color: white;" +
        "padding: 4px 8px;" +
        "font-size: 12px;" +
        "font-family: monospace;" +
        "border-radius: 4px;" +
        "z-index: 999999;";
      document.body.appendChild(rightLabel);
    }
    
    // クラス名を表示
    var className = clickedElement.className;
    if (typeof className === "object" && className.baseVal) {
      className = className.baseVal;
    }
    var displayName = className ? className.split(" ")[0] : clickedElement.tagName.toLowerCase();
    
    showNotification("要素: ." + displayName + " | 左: " + distanceLeft + "px, 右: " + distanceRight + "px", "success");
    
    // 5秒後に自動削除
    setTimeout(function() {
      var overlays = document.querySelectorAll(".css-jumper-distance-overlay");
      for (var i = 0; i < overlays.length; i++) {
        overlays[i].remove();
      }
    }, 5000);
  }
}, true);

// Escキーで選択をキャンセル
document.addEventListener("keydown", function(event) {
  if (event.key === "Escape" && distanceMeasureFirstElement) {
    if (distanceMeasureHighlight) {
      distanceMeasureHighlight.remove();
      distanceMeasureHighlight = null;
    }
    distanceMeasureFirstElement = null;
    showNotification("距離測定をキャンセル", "info");
  }
});

// background.jsからのメッセージを受信
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log("CSS Jumper: content.jsメッセージ受信", message);
  
  if (message.action === "getClassName") {
    var className = getFirstClassName();
    var allClasses = getAllClassNames();
    
    console.log("CSS Jumper: クラス名取得", className, allClasses);
    
    chrome.runtime.sendMessage({
      action: "classNameResult",
      className: className,
      allClasses: allClasses
    });
    
    sendResponse({ received: true });
  }
  
  if (message.action === "openUrl") {
    console.log("CSS Jumper: VS Code URLを開く", message.url);
    openVscodeUrl(message.url);
    sendResponse({ opened: true });
  }
  
  if (message.action === "toggleSizeDisplay") {
    console.log("CSS Jumper: サイズ表示トグル");
    toggleSizeDisplay();
    sendResponse({ toggled: true });
  }
  
  if (message.action === "showNotification") {
    showNotification(message.message, message.type || "info");
    sendResponse({ shown: true });
  }
  
  if (message.action === "getViewportInfo") {
    // ビューポート情報を返す
    var info = {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight
    };
    console.log("CSS Jumper: ビューポート情報を返す", info);
    sendResponse(info);
  }
  
  if (message.action === "toggleSpacingDisplay") {
    console.log("CSS Jumper: 距離表示トグル");
    toggleSpacingDisplay();
    sendResponse({ toggled: true });
  }
  
  if (message.action === "toggleBothDisplay") {
    console.log("CSS Jumper: 両方表示");
    showBothOverlays();
    sendResponse({ shown: true });
  }
  
  if (message.action === "getCssLinks") {
    // ページ内のCSSリンクを取得
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    var cssLinks = [];
    
    for (var i = 0; i < links.length; i++) {
      var href = links[i].href;
      // 外部CDN等は除外（ローカルのみ）
      if (href && (href.includes('127.0.0.1') || href.includes('localhost'))) {
        cssLinks.push(href);
      }
    }
    
    console.log("CSS Jumper: CSSリンク検出", cssLinks);
    sendResponse({ cssLinks: cssLinks });
  }
  
  return true;
});

// スクロールバー幅を取得
function getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth;
}

// デザイン基準（1rem = 10px）でmargin値を変換
function convertToDesignBasis(pixelValue) {
  // ブラウザの実際のhtml font-sizeを取得
  var htmlFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
  
  // rem値を逆算
  var remValue = pixelValue / htmlFontSize;
  
  // デザイン基準（1rem = 10px）で再計算
  var designBasisPx = remValue * 10;
  
  return Math.round(designBasisPx);
}

// 配置方法に基づいてスクロールバー補正値を計算
function getScrollbarCorrection(element) {
  var scrollbarWidth = getScrollbarWidth();
  
  // スクロールバーがなければ補正不要
  // デバッグ用：一時的に補正を無効化
  if (true || scrollbarWidth <= 0) {
    return { left: 0, right: 0 };
  }
  
  var style = window.getComputedStyle(element);
  var parent = element.parentElement;
  var parentStyle = parent ? window.getComputedStyle(parent) : null;
  
  // 要素の位置から中央寄せかどうかを判定
  var rect = element.getBoundingClientRect();
  var parentRect = parent ? parent.getBoundingClientRect() : { left: 0, right: window.innerWidth };
  
  // 親要素に対する左右の余白を計算
  var leftSpace = rect.left - parentRect.left;
  var rightSpace = parentRect.right - rect.right;
  
  // 左右の余白がほぼ等しい場合は中央寄せと判定（許容誤差10px）
  if (Math.abs(leftSpace - rightSpace) <= 10) {
    return {
      left: scrollbarWidth / 2,
      right: scrollbarWidth / 2
    };
  }
  
  // flexboxの中央寄せ判定
  if (parentStyle && 
      (parentStyle.display === 'flex' || parentStyle.display === 'inline-flex') &&
      parentStyle.justifyContent === 'center') {
    return {
      left: scrollbarWidth / 2,
      right: scrollbarWidth / 2
    };
  }
  
  // gridの中央寄せ判定
  if (parentStyle && 
      (parentStyle.display === 'grid' || parentStyle.display === 'inline-grid') &&
      parentStyle.justifyContent === 'center') {
    return {
      left: scrollbarWidth / 2,
      right: scrollbarWidth / 2
    };
  }
  
  // position: absoluteの判定
  if (style.position === 'absolute' || style.position === 'fixed') {
    var hasLeft = style.left !== 'auto';
    var hasRight = style.right !== 'auto';
    
    if (hasLeft && hasRight) {
      // 両方指定 → 中央的な配置
      return { left: scrollbarWidth / 2, right: scrollbarWidth / 2 };
    } else if (hasLeft) {
      // left基準 → 左は変わらない、右が縮む
      return { left: 0, right: scrollbarWidth };
    } else if (hasRight) {
      // right基準 → 右は変わらない、左が縮む
      return { left: scrollbarWidth, right: 0 };
    }
  }
  
  // 右寄りの場合（右余白が左余白より小さい）
  if (rightSpace < leftSpace - 10) {
    return {
      left: scrollbarWidth,
      right: 0
    };
  }
  
  // 左寄せ（デフォルト）
  return {
    left: 0,
    right: scrollbarWidth
  };
}

// サイズ表示をトグル
function toggleSizeDisplay() {
  if (sizeOverlayVisible) {
    removeSizeOverlay();
  } else {
    showSizeOverlay();
  }
}

// サイズオーバーレイを表示
function showSizeOverlay() {
  // 距離オーバーレイが表示されていたら削除
  removeSpacingOverlay();
  
  // まずスクロールを左上にリセット
  window.scrollTo(0, 0);
  
  // 少し待ってからサイズを計測
  setTimeout(function() {
    // ビューポート情報を取得
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;
    var documentWidth = document.documentElement.scrollWidth;
    var documentHeight = document.documentElement.scrollHeight;
    
    // 水平スクロールが発生しているか確認
    var hasHorizontalScroll = documentWidth > viewportWidth;
    
    console.log("CSS Jumper: ビューポート情報", {
      viewportWidth: viewportWidth,
      viewportHeight: viewportHeight,
      documentWidth: documentWidth,
      documentHeight: documentHeight,
      hasHorizontalScroll: hasHorizontalScroll
    });
    
    // ビューポート幅の表示（画面左上に固定）
    var viewportInfo = document.createElement("div");
    viewportInfo.className = "css-jumper-size-overlay css-jumper-viewport-info";
    viewportInfo.innerHTML = 
      "<strong>📐 ビューポート: " + viewportWidth + " × " + viewportHeight + "</strong>" +
      (hasHorizontalScroll ? 
        "<br><span style='color:#ff9800'>⚠ コンテンツ幅: " + documentWidth + "px（はみ出しあり）</span>" : 
        "<br><span style='color:#81c784'>✓ コンテンツ幅: " + documentWidth + "px</span>");
    
    viewportInfo.style.cssText = 
      "position: fixed;" +
      "left: 10px;" +
      "top: 10px;" +
      "background: rgba(0, 0, 0, 0.85);" +
      "color: white;" +
      "padding: 10px 14px;" +
      "font-size: 13px;" +
      "font-family: 'Segoe UI', sans-serif;" +
      "border-radius: 6px;" +
      "z-index: 999999;" +
      "pointer-events: none;" +
      "box-shadow: 0 4px 12px rgba(0,0,0,0.4);" +
      "line-height: 1.6;";
    
    document.body.appendChild(viewportInfo);
    
    // クラスを持つ要素のみを対象に（精度向上のため）
    var elements = document.querySelectorAll("[class]");
    var processedRects = []; // 重複防止用
    
    for (var i = 0; i < elements.length; i++) {
      var elem = elements[i];
      
      // 自身のオーバーレイはスキップ
      if (elem.classList && elem.classList.contains("css-jumper-size-overlay")) {
        continue;
      }
      
      // script, style, head 内の要素はスキップ
      if (elem.tagName === "SCRIPT" || elem.tagName === "STYLE" || elem.tagName === "HEAD" || elem.tagName === "META" || elem.tagName === "LINK") {
        continue;
      }
      
      // 検証ツールと同じ値を取得するためoffsetWidth/offsetHeightを使用
      var elemWidth = elem.offsetWidth;
      var elemHeight = elem.offsetHeight;
      
      // 小さすぎる要素はスキップ（幅20px未満または高さ12px未満）
      if (elemWidth < 20 || elemHeight < 12) {
        continue;
      }
      
      // 位置取得用にgetBoundingClientRectを使用（位置だけ）
      var rect = elem.getBoundingClientRect();
      
      // 画面外の要素はスキップ（最初の画面分だけ処理）
      if (rect.top > viewportHeight * 2 || rect.bottom < -viewportHeight) {
        continue;
      }
      
      // 重複チェック（同じ位置・サイズの要素はスキップ）
      var rectKey = Math.round(rect.left) + "," + Math.round(rect.top) + "," + elemWidth + "," + elemHeight;
      if (processedRects.indexOf(rectKey) !== -1) {
        continue;
      }
      processedRects.push(rectKey);
      
      var label = document.createElement("div");
      label.className = "css-jumper-size-overlay";
      
      var width = elemWidth;
      var height = elemHeight;
      
      // フォントサイズを取得
      var computedStyle = window.getComputedStyle(elem);
      var fontSize = Math.round(parseFloat(computedStyle.fontSize));
      
      // 幅がビューポートを超えている場合は警告色
      var bgColor = "rgba(33, 150, 243, 0.9)";
      if (width > viewportWidth) {
        bgColor = "rgba(255, 152, 0, 0.9)"; // オレンジ（警告）
      }
      
      // サイズとフォントサイズを表示
      label.textContent = width + "×" + height + " f" + fontSize;
      label.style.cssText = 
        "position: absolute;" +
        "left: " + (rect.left + window.scrollX) + "px;" +
        "top: " + (rect.top + window.scrollY) + "px;" +
        "background: " + bgColor + ";" +
        "color: white;" +
        "padding: 2px 6px;" +
        "font-size: 11px;" +
        "font-family: monospace;" +
        "border-radius: 3px;" +
        "z-index: 999998;" +
        "pointer-events: none;" +
        "white-space: nowrap;";
      
      document.body.appendChild(label);
    }
    
    sizeOverlayVisible = true;
    
    // 通知メッセージ
    var message = "✓ サイズ表示ON（ビューポート: " + viewportWidth + "px）";
    if (hasHorizontalScroll) {
      message = "⚠ サイズ表示ON（ビューポート: " + viewportWidth + "px、コンテンツがはみ出しています）";
      showNotification(message, "warning");
    } else {
      showNotification(message, "success");
    }
  }, 100);
}

// サイズオーバーレイを削除
function removeSizeOverlay() {
  var overlays = document.querySelectorAll(".css-jumper-size-overlay");
  for (var i = 0; i < overlays.length; i++) {
    overlays[i].remove();
  }
  
  sizeOverlayVisible = false;
  showNotification("サイズ表示OFF", "info");
}

// 距離表示用のフラグ
var spacingOverlayVisible = false;

// 距離表示をトグル
function toggleSpacingDisplay() {
  if (spacingOverlayVisible) {
    removeSpacingOverlay();
  } else {
    showSpacingOverlay();
  }
}

// 両方表示（サイズ＋距離を同時に表示）
function showBothOverlays() {
  // 既存のオーバーレイを削除
  removeSizeOverlay();
  removeSpacingOverlay();
  
  // スクロールをリセット
  window.scrollTo(0, 0);
  
  setTimeout(function() {
    // サイズ表示（距離を消さないバージョン）
    showSizeOverlayOnly();
    
    // 少し待ってから距離表示（サイズを消さないバージョン）
    setTimeout(function() {
      showSpacingOverlayOnly();
      showNotification("✓ サイズ＋距離を同時表示", "success");
    }, 50);
  }, 100);
}

// サイズオーバーレイのみ表示（他のオーバーレイを消さない）
function showSizeOverlayOnly() {
  var viewportWidth = window.innerWidth;
  var viewportHeight = window.innerHeight;
  var documentWidth = document.documentElement.scrollWidth;
  var hasHorizontalScroll = documentWidth > viewportWidth;
  
  // ビューポート情報
  var viewportInfo = document.createElement("div");
  viewportInfo.className = "css-jumper-size-overlay css-jumper-viewport-info";
  var bgColor = hasHorizontalScroll ? "rgba(255, 152, 0, 0.95)" : "rgba(33, 150, 243, 0.95)";
  viewportInfo.innerHTML = "<strong>📐 ビューポート: " + viewportWidth + " × " + viewportHeight + "</strong>";
  if (hasHorizontalScroll) {
    viewportInfo.innerHTML += "<br>⚠️ コンテンツ幅: " + documentWidth + "px（はみ出し）";
  }
  viewportInfo.style.cssText = 
    "position: fixed;" +
    "left: 10px;" +
    "top: 10px;" +
    "background: " + bgColor + ";" +
    "color: white;" +
    "padding: 10px 14px;" +
    "font-size: 13px;" +
    "font-family: 'Segoe UI', sans-serif;" +
    "border-radius: 6px;" +
    "z-index: 999999;" +
    "pointer-events: none;" +
    "box-shadow: 0 4px 12px rgba(0,0,0,0.4);" +
    "line-height: 1.6;";
  document.body.appendChild(viewportInfo);
  
  // クラスを持つ要素のサイズ表示
  var elements = document.querySelectorAll("[class]");
  var processedRects = [];
  
  for (var i = 0; i < elements.length; i++) {
    var elem = elements[i];
    if (elem.classList && elem.classList.contains("css-jumper-size-overlay")) continue;
    if (elem.classList && elem.classList.contains("css-jumper-spacing-overlay")) continue;
    if (elem.tagName === "SCRIPT" || elem.tagName === "STYLE" || elem.tagName === "HEAD") continue;
    
    var elemWidth = elem.offsetWidth;
    var elemHeight = elem.offsetHeight;
    if (elemWidth < 20 || elemHeight < 12) continue;
    
    var rect = elem.getBoundingClientRect();
    if (rect.top > viewportHeight * 2 || rect.bottom < -viewportHeight) continue;
    
    var rectKey = Math.round(rect.left) + "," + Math.round(rect.top) + "," + elemWidth + "," + elemHeight;
    if (processedRects.indexOf(rectKey) !== -1) continue;
    processedRects.push(rectKey);
    
    var label = document.createElement("div");
    label.className = "css-jumper-size-overlay";
    var bgColor = elemWidth > viewportWidth ? "rgba(255, 152, 0, 0.9)" : "rgba(33, 150, 243, 0.9)";
    // フォントサイズを取得
    var computedStyle = window.getComputedStyle(elem);
    var fontSize = Math.round(parseFloat(computedStyle.fontSize));
    label.textContent = elemWidth + "×" + elemHeight + " f" + fontSize;
    label.style.cssText = 
      "position: absolute;" +
      "left: " + (rect.left + window.scrollX) + "px;" +
      "top: " + (rect.top + window.scrollY) + "px;" +
      "background: " + bgColor + ";" +
      "color: white;" +
      "padding: 2px 6px;" +
      "font-size: 11px;" +
      "font-family: monospace;" +
      "border-radius: 3px;" +
      "z-index: 999998;" +
      "pointer-events: none;" +
      "white-space: nowrap;";
    document.body.appendChild(label);
  }
  sizeOverlayVisible = true;
}

// 距離オーバーレイのみ表示（他のオーバーレイを消さない）
function showSpacingOverlayOnly() {
  var viewportWidth = window.innerWidth;
  var viewportHeight = window.innerHeight;
  
  var elements = document.querySelectorAll("[class]");
  var processedElements = [];
  
  for (var i = 0; i < elements.length; i++) {
    var elem = elements[i];
    if (elem.classList.contains("css-jumper-spacing-overlay") || elem.classList.contains("css-jumper-size-overlay")) continue;
    if (elem.tagName === "SCRIPT" || elem.tagName === "STYLE" || elem.tagName === "HEAD") continue;
    
    var elemWidth = elem.offsetWidth;
    var elemHeight = elem.offsetHeight;
    if (elemWidth < 20 || elemHeight < 12) continue;
    
    var rect = elem.getBoundingClientRect();
    if (rect.top > viewportHeight * 2 || rect.bottom < -viewportHeight) continue;
    
    var key = Math.round(rect.left) + "," + Math.round(rect.top) + "," + elemWidth + "," + elemHeight;
    if (processedElements.indexOf(key) !== -1) continue;
    processedElements.push(key);
    
    var style = window.getComputedStyle(elem);
    var marginTop = Math.round(parseFloat(style.marginTop)) || 0;
    var marginLeft = Math.round(parseFloat(style.marginLeft)) || 0;
    var marginBottom = Math.round(parseFloat(style.marginBottom)) || 0;
    var marginRight = Math.round(parseFloat(style.marginRight)) || 0;
    
    // 中央寄せ（margin: auto）の場合、スクロールバー幅分を補正
    var scrollbarWidth = getScrollbarWidth();
    if (scrollbarWidth > 0 && Math.abs(marginLeft - marginRight) < 3) {
      // 左右のmarginがほぼ同じ = margin: auto で中央寄せ
      var scrollbarCorrection = Math.floor(scrollbarWidth / 2);
      marginLeft += scrollbarCorrection;
      marginRight += scrollbarCorrection;
    }
    
    // margin表示（ピンク/オレンジ）
    if (marginTop >= 5) {
      var mTop = document.createElement("div");
      mTop.className = "css-jumper-spacing-overlay";
      mTop.textContent = "↑" + marginTop;
      mTop.style.cssText = "position:absolute;left:" + (rect.left + window.scrollX + rect.width/2 - 20) + "px;top:" + (rect.top + window.scrollY - 18) + "px;background:rgba(233,30,99,0.9);color:white;padding:2px 6px;font-size:10px;font-family:monospace;border-radius:3px;z-index:999997;pointer-events:none;white-space:nowrap;";
      document.body.appendChild(mTop);
    }
    if (marginBottom >= 5) {
      var mBot = document.createElement("div");
      mBot.className = "css-jumper-spacing-overlay";
      mBot.textContent = "↓" + marginBottom;
      mBot.style.cssText = "position:absolute;left:" + (rect.left + window.scrollX + rect.width/2 - 20) + "px;top:" + (rect.bottom + window.scrollY + 2) + "px;background:rgba(233,30,99,0.9);color:white;padding:2px 6px;font-size:10px;font-family:monospace;border-radius:3px;z-index:999997;pointer-events:none;white-space:nowrap;";
      document.body.appendChild(mBot);
    }
    if (marginLeft >= 5) {
      var mLeft = document.createElement("div");
      mLeft.className = "css-jumper-spacing-overlay";
      mLeft.textContent = "←" + marginLeft;
      mLeft.style.cssText = "position:absolute;left:" + (rect.left + window.scrollX - 40) + "px;top:" + (rect.top + window.scrollY + rect.height/2 - 8) + "px;background:rgba(255,152,0,0.9);color:white;padding:2px 6px;font-size:10px;font-family:monospace;border-radius:3px;z-index:999997;pointer-events:none;white-space:nowrap;";
      document.body.appendChild(mLeft);
    }
    if (marginRight >= 5) {
      var mRight = document.createElement("div");
      mRight.className = "css-jumper-spacing-overlay";
      mRight.textContent = marginRight + "→";
      mRight.style.cssText = "position:absolute;left:" + (rect.right + window.scrollX + 4) + "px;top:" + (rect.top + window.scrollY + rect.height/2 - 8) + "px;background:rgba(255,152,0,0.9);color:white;padding:2px 6px;font-size:10px;font-family:monospace;border-radius:3px;z-index:999997;pointer-events:none;white-space:nowrap;";
      document.body.appendChild(mRight);
    }
  }
  spacingOverlayVisible = true;
}

// 距離オーバーレイを表示
function showSpacingOverlay() {
  // まず既存のオーバーレイを削除
  removeSpacingOverlay();
  removeSizeOverlay();
  
  window.scrollTo(0, 0);
  
  setTimeout(function() {
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;
    
    // ビューポート情報を表示
    var viewportInfo = document.createElement("div");
    viewportInfo.className = "css-jumper-spacing-overlay css-jumper-viewport-info";
    viewportInfo.innerHTML = "<strong>📐 距離表示モード（ビューポート: " + viewportWidth + "px）</strong>";
    viewportInfo.style.cssText = 
      "position: fixed;" +
      "left: 10px;" +
      "top: 10px;" +
      "background: rgba(156, 39, 176, 0.9);" +
      "color: white;" +
      "padding: 10px 14px;" +
      "font-size: 13px;" +
      "font-family: 'Segoe UI', sans-serif;" +
      "border-radius: 6px;" +
      "z-index: 999999;" +
      "pointer-events: none;" +
      "box-shadow: 0 4px 12px rgba(0,0,0,0.4);";
    document.body.appendChild(viewportInfo);
    
    // クラスを持つ要素のみを対象に
    var elements = document.querySelectorAll("[class]");
    var processedElements = [];
    
    for (var i = 0; i < elements.length; i++) {
      var elem = elements[i];
      
      // 自身のオーバーレイはスキップ
      if (elem.classList.contains("css-jumper-spacing-overlay") || 
          elem.classList.contains("css-jumper-size-overlay")) {
        continue;
      }
      
      // 非表示要素はスキップ
      if (elem.tagName === "SCRIPT" || elem.tagName === "STYLE" || 
          elem.tagName === "HEAD" || elem.tagName === "META" || elem.tagName === "LINK") {
        continue;
      }
      
      var elemWidth = elem.offsetWidth;
      var elemHeight = elem.offsetHeight;
      
      if (elemWidth < 20 || elemHeight < 12) {
        continue;
      }
      
      var rect = elem.getBoundingClientRect();
      
      // 画面外はスキップ
      if (rect.top > viewportHeight * 2 || rect.bottom < -viewportHeight) {
        continue;
      }
      
      // 重複チェック
      var key = Math.round(rect.left) + "," + Math.round(rect.top) + "," + elemWidth + "," + elemHeight;
      if (processedElements.indexOf(key) !== -1) {
        continue;
      }
      processedElements.push(key);
      
      // marginを取得
      var style = window.getComputedStyle(elem);
      var marginTop = Math.round(parseFloat(style.marginTop)) || 0;
      var marginLeft = Math.round(parseFloat(style.marginLeft)) || 0;
      var marginBottom = Math.round(parseFloat(style.marginBottom)) || 0;
      var marginRight = Math.round(parseFloat(style.marginRight)) || 0;
      
      // 中央寄せ（margin: auto）の場合、スクロールバー幅分を補正
      var scrollbarWidth = getScrollbarWidth();
      if (scrollbarWidth > 0 && Math.abs(marginLeft - marginRight) < 3) {
        // 左右のmarginがほぼ同じ = margin: auto で中央寄せ
        var scrollbarCorrection = Math.floor(scrollbarWidth / 2);
        marginLeft += scrollbarCorrection;
        marginRight += scrollbarCorrection;
      }
      
      // paddingを取得
      var paddingTop = Math.round(parseFloat(style.paddingTop)) || 0;
      var paddingLeft = Math.round(parseFloat(style.paddingLeft)) || 0;
      var paddingBottom = Math.round(parseFloat(style.paddingBottom)) || 0;
      var paddingRight = Math.round(parseFloat(style.paddingRight)) || 0;
      
      // padding表示（シアン色、5px以上の場合のみ）
      if (paddingTop >= 5) {
        var pTopLabel = document.createElement("div");
        pTopLabel.className = "css-jumper-spacing-overlay";
        pTopLabel.textContent = "p↓" + paddingTop;
        pTopLabel.style.cssText = 
          "position: absolute;" +
          "left: " + (rect.left + window.scrollX + rect.width / 2 + 20) + "px;" +
          "top: " + (rect.top + window.scrollY + 2) + "px;" +
          "background: rgba(0, 188, 212, 0.9);" +
          "color: white;" +
          "padding: 2px 6px;" +
          "font-size: 10px;" +
          "font-family: monospace;" +
          "border-radius: 3px;" +
          "z-index: 999997;" +
          "pointer-events: none;" +
          "white-space: nowrap;";
        document.body.appendChild(pTopLabel);
      }
      
      if (paddingLeft >= 5) {
        var pLeftLabel = document.createElement("div");
        pLeftLabel.className = "css-jumper-spacing-overlay";
        pLeftLabel.textContent = "p→" + paddingLeft;
        pLeftLabel.style.cssText = 
          "position: absolute;" +
          "left: " + (rect.left + window.scrollX + 2) + "px;" +
          "top: " + (rect.top + window.scrollY + rect.height / 2 + 10) + "px;" +
          "background: rgba(0, 188, 212, 0.9);" +
          "color: white;" +
          "padding: 2px 6px;" +
          "font-size: 10px;" +
          "font-family: monospace;" +
          "border-radius: 3px;" +
          "z-index: 999997;" +
          "pointer-events: none;" +
          "white-space: nowrap;";
        document.body.appendChild(pLeftLabel);
      }
      
      if (paddingBottom >= 5) {
        var pBottomLabel = document.createElement("div");
        pBottomLabel.className = "css-jumper-spacing-overlay";
        pBottomLabel.textContent = "p↑" + paddingBottom;
        pBottomLabel.style.cssText = 
          "position: absolute;" +
          "left: " + (rect.left + window.scrollX + rect.width / 2 + 20) + "px;" +
          "top: " + (rect.bottom + window.scrollY - 18) + "px;" +
          "background: rgba(0, 188, 212, 0.9);" +
          "color: white;" +
          "padding: 2px 6px;" +
          "font-size: 10px;" +
          "font-family: monospace;" +
          "border-radius: 3px;" +
          "z-index: 999997;" +
          "pointer-events: none;" +
          "white-space: nowrap;";
        document.body.appendChild(pBottomLabel);
      }
      
      if (paddingRight >= 5) {
        var pRightLabel = document.createElement("div");
        pRightLabel.className = "css-jumper-spacing-overlay";
        pRightLabel.textContent = paddingRight + "←p";
        pRightLabel.style.cssText = 
          "position: absolute;" +
          "left: " + (rect.right + window.scrollX - 45) + "px;" +
          "top: " + (rect.top + window.scrollY + rect.height / 2 + 10) + "px;" +
          "background: rgba(0, 188, 212, 0.9);" +
          "color: white;" +
          "padding: 2px 6px;" +
          "font-size: 10px;" +
          "font-family: monospace;" +
          "border-radius: 3px;" +
          "z-index: 999997;" +
          "pointer-events: none;" +
          "white-space: nowrap;";
        document.body.appendChild(pRightLabel);
      }
      
      // 上方向のmarginを表示（5px以上の場合のみ）
      if (marginTop >= 5) {
        var topLabel = document.createElement("div");
        topLabel.className = "css-jumper-spacing-overlay";
        topLabel.textContent = "↑" + marginTop;
        topLabel.style.cssText = 
          "position: absolute;" +
          "left: " + (rect.left + window.scrollX + rect.width / 2 - 20) + "px;" +
          "top: " + (rect.top + window.scrollY - 18) + "px;" +
          "background: rgba(233, 30, 99, 0.9);" +
          "color: white;" +
          "padding: 2px 6px;" +
          "font-size: 10px;" +
          "font-family: monospace;" +
          "border-radius: 3px;" +
          "z-index: 999997;" +
          "pointer-events: none;" +
          "white-space: nowrap;";
        document.body.appendChild(topLabel);
      }
      
      // 左方向のmarginを表示（5px以上）
      if (marginLeft >= 5) {
        var leftLabel = document.createElement("div");
        leftLabel.className = "css-jumper-spacing-overlay";
        leftLabel.textContent = "←" + marginLeft;
        leftLabel.style.cssText = 
          "position: absolute;" +
          "left: " + (rect.left + window.scrollX - 40) + "px;" +
          "top: " + (rect.top + window.scrollY + rect.height / 2 - 8) + "px;" +
          "background: rgba(255, 152, 0, 0.9);" +
          "color: white;" +
          "padding: 2px 6px;" +
          "font-size: 10px;" +
          "font-family: monospace;" +
          "border-radius: 3px;" +
          "z-index: 999997;" +
          "pointer-events: none;" +
          "white-space: nowrap;";
        document.body.appendChild(leftLabel);
      }
      
      // 下方向のmarginを表示（5px以上の場合のみ）
      if (marginBottom >= 5) {
        var bottomLabel = document.createElement("div");
        bottomLabel.className = "css-jumper-spacing-overlay";
        bottomLabel.textContent = "↓" + marginBottom;
        bottomLabel.style.cssText = 
          "position: absolute;" +
          "left: " + (rect.left + window.scrollX + rect.width / 2 - 20) + "px;" +
          "top: " + (rect.bottom + window.scrollY + 2) + "px;" +
          "background: rgba(233, 30, 99, 0.9);" +
          "color: white;" +
          "padding: 2px 6px;" +
          "font-size: 10px;" +
          "font-family: monospace;" +
          "border-radius: 3px;" +
          "z-index: 999997;" +
          "pointer-events: none;" +
          "white-space: nowrap;";
        document.body.appendChild(bottomLabel);
      }
      
      // 右方向のmarginを表示（5px以上）
      if (marginRight >= 5) {
        var rightLabel = document.createElement("div");
        rightLabel.className = "css-jumper-spacing-overlay";
        rightLabel.textContent = marginRight + "→";
        rightLabel.style.cssText = 
          "position: absolute;" +
          "left: " + (rect.right + window.scrollX + 2) + "px;" +
          "top: " + (rect.top + window.scrollY + rect.height / 2 - 8) + "px;" +
          "background: rgba(255, 152, 0, 0.9);" +
          "color: white;" +
          "padding: 2px 6px;" +
          "font-size: 10px;" +
          "font-family: monospace;" +
          "border-radius: 3px;" +
          "z-index: 999997;" +
          "pointer-events: none;" +
          "white-space: nowrap;";
        document.body.appendChild(rightLabel);
      }
      
      // Flex/Gridの親要素の場合、gapを表示
      var display = style.display;
      if (display === "flex" || display === "inline-flex" || display === "grid" || display === "inline-grid") {
        var gap = parseInt(style.gap) || 0;
        var columnGap = parseInt(style.columnGap) || gap;
        var rowGap = parseInt(style.rowGap) || gap;
        
        if (columnGap >= 5 || rowGap >= 5) {
          var gapLabel = document.createElement("div");
          gapLabel.className = "css-jumper-spacing-overlay";
          var gapText = "";
          if (columnGap === rowGap && columnGap > 0) {
            gapText = "gap:" + columnGap;
          } else {
            if (rowGap >= 5) gapText += "row:" + rowGap + " ";
            if (columnGap >= 5) gapText += "col:" + columnGap;
          }
          gapLabel.textContent = gapText.trim();
          gapLabel.style.cssText = 
            "position: absolute;" +
            "left: " + (rect.left + window.scrollX + 2) + "px;" +
            "top: " + (rect.top + window.scrollY + 2) + "px;" +
            "background: rgba(0, 150, 136, 0.9);" +
            "color: white;" +
            "padding: 2px 6px;" +
            "font-size: 10px;" +
            "font-family: monospace;" +
            "border-radius: 3px;" +
            "z-index: 999998;" +
            "pointer-events: none;" +
            "white-space: nowrap;";
          document.body.appendChild(gapLabel);
        }
        
        // Flex/Grid中央配置時の視覚的余白を計算（親子間の距離）
        var justifyContent = style.justifyContent;
        var alignItems = style.alignItems;
        
        // 親要素のborder幅を取得
        var borderLeft = Math.round(parseFloat(style.borderLeftWidth)) || 0;
        var borderRight = Math.round(parseFloat(style.borderRightWidth)) || 0;
        var borderTop = Math.round(parseFloat(style.borderTopWidth)) || 0;
        var borderBottom = Math.round(parseFloat(style.borderBottomWidth)) || 0;
        
        // 子要素が1つだけの場合、視覚的余白を計算
        var firstChild = elem.firstElementChild;
        if (firstChild && elem.children.length === 1) {
          var childRect = firstChild.getBoundingClientRect();
          
          // 横方向の視覚的余白（justify-content: center の場合）
          // border幅を引いて純粋な余白のみ表示
          if (justifyContent === "center" || justifyContent === "space-around" || justifyContent === "space-evenly") {
            var leftSpace = Math.round(childRect.left - rect.left) - borderLeft;
            var rightSpace = Math.round(rect.right - childRect.right) - borderRight;
            
            if (leftSpace >= 10) {
              var lSpaceLabel = document.createElement("div");
              lSpaceLabel.className = "css-jumper-spacing-overlay";
              lSpaceLabel.textContent = "⇥" + leftSpace;
              lSpaceLabel.style.cssText = 
                "position: absolute;" +
                "left: " + (rect.left + window.scrollX + leftSpace / 2 - 15) + "px;" +
                "top: " + (rect.top + window.scrollY + rect.height / 2 - 8) + "px;" +
                "background: rgba(121, 85, 72, 0.9);" +
                "color: white;" +
                "padding: 2px 6px;" +
                "font-size: 10px;" +
                "font-family: monospace;" +
                "border-radius: 3px;" +
                "z-index: 999998;" +
                "pointer-events: none;" +
                "white-space: nowrap;";
              document.body.appendChild(lSpaceLabel);
            }
            
            if (rightSpace >= 10) {
              var rSpaceLabel = document.createElement("div");
              rSpaceLabel.className = "css-jumper-spacing-overlay";
              rSpaceLabel.textContent = rightSpace + "⇤";
              rSpaceLabel.style.cssText = 
                "position: absolute;" +
                "left: " + (childRect.right + window.scrollX + rightSpace / 2 - 15) + "px;" +
                "top: " + (rect.top + window.scrollY + rect.height / 2 - 8) + "px;" +
                "background: rgba(121, 85, 72, 0.9);" +
                "color: white;" +
                "padding: 2px 6px;" +
                "font-size: 10px;" +
                "font-family: monospace;" +
                "border-radius: 3px;" +
                "z-index: 999998;" +
                "pointer-events: none;" +
                "white-space: nowrap;";
              document.body.appendChild(rSpaceLabel);
            }
          }
          
          // 縦方向の視覚的余白（align-items: center の場合）
          // border幅を引いて純粋な余白のみ表示
          if (alignItems === "center") {
            var topSpace = Math.round(childRect.top - rect.top) - borderTop;
            var bottomSpace = Math.round(rect.bottom - childRect.bottom) - borderBottom;
            
            if (topSpace >= 10) {
              var tSpaceLabel = document.createElement("div");
              tSpaceLabel.className = "css-jumper-spacing-overlay";
              tSpaceLabel.textContent = "⇣" + topSpace;
              tSpaceLabel.style.cssText = 
                "position: absolute;" +
                "left: " + (rect.left + window.scrollX + rect.width / 2 - 15) + "px;" +
                "top: " + (rect.top + window.scrollY + topSpace / 2 - 8) + "px;" +
                "background: rgba(121, 85, 72, 0.9);" +
                "color: white;" +
                "padding: 2px 6px;" +
                "font-size: 10px;" +
                "font-family: monospace;" +
                "border-radius: 3px;" +
                "z-index: 999998;" +
                "pointer-events: none;" +
                "white-space: nowrap;";
              document.body.appendChild(tSpaceLabel);
            }
          }
        }
      }
      
      // 右隣の兄弟要素との距離を計算
      var nextSibling = elem.nextElementSibling;
      if (nextSibling && nextSibling.offsetWidth > 0) {
        var nextRect = nextSibling.getBoundingClientRect();
        
        // 同じ行にある場合（横方向の距離）
        if (Math.abs(rect.top - nextRect.top) < rect.height / 2) {
          var horizontalGap = Math.round(nextRect.left - rect.right);
          if (horizontalGap >= 5 && horizontalGap < 200) {
            var hGapLabel = document.createElement("div");
            hGapLabel.className = "css-jumper-spacing-overlay";
            hGapLabel.textContent = "←" + horizontalGap + "→";
            hGapLabel.style.cssText = 
              "position: absolute;" +
              "left: " + (rect.right + window.scrollX + horizontalGap / 2 - 25) + "px;" +
              "top: " + (rect.top + window.scrollY + rect.height / 2 - 8) + "px;" +
              "background: rgba(63, 81, 181, 0.9);" +
              "color: white;" +
              "padding: 2px 6px;" +
              "font-size: 10px;" +
              "font-family: monospace;" +
              "border-radius: 3px;" +
              "z-index: 999998;" +
              "pointer-events: none;" +
              "white-space: nowrap;";
            document.body.appendChild(hGapLabel);
          }
        }
        
        // 大きなブロック要素間の縦方向距離（セクション間など）
        var blockTags = ["DIV", "SECTION", "ARTICLE", "HEADER", "FOOTER", "MAIN", "NAV", "ASIDE", "UL", "OL", "DL", "TABLE", "FORM", "H1", "H2", "H3", "H4", "H5", "H6", "P"];
        var isBlock = blockTags.indexOf(elem.tagName) !== -1;
        var isNextBlock = blockTags.indexOf(nextSibling.tagName) !== -1;
        
        // 両方がブロック要素の場合に表示（見出し要素は高さが小さいので条件を緩和）
        var minHeight = 12; // 見出し対応用に緩和
        if (isBlock && isNextBlock && elemWidth > 50 && elemHeight >= minHeight && nextSibling.offsetHeight >= minHeight) {
          var verticalGap = Math.round(nextRect.top - rect.bottom);
          if (verticalGap >= 10 && verticalGap < 300) {
            var vGapLabel = document.createElement("div");
            vGapLabel.className = "css-jumper-spacing-overlay";
            vGapLabel.textContent = "↕ " + verticalGap + "px";
            vGapLabel.style.cssText = 
              "position: absolute;" +
              "left: " + (Math.min(rect.left, nextRect.left) + window.scrollX + 5) + "px;" +
              "top: " + (rect.bottom + window.scrollY + verticalGap / 2 - 8) + "px;" +
              "background: rgba(103, 58, 183, 0.95);" +
              "color: white;" +
              "padding: 3px 8px;" +
              "font-size: 11px;" +
              "font-weight: bold;" +
              "font-family: monospace;" +
              "border-radius: 4px;" +
              "z-index: 999999;" +
              "pointer-events: none;" +
              "white-space: nowrap;" +
              "box-shadow: 0 2px 6px rgba(0,0,0,0.3);";
            document.body.appendChild(vGapLabel);
          }
        }
      }
    }
    
    spacingOverlayVisible = true;
    showNotification("✓ 距離（margin/gap）表示ON", "success");
  }, 100);
}

// 距離オーバーレイを削除
function removeSpacingOverlay() {
  var overlays = document.querySelectorAll(".css-jumper-spacing-overlay");
  for (var i = 0; i < overlays.length; i++) {
    overlays[i].remove();
  }
  
  spacingOverlayVisible = false;
}

// VS Code URLを開く
function openVscodeUrl(url) {
  console.log("CSS Jumper: openVscodeUrl実行", url);
  
  try {
    var link = document.createElement("a");
    link.href = url;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    
    setTimeout(function() {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
    }, 100);
    
    console.log("CSS Jumper: aタグクリック成功");
    return;
  } catch (err) {
    console.log("CSS Jumper: aタグクリック失敗", err);
  }
  
  try {
    window.location.href = url;
    console.log("CSS Jumper: location.href成功");
  } catch (err) {
    console.log("CSS Jumper: location.href失敗", err);
  }
}

// 最初のクラス名を取得
function getFirstClassName() {
  if (!lastRightClickedElement) {
    console.log("CSS Jumper: 要素が記録されていません");
    return null;
  }
  
  var classAttr = lastRightClickedElement.className;
  var classString = "";
  
  if (typeof classAttr === "string") {
    classString = classAttr;
  } else if (classAttr && classAttr.baseVal !== undefined) {
    classString = classAttr.baseVal;
  }
  
  if (!classString || !classString.trim()) {
    console.log("CSS Jumper: クラス属性が空です");
    return null;
  }
  
  var classes = classString.trim().split(/\s+/);
  console.log("CSS Jumper: 分割されたクラス", classes);
  return classes[0] || null;
}

// 全てのクラス名を取得
function getAllClassNames() {
  if (!lastRightClickedElement) return [];
  
  var classAttr = lastRightClickedElement.className;
  var classString = "";
  
  if (typeof classAttr === "string") {
    classString = classAttr;
  } else if (classAttr && classAttr.baseVal !== undefined) {
    classString = classAttr.baseVal;
  }
  
  if (!classString || !classString.trim()) return [];
  
  return classString.trim().split(/\s+/);
}

// 画面に通知を表示
function showNotification(message, type) {
  if (!type) type = "info";
  
  console.log("CSS Jumper: 通知表示", message, type);
  
  var existing = document.getElementById("css-jumper-notification");
  if (existing) {
    existing.remove();
  }
  
  var notification = document.createElement("div");
  notification.id = "css-jumper-notification";
  notification.textContent = message;
  
  var bgColor = "#2196f3";
  if (type === "success") bgColor = "#4caf50";
  if (type === "error") bgColor = "#f44336";
  if (type === "warning") bgColor = "#ff9800";
  
  notification.style.cssText = 
    "position: fixed;" +
    "bottom: 20px;" +
    "right: 20px;" +
    "background: " + bgColor + ";" +
    "color: #fff;" +
    "padding: 14px 24px;" +
    "border-radius: 8px;" +
    "font-size: 14px;" +
    "font-family: 'Segoe UI', sans-serif;" +
    "z-index: 999999;" +
    "box-shadow: 0 4px 16px rgba(0,0,0,0.3);" +
    "opacity: 0;" +
    "transform: translateY(20px);" +
    "transition: all 0.3s ease;" +
    "max-width: 400px;";
  
  document.body.appendChild(notification);
  
  setTimeout(function() {
    notification.style.opacity = "1";
    notification.style.transform = "translateY(0)";
  }, 10);
  
  setTimeout(function() {
    notification.style.opacity = "0";
    notification.style.transform = "translateY(-10px)";
    setTimeout(function() {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3500);
}
