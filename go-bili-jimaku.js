// ==UserScript==
// @name         go-bili-jimaku
// @namespace    https://raw.githubusercontent.com/nazonoa/go-bili-jimaku
// @version      1.0.0
// @description  bilibili任意视频挂载外部字幕
// @author       siianchan@foxmail.com
// @updateURL    https://raw.githubusercontent.com/nazonoa/go-bili-jimaku/main/go-bili-jimaku.js
// @downloadURL  https://raw.githubusercontent.com/nazonoa/go-bili-jimaku/main/go-bili-jimaku.js
// @run-at       document-idle
// @match        https://www.bilibili.com/video/*
// @icon         data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNzMzOTg0ODg5OTk3IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjQ1NDQiIGlkPSJteF9uXzE3MzM5ODQ4ODk5OTciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxwYXRoIGQ9Ik0xMDA0LjY5NjUzNiA4ODguMDQ0NDg1TDU3NC45NjUzMzQgNTAuNDQzNTU4YTkyLjgwODE1MSA5Mi44MDgxNTEgMCAwIDAtMTY2LjY3MTY1NCAzLjEwODMzNkwxNy4zMzU2NjIgODkxLjE1MjgyMmE5Mi44MDgxNTEgOTIuODA4MTUxIDAgMSAwIDE2OC4xODg5OTMgNzguNTAzOTFsMzEwLjgzMzY0OS02NjUuODYxNjU0TDcwMy45MjQ0NyA3MDguNDIzODg1SDUyNC42NDI2OTJhOTIuODA4MTUxIDkyLjgwODE1MSAwIDAgMCAwIDE4NS42MTYzMDFoMjI2LjExMzA2NWE5Mi4zNjYyMDcgOTIuMzY2MjA3IDAgMCAwIDQzLjAzMDU3My0xMC41NjI0NTFsNDUuODE0ODE3IDg5LjMwMjA2NWE5Mi44MDgxNTEgOTIuODA4MTUxIDAgMSAwIDE2NS4xNTQzMTUtODQuNzM1MzE1eiIgZmlsbD0iI2ZiNzI5OSIgcC1pZD0iNDU0NSI+PC9wYXRoPjwvc3ZnPg==
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @note         24-12-12 1.0.0 初版发布
// ==/UserScript==

