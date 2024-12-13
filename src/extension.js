"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const documentationPanel_1 = require("./webview/documentationPanel");
function activate(context) {
    let setApiKeyCommand = vscode.commands.registerCommand('auto-generate-docs-for-ai.setOpenRouterAPI', async () => {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'OpenRouter APIキーを入力してください',
            password: true
        });
        if (apiKey) {
            await context.secrets.store('openrouter-api-key', apiKey);
            vscode.window.showInformationMessage('APIキーが保存されました');
            // APIキーが更新されたことをWebViewに通知
            provider.notifyApiKeyUpdate();
        }
    });
    const provider = new documentationPanel_1.DocumentationWebviewProvider(context);
    // ファイルシステムの変更を監視
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (workspaceRoot) {
        const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceRoot, '**/*'), false, // 作成イベントを監視
        true, // 変更イベントは無視
        true // 削除イベントは無視
        );
        // 新規ファイルが作成された時にファイルツリーを更新
        watcher.onDidCreate(() => {
            provider.updateFileTree();
        });
        context.subscriptions.push(watcher);
    }
    context.subscriptions.push(setApiKeyCommand, vscode.window.registerWebviewViewProvider('auto-generate-docs-view', provider));
}
//# sourceMappingURL=extension.js.map