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
    progressElement.innerHTML = `<div id="progress"><div id="barra"></div></div><label style="width: 100%; text-align: center;">${progress.phase}: ${progress.loaded}/${progress.total? progress.total : "?"} (${progress.total? ((progress.loaded / progress.total) * 100).toFixed(1): "?"}%)</label>`;
    const borda = document.getElementById('progress');
    borda.style.borderStyle = "solid"
    const barra = document.getElementById('barra');
    if (progress.total) {
      barra.style.width = `${(progress.loaded / progress.total) * 100}%`;
    }
    else { barra.style.width = "95%"; }
  }
});