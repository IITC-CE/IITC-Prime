import { knownFolders } from '@nativescript/core';
import * as fs from '@nativescript/core';
import { ShareFile } from '@nativescript-community/ui-share-file';
import { openFilePicker } from '@nativescript-community/ui-document-picker';

export interface FileInfo {
    name: string;
    path: string;
    type?: string;
    size?: number;
}

export interface FileChooserParams {
    allowsMultipleSelection?: boolean;
    acceptTypes?: string[];
}

export async function selectFiles(params: FileChooserParams): Promise<FileInfo[]> {
    try {
        const options: any = {
            multipleSelection: params.allowsMultipleSelection || false,
            copyToAppDocuments: true
        };

        if (params.acceptTypes?.length && !params.acceptTypes.includes('*/*')) {
            options.mimeTypes = params.acceptTypes;
        }

        const result = await openFilePicker(options);

        if (result.files?.length) {
            const files = result.files.map((filePath: string) => {
                const fileName = filePath.split('/').pop() || 'unknown';
                return {
                    name: fileName,
                    path: filePath,
                    type: 'text/plain',
                    size: 0
                };
            });

            return files;
        }

        return [];
    } catch (error) {
        console.error('File selection error:', error);
        return [];
    }
}

export async function readFileContent(filePath: string): Promise<{ content: string; name: string; type: string }> {
    try {
        const file = fs.File.fromPath(filePath);
        const content = await file.readText();

        // Extract filename from path
        let fileName = filePath.split('/').pop() || 'unknown';
        if (fileName.includes('%3A')) {
            try {
                fileName = decodeURIComponent(fileName);
            } catch (e) {
                // Keep original filename if decoding fails
            }
        }

        return {
            content: content,
            name: fileName,
            type: 'text/plain'
        };

    } catch (error) {
        console.error('Error reading file content:', error);
        throw error;
    }
}

export async function shareFile(filename: string, content: string): Promise<void> {
    try {
        const tempDir = knownFolders.temp();
        const sanitizedFilename = sanitizeFilename(filename);
        const tempFile = tempDir.getFile(sanitizedFilename);

        await tempFile.writeText(content, 'utf8');

        const shareFile = new ShareFile();
        await shareFile.open({
            path: tempFile.path,
            title: `Save ${filename}`,
            options: true,
            animated: true
        });

        console.log('File exported:', filename);
    } catch (error) {
        console.error('Share file error:', error);
        throw error;
    }
}

function sanitizeFilename(filename: string): string {
    return filename.replace(/[<>:"/\\|?*]/g, '_').substring(0, 255);
}
