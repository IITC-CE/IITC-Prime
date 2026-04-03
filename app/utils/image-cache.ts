// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { knownFolders, Folder, File, path, Http } from '@nativescript/core';

class ImageCacheService {
  private memoryCache = new Map<string, string>();
  private urlToFilename = new Map<string, string>();
  private readonly cacheDuration: number = 30 * 24 * 60 * 60 * 1000; // 30 days
  private cacheFolder: Folder;

  constructor() {
    this.initializeFileCache();
  }

  private initializeFileCache(): void {
    try {
      this.cacheFolder = knownFolders.temp().getFolder('image-cache');
    } catch (error) {
      console.error('Failed to initialize image file cache:', error);
    }
  }

  // Generate filename for cache file based on full URL
  private getFilename(url: string): string {
    // Extract original filename from URL
    const urlParts = url.split('/');
    const originalName = urlParts[urlParts.length - 1].split('?')[0];

    // Extract extension
    const extMatch = originalName.match(/\.(png|jpg|jpeg|gif|webp|bmp)$/i);
    const ext = extMatch ? extMatch[0].toLowerCase() : '.png';

    const baseName = originalName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '-');

    // Hash full URL to distinguish same filenames from different sources
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return `${baseName}-${Math.abs(hash)}${ext}`;
  }

  // Get cached file path if valid
  private getFromFileCache(url: string): string | null {
    try {
      let filename = this.urlToFilename.get(url);
      if (!filename) {
        filename = this.getFilename(url);
        this.urlToFilename.set(url, filename);
      }

      const filePath = path.join(this.cacheFolder.path, filename);

      if (!File.exists(filePath)) {
        return null;
      }

      const file = this.cacheFolder.getFile(filename);
      const fileAge = Date.now() - file.lastModified.getTime();

      if (fileAge > this.cacheDuration) {
        file.removeSync();
        return null;
      }

      return filePath;
    } catch (error) {
      console.error('Failed to read from image file cache:', error);
      return null;
    }
  }

  // Download image and save to cache, returns local file path
  private async downloadToCache(url: string): Promise<string | null> {
    try {
      const filename = this.getFilename(url);
      const filePath = path.join(this.cacheFolder.path, filename);

      await Http.getFile(url, filePath);

      this.urlToFilename.set(url, filename);
      return filePath;
    } catch (error) {
      console.error('Failed to download image:', error);
      return null;
    }
  }

  // Get local file path for image (from cache or download)
  get(url: string): string | null {
    const cached = this.memoryCache.get(url);
    if (cached) {
      return cached;
    }

    const filePath = this.getFromFileCache(url);
    if (filePath) {
      this.memoryCache.set(url, filePath);
      return filePath;
    }

    return null;
  }

  // Download image and cache it, returns local file path
  async fetch(url: string): Promise<string | null> {
    // Check caches first
    const cached = this.get(url);
    if (cached) {
      return cached;
    }

    const filePath = await this.downloadToCache(url);
    if (filePath) {
      this.memoryCache.set(url, filePath);
    }
    return filePath;
  }
}

const imageCacheService = new ImageCacheService();

export default imageCacheService;
