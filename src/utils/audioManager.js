// Define a global audio context, which will be used to play audio
let audioContext;

// Object to store loaded audio buffers by name
const audioBuffers = {};

/**
 * Loads an audio file from a given URL and stores it in the audioBuffers object.
 * @param {string} name - A unique key to reference the loaded sound.
 * @param {string} url - The URL of the audio file to load.
 */
export const loadSound = async (name, url) => {
  // Initialize the AudioContext if it doesn't already exist
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Fetch the audio file from the given URL
  const res = await fetch(url);

  // Convert the response to an ArrayBuffer
  const arrayBuffer = await res.arrayBuffer();

  // Decode the audio data into an AudioBuffer and store it
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioBuffers[name] = audioBuffer;
};

/**
 * Plays a previously loaded sound by name.
 * @param {string} name - The name of the sound to play.
 * @param {number} [playbackRate=1] - The speed at which to play the audio (default is normal speed).
 */
export const playSound = (name, playbackRate = 1) => {
  // Exit early if the AudioContext or requested sound is not available
  if (!audioContext || !audioBuffers[name]) return;

  // Create a new audio source and set its buffer and playback rate
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffers[name];
  source.playbackRate.value = playbackRate;

  // Connect the source to the destination (i.e., the speakers)
  source.connect(audioContext.destination);

  // Start playing the audio immediately
  source.start(0);
};
