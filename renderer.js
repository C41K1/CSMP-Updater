function downloadFile() {
  window.electron.ipcRenderer.send('download');
}

window.downloadFile = downloadFile;

window.electron.ipcRenderer.on('updateProgress', (event, progress) => {
  if (progress == "descompactando") {
    const progressElement = document.getElementById('selecionar');
    progressElement.innerHTML = `<label style="width: 100%; text-align: center;">Descompactando...</label>`;
  }
  else if (progress == "concluido") {
    const progressElement = document.getElementById('selecionar');
    progressElement.innerHTML = `<label style="width: 100%; text-align: center;">Concluido!</label>`;
  }
  else {
    const progressElement = document.getElementById('selecionar');
    progressElement.innerHTML = `<div id="progress"><div id="barra"></div></div><label style="width: 100%; text-align: center;">Baixando: ${progress.toFixed(2)}%</label>`;
    const borda = document.getElementById('progress');
    borda.style.borderStyle = "solid"
    const barra = document.getElementById('barra');
    barra.style.width = `${progress.toFixed(2)}%`;
  }
});