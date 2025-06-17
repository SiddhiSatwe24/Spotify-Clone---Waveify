console.log("Let’s write JavaScript");

let currentSong = new Audio();
let songs = [];
let currFolder;

// User-defined play and pause button images
const userPlayButton = "img/play.svg"; // Replace with your custom play button image
const userPauseButton = "img/pause.svg"; // Replace with your custom pause button image

// Converts seconds to MM:SS format
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

// Fetches songs from a given folder
async function getSongs(folder) {
  currFolder = folder;

  try {
    const response = await fetch("http://127.0.0.1:3000/songs/");
    const responseText = await response.text();
    const div = document.createElement("div");
    div.innerHTML = responseText;
    const links = div.getElementsByTagName("a");

    songs = Array.from(links)
      .filter((link) => link.href.endsWith(".mp3"))
      .map((link) => link.href.split("http://127.0.0.1:3000/songs/")[1]);

    // Display songs in the playlist
    const songList = document.querySelector(".songList ul");
    songList.innerHTML = songs
      .map((song) => `
        <li>
          <img class="invert" width="34" src="img/music.svg" alt="">
          <div class="info">
            <div>${song.replaceAll("%20", " ")}</div>
            <div>Waveify</div>
          </div>
          <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="${userPlayButton}" alt="">
          </div>
        </li>
      `)
      .join("");

    // Add click event listeners to the songs
    Array.from(songList.getElementsByTagName("li")).forEach((songElement) => {
      songElement.addEventListener("click", () => {
        const songName = songElement.querySelector(".info div").innerText.trim();
        playMusic(songName);
      });
    });
  } catch (error) {
    console.error("Error fetching songs:", error);
  }
}

// Plays the selected music track
const playMusic = (track, pause = false) => {
  currentSong.src = `http://127.0.0.1:3000/songs/${track}`;

  if (!pause) {
    currentSong.play();
    document.querySelector("#play").src = userPauseButton;
  }

  document.querySelector(".songinfo").innerText = decodeURI(track);
  document.querySelector(".songtime").innerText = "00:00 / 00:00";

  // Update seek bar and song duration on load
  currentSong.addEventListener("loadedmetadata", () => {
    document.querySelector(".songtime").innerText = `00:00 / ${secondsToMinutesSeconds(currentSong.duration)}`;
  });
};

// Fetches and displays album data
async function displayAlbums() {
  try {
    const response = await fetch('http://127.0.0.1:3000/songs/');
    const responseText = await response.text();
    const div = document.createElement("div");
    div.innerHTML = responseText;
    const anchors = div.getElementsByTagName("a");
    const cardContainer = document.querySelector(".cardContainer");

    for (let anchor of anchors) {
      if (anchor.href.includes("/songs/") && !anchor.href.includes(".htaccess")) {
        const folder = anchor.href.split("/").slice(-2)[0];
        const folderMetadata = await fetch(`http://127.0.0.1:3000/songs/${folder}/metadata.json`).then(res => res.json());

        cardContainer.innerHTML += `
          <div data-folder="${folder}" class="card">
            <div class="play">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
    <path d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
</svg>
            </div>
            <img src="/songs/${folder}/cover.jpg" alt="Album Cover">
            <h2>${folderMetadata.title}</h2>
            <p>${folderMetadata.description}</p>
          </div>
        `;
      }
    }

    // Add event listener to load playlists when cards are clicked
    Array.from(document.getElementsByClassName("card")).forEach((card) => {
      card.addEventListener("click", async () => {
        const folder = card.dataset.folder;
        songs = await getSongs(`songs/${folder}`);
        playMusic(songs[0]);
      });
    });
  } catch (error) {
    console.error("Error displaying albums:", error);
  }
}

// Initialize the music player
async function main() {
  try {
    await getSongs("songs/ncs");
    playMusic(songs[0], true);

    // Display all albums
    await displayAlbums();

    // Play / Pause button event
    document.querySelector("#play").addEventListener("click", () => {
      if (currentSong.paused) {
        currentSong.play();
        document.querySelector("#play").src = userPauseButton;
      } else {
        currentSong.pause();
        document.querySelector("#play").src = userPlayButton;
      }
    });

    // Update seek bar and song time
    currentSong.addEventListener("timeupdate", () => {
      const currentTime = secondsToMinutesSeconds(currentSong.currentTime);
      const totalTime = secondsToMinutesSeconds(currentSong.duration);
      document.querySelector(".songtime").innerText = `${currentTime} / ${totalTime}`;

      const progress = (currentSong.currentTime / currentSong.duration) * 100;
      document.querySelector(".seekbar .circle").style.left = `${progress}%`;
    });

    // Seek bar click to update the current time
    document.querySelector(".seekbar").addEventListener("click", (e) => {
      const seekBarWidth = e.target.getBoundingClientRect().width;
      const offsetX = e.offsetX;
      const newTime = (offsetX / seekBarWidth) * currentSong.duration;
      currentSong.currentTime = newTime;
    });

    // Volume control
    document.querySelector(".range input").addEventListener("input", (e) => {
      currentSong.volume = e.target.value / 100;
      const volumeIcon = document.querySelector(".volume img");
      volumeIcon.src = currentSong.volume > 0 ? "img/volume.svg" : "img/mute.svg";
    });

    // Mute / Unmute toggle
    document.querySelector(".volume img").addEventListener("click", () => {
      if (currentSong.volume > 0) {
        currentSong.volume = 0;
        document.querySelector(".volume img").src = "img/mute.svg";
      } else {
        currentSong.volume = 0.5;
        document.querySelector(".volume img").src = "img/volume.svg";
      }
    });
  } catch (error) {
    console.error("Error initializing the music player:", error);
  }
}

main();