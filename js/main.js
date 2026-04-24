console.log(
  "\n %c HeoMusic 开源静态音乐播放器 %c https://github.com/zhheo/HeoMusic \n",
  "color: #fadfa3; background: #030307; padding:5px 0;",
  "background: #fadfa3; padding:5px 0;",
);
var local = true;
var isScrolling = false;
var scrollTimer = null;
var animationFrameId = null;

// 检查本地音乐配置
if (typeof localMusic === "undefined" || !Array.isArray(localMusic) || localMusic.length === 0) {
  console.error("请先在 config.js 中配置本地音乐列表 localMusic");
  document.getElementById("heoMusic-page").innerHTML =
    '<div style="text-align:center;padding:50px;color:#fff;">请在 config.js 中配置本地音乐</div>';
}

var volume = 0.8;

const params = new URLSearchParams(window.location.search);

// 编码非 ASCII 字符的函数
function encodeNonAscii(str) {
  return str.replace(/[^\x00-\x7F]/g, function (c) {
    return encodeURIComponent(c);
  });
}

// 初始化本地音乐播放器
function initLocalPlayer() {
  if (typeof localMusic === "undefined" || !Array.isArray(localMusic) || localMusic.length === 0) {
    return;
  }

  var encodedLocalMusic = localMusic.map((item) => ({
    name: item.name,
    artist: item.artist,
    url: encodeNonAscii(item.url),
    cover: encodeNonAscii(item.cover),
    lrc: encodeNonAscii(item.lrc),
  }));

  document.getElementById("heoMusic-page").classList.add("localMusic");

  window.ap = new APlayer({
    container: document.getElementById("heoMusic-page"),
    lrcType: 3,
    audio: encodedLocalMusic,
    listFolded: window.innerWidth < 768 ? true : false,
  });

  heo.setupMediaSessionHandlers(ap);
}

