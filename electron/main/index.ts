import { app, BrowserWindow, shell, ipcMain, Menu, dialog, ipcRenderer } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { update } from './update'
import * as process from "node:process";
import { exec, spawn } from 'child_process';
import { a9 } from "vitest/dist/chunks/reporters.nr4dxCkA";

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const IS_DEV = !!VITE_DEV_SERVER_URL;
const RESOURCE_FOLDER = IS_DEV ? process.env.APP_ROOT : path.dirname(process.env.APP_ROOT);
const POE_BENCH_EXE = `${RESOURCE_FOLDER}/bin/PoeBench.exe`;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, 'public')
    : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
    win = new BrowserWindow({
        title: 'Main window',
        icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
        width: 800,
        height: 500,
        resizable: false,
        webPreferences: {
            preload,
            contextIsolation: true, // 必须启用上下文隔离
            nodeIntegration: false, // 禁用 Node.js 集成
            sandbox: true // 启用沙箱
        },
    })

    if (VITE_DEV_SERVER_URL) { // #298
        win.loadURL(VITE_DEV_SERVER_URL)
        // Open devTool if the app is not packaged
        win.webContents.openDevTools()

        // 创建自定义菜单
        const menuTemplate = [
            {
                label: '开发者工具',
                click: () => {
                    if (win) {
                        if (win.webContents.isDevToolsOpened()) {
                            win.webContents.closeDevTools();
                        } else {
                            win.webContents.openDevTools();
                        }
                    }
                },
                accelerator: 'F12' // 可选：添加快捷键
            },
            {
                label: '重载',
                click: () => {
                    if (win) {
                        win.reload();
                    }
                }
            }
        ];
        const menu = Menu.buildFromTemplate(menuTemplate);
        win.setMenu(menu);
    } else {
        win.setMenu(null);
        win.loadFile(indexHtml)
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString())
    })

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return { action: 'deny' }
    })

    // Auto update
    update(win)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore()
        win.focus()
    }
})

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus()
    } else {
        createWindow()
    }
})


ipcMain.handle('open-game-file-dialog', async (_, arg) => {
    if (win) {
        const result = await dialog.showOpenDialog(win, {
            title: '选择 Content.ggpk/_.index.bin',
            filters: [
                {
                    name: 'Content.ggpk/_.index.bin',
                    extensions: ['ggpk', 'bin'],
                }
            ]
        });
        if (result.canceled) {
            return null;
        }
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('open-patch-file-dialog', async (_, arg) => {
    if (win) {
        const result = await dialog.showOpenDialog(win, {
            title: '选择补丁',
            filters: [
                {
                    name: '压缩包',
                    extensions: ['zip'],
                }
            ],
            properties: ['openFile', 'multiSelections']
        });
        if (result.canceled) {
            return null;
        }
        return result.filePaths;
    }
    return null;
});

ipcMain.handle('get-game-install-path', async(_, arg) => {
    const { version, platform } = arg;
    const command = `chcp 65001 >nul && "${POE_BENCH_EXE}" get-game-install-path --version ${version} --platform ${platform}`;
    return await new Promise<string>(resolve => {
        exec(command, (error, stdout, stderr) => {
            if (stdout) {
                resolve(stdout);
            } else {
                resolve('');
            }
        })
    });
});

ipcMain.handle('get-installed-fonts', async(_, arg) => {
    const command = `chcp 65001 >nul && "${POE_BENCH_EXE}" get-installed-fonts`;
    return await new Promise<string>(resolve => {
        exec(command, (error, stdout, stderr) => {
            if (stdout) {
                resolve(JSON.parse(stdout));
            } else {
                resolve('[]');
            }
        })
    });
});

ipcMain.handle('patch', async(_, arg: ExecParam) => {
    let command = `chcp 65001 >nul && "${POE_BENCH_EXE}" patch`;
    const { path, patch, font, fontSizeDelta, removeMinimapFog, cameraZoom } = arg;
    command += ' -p ' + path;
    if (patch && patch.length > 0) {
        patch.forEach(p => {
            command += ' -pf ' + p;
        });
    }
    if (font) {
        command += ' --font ' + font;
    }
    if (fontSizeDelta) {
        command += ' --font-size-delta ' + fontSizeDelta;
    }
    if (removeMinimapFog !== undefined) {
        command += ' --remove-minimap-fog ' + removeMinimapFog;
    }
    if (cameraZoom !== undefined) {
        command += ' --camera-zoom ' + cameraZoom;
    }
    console.log('exec ', command);
    return await new Promise<any>(resolve => {
        const child = spawn(command);
        child.on('close', code => resolve(code));
        child.stdout.on('data', data => {
            ipcRenderer.send('execute-log', data);
        });
        child.stderr.on('data', data => {
            ipcRenderer.send('execute-log', data);
        })
    });
});