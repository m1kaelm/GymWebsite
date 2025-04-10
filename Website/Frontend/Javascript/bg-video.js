const videoElement = document.getElementById("bgVideo");

const videoSources = [
  "../../media/Background_vid_1.mp4",
  "../../media/Background_vid_2.mp4",
  "../../media/Background_vid_1.mp4"  // <- include "../media/"
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
