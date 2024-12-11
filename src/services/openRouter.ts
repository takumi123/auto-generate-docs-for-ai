import * as vscode from 'vscode';
import * as path from 'path';
import { OpenRouterResponse, FileContent } from '../types';

// Global status bar item
let statusBarItem: vscode.StatusBarItem;
let loadingInterval: NodeJS.Timeout | null = null;

const loadingFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let currentFrame = 0;
let currentMessage = '';
let currentPercent = 0;

function startLoadingAnimation() {
    if (!statusBarItem) {
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusBarItem.show();
    }
    
    if (loadingInterval) {
        return;
    }
    
    loadingInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % loadingFrames.length;
        const progressBar = '█'.repeat(Math.floor(currentPercent / 5)) + '░'.repeat(20 - Math.floor(currentPercent / 5));
        statusBarItem.text = `${currentMessage} [${progressBar}] ${currentPercent}% ${loadingFrames[currentFrame]}`;
    }, 80);
}

function stopLoadingAnimation() {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
}

function showProgress(message: string, percent: number, showSpinner: boolean = true) {
    currentMessage = message;
    currentPercent = percent;
    
    if (!statusBarItem) {
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusBarItem.show();
    }

    if (showSpinner && !loadingInterval) {
        startLoadingAnimation();
    } else if (!showSpinner && loadingInterval) {
        stopLoadingAnimation();
        const progressBar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
        statusBarItem.text = `${message} [${progressBar}] ${percent}%`;
    }
}

const PROMPT = `
Please document the following files by analyzing only what is explicitly present in the code:

## System Level
- Document the actual processing flow and responsibilities implemented in each feature/module
- Document the implemented algorithms as they appear in the code
- Document the exact I/O specifications (data types, formats, constraints) used
- Document the implemented exception and error handling mechanisms
- Document the data structures as they are defined and used in the code

## Program Level
- List all functions/methods with their implemented roles
- Document the actual parameters and return values of each function
- Document the defined variables and their current usage
- List all constants and configuration files present in the code
- Document the implemented conditions before and after each function call

## API/Database Design
- Document the implemented status codes
- Document the defined error response formats
- Document the existing database schemas and columns
- Document the implemented database indexes and constraints
- Document the established database relationships

## Testing/Quality Control
- Document the implemented test cases
- Document the defined test data
- Document the applied coding standards in the codebase
- Document the implemented test coverage
- Document the handled edge cases

## Infrastructure
- Document the configured system infrastructure
- Document the implemented build process
- Document the implemented deployment process
- Document the defined environment parameters
- Document the specified test environment setup

Please document only what is explicitly implemented in the code, without assumptions or suggestions.`;

export async function callOpenRouterAPI(apiKey: string, files: FileContent[]): Promise<string> {
    const config = vscode.workspace.getConfiguration('aiDocsGenerator');
    const customSystemPrompt = config.get<string>('customSystemPrompt') || '';

    startLoadingAnimation();

    const messages = [
        ...(customSystemPrompt ? [{
            role: "system",
            content: customSystemPrompt
        }] : []),
        {
            role: "system",
            content: PROMPT
        },
        {
            role: "user",
            content: `Please analyze and summarize the following files in English.\n\n${
                files.map(f => `=== ${f.path} ===\n${f.content}\n`).join('\n')
            }`
        }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'google/gemini-pro-1.5',
            messages: messages
        })
    });

    if (!response.ok) {
        stopLoadingAnimation();
        throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json() as OpenRouterResponse;
    return data.choices[0].message.content;
}

export async function generateDocumentation(
    apiKey: string,
    files: string[],
    workspaceRoot: string,
    readFileContent: (path: string) => Promise<string>,
    updateSummaryFile: (content: string, workspaceRoot: string) => Promise<string>
): Promise<string> {
    if (!files || files.length === 0) {
        throw new Error('No files selected');
    }

    showProgress('Initializing...', 0, true);

    // Process files with detailed progress
    let filesProcessed = 0;
    const totalFiles = files.length;
    const fileContents = await Promise.all(
        files.map(async (filePath: string) => {
            const content = await readFileContent(filePath);
            filesProcessed++;
            const percent = Math.floor((filesProcessed / totalFiles) * 40); // 0-40%
            showProgress(`Processing file (${filesProcessed}/${totalFiles}): ${path.basename(filePath)}`, percent, true);
            return {
                path: path.relative(workspaceRoot, filePath),
                content
            };
        })
    );

    // Load existing summary.md
    showProgress('Loading existing documentation...', 45, true);
    const config = vscode.workspace.getConfiguration('aiDocsGenerator');
    const outputPath = config.get<string>('outputPath') || 'docs_for_ai/summary.md';
    const summaryPath = path.join(workspaceRoot, outputPath);
    let existingSummary = '';
    try {
        existingSummary = await readFileContent(summaryPath);
        if (existingSummary) {
            fileContents.push({
                path: 'existing-summary.md',
                content: existingSummary
            });
        }
    } catch (error) {
        // Ignore if file doesn't exist
    }

    // Gemini analysis with detailed progress
    showProgress('Preparing Gemini analysis...', 50, true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    showProgress('Sending request to Gemini API...', 60, true);
    const summary = await callOpenRouterAPI(apiKey, fileContents);
    showProgress('Gemini analysis completed', 80, false);

    showProgress('Saving documentation...', 90, true);
    const resultPath = await updateSummaryFile(summary, workspaceRoot);
    
    stopLoadingAnimation();
    showProgress('Documentation generation completed', 100, false);
    return resultPath;
}
