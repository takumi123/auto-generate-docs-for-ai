import * as vscode from 'vscode';
import * as path from 'path';
import { WebviewProvider, FileNode } from '../types';
import { buildFileTree } from '../utils/fileSystem';
import { generateDocumentation } from '../services/openRouter';
import { readFileContent, updateSummaryFile } from '../utils/fileSystem';

let checkedState = new Map<string, boolean>();

function getFileTreeHtml(nodes: FileNode[], level: number = 0): string {
    return nodes.map(node => {
        const indent = '  '.repeat(level);
        const isDirectory = node.type === 'directory';
        const checkboxId = `checkbox-${node.path}`;
        const savedState = checkedState.get(node.path);
        // デフォルトでチェック状態にする
        const isChecked = savedState !== undefined ? savedState : true;
        
        return `
            ${indent}<div class="tree-item" style="margin-left: ${level * 20}px">
                <input type="checkbox" id="${checkboxId}" data-path="${node.path}" data-type="${node.type}" ${isChecked ? 'checked' : ''}>
                <label for="${checkboxId}">${node.name}</label>
                ${isDirectory && node.children ? getFileTreeHtml(node.children, level + 1) : ''}
            </div>
        `;
    }).join('');
}

function getMainViewHtml(
    fileTree: FileNode[],
    apiKey: string | undefined,
): string {
    const maskedKey = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : '';
    
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    padding: 10px;
                    color: var(--vscode-foreground);
                    font-family: var(--vscode-font-family);
                }
                button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    cursor: pointer;
                    margin: 8px 0;
                    width: 100%;
                }
                button:hover:not(:disabled) {
                    background: var(--vscode-button-hoverBackground);
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .tree-container {
                    margin: 20px 0;
                    max-height: calc(100vh - 200px);
                    overflow-y: auto;
                    border: 1px solid var(--vscode-widget-border);
                    padding: 10px;
                }
                .tree-item {
                    margin: 5px 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .tree-item label {
                    margin-left: 5px;
                }
                .button-container {
                    position: sticky;
                    bottom: 0;
                    background: var(--vscode-sideBar-background);
                    padding: 10px 0;
                    border-top: 1px solid var(--vscode-widget-border);
                }
                .api-key-status {
                    margin: 10px 0;
                    padding: 10px;
                    border: 1px solid var(--vscode-widget-border);
                    border-radius: 4px;
                }
                .api-key-status.has-key {
                    background: var(--vscode-inputValidation-infoBackground);
                }
                .api-key-status.no-key {
                    background: var(--vscode-inputValidation-warningBackground);
                }
            </style>
        </head>
        <body>
            <div class="api-key-status ${apiKey ? 'has-key' : 'no-key'}">
                <p>API Key Status: ${apiKey ? 'Configured' : 'Not Configured'}</p>
                ${apiKey ? '<p>Current Key: ' + maskedKey + '</p>' : ''}
            </div>
            <button onclick="setApiKey()">${apiKey ? 'Reconfigure API Key' : 'Configure API Key'}</button>
            <div class="tree-container">
                ${getFileTreeHtml(fileTree)}
            </div>
            <div class="button-container">
                <button id="generateButton" onclick="generateDocs()">Generate Documentation for Selected Files</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();

                document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    checkbox.addEventListener('change', function() {
                        const path = this.dataset.path;
                        const type = this.dataset.type;
                        const checked = this.checked;
                        
                        if (type === 'directory') {
                            const container = this.closest('.tree-item');
                            container.querySelectorAll('input[type="checkbox"]').forEach(child => {
                                child.checked = checked;
                                vscode.postMessage({
                                    command: 'updateChecked',
                                    path: child.dataset.path,
                                    checked: checked
                                });
                            });
                        }
                        
                        vscode.postMessage({
                            command: 'updateChecked',
                            path: path,
                            checked: checked
                        });
                    });
                });

                function setApiKey() {
                    vscode.postMessage({ command: 'setApiKey' });
                }

                function generateDocs() {
                    const generateButton = document.getElementById('generateButton');
                    generateButton.disabled = true;
                    generateButton.textContent = 'Generating Documentation...';

                    const checkedFiles = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
                        .filter(checkbox => checkbox.dataset.type === 'file')
                        .map(checkbox => checkbox.dataset.path);
                    
                    vscode.postMessage({
                        command: 'generate',
                        files: checkedFiles
                    });
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'generationComplete':
                            const generateButton = document.getElementById('generateButton');
                            generateButton.disabled = false;
                            generateButton.textContent = 'Generate Documentation for Selected Files';
                            break;
                        case 'updateFileTree':
                            const treeContainer = document.querySelector('.tree-container');
                            treeContainer.innerHTML = message.html;
                            // 新しく追加されたチェックボックスにイベントリスナーを設定
                            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                                checkbox.addEventListener('change', function() {
                                    const path = this.dataset.path;
                                    const type = this.dataset.type;
                                    const checked = this.checked;
                                    
                                    if (type === 'directory') {
                                        const container = this.closest('.tree-item');
                                        container.querySelectorAll('input[type="checkbox"]').forEach(child => {
                                            child.checked = checked;
                                            vscode.postMessage({
                                                command: 'updateChecked',
                                                path: child.dataset.path,
                                                checked: checked
                                            });
                                        });
                                    }
                                    
                                    vscode.postMessage({
                                        command: 'updateChecked',
                                        path: path,
                                        checked: checked
                                    });
                                });
                            });
                            break;
                    }
                });
            </script>
        </body>
        </html>
    `;
}

export class DocumentationWebviewProvider implements WebviewProvider {
    _view?: vscode.WebviewView;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async notifyApiKeyUpdate() {
        if (this._view) {
            const apiKey = await this.context.secrets.get('openrouter-api-key');
            const maskedKey = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : '';
            this._view.webview.postMessage({ 
                command: 'updateApiKeyStatus',
                hasKey: !!apiKey,
                maskedKey
            });
        }
    }

    async updateFileTree() {
        if (this._view) {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
            if (!workspaceRoot) {
                return;
            }

            const fileTree = await buildFileTree(workspaceRoot);
            const treeHtml = getFileTreeHtml(fileTree);
            this._view.webview.postMessage({
                command: 'updateFileTree',
                html: treeHtml
            });
        }
    }

    async resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true
        };

        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspaceRoot) {
            webviewView.webview.html = `
                <html><body>
                    <p>No workspace is open</p>
                </body></html>
            `;
            return;
        }

        const apiKey = await this.context.secrets.get('openrouter-api-key');
        const fileTree = await buildFileTree(workspaceRoot);

        webviewView.webview.html = getMainViewHtml(fileTree, apiKey);

        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'setApiKey':
                    vscode.commands.executeCommand('auto-generate-docs-for-ai.setOpenRouterAPI');
                    break;
                case 'updateChecked':
                    checkedState.set(message.path, message.checked);
                    break;
                case 'generate':
                    const apiKey = await this.context.secrets.get('openrouter-api-key');
                    if (!apiKey) {
                        vscode.window.showErrorMessage('OpenRouter API key is not configured.');
                        return;
                    }

                    try {
                        const summaryPath = await generateDocumentation(
                            apiKey,
                            message.files,
                            workspaceRoot,
                            readFileContent,
                            updateSummaryFile
                        );

                        // 生成完了を通知
                        webviewView.webview.postMessage({ command: 'generationComplete' });

                        vscode.window.showInformationMessage(
                            `Documentation saved to ${summaryPath}`,
                            'Open'
                        ).then(selection => {
                            if (selection === 'Open') {
                                vscode.workspace.openTextDocument(summaryPath)
                                    .then(doc => vscode.window.showTextDocument(doc));
                            }
                        });
                    } catch (error) {
                        // エラー時もボタンを有効化
                        webviewView.webview.postMessage({ command: 'generationComplete' });
                        vscode.window.showErrorMessage(`Error generating documentation: ${error}`);
                    }
                    break;
            }
        });
    }
}