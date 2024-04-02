const apiUrl = 'https://elb.themetavoice.xyz/api/convert-voice';
const headers = {
  'Accept': '*/*',
  'Accept-Encoding': 'gzip, deflate',
  'Content-Type': 'audio/webm;codecs=opus',
  'X-Isvideo': 'false',
  'X-New-Model': 'false',
  'X-Target': "eva",
  'X-Uid-2': '8a84e23e-c20f-40de-a4cb-b2e2c4b755a0',
  'Response-Type': 'stream',
};

let mediaRecorder;
let chunks = [];
let startTime;
let process;

const recordButton = document.getElementById('record-button');
const audioPlayer = document.getElementById('audio-player');
const responseAudioDiv = document.getElementById('response-audio');
const uploadInput = document.getElementById('upload-input');

recordButton.addEventListener('click', async () => {
  if (recordButton.textContent === 'Record Audio') {
    startRecording();
    recordButton.style.backgroundColor = "gray";
    startTime = Date.now();
    process = true
    updateDuration()
  } else {
    process = false;
    stopRecording();
    recordButton.style.backgroundColor = "#4CAF50";
    recordButton.textContent = "Record Audio"
  }
});

function updateDuration() {
  if (process) {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    recordButton.textContent = `Recording ${elapsedTime}s`
    setTimeout(updateDuration, 1000);
  }
}

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
      mediaRecorder = new MediaRecorder(stream);
      chunks = [];
      mediaRecorder.ondataavailable = function(e) {
        chunks.push(e.data);
      }
      mediaRecorder.onstop = function(e) {
        recordButton.textContent = 'Record Audio'
        const blob = new Blob(chunks, { 'type': 'audio/webm;codecs=opus' });
        const reader = new FileReader();
        reader.onload = function(event) {
          sendAudio(event.target.result);
        };
        reader.readAsArrayBuffer(blob);
      }
      mediaRecorder.start();
    })
    .catch(function(err) {
      handleError();
      console.log('Error: ' + err);
    });
}

function stopRecording() {
  mediaRecorder.stop();
  if (mediaRecorder.stream) {
    mediaRecorder.stream.getTracks()[0].stop();
  }
}

async function sendAudio(arrayBuffer) {
  try {
    recordButton.disabled = true;
    uploadInput.disabled = true;
    recordButton.textContent = "Processing..."
    uploadInput.style.backgroundColor = "gray"
    recordButton.style.backgroundColor = "gray";

    const CHUNK_SIZE = 10 * 1000; // 10 seconds in milliseconds
    const arrayBufferLength = arrayBuffer.byteLength;

    if (arrayBufferLength <= CHUNK_SIZE) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: arrayBuffer
      });
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      audioPlayer.src = audioUrl;
    } else {
      const chunkCount = Math.ceil(arrayBufferLength / CHUNK_SIZE);
      let audioChunks = [];
      for (let i = 0; i < chunkCount; i++) {
        await new Promise(x => {setTimeout(x, 2000)})
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, arrayBufferLength);
        const chunk = arrayBuffer.slice(start, end);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: headers,
          body: chunk
        });
        const chunkBlob = await response.blob();
        audioChunks.push(chunkBlob);
      }
      const blob = new Blob(audioChunks);
      const audioUrl = URL.createObjectURL(blob);
      audioPlayer.src = audioUrl;
    }

    responseAudioDiv.style.display = 'block';
  } catch (error) {
    recordButton.style.backgroundColor = "red";
    handleError();
    console.error('Error:', error);
  } finally {
    recordButton.disabled = false;
    uploadInput.disabled = false;
    uploadInput.style.backgroundColor = "orange"
    recordButton.style.backgroundColor = "#4CAF50"
    recordButton.textContent = "Record Audio"
  }
}

uploadInput.addEventListener('change', (event) => {
  if (process) return
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    sendAudio(event.target.result);
  };
  reader.readAsArrayBuffer(file);
});

function handleError() {
  alert("An Error Occurred, Check console");
}