// 右クリックメニューを作成
chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: "openCssInVscode",
    title: "VS CodeでCSS開く",
    contexts: ["all"]
  });
  
  chrome.contextMenus.create({
    id: "toggleSizeDisplay",
    title: "📐 サイズ表示",
    contexts: ["all"]
  });
  
  chrome.contextMenus.create({
    id: "toggleSpacingDisplay",
    title: "↕️ 距離表示（margin/gap）",
    contexts: ["all"]
  });
  
  console.log("CSS Jumper: メニュー作成完了");
});

// 右クリックメニューがクリックされた時の処理
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  console.log("CSS Jumper: メニュークリック", info.menuItemId);
  
  if (info.menuItemId === "openCssInVscode") {
    // content.jsにクラス名取得を依頼
    chrome.tabs.sendMessage(tab.id, { action: "getClassName" }, function(response) {
      if (chrome.runtime.lastError) {
        console.error("CSS Jumper: content.jsへの送信エラー", chrome.runtime.lastError);
        notifyUserToTab(tab.id, "ページをリロードしてください（F5）", "error");
      }
    });
  }
  
  if (info.menuItemId === "toggleSizeDisplay") {
    // 保存されたビューポート幅を取得してウィンドウをリサイズ
    chrome.storage.local.get(["targetViewportWidth"], function(result) {
      var targetWidth = result.targetViewportWidth || 1280;
      
      // 精密なリサイズ（リトライあり）
      resizeToTargetViewport(tab.id, tab.windowId, targetWidth, 1, function() {
        chrome.tabs.sendMessage(tab.id, { action: "toggleSizeDisplay" }, function(response) {
          if (chrome.runtime.lastError) {
            console.error("CSS Jumper: toggleSizeDisplay送信エラー", chrome.runtime.lastError);
            notifyUserToTab(tab.id, "ページをリロードしてください（F5）", "error");
          }
        });
      });
    });
  }
  
  if (info.menuItemId === "toggleSpacingDisplay") {
    // 保存されたビューポート幅を取得してウィンドウをリサイズ
    chrome.storage.local.get(["targetViewportWidth"], function(result) {
      var targetWidth = result.targetViewportWidth || 1280;
      
      // 精密なリサイズ（リトライあり）
      resizeToTargetViewport(tab.id, tab.windowId, targetWidth, 1, function() {
        chrome.tabs.sendMessage(tab.id, { action: "toggleSpacingDisplay" }, function(response) {
          if (chrome.runtime.lastError) {
            console.error("CSS Jumper: toggleSpacingDisplay送信エラー", chrome.runtime.lastError);
            notifyUserToTab(tab.id, "ページをリロードしてください（F5）", "error");
          }
        });
      });
    });
  }
});

// 精密なビューポートリサイズ関数（リトライあり、許容誤差0px）
function resizeToTargetViewport(tabId, windowId, targetViewportWidth, attempt, callback) {
  chrome.tabs.sendMessage(tabId, { action: "getViewportInfo" }, function(response) {
    if (chrome.runtime.lastError || !response) {
      // フォールバック：推定値でリサイズ
      var fallbackWindowWidth = targetViewportWidth + 87;
      chrome.windows.update(windowId, { width: fallbackWindowWidth }, function() {
        setTimeout(callback, 300);
      });
      return;
    }
    
    var currentViewport = response.viewportWidth;
    var diff = currentViewport - targetViewportWidth;
    
    // ピッタリ一致したらコールバック
    if (diff === 0) {
      callback();
      return;
    }
    
    // ウィンドウサイズを調整
    chrome.windows.get(windowId, function(win) {
      var targetWindowWidth = win.width - diff;
      
      chrome.windows.update(windowId, { width: targetWindowWidth }, function() {
        setTimeout(function() {
          chrome.tabs.sendMessage(tabId, { action: "getViewportInfo" }, function(resp2) {
            var newViewport = resp2 ? resp2.viewportWidth : targetViewportWidth;
            var newDiff = Math.abs(newViewport - targetViewportWidth);
            
            // まだずれていて、リトライ回数が残っていれば再試行
            if (newDiff > 0 && attempt < 5) {
              resizeToTargetViewport(tabId, windowId, targetViewportWidth, attempt + 1, callback);
            } else {
              callback();
            }
          });
        }, 300);
      });
    });
  });
}
// content.jsからのメッセージを受信
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log("CSS Jumper: メッセージ受信", message);
  
  if (message.action === "classNameResult") {
    handleClassName(message.className, message.allClasses);
  }
});

