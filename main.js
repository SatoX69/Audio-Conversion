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

const recordButton = document.getElementById('record-button');
const recordingIndicator = document.getElementById('recording-indicator');
const audioPlayer = document.getElementById('audio-player');
const responseAudioDiv = document.getElementById('response-audio');
const uploadInput = document.getElementById('upload-input');

recordButton.addEventListener('click', async () => {
  if (!recordButton.disabled) {
    recordButton.disabled = true;
    recordButton.style.backgroundColor = 'gray';
    if (recordButton.textContent === 'Record Audio') {
      startRecording();
      await new Promise(res => setTimeout(res, 10000));
      stopRecording();
    } else {
      stopRecording();
    }
    recordButton.disabled = false;
    recordButton.style.backgroundColor = '';
  }
});

function startRecording() {
  navigator.mediaDevices.getUserMedia({
      audio: true
    })
    .then(function(stream) {
      mediaRecorder = new MediaRecorder(stream);
      recordingIndicator.style.display = 'block';
      recordButton.textContent = 'Stop Recording';
      chunks = [];
      mediaRecorder.ondataavailable = function(e) {
        chunks.push(e.data);
      }
      mediaRecorder.onstop = function(e) {
        recordingIndicator.style.display = 'none';
        recordButton.textContent = 'Record Audio';
        const blob = new Blob(chunks, {
          'type': 'audio/webm;codecs=opus'
        });
        const reader = new FileReader();
        reader.onload = function(event) {
          sendAudio(event.target.result);
        };
        reader.readAsArrayBuffer(blob);
      }
      mediaRecorder.start();
    })
    .catch(function(err) {
      err()
      console.log('Error: ' + err);
    });
}

function stopRecording() {
  mediaRecorder.stop();
}

function sendAudio(arrayBuffer) {
  fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: arrayBuffer
    })
    .then(response => response.blob())
    .then(blob => {
      responseAudioDiv.style.display = 'block';
      const audioUrl = URL.createObjectURL(blob);
      audioPlayer.src = audioUrl;
      alert("Conversion Done")
    })
    .catch(error => {
      err()
      console.error('Error:', error);
    });
}

uploadInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    sendAudio(event.target.result);
  };
  reader.readAsArrayBuffer(file);
});

function err() {
  alert("An Error Occured, Check console")
}