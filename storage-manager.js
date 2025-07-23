// Storage Manager for Screen Recorder
// Developed by Team Mohaned

class StorageManager {
    constructor() {
        this.storageKey = 'screenRecordings';
        this.maxRecordings = 10;
        this.maxStorageSize = 50 * 1024 * 1024; // 50MB limit
    }

    // Save recording to localStorage
    async saveRecording(blob, fileName, type) {
        try {
            const recording = await this.blobToRecording(blob, fileName, type);
            let recordings = this.getAllRecordings();
            
            // Add new recording
            recordings.push(recording);
            
            // Sort by date (newest first)
            recordings.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Enforce limits
            recordings = this.enforceLimits(recordings);
            
            // Save to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(recordings));
            
            return recording;
        } catch (error) {
            console.error('Failed to save recording:', error);
            throw new Error('فشل في حفظ التسجيل: ' + error.message);
        }
    }

    // Convert blob to recording object
    blobToRecording(blob, fileName, type) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const recording = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: fileName,
                    data: reader.result,
                    size: this.formatFileSize(blob.size),
                    sizeBytes: blob.size,
                    date: new Date().toISOString(),
                    type: type,
                    mimeType: blob.type
                };
                resolve(recording);
            };
            reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
            reader.readAsDataURL(blob);
        });
    }

    // Get all recordings from localStorage
    getAllRecordings() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load recordings:', error);
            return [];
        }
    }

    // Get recording by ID
    getRecording(id) {
        const recordings = this.getAllRecordings();
        return recordings.find(r => r.id === id);
    }

    // Delete recording by ID
    deleteRecording(id) {
        try {
            let recordings = this.getAllRecordings();
            recordings = recordings.filter(r => r.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(recordings));
            return true;
        } catch (error) {
            console.error('Failed to delete recording:', error);
            return false;
        }
    }

    // Clear all recordings
    clearAllRecordings() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Failed to clear recordings:', error);
            return false;
        }
    }

    // Enforce storage limits
    enforceLimits(recordings) {
        // Limit by count
        if (recordings.length > this.maxRecordings) {
            recordings = recordings.slice(0, this.maxRecordings);
        }

        // Limit by size
        let totalSize = 0;
        const filteredRecordings = [];
        
        for (const recording of recordings) {
            if (totalSize + recording.sizeBytes <= this.maxStorageSize) {
                filteredRecordings.push(recording);
                totalSize += recording.sizeBytes;
            } else {
                break;
            }
        }

        return filteredRecordings;
    }

    // Get storage statistics
    getStorageStats() {
        const recordings = this.getAllRecordings();
        const totalSize = recordings.reduce((sum, r) => sum + r.sizeBytes, 0);
        const videoCount = recordings.filter(r => r.type === 'video').length;
        const imageCount = recordings.filter(r => r.type === 'image').length;

        return {
            totalRecordings: recordings.length,
            videoCount,
            imageCount,
            totalSize,
            formattedSize: this.formatFileSize(totalSize),
            usagePercentage: (totalSize / this.maxStorageSize) * 100,
            remainingSpace: this.maxStorageSize - totalSize,
            formattedRemainingSpace: this.formatFileSize(this.maxStorageSize - totalSize)
        };
    }

    // Check if storage is available
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Check if there's enough space for a new recording
    canStoreRecording(sizeBytes) {
        const stats = this.getStorageStats();
        return stats.remainingSpace >= sizeBytes;
    }

    // Export recordings as JSON
    exportRecordings() {
        const recordings = this.getAllRecordings();
        const exportData = {
            exportDate: new Date().toISOString(),
            recordingsCount: recordings.length,
            recordings: recordings.map(r => ({
                ...r,
                data: r.data.substring(0, 100) + '...' // Truncate data for export
            }))
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screen-recordings-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Clean up old recordings automatically
    autoCleanup() {
        try {
            const recordings = this.getAllRecordings();
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const filteredRecordings = recordings.filter(recording => {
                const recordingDate = new Date(recording.date);
                return recordingDate > oneWeekAgo;
            });

            if (filteredRecordings.length !== recordings.length) {
                localStorage.setItem(this.storageKey, JSON.stringify(filteredRecordings));
                console.log(`Cleaned up ${recordings.length - filteredRecordings.length} old recordings`);
            }
        } catch (error) {
            console.error('Auto cleanup failed:', error);
        }
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
} else {
    window.StorageManager = StorageManager;
}
