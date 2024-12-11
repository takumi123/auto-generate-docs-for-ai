import * as vscode from 'vscode';
import { DocumentationWebviewProvider } from './webview/documentationPanel';

export function activate(context: vscode.ExtensionContext) {
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

    const provider = new DocumentationWebviewProvider(context);

    // ファイルシステムの変更を監視
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (workspaceRoot) {
        const watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceRoot, '**/*'),
            false, // 作成イベントを監視
            true,  // 変更イベントは無視
            true   // 削除イベントは無視
        );

        // 新規ファイルが作成された時にファイルツリーを更新
        watcher.onDidCreate(() => {
            provider.updateFileTree();
        });

        context.subscriptions.push(watcher);
    }

    context.subscriptions.push(
        setApiKeyCommand,
        vscode.window.registerWebviewViewProvider('auto-generate-docs-view', provider)
    );
}
