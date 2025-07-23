// ===== Screen Recorder App =====
class ScreenRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.stream = null;
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = null;
        this.timerInterval = null;
        this.recordings = [];

        this.initializeElements();
        this.bindEvents();
        this.initializeTheme();
        this.loadRecordingsFromStorage();
        this.initializeDevices();
    }

    // Initialize DOM elements
    initializeElements() {
        this.startBtn = document.getElementById('startRecording');
        this.stopBtn = document.getElementById('stopRecording');
        this.pauseBtn = document.getElementById('pauseRecording');
        this.screenshotBtn = document.getElementById('takeScreenshot');
        this.previewVideo = document.getElementById('previewVideo');
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.recordingTimer = document.getElementById('recordingTimer');
        this.recordingsList = document.getElementById('recordingsList');
        this.themeToggle = document.getElementById('themeToggle');
        this.storageUsage = document.getElementById('storageUsage');
        this.clearAllBtn = document.getElementById('clearAllRecordings');

        // Options
        this.recordingSource = document.getElementById('recordingSource');
        this.videoQuality = document.getElementById('videoQuality');
        this.autoDownload = document.getElementById('autoDownload');
        this.videoFormat = document.getElementById('videoFormat');
        this.frameRate = document.getElementById('frameRate');
    }

    // Bind event listeners
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.screenshotBtn.addEventListener('click', () => this.takeScreenshot());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.clearAllBtn.addEventListener('click', () => this.clearAllRecordings());



        // Make checkmarks clickable
        this.setupCheckboxes();
        
        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });
        
        // Close modal on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    // Initialize theme
    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    // Toggle theme
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    // Update theme icon
    updateThemeIcon(theme) {
        const icon = this.themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Setup checkbox functionality
    setupCheckboxes() {
        // Make checkmarks clickable for all checkboxes
        document.querySelectorAll('.option-group').forEach(group => {
            const checkbox = group.querySelector('input[type="checkbox"]');
            const checkmark = group.querySelector('.checkmark');

            if (checkbox && checkmark) {
                checkmark.addEventListener('click', (e) => {
                    e.preventDefault();
                    checkbox.checked = !checkbox.checked;

                    // Trigger change event
                    const event = new Event('change', { bubbles: true });
                    checkbox.dispatchEvent(event);
                });

                // Also make label clickable
                const label = group.querySelector('label');
                if (label) {
                    label.addEventListener('click', (e) => {
                        e.preventDefault();
                        checkbox.checked = !checkbox.checked;

                        // Trigger change event
                        const event = new Event('change', { bubbles: true });
                        checkbox.dispatchEvent(event);
                    });
                }
            }
        });
    }

    // Initialize devices
    async initializeDevices() {
        console.log('No devices to initialize - audio removed');
    }











    // Get screen capture constraints
    getScreenConstraints() {
        const quality = this.videoQuality.value;
        const frameRate = parseInt(this.frameRate.value);

        let constraints = {
            video: {
                frameRate: frameRate
            },
            audio: false // No audio
        };

        // Set video quality
        switch (quality) {
            case '1080p':
                constraints.video.width = 1920;
                constraints.video.height = 1080;
                break;
            case '720p':
                constraints.video.width = 1280;
                constraints.video.height = 720;
                break;
            case '480p':
                constraints.video.width = 854;
                constraints.video.height = 480;
                break;
        }

        return constraints;
    }



    // Start recording
    async startRecording() {
        try {
            console.log('Starting screen recording...');

            // Get screen stream (video only)
            const screenConstraints = this.getScreenConstraints();
            console.log('Getting screen stream with constraints:', screenConstraints);
            this.stream = await navigator.mediaDevices.getDisplayMedia(screenConstraints);

            // Set up preview
            this.previewVideo.srcObject = this.stream;

            // Set up MediaRecorder
            const options = {
                mimeType: this.getSupportedMimeType()
            };

            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.saveRecording();
            };

            // Handle stream end (user stops sharing screen)
            const screenTrack = this.stream.getVideoTracks()[0];
            if (screenTrack) {
                screenTrack.onended = () => {
                    console.log('Screen sharing ended by user');
                    this.stopRecording();
                };
            }

            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;
            this.startTime = Date.now();

            // Update UI
            this.updateRecordingUI();
            this.startTimer();

            this.showNotification('بدأ تسجيل الشاشة بنجاح!', 'success');

        } catch (error) {
            console.error('Failed to start recording:', error);
            this.showError('فشل في بدء التسجيل: ' + error.message);
        }
    }

    // Stop recording
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            console.log('Stopping recording...');

            this.mediaRecorder.stop();

            // Stop all stream tracks
            if (this.stream) {
                this.stream.getTracks().forEach(track => {
                    track.stop();
                    console.log('Stopped stream track:', track.kind);
                });
                this.stream = null;
            }

            this.isRecording = false;
            this.isPaused = false;

            this.updateRecordingUI();
            this.stopTimer();

            // Clear preview
            this.previewVideo.srcObject = null;

            this.showNotification('تم إيقاف التسجيل بنجاح!', 'success');
        }
    }

    // Toggle pause/resume
    togglePause() {
        if (!this.isRecording) return;
        
        if (this.isPaused) {
            this.mediaRecorder.resume();
            this.isPaused = false;
            this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>إيقاف مؤقت</span>';
        } else {
            this.mediaRecorder.pause();
            this.isPaused = true;
            this.pauseBtn.innerHTML = '<i class="fas fa-play"></i><span>استئناف</span>';
        }
    }

    // Take screenshot
    async takeScreenshot() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'screen' }
            });

            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            video.onloadedmetadata = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0);

                // Convert to blob and save
                canvas.toBlob((blob) => {
                    const fileName = `screenshot-${this.formatDate(new Date())}.png`;

                    // Save to local storage
                    this.saveToLocalStorage(blob, fileName, 'image');

                    // Download automatically if enabled
                    if (this.autoDownload.checked) {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileName;
                        a.click();
                        URL.revokeObjectURL(url);

                        this.showNotification('تم أخذ وتحميل لقطة الشاشة بنجاح!', 'success');
                    } else {
                        this.showNotification('تم أخذ لقطة الشاشة بنجاح! يمكنك تحميلها من قائمة التسجيلات', 'success');
                    }

                    stream.getTracks().forEach(track => track.stop());
                }, 'image/png');
            };

        } catch (error) {
            this.showError('فشل في أخذ لقطة الشاشة: ' + error.message);
        }
    }

    // Get supported MIME type
    getSupportedMimeType() {
        const types = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4'
        ];
        
        for (let type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        
        return 'video/webm';
    }

    // Save recording
    saveRecording() {
        if (this.recordedChunks.length === 0) return;

        const blob = new Blob(this.recordedChunks, {
            type: this.getSupportedMimeType()
        });

        const fileName = `recording-${this.formatDate(new Date())}.webm`;

        // Save to local storage
        this.saveToLocalStorage(blob, fileName, 'video');

        // Download automatically if enabled
        if (this.autoDownload.checked) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);

            this.showNotification('تم حفظ وتحميل التسجيل بنجاح!', 'success');
        } else {
            this.showNotification('تم حفظ التسجيل بنجاح! يمكنك تحميله من قائمة التسجيلات', 'success');
        }
    }

    // Update recording UI
    updateRecordingUI() {
        this.startBtn.disabled = this.isRecording;
        this.stopBtn.disabled = !this.isRecording;
        this.pauseBtn.disabled = !this.isRecording;
        
        if (this.isRecording) {
            this.recordingIndicator.classList.add('active');
        } else {
            this.recordingIndicator.classList.remove('active');
        }
    }

    // Start timer
    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            this.recordingTimer.textContent = this.formatTime(elapsed);
        }, 1000);
    }

    // Stop timer
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.recordingTimer.textContent = '00:00:00';
    }

    // Format time
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Format date
    formatDate(date) {
        return date.toISOString().slice(0, 19).replace(/:/g, '-');
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Save to local storage
    saveToLocalStorage(blob, fileName, type) {
        const reader = new FileReader();
        reader.onload = () => {
            const recording = {
                id: Date.now().toString(),
                name: fileName,
                data: reader.result,
                size: this.formatFileSize(blob.size),
                sizeBytes: blob.size,
                date: new Date().toISOString(),
                type: type,
                mimeType: blob.type
            };

            this.recordings.push(recording);
            this.saveRecordingsToStorage();
            this.displayRecordings();
        };
        reader.readAsDataURL(blob);
    }

    // Save recordings to localStorage
    saveRecordingsToStorage() {
        try {
            // Keep only last 10 recordings to avoid storage limit
            const recordingsToSave = this.recordings.slice(-10);
            localStorage.setItem('screenRecordings', JSON.stringify(recordingsToSave));
        } catch (error) {
            console.warn('Failed to save recordings to localStorage:', error);
            this.showNotification('تحذير: لا يمكن حفظ التسجيل في التخزين المحلي', 'warning');
        }
    }

    // Load recordings from localStorage
    loadRecordingsFromStorage() {
        try {
            const saved = localStorage.getItem('screenRecordings');
            if (saved) {
                this.recordings = JSON.parse(saved);
                this.displayRecordings();
            }
        } catch (error) {
            console.warn('Failed to load recordings from localStorage:', error);
            this.recordings = [];
        }
    }

    // Display all recordings
    displayRecordings() {
        // Clear current list
        this.recordingsList.innerHTML = '';

        if (this.recordings.length === 0) {
            this.recordingsList.innerHTML = `
                <div class="no-recordings">
                    <i class="fas fa-folder-open"></i>
                    <p>لا توجد تسجيلات محفوظة بعد</p>
                </div>
            `;
            return;
        }

        // Sort recordings by date (newest first)
        const sortedRecordings = [...this.recordings].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        sortedRecordings.forEach(recording => {
            this.addRecordingToList(recording);
        });

        this.updateStorageInfo();
    }

    // Add single recording to list
    addRecordingToList(recording) {
        const recordingItem = document.createElement('div');
        recordingItem.className = 'recording-item';
        recordingItem.setAttribute('data-id', recording.id);

        const date = new Date(recording.date);
        const formattedDate = date.toLocaleDateString('ar-SA');
        const formattedTime = date.toLocaleTimeString('ar-SA');

        recordingItem.innerHTML = `
            <div class="recording-thumbnail">
                ${recording.type === 'video' ?
                    `<video src="${recording.data}" controls preload="metadata"></video>` :
                    `<img src="${recording.data}" alt="Screenshot">`
                }
                <div class="recording-overlay">
                    <i class="fas fa-${recording.type === 'video' ? 'play' : 'image'}"></i>
                </div>
            </div>
            <div class="recording-info">
                <h3>${recording.name}</h3>
                <div class="recording-meta">
                    <span><i class="fas fa-hdd"></i> ${recording.size}</span>
                    <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                    <span><i class="fas fa-clock"></i> ${formattedTime}</span>
                </div>
                <div class="recording-actions">
                    <button class="btn btn-primary btn-small" onclick="window.screenRecorder.playRecording('${recording.id}')">
                        <i class="fas fa-play"></i> تشغيل
                    </button>
                    <button class="btn btn-success btn-small" onclick="window.screenRecorder.downloadRecording('${recording.id}')">
                        <i class="fas fa-download"></i> تحميل
                    </button>
                    <button class="btn btn-danger btn-small" onclick="window.screenRecorder.deleteRecording('${recording.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;

        this.recordingsList.appendChild(recordingItem);
    }

    // Play recording
    playRecording(recordingId) {
        const recording = this.recordings.find(r => r.id === recordingId);
        if (!recording) return;

        if (recording.type === 'video') {
            // Open video in new window
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`
                <!DOCTYPE html>
                <html dir="rtl">
                <head>
                    <title>${recording.name}</title>
                    <style>
                        body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
                        video { max-width: 100%; max-height: 100vh; }
                    </style>
                </head>
                <body>
                    <video controls autoplay>
                        <source src="${recording.data}" type="${recording.mimeType}">
                        متصفحك لا يدعم تشغيل الفيديو
                    </video>
                </body>
                </html>
            `);
        } else {
            // Open image in new window
            window.open(recording.data, '_blank');
        }
    }

    // Download recording
    downloadRecording(recordingId) {
        const recording = this.recordings.find(r => r.id === recordingId);
        if (!recording) return;

        const a = document.createElement('a');
        a.href = recording.data;
        a.download = recording.name;
        a.click();

        this.showNotification('تم بدء التحميل', 'success');
    }

    // Delete recording
    deleteRecording(recordingId) {
        if (!confirm('هل أنت متأكد من حذف هذا التسجيل؟')) return;

        this.recordings = this.recordings.filter(r => r.id !== recordingId);
        this.saveRecordingsToStorage();
        this.displayRecordings();

        this.showNotification('تم حذف التسجيل بنجاح', 'success');
    }

    // Clear all recordings
    clearAllRecordings() {
        if (!confirm('هل أنت متأكد من حذف جميع التسجيلات؟')) return;

        this.recordings = [];
        this.saveRecordingsToStorage();
        this.displayRecordings();

        this.showNotification('تم حذف جميع التسجيلات', 'success');
    }

    // Get storage usage
    getStorageUsage() {
        const totalSize = this.recordings.reduce((sum, recording) => sum + recording.sizeBytes, 0);
        return {
            totalSize: totalSize,
            formattedSize: this.formatFileSize(totalSize),
            recordingsCount: this.recordings.length
        };
    }

    // Update storage info display
    updateStorageInfo() {
        const usage = this.getStorageUsage();
        const videoCount = this.recordings.filter(r => r.type === 'video').length;
        const imageCount = this.recordings.filter(r => r.type === 'image').length;

        let text = '';
        if (usage.recordingsCount === 0) {
            text = 'لا توجد تسجيلات';
        } else {
            const parts = [];
            if (videoCount > 0) parts.push(`${videoCount} فيديو`);
            if (imageCount > 0) parts.push(`${imageCount} صورة`);
            text = `${parts.join(' • ')} • ${usage.formattedSize}`;
        }

        this.storageUsage.textContent = text;
    }

    // Show error modal
    showError(message) {
        console.error('Error:', message);

        const errorModal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');

        if (errorModal && errorMessage) {
            errorMessage.textContent = message;
            errorModal.classList.add('active');
        } else {
            // Fallback to notification if modal not available
            this.showNotification(message, 'error');
        }
    }

    // Check browser compatibility
    checkBrowserSupport() {
        const errors = [];

        if (!navigator.mediaDevices) {
            errors.push('متصفحك لا يدعم الوصول للأجهزة');
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            errors.push('متصفحك لا يدعم تسجيل الشاشة');
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            errors.push('متصفحك لا يدعم الوصول للكاميرا والميكروفون');
        }

        if (!MediaRecorder) {
            errors.push('متصفحك لا يدعم تسجيل الوسائط');
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.warn('متصفحك لا يدعم عرض قائمة الأجهزة');
        }

        if (errors.length > 0) {
            this.showError(errors.join('\n'));
            return false;
        }

        console.log('Browser support check passed');
        return true;
    }

    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R: Start/Stop recording
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                if (this.isRecording) {
                    this.stopRecording();
                } else {
                    this.startRecording();
                }
            }

            // Ctrl/Cmd + P: Pause/Resume
            if ((e.ctrlKey || e.metaKey) && e.key === 'p' && this.isRecording) {
                e.preventDefault();
                this.togglePause();
            }

            // Ctrl/Cmd + S: Take screenshot
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.takeScreenshot();
            }

            // Escape: Stop recording
            if (e.key === 'Escape' && this.isRecording) {
                this.stopRecording();
            }
        });
    }

    // Save settings to localStorage
    saveSettings() {
        const settings = {
            recordingSource: this.recordingSource.value,
            videoQuality: this.videoQuality.value,
            autoDownload: this.autoDownload.checked,
            videoFormat: this.videoFormat.value,
            frameRate: this.frameRate.value
        };

        localStorage.setItem('screenRecorderSettings', JSON.stringify(settings));
    }

    // Load settings from localStorage
    loadSettings() {
        const savedSettings = localStorage.getItem('screenRecorderSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);

            this.recordingSource.value = settings.recordingSource || 'screen';
            this.videoQuality.value = settings.videoQuality || '1080p';
            this.autoDownload.checked = settings.autoDownload === true;
            this.videoFormat.value = settings.videoFormat || 'webm';
            this.frameRate.value = settings.frameRate || '30';

            console.log('Settings loaded:', settings);
        }
    }

    // Add settings change listeners
    addSettingsListeners() {
        [this.recordingSource, this.videoQuality, this.autoDownload, this.videoFormat, this.frameRate].forEach(element => {
            element.addEventListener('change', () => this.saveSettings());
        });
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        let iconClass = 'info-circle';
        if (type === 'success') iconClass = 'check-circle';
        else if (type === 'error') iconClass = 'exclamation-circle';
        else if (type === 'warning') iconClass = 'exclamation-triangle';

        notification.innerHTML = `
            <i class="fas fa-${iconClass}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    // Initialize all features
    initialize() {
        if (!this.checkBrowserSupport()) {
            return;
        }

        console.log('Initializing Screen Recorder...');

        this.loadSettings();
        this.addSettingsListeners();
        this.initializeKeyboardShortcuts();
        this.setupCleanupHandlers();

        // Initialize devices after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeDevices();
        }, 500);

        // Show welcome notification
        this.showNotification('مرحباً بك في مسجل الشاشة الاحترافي!', 'success');

        console.log('Screen Recorder initialized successfully');
    }

    // Setup cleanup handlers
    setupCleanupHandlers() {
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Cleanup on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRecording) {
                // Optionally pause recording when tab becomes hidden
                console.log('Tab hidden during recording');
            }
        });
    }

    // Cleanup resources
    cleanup() {
        console.log('Cleaning up all resources...');

        if (this.isRecording) {
            this.stopRecording();
        }

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        console.log('All resources cleaned up');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.screenRecorder = new ScreenRecorder();
    window.screenRecorder.initialize();
});
