const { app, BrowserWindow, ipcMain, dialog, net } = require('electron');
const fs = require('fs');
const path = require('path');
//const AdmZip = require('adm-zip');
const git = require('isomorphic-git');
const http = require("isomorphic-git/http/node");

let mainWindow;

async function cloneOrUpdateRepo(repoDir, giturl) {
	if (!fs.existsSync(repoDir + "/.git")) {
		await git.clone({
			fs,
			http,
			dir: repoDir,
			url: giturl,
			singleBranch: true,
			depth: 1,

			onProgress: (progress) => { mainWindow.webContents.send('updateProgress', progress); }
		}).then(() => { mainWindow.webContents.send('updateProgress', "concluido") });
		console.log('Repositório clonado com sucesso!');
	} else {
		await git.checkout({
			fs,
			dir: repoDir,
			ref: 'main',
			force: true,
			onProgress: (progress) => { mainWindow.webContents.send('updateProgress', progress); }
		}).then(() => { mainWindow.webContents.send('updateProgress', "concluido") });
		const remotes = await git.listRemotes({ fs, dir: repoDir });

		const originRemote = remotes.find(remote => remote.remote === 'origin');

		if (!originRemote || originRemote.url !== giturl) {
			console.warn('O repositório local não corresponde ao esperado.');
			console.log(originRemote);

		}
		else {
			//const main = await git.resolveRef({ fs, dir: repoDir, ref: 'main' });

			// Redefine o índice para o HEAD
			//await git.resetIndex({ fs, dir: repoDir, ref: main, filepath: repoDir });

			// Atualiza o diretório de trabalho para refletir o índice
			//await git.checkout({ fs, dir: repoDir, ref: main, force: true, onProgress: (progress) => { mainWindow.webContents.send('updateProgress', progress); }});

			await git.pull({
				fs,
				http,
				ref: "main",
				dir: repoDir,
				fastForwardOnly: true,
				singleBranch: true,
				onProgress: (progress) => { mainWindow.webContents.send('updateProgress', progress); },
				author: {
					name: "CSMP Updater User",
					timestamp: new Date().getTime()
				},
			}).then(() => { mainWindow.webContents.send('updateProgress', "concluido") });
			console.log('Repositório atualizado com sucesso!');
		}
	}
}

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
				cloneOrUpdateRepo(outputPath, fileUrl).catch(console.error);
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
