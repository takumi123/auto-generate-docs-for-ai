import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { FileNode } from '../types';

export async function getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    async function traverse(currentDir: string) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                await traverse(fullPath);
            } else if (entry.isFile() && !entry.name.startsWith('.')) {
                files.push(fullPath);
            }
        }
    }
    
    await traverse(dir);
    return files;
}

export async function buildFileTree(dir: string): Promise<FileNode[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const nodes: FileNode[] = [];

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
        } else {
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

export async function readFileContent(filePath: string): Promise<string> {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return '';
    }
}

export async function updateSummaryFile(content: string, workspaceRoot: string): Promise<string> {
    const config = vscode.workspace.getConfiguration('aiDocsGenerator');
    const outputPath = config.get<string>('outputPath') || 'docs_for_ai/summary.md';
    
    const summaryPath = path.join(workspaceRoot, outputPath);
    const summaryDir = path.dirname(summaryPath);

    try {
        await fs.mkdir(summaryDir, { recursive: true });

        const newContent = `# Project Summary\n\n${content}`;

        await fs.writeFile(summaryPath, newContent, 'utf-8');
        return summaryPath;
    } catch (error) {
        throw new Error(`Failed to update summary file: ${error}`);
    }
}
