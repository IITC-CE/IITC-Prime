// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { knownFolders, Folder, File, path } from '@nativescript/core';

class SVGCacheService {
  private memoryCache = new Map<string, string>();
  private urlToFilename = new Map<string, string>(); // url -> filename mapping
  private readonly cacheDuration: number = 30 * 24 * 60 * 60 * 1000; // 30 days
  private cacheFolder: Folder;

  constructor() {
    this.initializeFileCache();
  }

  // Initialize file cache folder
  private initializeFileCache(): void {
    try {
      this.cacheFolder = knownFolders.temp().getFolder('svg-cache');
    } catch (error) {
      console.error('Failed to initialize SVG file cache:', error);
    }
  }

  // Generate filename for cache file based on full URL
  private getFilename(url: string): string {
    // Extract plugin name from URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const pluginName = filename.replace('.svg', '').replace(/[^a-zA-Z0-9-]/g, '-');

    // Hash full URL to distinguish same plugin names from different sources
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `${pluginName}-${Math.abs(hash)}.svg`;
  }

  // Get SVG content from file cache
  private getFromFileCache(url: string): string | null {
    try {
      // Use cached filename or generate it
      let filename = this.urlToFilename.get(url);
      if (!filename) {
        filename = this.getFilename(url);
        this.urlToFilename.set(url, filename);
      }

      const filePath = path.join(this.cacheFolder.path, filename);

      if (!File.exists(filePath)) {
        return null;
      }

      // Check if file is expired using lastModified
      const file = this.cacheFolder.getFile(filename);
      const fileAge = Date.now() - file.lastModified.getTime();

      if (fileAge > this.cacheDuration) {
        // File is expired, delete it
        file.removeSync();
        return null;
      }

      const content = file.readTextSync();
      return content;
    } catch (error) {
      console.error('Failed to read from file cache:', error);
      return null;
    }
  }

  // Save SVG content to file cache
  private saveToFileCache(url: string, content: string): void {
    try {
      const filename = this.getFilename(url);
      const file = this.cacheFolder.getFile(filename);
      file.writeTextSync(content);

      // Cache the url->filename mapping
      this.urlToFilename.set(url, filename);
    } catch (error) {
      console.error('Failed to save to file cache:', error);
    }
  }

  // Get SVG content from cache (memory first, then file)
  get(url: string): string | null {
    // 1. Check memory cache first
    const cached = this.memoryCache.get(url);
    if (cached) {
      return cached;
    }

    // 2. Check file cache
    const fileContent = this.getFromFileCache(url);
    if (fileContent) {
      // Load into memory cache
      this.memoryCache.set(url, fileContent);
      return fileContent;
    }

    return null;
  }

  // Store SVG content in both memory and file cache
  set(url: string, content: string): void {
    // Store in memory cache
    this.memoryCache.set(url, content);

    // Store in file cache
    this.saveToFileCache(url, content);
  }


}

// Create singleton instance
const svgCacheService = new SVGCacheService();

export default svgCacheService;
