const videoElement = document.getElementById("bgVideo");

const videoSources = [
  "../../media/143431-782373969_small.mp4",
  "../../media/148208-793717949_small.mp4",
  "../../media/200657-913478674_small.mp4"  // <- include "../media/"
];

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

let shuffledSources = shuffle([...videoSources]);
let currentIndex = 0;

function playNextVideo() {
  videoElement.src = shuffledSources[currentIndex];
  videoElement.load();
  videoElement.play().catch((error) => {
    console.error("Autoplay failed:", error);
  });

  currentIndex = (currentIndex + 1) % shuffledSources.length;
  videoElement.onended = playNextVideo;
}

playNextVideo();
