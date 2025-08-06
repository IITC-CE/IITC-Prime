import { knownFolders } from '@nativescript/core';
import { ShareFile } from '@nativescript-community/ui-share-file';

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