var heo = {
  handleScrollOrTouch: function (event, isTouchEvent) {
    let targetElement = event.target;
    let isInTargetArea = false;

    while (targetElement && targetElement !== document) {
      if (targetElement.classList) {
        if (isTouchEvent) {
          if (
            targetElement.classList.contains("aplayer-body") ||
            targetElement.classList.contains("aplayer-lrc")
          ) {
            isInTargetArea = true;
            break;
          }
        } else {
          if (targetElement.classList.contains("aplayer-body")) {
            isInTargetArea = true;
            break;
          }
        }
      }
      targetElement = targetElement.parentNode;
    }

    if (isInTargetArea) {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      isScrolling = true;

      if (scrollTimer !== null) {
        clearTimeout(scrollTimer);
      }

      const timeoutDuration = isTouchEvent ? 4500 : 4000;
      scrollTimer = setTimeout(function () {
        isScrolling = false;
        heo.scrollLyric();
      }, timeoutDuration);
    }
  },

  initScrollEvents: function () {
    document.addEventListener(
      "wheel",
      (event) => {
        this.handleScrollOrTouch(event, false);
      },
      { passive: true },
    );

    document.addEventListener(
      "touchmove",
      (event) => {
        this.handleScrollOrTouch(event, true);
      },
      { passive: true },
    );
  },

  scrollLyric: function () {
    if (isScrolling) {
      return;
    }

    const lrcContent = document.querySelector(".aplayer-lrc");
    const currentLyric = document.querySelector(".aplayer-lrc-current");

    if (lrcContent && currentLyric) {
      let startScrollTop = lrcContent.scrollTop;
      let targetScrollTop =
        currentLyric.offsetTop - (window.innerHeight - 150) * 0.3;
      let distance = targetScrollTop - startScrollTop;
      let duration = 600;
      let startTime = null;

      function easeOutQuad(t) {
        return t * (2 - t);
      }

      function animateScroll(currentTime) {
        if (isScrolling) {
          animationFrameId = null;
          return;
        }

        if (startTime === null) startTime = currentTime;
        let timeElapsed = currentTime - startTime;
        let progress = Math.min(timeElapsed / duration, 1);
        let easeProgress =
          window.innerWidth < 768 ? progress : easeOutQuad(progress);
        lrcContent.scrollTop = startScrollTop + distance * easeProgress;

        if (timeElapsed < duration) {
          animationFrameId = requestAnimationFrame(animateScroll);
        } else {
          animationFrameId = null;
        }
      }

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(animateScroll);
    }
  },

  bindEvents: function () {
    var e = this;
    if (this.lrc) {
      this.template.lrc.addEventListener("click", function (event) {
        var target = event.target;
        if (target.tagName.toLowerCase() === "p") {
          var lyrics = e.template.lrc.getElementsByTagName("p");
          for (var i = 0; i < lyrics.length; i++) {
            if (lyrics[i] === target) {
              if (e.lrc.current[i]) {
                var time = e.lrc.current[i][0];
                e.seek(time);
                if (e.paused) {
                  e.play();
                }
              }
              break;
            }
          }
        }
      });
    }
  },

  addLyricClickEvent: function () {
    const lrcContent = document.querySelector(".aplayer-lrc-contents");

    if (lrcContent) {
      lrcContent.addEventListener("click", function (event) {
        if (event.target.tagName.toLowerCase() === "p") {
          const lyrics = lrcContent.getElementsByTagName("p");
          for (let i = 0; i < lyrics.length; i++) {
            if (lyrics[i] === event.target) {
              const player = ap;
              if (player.lrc.current[i]) {
                const time = player.lrc.current[i][0];
                player.seek(time);
                isScrolling = false;
                clearTimeout(scrollTimer);
                if (player.paused) {
                  player.play();
                }
              }
              event.stopPropagation();
              break;
            }
          }
        }
      });
    }
  },

  // 缓存 artwork 避免重复请求
  _artworkCache: {},

  setMediaMetadata: function (aplayerObj, isSongPlaying) {
    const audio = aplayerObj.list.audios[aplayerObj.list.index];
    const coverUrl = audio.cover || "./img/icon.webp";
    const currentLrcContent = document
      .getElementById("heoMusic-page")
      .querySelector(".aplayer-lrc-current").textContent;
    let songName, songArtist;

    if ("mediaSession" in navigator) {
      if (isSongPlaying && currentLrcContent) {
        songName = currentLrcContent;
        songArtist = `${audio.artist} / ${audio.name}`;
      } else {
        songName = audio.name;
        songArtist = audio.artist;
      }

      // 使用缓存的 artwork 或创建新的
      if (!this._artworkCache[coverUrl]) {
        this._artworkCache[coverUrl] = [
          { src: coverUrl, sizes: "96x96", type: "image/jpeg" },
          { src: coverUrl, sizes: "128x128", type: "image/jpeg" },
          { src: coverUrl, sizes: "192x192", type: "image/jpeg" },
          { src: coverUrl, sizes: "256x256", type: "image/jpeg" },
          { src: coverUrl, sizes: "384x384", type: "image/jpeg" },
          { src: coverUrl, sizes: "512x512", type: "image/jpeg" },
        ];
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: songName,
        artist: songArtist,
        album: audio.album,
        artwork: this._artworkCache[coverUrl],
      });
    } else {
      console.log("当前浏览器不支持 Media Session API");
      document.title = `${audio.name} - ${audio.artist}`;
    }
  },

  setupMediaSessionHandlers: function (aplayer) {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => {
        aplayer.play();
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        aplayer.pause();
      });

      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekforward", null);

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        aplayer.skipBack();
      });

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        aplayer.skipForward();
      });

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.fastSeek && "fastSeek" in aplayer.audio) {
          aplayer.audio.fastSeek(details.seekTime);
        } else {
          aplayer.audio.currentTime = details.seekTime;
        }
      });

      aplayer.on("loadeddata", () => {
        heo.setMediaMetadata(aplayer, false);
      });

      aplayer.on("play", () => {
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing";
          heo.setMediaMetadata(aplayer, true);
        }
      });

      aplayer.on("pause", () => {
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "paused";
          heo.setMediaMetadata(aplayer, false);
        }
      });

      aplayer.on("timeupdate", () => {
        heo.setMediaMetadata(aplayer, true);
      });
    }
  },

  updateThemeColorWithImage(img) {
    if (local) {
      const updateThemeColor = (colorThief) => {
        const dominantColor = colorThief.getColor(img);
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          const r = Math.round(dominantColor[0] * 0.6);
          const g = Math.round(dominantColor[1] * 0.6);
          const b = Math.round(dominantColor[2] * 0.6);
          metaThemeColor.setAttribute("content", `rgb(${r},${g},${b})`);
        }
      };

      if (typeof ColorThief === "undefined") {
        const script = document.createElement("script");
        script.src = "./js/color-thief.min.js";
        script.onload = () => updateThemeColor(new ColorThief());
        document.body.appendChild(script);
      } else {
        updateThemeColor(new ColorThief());
      }
    }
  },

  scrollLyricToTop: function () {
    const lrcContent = document.querySelector(".aplayer-lrc");
    if (lrcContent) {
      lrcContent.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  },

  init: function () {
    this.initScrollEvents();
    initLocalPlayer();
  },
};

document.addEventListener("keydown", function (event) {
  if (event.code === "Space") {
    event.preventDefault();
    ap.toggle();
  }
  if (event.keyCode === 39) {
    event.preventDefault();
    ap.skipForward();
  }
  if (event.keyCode === 37) {
    event.preventDefault();
    ap.skipBack();
  }
  if (event.keyCode === 38) {
    if (volume <= 1) {
      volume += 0.1;
      ap.volume(volume, true);
    }
  }
  if (event.keyCode === 40) {
    if (volume >= 0) {
      volume += -0.1;
      ap.volume(volume, true);
    }
  }
});

window.addEventListener("resize", function () {
  if (window.innerWidth > 768) {
    ap.list.show();
  } else {
    ap.list.hide();
  }
});

heo.init();
