import * as vscode from 'vscode';

export interface SubscriptionState {
    isSubscribed: boolean;
    trialEnd?: Date;
    customerId?: string;
}

export interface FileNode {
    path: string;
    name: string;
    type: 'file' | 'directory';
    checked: boolean;
    children?: FileNode[];
}

export interface OpenRouterResponse {
    choices: [{
        message: {
            content: string;
        };
    }];
}

export interface FileContent {
    path: string;
    content: string;
}

export interface WebviewProvider {
    _view?: vscode.WebviewView;
    notifyApiKeyUpdate: () => Promise<void>;
    resolveWebviewView: (webviewView: vscode.WebviewView) => Promise<void>;
}
