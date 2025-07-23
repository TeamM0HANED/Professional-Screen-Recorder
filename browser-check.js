// Browser Compatibility Check
(function() {
    'use strict';
    
    // Check if browser supports required APIs
    function checkBrowserSupport() {
        const features = {
            'Screen Capture API': !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
            'MediaRecorder API': !!window.MediaRecorder,
            'Canvas API': !!document.createElement('canvas').getContext,
            'Blob API': !!window.Blob,
            'URL.createObjectURL': !!(window.URL && window.URL.createObjectURL),
            'Local Storage': !!window.localStorage
        };
        
        const unsupported = [];
        const supported = [];
        
        for (const [feature, isSupported] of Object.entries(features)) {
            if (isSupported) {
                supported.push(feature);
            } else {
                unsupported.push(feature);
            }
        }
        
        return {
            isFullySupported: unsupported.length === 0,
            supported,
            unsupported
        };
    }
    
    // Show browser compatibility warning
    function showCompatibilityWarning(unsupported) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'browser-warning';
        warningDiv.innerHTML = `
            <div class="warning-content">
                <h3>⚠️ تحذير توافق المتصفح</h3>
                <p>متصفحك لا يدعم بعض الميزات المطلوبة:</p>
                <ul>
                    ${unsupported.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
                <p>يُنصح بتحديث المتصفح أو استخدام:</p>
                <ul>
                    <li>Chrome 72+ أو Chromium</li>
                    <li>Firefox 66+</li>
                    <li>Safari 13+</li>
                    <li>Edge 79+</li>
                </ul>
                <button onclick="this.parentElement.parentElement.remove()">إغلاق</button>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .browser-warning {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Cairo', sans-serif;
            }
            
            .warning-content {
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 500px;
                margin: 20px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            
            .warning-content h3 {
                color: #f59e0b;
                margin-bottom: 15px;
                font-size: 1.5rem;
            }
            
            .warning-content ul {
                text-align: right;
                margin: 15px 0;
                padding-right: 20px;
            }
            
            .warning-content li {
                margin: 5px 0;
                color: #ef4444;
            }
            
            .warning-content button {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1rem;
                margin-top: 15px;
            }
            
            .warning-content button:hover {
                background: #1e40af;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(warningDiv);
    }
    
    // Check on page load
    document.addEventListener('DOMContentLoaded', function() {
        const support = checkBrowserSupport();
        
        if (!support.isFullySupported) {
            showCompatibilityWarning(support.unsupported);
        }
        
        // Log support info to console
        console.log('Browser Support Check:', support);
    });
    
    // Export for global access
    window.browserCheck = {
        checkSupport: checkBrowserSupport,
        showWarning: showCompatibilityWarning
    };
})();
