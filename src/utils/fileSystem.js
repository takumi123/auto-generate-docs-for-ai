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
exports.getAllFiles = getAllFiles;
exports.buildFileTree = buildFileTree;
exports.readFileContent = readFileContent;
exports.updateSummaryFile = updateSummaryFile;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
async function getAllFiles(dir) {
    const files = [];
    async function traverse(currentDir) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                await traverse(fullPath);
            }
            else if (entry.isFile() && !entry.name.startsWith('.')) {
                files.push(fullPath);
            }
        }
    }
    await traverse(dir);
    return files;
}
async function buildFileTree(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const nodes = [];
    for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
        }
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const children = await buildFileTree(fullPath);
            nodes.push({
                path: fullPath,
                name: entry.name,
                type: 'directory',
                checked: true,
                children
            });
        }
        else {
            nodes.push({
                path: fullPath,
                name: entry.name,
                type: 'file',
                checked: true
            });
        }
    }
    return nodes;
}
async function readFileContent(filePath) {
    try {
        return await fs.readFile(filePath, 'utf-8');
    }
    catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return '';
    }
}
async function updateSummaryFile(content, workspaceRoot) {
    const config = vscode.workspace.getConfiguration('aiDocsGenerator');
    const outputPath = config.get('outputPath') || 'docs_for_ai/summary.md';
    const summaryPath = path.join(workspaceRoot, outputPath);
    const summaryDir = path.dirname(summaryPath);
    try {
        await fs.mkdir(summaryDir, { recursive: true });
        const newContent = `# Project Summary\n\n${content}`;
        await fs.writeFile(summaryPath, newContent, 'utf-8');
        return summaryPath;
    }
    catch (error) {
        throw new Error(`Failed to update summary file: ${error}`);
    }
}
//# sourceMappingURL=fileSystem.js.map