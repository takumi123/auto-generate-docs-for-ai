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
exports.callOpenRouterAPI = callOpenRouterAPI;
exports.generateDocumentation = generateDocumentation;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
// Global status bar item
let statusBarItem;
let loadingInterval = null;
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
        if (statusBarItem) {
            statusBarItem.text = `${currentMessage} [${progressBar}] ${currentPercent}% ${loadingFrames[currentFrame]}`;
        }
    }, 80);
}
function stopLoadingAnimation() {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
    if (statusBarItem) {
        statusBarItem.dispose();
        statusBarItem = undefined;
    }
}
function showProgress(message, percent, showSpinner = true) {
    currentMessage = message;
    currentPercent = percent;
    if (!statusBarItem) {
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusBarItem.show();
    }
    if (showSpinner && !loadingInterval) {
        startLoadingAnimation();
    }
    else if (!showSpinner && loadingInterval) {
        if (statusBarItem) {
            const progressBar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
            statusBarItem.text = `${message} [${progressBar}] ${percent}%`;
        }
        stopLoadingAnimation();
    }
}
const PROMPT = `
[Objective]  
Analyze the given codebase and produce a single, comprehensive summary document that provides a complete overview of the entire implemented system.  
This summary must be based exclusively on what is explicitly stated in the code; do not infer or guess any details not directly evident from the code itself.  
The goal is that by reading this single output, the reader (and any AI system) will gain a thorough understanding of the system's implemented structure, functionality, specifications, I/O, error handling, data structures, infrastructure, and testing.

[Output Format]  
Please structure your output according to the following sections and their subsections.  
If a particular item does not exist in the code, state "Not applicable."  
Do not make assumptions or suggestions; document only what is explicitly implemented in the code.

1. **System-Level Overview**  
   - Document the process flow of each feature/module (from input to internal processing to output)  
   - Document the explicitly implemented algorithms as they appear in the code  
   - Document all I/O specifications (data types, formats, constraints)  
   - Document the implemented exception/error handling mechanisms (where and how errors are handled)  
   - Document all data structures (their definitions, usage locations, and structural details)

2. **Program-Level Details**  
   - List all functions/methods and describe their exact roles  
   - Document the parameters and return values for each function (type, format, constraints)  
   - List all defined variables (including their purpose and scope)  
   - List all constants and configuration files (with their defined values and file locations)  
   - Document all preconditions and postconditions around function calls

3. **API/Database Design**  
   - Document implemented status codes and their triggering conditions  
   - Document defined error response formats (fields, messages)  
   - Document existing database schemas (tables, columns, data types)  
   - Document any implemented indexes or constraints (e.g., UNIQUE, FOREIGN KEY)  
   - Document defined relationships between database tables

4. **Testing/Quality Control**  
   - Document implemented test cases and what they verify  
   - Document defined test data (input values, expected results)  
   - Document any applied coding standards or style guides used in the codebase  
   - Document implemented test coverage and how it is reported  
   - Document handled edge cases and how they are managed

5. **Infrastructure**  
   - Document the configured system infrastructure (server setup, network configuration, CI/CD pipelines)  
   - Document the build process (scripts, tools, steps for compilation/packaging)  
   - Document the deployment process (release steps, environment-specific differences)  
   - Document defined environment variables or parameters  
   - Document the test environment setup

[Important Notes]  
- If no explicit mention exists for a specific item, state "Not applicable."  
- Do not infer, guess, or propose any details. Only use what is explicitly present in the code.  - Use bullet points to maintain clarity and accuracy.  
- Provide all results as a single consolidated document.

Following these requirements, extract and summarize all the directly available information from the codebase into one comprehensive summary.

`;
async function callOpenRouterAPI(apiKey, files) {
    const config = vscode.workspace.getConfiguration('aiDocsGenerator');
    const customSystemPrompt = config.get('customSystemPrompt') || '';
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
            content: `Please analyze and summarize the following files in English.\n\n${files.map(f => `=== ${f.path} ===\n${f.content}\n`).join('\n')}`
        }
    ];
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'google/gemini-2.0-flash-exp:free',
            messages: messages
        })
    });
    if (!response.ok) {
        stopLoadingAnimation();
        throw new Error(`API request failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
}
async function generateDocumentation(apiKey, files, workspaceRoot, readFileContent, updateSummaryFile) {
    if (!files || files.length === 0) {
        throw new Error('No files selected');
    }
    showProgress('Initializing...', 0, true);
    // Process files with detailed progress
    let filesProcessed = 0;
    const totalFiles = files.length;
    const fileContents = await Promise.all(files.map(async (filePath) => {
        const content = await readFileContent(filePath);
        filesProcessed++;
        const percent = Math.floor((filesProcessed / totalFiles) * 40); // 0-40%
        showProgress(`Processing file (${filesProcessed}/${totalFiles}): ${path.basename(filePath)}`, percent, true);
        return {
            path: path.relative(workspaceRoot, filePath),
            content
        };
    }));
    // Load existing summary.md
    showProgress('Loading existing documentation...', 45, true);
    const config = vscode.workspace.getConfiguration('aiDocsGenerator');
    const outputPath = config.get('outputPath') || 'docs_for_ai/summary.md';
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
    }
    catch (error) {
        // Ignore if file doesn't exist
    }
    // Gemini analysis with detailed progress
    showProgress('Preparing Gemini analysis...', 50, true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    showProgress('Sending request to Gemini API...', 60, true);
    const summary = await callOpenRouterAPI(apiKey, fileContents);
    showProgress('Gemini analysis completed', 100, false);
    const resultPath = await updateSummaryFile(summary, workspaceRoot);
    await new Promise(resolve => setTimeout(resolve, 1000));
    stopLoadingAnimation();
    return resultPath;
}
//# sourceMappingURL=openRouter.js.map