(function () {
  "use strict";
  console.info("加载脚本--go-bilibili-jimaku--");
  const language = navigator.language;
  const bvid = getBvid();
  const jimakuId = getJimakuId();
  const host = "https://vsub.cn/jimaku-api";
  var jimakuSize = GM_getValue("jimaku-size") || "18";
  var jimakuData = {};
  var lastIndex = -1;
  var lastTime = 0;
  let css = `
    #trans-title {
      color: #95a5a6;
      font-weight: bold;
      font-size: 1.2rem;
    }
    #jimaku {
      padding: 2px 4px;
      border-radius: 2px;
      font-size: 18px;
      line-height: 1.6;
      color: white;
      background-color: rgba(0, 0, 0, 0.4);
    }
    #jimaku:empty {
      visibility: hidden;
    }
    #jimaku-wrap {
      width: 80%;
      top: 15px;
      position: absolute;
      text-align: center;
      z-index: 100;
      left: 50%;
      transform: translateX(-50%);
    }
    #jimaku-button-group {
      margin: 10px;
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: start;
    }
    .jimaku-button {
      padding: 5px;
      background-color: #00a1d6;
      border: none;
      border-radius: 5px;
      text-align: center;
      color: white;
      width: 50px;
      margin-right: 5px;
      font-size: 12px;
      cursor: pointer;
      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
      transition: background-color 0.3s;
    }
    .jimaku-button[data-state="ON"] {
      background-color: #4caf50;
    }
    .jimaku-button[data-state="OFF"] {
      background-color: #f44336;
    }
    .jimaku-button:hover {
      scale: 1.02;
    }
  `;
  GM_addStyle(css);
  function ajaxGet(url, onSuccess, onError) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          onSuccess(xhr.responseText);
        } else {
          onError(xhr.status, xhr.statusText);
        }
      }
    };
    xhr.send();
  }
  const loading = setInterval(() => {
    const search = document.querySelector(
      "#nav-searchform > div.nav-search-content"
    );
    if (search) {
      ajaxGet(
        host +
          "/getJimaku?bvid=" +
          bvid +
          "&lan=" +
          language +
          "&jimakuId=" +
          jimakuId,
        (ret) => {
          const obj = JSON.parse(ret);
          if (obj.code == 200) {
            jimakuData = obj.data;
            if (jimakuData.id != 0) {
              setTransTitle(jimakuData.title, jimakuData.author);
              loadJimaku();
              setButton();
            }
          }
        },
        (err) => {
          console.log(err);
        }
      );
      clearInterval(loading);
    }
  }, 100);

  function setTransTitle(titleName, author) {
    if (titleName == null || titleName == "") {
      return;
    }
    if (author == null || author == "") {
      author = "匿名";
    }
    const playerWrap = document.getElementById("playerWrap");
    const newTitleTrans = document.createElement("div");
    newTitleTrans.textContent = titleName + " 【@" + author + "】";
    newTitleTrans.style.padding = "10px";
    newTitleTrans.id = "trans-title";
    playerWrap.insertAdjacentElement("afterend", newTitleTrans);
  }

  function setJimaku() {
    const jimaku = document.createElement("span");
    const jimakuWrap = document.createElement("div");
    const player = document.querySelector(
      "#bilibili-player > div > div > div.bpx-player-primary-area > div.bpx-player-video-area > div.bpx-player-video-perch > div"
    );
    jimaku.id = "jimaku";
    jimakuWrap.id = "jimaku-wrap";
    player.insertBefore(jimakuWrap, player.firstChild);
    jimakuWrap.appendChild(jimaku);
    jimaku.style.fontSize = jimakuSize + "px";
    const playerContainer = document.querySelector(".bpx-player-container");
    const observer = new MutationObserver((mutationsList) => {
      console.log(mutationsList);
      mutationsList.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-screen"
        ) {
          const newValue = playerContainer.getAttribute("data-screen");
          if (newValue == "full") {
            jimaku.style.fontSize = "30px";
            jimakuWrap.style.top = "70px";
          } else if (newValue == "normal") {
            jimakuWrap.style.top = "15px";
            jimaku.style.fontSize = jimakuSize + "px";
          } else {
          }
        }
      });
    });
    observer.observe(playerContainer, {
      attributes: true,
      attributeFilter: ["data-screen"],
    });
  }

  function setButton() {
    const addElement =
      document.getElementById("trans-title") ||
      document.getElementById("playerWrap");
    const buttonGroup = document.createElement("div");
    buttonGroup.id = "jimaku-button-group";
    const turn = document.createElement("button");
    turn.setAttribute("data-state", "ON");
    turn.textContent = turn.getAttribute("data-state");
    turn.className = "jimaku-button";
    turn.id = "jimaku-button-switch";
    turn.addEventListener("click", () => {
      if (turn.getAttribute("data-state") == "ON") {
        turn.setAttribute("data-state", "OFF");
      } else {
        turn.setAttribute("data-state", "ON");
      }
      turn.textContent = turn.getAttribute("data-state");
      const jimakuWrap = document.getElementById("jimaku-wrap");
      if (jimakuWrap.style.display == "none") {
        jimakuWrap.style.display = "block";
      } else {
        jimakuWrap.style.display = "none";
      }
    });
    const jimakuSizeShow = document.createElement("span");
    jimakuSizeShow.textContent = jimakuSize + "px";
    const inputRange = document.createElement("input");
    inputRange.type = "range";
    inputRange.min = "12";
    inputRange.max = "30";
    inputRange.value = jimakuSize;
    const jimaku = document.getElementById("jimaku");
    inputRange.addEventListener("input", () => {
      const fontSize = inputRange.value + "px";
      jimakuSizeShow.textContent = fontSize;
      jimaku.style.fontSize = fontSize;
      GM_setValue("jimaku-size", inputRange.value);
    });
    buttonGroup.appendChild(turn);
    buttonGroup.appendChild(inputRange);
    buttonGroup.appendChild(jimakuSizeShow);
    addElement.insertAdjacentElement("afterend", buttonGroup);
  }

  function findSubtitleIndex(currentTime) {
    let left = 0;
    let right = jimakuData.detail.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const item = jimakuData.detail[mid];
      if (currentTime >= item.s && currentTime <= item.e) {
        return mid;
      } else if (currentTime < item.s) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    return -1;
  }

  function loadJimaku() {
    if (jimakuData.detail == null || jimakuData.detail.length == 0) {
      return;
    }
    setJimaku();
    const player = document.querySelector(
      "#bilibili-player > div > div > div.bpx-player-primary-area > div.bpx-player-video-area > div.bpx-player-video-perch > div > video"
    );
    player.addEventListener("timeupdate", () => {
      const currentTime = player.currentTime;
      const timeJumpThreshold = 1.0;
      if (Math.abs(currentTime - lastTime) > timeJumpThreshold) {
        lastIndex = -1;
      }
      if (lastIndex !== -1) {
        const lastItem = jimakuData.detail[lastIndex];
        if (currentTime >= lastItem.s && currentTime <= lastItem.e) {
          lastTime = currentTime;
          return;
        }
      }
      const index = findSubtitleIndex(currentTime);
      const jimaku = document.querySelector("#jimaku");
      if (index !== -1) {
        lastIndex = index;
        const item = jimakuData.detail[index];
        jimaku.textContent = item.t;
      } else {
        lastIndex = -1;
        jimaku.textContent = "";
      }
      lastTime = currentTime;
    });
  }
  function getJimakuId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("jimakuId");
  }
  function getBvid() {
    const match = window.location.href.match(/\/video\/(BV\w+)\//);
    return match ? match[1] : "";
  }
})();
