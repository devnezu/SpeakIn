let mediaRecorder;
let audioChunks = [];
let isRecording = false;

const recordBtn = document.getElementById('recordBtn');
const apiKeyInput = document.getElementById('apiKey');
const statusDiv = document.getElementById('status');
const transcriptionContainer = document.getElementById('transcriptionContainer');
const transcriptionText = document.getElementById('transcriptionText');
const copyBtn = document.getElementById('copyBtn');

// Carregar API key salva
const savedApiKey = localStorage.getItem('groq_api_key');
if (savedApiKey) {
  apiKeyInput.value = savedApiKey;
}

// Salvar API key quando mudar
apiKeyInput.addEventListener('change', () => {
  localStorage.setItem('groq_api_key', apiKeyInput.value.trim());
});

// Controle de gravação
recordBtn.addEventListener('click', async () => {
  if (!apiKeyInput.value.trim()) {
    showStatus('Configure sua API Key GROQ primeiro', 'error');
    return;
  }

  if (!isRecording) {
    await startRecording();
  } else {
    stopRecording();
  }
});

// Copiar transcrição
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(transcriptionText.textContent);
  showStatus('Texto copiado', 'success');
  setTimeout(() => hideStatus(), 2000);
});

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      await transcribeAudio(audioBlob);

      // Parar o stream
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    isRecording = true;
    recordBtn.textContent = 'Parar';
    recordBtn.classList.add('recording');
    showStatus('Gravando...', 'info');

  } catch (error) {
    console.error('Erro ao iniciar gravação:', error);
    showStatus('Erro ao acessar microfone', 'error');
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    recordBtn.textContent = 'Gravar';
    recordBtn.classList.remove('recording');
    showStatus('Processando...', 'info');
  }
}

async function transcribeAudio(audioBlob) {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'pt');

    const apiKey = apiKeyInput.value.trim();

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
    }

    const data = await response.json();

    if (data.text) {
      transcriptionText.textContent = data.text;
      transcriptionContainer.classList.add('visible');
      showStatus('Transcrição concluída', 'success');
      setTimeout(() => hideStatus(), 3000);
    } else {
      showStatus('Nenhum texto detectado', 'error');
    }

  } catch (error) {
    console.error('Erro na transcrição:', error);
    showStatus(`Erro: ${error.message}`, 'error');
  }
}

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}

function hideStatus() {
  statusDiv.className = 'status';
}
