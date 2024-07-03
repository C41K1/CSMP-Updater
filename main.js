const { app, BrowserWindow, ipcMain, dialog, net } = require('electron');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: './assets/icone.png',
    width: 600,
    height: 700,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  ipcMain.on('download', async (event) => {
    respApi = await net.fetch("https://csmp.vercel.app/api/getModpack");
    if (respApi.ok) {
      const resp = await respApi.json();
      fileUrl = resp?.link;

      const selectedPath = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
      if (!selectedPath.canceled) {
        const outputPath = selectedPath.filePaths[0];
        const fileName = fileUrl.split('/').pop();
        const filePath = `${outputPath}/${fileName}`;

        const file = fs.createWriteStream(filePath);
        const request = net.request(fileUrl);

        request.on('response', (response) => {
          const totalBytes = parseInt(response.headers['content-length'], 10);
          let receivedBytes = 0;

          response.on('data', (chunk) => {
            receivedBytes += chunk.length;
            console.log(receivedBytes);
            const progress = (receivedBytes / totalBytes) * 100;
            mainWindow.webContents.send('updateProgress', progress); // Envio do progresso corrigido
            file.write(chunk);
          });

          response.on('end', () => {
            file.end();

            fs.rm(path.join(outputPath, 'config'), { recursive: true, force: true }, () => { });
            fs.rm(path.join(outputPath, 'defaultconfigs'), { recursive: true, force: true }, () => { });
            fs.rm(path.join(outputPath, 'mods'), { recursive: true, force: true }, () => { });
            fs.rm(path.join(outputPath, 'resourcepacks'), { recursive: true, force: true }, () => { });
            fs.rm(path.join(outputPath, 'plugins'), { recursive: true, force: true }, () => { });
            fs.rm(path.join(outputPath, 'fancymenu_data'), { recursive: true, force: true }, () => { });

            mainWindow.webContents.send('updateProgress', 100); // Envio de 100% quando o download é concluído
            mainWindow.webContents.send('updateProgress', "descompactando");

            setTimeout(() => {
              const zip = new AdmZip(filePath);
              const zipEntries = zip.getEntries();
              const extractPath = outputPath; // Pasta de extração

              if (!fs.existsSync(extractPath)) {
                fs.mkdirSync(extractPath);
              }

              zipEntries.forEach((zipEntry) => {
                if (!zipEntry.isDirectory) {
                  zip.extractEntryTo(zipEntry, extractPath, true, true);
                }
              });
              mainWindow.webContents.send('updateProgress', "concluido");
            }, 2500)
          });
        });

        request.on('error', err => {
          dialog.showErrorBox('Erro', `Ocorreu um erro no download: ${err.message}`);
        });

        request.end();
      }
    }
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