// クラス名を処理
async function handleClassName(className, allClasses) {
  console.log("CSS Jumper: クラス名処理開始", className, allClasses);
  
  if (!className) {
    notifyUser("クラス名が見つかりません（クラスのある要素を右クリックしてください）", "error");
    return;
  }

  // 保存されたCSSデータを取得
  var result;
  try {
    result = await chrome.storage.local.get(["projectPath", "cssFiles"]);
  } catch (e) {
    console.error("CSS Jumper: ストレージアクセスエラー", e);
    notifyUser("設定の読み込みに失敗しました", "error");
    return;
  }
  
  var projectPath = result.projectPath;
  var cssFiles = result.cssFiles || [];
  
  console.log("CSS Jumper: 設定確認", { 
    projectPath: projectPath, 
    cssFilesCount: cssFiles.length,
    cssFileNames: cssFiles.map(function(f) { return f.name; }),
    cssFilePaths: cssFiles.map(function(f) { return f.relativePath; })
  });

  if (!projectPath) {
    notifyUser("⚠️ プロジェクトパスが未設定です\n拡張機能アイコンをクリックして設定してください", "error");
    return;
  }
  
  if (cssFiles.length === 0) {
    notifyUser("⚠️ CSSファイルが未読み込みです\n拡張機能アイコンをクリックしてCSSを選択してください", "error");
    return;
  }

  // CSSファイルからクラス名を検索
  var searchResult = searchClassInCss(className, cssFiles, projectPath);
  
  console.log("CSS Jumper: 検索結果", searchResult);
  
  if (searchResult) {
    // VS Codeで該当行を開く
    var vscodeUrl = "vscode://file/" + searchResult.filePath + ":" + searchResult.lineNumber;
    console.log("CSS Jumper: VS Code URL", vscodeUrl);
    
    openInVscode(vscodeUrl);
    notifyUser("✓ ." + className + " → " + searchResult.fileName + ":" + searchResult.lineNumber, "success");
  } else {
    // 見つからない場合、全クラスで再検索
    for (var i = 0; i < allClasses.length; i++) {
      var cls = allClasses[i];
      if (cls === className) continue;
      
      var altResult = searchClassInCss(cls, cssFiles, projectPath);
      if (altResult) {
        var url = "vscode://file/" + altResult.filePath + ":" + altResult.lineNumber;
        openInVscode(url);
        notifyUser("✓ ." + cls + " → " + altResult.fileName + ":" + altResult.lineNumber, "success");
        return;
      }
    }
    
    // 検索失敗時に詳細情報を表示
    var fileNames = cssFiles.map(function(f) { return f.name; }).join(", ");
    notifyUser("「." + className + "」が見つかりません\n検索対象: " + fileNames, "error");
  }
}

// CSSファイル内でクラス名を検索
function searchClassInCss(className, cssFiles, projectPath) {
  // 除外ファイル
  var excludeFiles = ["reset.css", "normalize.css", "sanitize.css"];
  
  for (var f = 0; f < cssFiles.length; f++) {
    var file = cssFiles[f];
    
    // 除外ファイルをスキップ
    var isExcluded = false;
    for (var e = 0; e < excludeFiles.length; e++) {
      if (file.name.toLowerCase() === excludeFiles[e].toLowerCase()) {
        isExcluded = true;
        break;
      }
    }
    if (isExcluded) continue;
    
    // ファイル内容がない場合はスキップ
    if (!file.content) {
      console.warn("CSS Jumper: ファイル内容がありません", file.name);
      continue;
    }
    
    var lines = file.content.split("\n");
    
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      
      // .クラス名 { または .クラス名, または .クラス名: にマッチ
      var regex = new RegExp("\\.(" + escapeRegex(className) + ")(?:\\s*[{,:\\[]|\\s*$)", "i");
      
      if (regex.test(line)) {
        // 【修正】relativePath を使用してフルパスを構築
        var filePath;
        if (file.relativePath && file.relativePath !== file.name) {
          // 相対パスがある場合はそれを使用
          filePath = projectPath + "/" + file.relativePath;
        } else {
          // 後方互換性: css/ ディレクトリを仮定
          filePath = projectPath + "/css/" + file.name;
        }
        filePath = filePath.replace(/\\/g, "/");
        // 重複スラッシュを除去
        filePath = filePath.replace(/\/+/g, "/");
        
        console.log("CSS Jumper: マッチ発見", {
          className: className,
          file: file.name,
          line: i + 1,
          filePath: filePath
        });
        
        return {
          filePath: filePath,
          fileName: file.name,
          lineNumber: i + 1,
          lineContent: line.trim()
        };
      }
    }
  }
  
  return null;
}

// 正規表現の特殊文字をエスケープ
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// VS Codeを開く（content.js経由）
function openInVscode(url) {
  console.log("CSS Jumper: VS Codeを開く", url);
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "openUrl",
        url: url
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("CSS Jumper: openUrl送信エラー", chrome.runtime.lastError);
          // フォールバック: chrome.tabs.createを試す
          chrome.tabs.create({ url: url, active: false }, function() {
            if (chrome.runtime.lastError) {
              console.error("CSS Jumper: tabs.createも失敗", chrome.runtime.lastError);
              notifyUser("VS Codeを開けませんでした\nvscodeプロトコルの登録を確認してください", "error");
            }
          });
        } else {
          console.log("CSS Jumper: openUrl送信成功");
        }
      });
    }
  });
}

// ユーザーに通知（アクティブタブへ）
function notifyUser(message, type) {
  console.log("CSS Jumper: 通知", message, type);
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]) {
      notifyUserToTab(tabs[0].id, message, type);
    }
  });
}

// 特定タブに通知
function notifyUserToTab(tabId, message, type) {
  chrome.tabs.sendMessage(tabId, {
    action: "showNotification",
    message: message,
    type: type
  }, function() {
    if (chrome.runtime.lastError) {
      console.log("CSS Jumper: 通知送信失敗（ページリロードが必要）");
    }
  });
}
