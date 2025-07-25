// Yamaha Speaker Integration with Flic App Module
// This script integrates Yamaha speakers using the YXC (Yamaha Extended Control) API
// with Flic buttons and Twist controllers for volume control

const flicApp = require('flicapp');
const http = require('http');

console.log('Yamaha Speaker Integration Started');

// ============================================================================
// YAMAHA YXC API CONFIGURATION
// ============================================================================

// Yamaha speaker configuration
const YAMAHA_CONFIG = {
    // Update these with your Yamaha speaker's IP address and zones
    speakers: [
        { 
            id: 'id1main', 
            ip: 'RECEIVER1_IP_ADDRESS', 
            name: 'Name Receiver 1 Main Zone',
            zone: 'main'
        },
        { 
            id: 'id1zone2', 
            ip: 'RECEIVER1_IP_ADDRESS', 
            name: 'Name Receiver 1 Zone 2',
            zone: 'zone2'
        }
    ],
    // YXC API endpoints for different zones
    endpoints: {
        main: {
            volume: '/YamahaExtendedControl/v1/main/setVolume',
            status: '/YamahaExtendedControl/v1/main/getStatus',
            power: '/YamahaExtendedControl/v1/main/setPower',
            mute: '/YamahaExtendedControl/v1/main/setMute'
        },
        zone2: {
            volume: '/YamahaExtendedControl/v1/zone2/setVolume',
            status: '/YamahaExtendedControl/v1/zone2/getStatus',
            power: '/YamahaExtendedControl/v1/zone2/setPower',
            mute: '/YamahaExtendedControl/v1/zone2/setMute'
        }
    },
    // Volume ranges will be discovered dynamically per zone
    volumeRanges: {
        main: {
            min: -80,  // Default fallback
            max: -10   // Default fallback
        },
        zone2: {
            min: -80,  // Default fallback
            max: -10   // Default fallback
        }
    }
};

// ============================================================================
// YAMAHA API FUNCTIONS
// ============================================================================

/**
 * Send HTTP request to Yamaha speaker
 * @param {string} ip - Speaker IP address
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data
 * @param {string} zone - Zone type (main or zone2)
 * @returns {Promise} - Response promise
 */
function sendYamahaRequest(ip, endpoint, data, zone = 'main') {
    let url = `http://${ip}${endpoint}`;
    if (data) {
        const params = [];
        if (data.volume !== undefined) params.push(`volume=${encodeURIComponent(data.volume)}`);
        if (data.power !== undefined) params.push(`power=${encodeURIComponent(data.power)}`);
        if (data.mute !== undefined) params.push(`mute=${encodeURIComponent(data.mute)}`);
        if (data.enable !== undefined) params.push(`enable=${encodeURIComponent(data.enable)}`);
        if (data.playback !== undefined) params.push(`playback=${encodeURIComponent(data.playback)}`);
        if (params.length > 0) url += '?' + params.join('&');
    }
    
    //console.log(`🌐 HTTP ${data?.volume ? 'volume' : 'status'} request: ${url}`);
    
    return new Promise((resolve, reject) => {
        const requestOptions = {
            url: url,
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Flic-Hub-Studio/1.0'
            }
        };
        
        const timeoutId = setTimeout(() => {
            reject(new Error('Request timeout'));
        }, 5000);
        
        http.makeRequest(requestOptions, (error, result) => {
            clearTimeout(timeoutId);
            
            if (error) {
                reject(new Error(`HTTP request failed: ${error}`));
            } else {
                const responseData = result || {};
                const statusCode = responseData.statusCode || responseData.status || 200;
                const content = responseData.content || responseData.body || responseData.data || '';
                
                resolve({ 
                    success: true, 
                    data: { 
                        status: statusCode, 
                        body: content,
                        headers: responseData.headers || {},
                        statusMessage: responseData.statusMessage || 'OK'
                    } 
                });
            }
        });
    });
}



/**
 * Set volume for a specific Yamaha speaker
 * @param {string} speakerId - Speaker identifier
 * @param {number} volume - Volume level (0-100)
 * @returns {Promise} - Response promise
 */
async function setYamahaVolume(speakerId, volume) {
    const speaker = YAMAHA_CONFIG.speakers.find(s => s.id === speakerId);
    if (!speaker) {
        throw new Error(`Speaker ${speakerId} not found`);
    }
    
    const volumeValue = Math.round(volume);
    
    try {
        const response = await sendYamahaRequest(speaker.ip, YAMAHA_CONFIG.endpoints[speaker.zone].volume, {
            volume: volumeValue
        }, speaker.zone);
        
        if (response.success) {
            // Get actual volume from device and update virtual device state
            await getCurrentVolumeAndUpdate(speaker);
            
            return response;
        } else {
            throw new Error(`Failed to set volume for ${speaker.name}`);
        }
    } catch (error) {
        console.error(`❌ Error setting volume for ${speaker.name}:`, error);
        throw error;
    }
}



/**
 * Set power state for a specific Yamaha speaker
 * @param {string} speakerId - Speaker identifier
 * @param {boolean} powerOn - True to turn on, false to turn off
 * @returns {Promise} - Response promise
 */
async function setYamahaPower(speakerId, powerOn) {
    const speaker = YAMAHA_CONFIG.speakers.find(s => s.id === speakerId);
    if (!speaker) {
        throw new Error(`Speaker ${speakerId} not found`);
    }
    
    const powerState = powerOn ? 'on' : 'standby';
    console.log(`Setting power for ${speaker.name} (${speaker.zone} zone) to ${powerState}`);
    
    try {
        const response = await sendYamahaRequest(speaker.ip, YAMAHA_CONFIG.endpoints[speaker.zone].power, {
            power: powerState
        }, speaker.zone);
        
        if (response.success) {
            console.log(`Successfully set power for ${speaker.name}`);
            return response;
        } else {
            throw new Error(`Failed to set power for ${speaker.name}`);
        }
    } catch (error) {
        console.error(`Error setting power for ${speaker.name}:`, error);
        throw error;
    }
}

/**
 * Set mute state for a specific Yamaha speaker
 * @param {string} speakerId - Speaker identifier
 * @param {boolean} muted - True to mute, false to unmute
 * @returns {Promise} - Response promise
 */
async function setYamahaMute(speakerId, muted) {
    const speaker = YAMAHA_CONFIG.speakers.find(s => s.id === speakerId);
    if (!speaker) {
        throw new Error(`Speaker ${speakerId} not found`);
    }
    
    const muteState = muted ? 'true' : 'false';
    console.log(`Setting mute for ${speaker.name} (${speaker.zone} zone) to ${muteState}`);
    
    try {
        const response = await sendYamahaRequest(speaker.ip, YAMAHA_CONFIG.endpoints[speaker.zone].mute, {
            mute: muteState
        }, speaker.zone);
        
        if (response.success) {
            console.log(`Successfully set mute for ${speaker.name}`);
            return response;
        } else {
            throw new Error(`Failed to set mute for ${speaker.name}`);
        }
    } catch (error) {
        console.error(`Error setting mute for ${speaker.name}:`, error);
        throw error;
    }
}

/**
 * Discover volume ranges from Yamaha device for all zones
 * @param {string} ip - Device IP address
 * @returns {Promise<Object>} - Volume ranges object per zone
 */
async function discoverVolumeRanges(ip) {
    try {
        const response = await sendYamahaRequest(ip, '/YamahaExtendedControl/v1/system/getFeatures', null, 'main');
        
        if (response.success && response.data.body) {
            const featuresData = JSON.parse(response.data.body);
            const discoveredRanges = {};
            
            // Look for volume ranges in each zone's range_step array
            if (featuresData.zone && Array.isArray(featuresData.zone)) {
                for (const zone of featuresData.zone) {
                    if (zone.range_step && Array.isArray(zone.range_step)) {
                        // Find the actual_volume_numeric entry for this zone (percentage format)
                        const volumeRange = zone.range_step.find(item => item.id === 'actual_volume_numeric');
                        if (volumeRange && volumeRange.min !== undefined && volumeRange.max !== undefined) {
                            discoveredRanges[zone.id] = {
                                min: volumeRange.min,
                                max: volumeRange.max
                            };
                        }
                    }
                }
            }
            
            if (Object.keys(discoveredRanges).length > 0) {
                return discoveredRanges;
            }
        }
    } catch (error) {
        console.error('❌ Error discovering volume ranges:', error);
    }
    
    // Return default ranges if discovery fails
    return YAMAHA_CONFIG.volumeRanges;
}





// ============================================================================
// FLIC APP MODULE INTEGRATION
// ============================================================================

// Track last playback command timestamp for cooldown
let lastPlaybackCommandTime = 0;
const PLAYBACK_COOLDOWN_MS = 2500; // 2.5 seconds

// Handle action messages from Flic app
flicApp.on('actionMessage', (message) => {
    console.log('Received action message:', message);
    
    // Parse device-specific commands: "{device-id} {action}"
    const parts = message.toLowerCase().split(' ');
    if (parts.length >= 2) {
        const deviceId = parts[0];
        const action = parts.slice(1).join(' ');
        
        // Find the speaker by device ID
        const speaker = YAMAHA_CONFIG.speakers.find(s => s.id === deviceId);
        if (!speaker) {
            console.log(`Unknown device: ${deviceId}`);
            return;
        }
        
        // Handle device-specific actions
        switch (action) {
            case 'volume up':
                handleDeviceVolumeUp(deviceId);
                break;
            case 'volume down':
                handleDeviceVolumeDown(deviceId);
                break;
            case 'mute':
                handleDeviceMuteToggle(deviceId);
                break;
            case 'power':
                handleDevicePowerToggle(deviceId);
                break;
            case 'on':
                handleDevicePowerOn(deviceId);
                break;
            case 'off':
                handleDevicePowerOff(deviceId);
                break;
            default:
                console.log(`Unknown action for device ${deviceId}: ${action}`);
                break;
        }
    } else {
        console.log('Invalid action message format. Expected: "{device-id} {action}"');
    }
});

// Handle virtual device updates from Flic Twist controllers
flicApp.on('virtualDeviceUpdate', (metaData, values) => {
    if (metaData.dimmableType === 'Speaker') {
        if (metaData.virtualDeviceId === 'skip') {
            handleSkipDeviceUpdate(metaData.virtualDeviceId, values);
        } else {
            handleYamahaSpeakerUpdate(metaData.virtualDeviceId, values);
        }
    }
});

// ============================================================================
// ACTION HANDLERS
// ============================================================================

let currentVolume = 50; // Default volume level
let mainZoneVolume = 50; // Main zone volume level
let zone2Volume = 50; // Zone 2 volume level

/**
 * Handle volume up for specific device
 */
async function handleDeviceVolumeUp(deviceId) {
    // Check playback command cooldown before allowing volume changes
    const currentTime = Date.now();
    const timeSinceLastCommand = currentTime - lastPlaybackCommandTime;
    
    if (timeSinceLastCommand < PLAYBACK_COOLDOWN_MS) {
        const remainingCooldown = Math.ceil((PLAYBACK_COOLDOWN_MS - timeSinceLastCommand) / 1000);
        console.log(`⏳ Volume up command ignored - playback cooldown active (${remainingCooldown}s remaining)`);
        return;
    }
    
    const speaker = YAMAHA_CONFIG.speakers.find(s => s.id === deviceId);
    if (!speaker) {
        console.error(`Device not found: ${deviceId}`);
        return;
    }
    
    try {
        // Get current volume
        const statusResponse = await sendYamahaRequest(speaker.ip, YAMAHA_CONFIG.endpoints[speaker.zone].status, null, speaker.zone);
        
        if (statusResponse.success) {
            const statusData = JSON.parse(statusResponse.data.body);
            const currentVolume = statusData.volume;
            const newVolume = Math.min(100, currentVolume + 10);
            
            await setYamahaVolume(deviceId, newVolume);
        } else {
            console.error(`❌ Failed to get current volume for ${speaker.name}`);
        }
    } catch (error) {
        console.error(`❌ Error increasing volume for ${speaker.name}:`, error);
    }
}

/**
 * Handle volume down for specific device
 */
async function handleDeviceVolumeDown(deviceId) {
    // Check playback command cooldown before allowing volume changes
    const currentTime = Date.now();
    const timeSinceLastCommand = currentTime - lastPlaybackCommandTime;
    
    if (timeSinceLastCommand < PLAYBACK_COOLDOWN_MS) {
        const remainingCooldown = Math.ceil((PLAYBACK_COOLDOWN_MS - timeSinceLastCommand) / 1000);
        console.log(`⏳ Volume down command ignored - playback cooldown active (${remainingCooldown}s remaining)`);
        return;
    }
    
    const speaker = YAMAHA_CONFIG.speakers.find(s => s.id === deviceId);
    if (!speaker) {
        console.error(`Device not found: ${deviceId}`);
        return;
    }
    
    try {
        // Get current volume
        const statusResponse = await sendYamahaRequest(speaker.ip, YAMAHA_CONFIG.endpoints[speaker.zone].status, null, speaker.zone);
        
        if (statusResponse.success) {
            const statusData = JSON.parse(statusResponse.data.body);
            const currentVolume = statusData.volume;
            const newVolume = Math.max(0, currentVolume - 10);
            
            await setYamahaVolume(deviceId, newVolume);
        } else {
            console.error(`❌ Failed to get current volume for ${speaker.name}`);
        }
    } catch (error) {
        console.error(`❌ Error decreasing volume for ${speaker.name}:`, error);
    }
}

/**
 * Handle mute toggle for specific device
 */
async function handleDeviceMuteToggle(deviceId) {
    const speaker = YAMAHA_CONFIG.speakers.find(s => s.id === deviceId);
    if (!speaker) {
        console.error(`Device not found: ${deviceId}`);
        return;
    }
    
    try {
        // Get current mute status
        const statusResponse = await sendYamahaRequest(speaker.ip, YAMAHA_CONFIG.endpoints[speaker.zone].status, null, speaker.zone);
        
        if (statusResponse.success) {
            const statusData = JSON.parse(statusResponse.data.body);
            const isCurrentlyMuted = statusData.mute;
            
            // Toggle mute status
            const newMuteState = !isCurrentlyMuted;
            const response = await sendYamahaRequest(speaker.ip, YAMAHA_CONFIG.endpoints[speaker.zone].mute, {
                enable: newMuteState.toString()
            }, speaker.zone);
            
            if (response.success) {
                console.log(`✅ ${speaker.name} ${newMuteState ? 'muted' : 'unmuted'}`);
            } else {
                console.error(`❌ Failed to toggle mute for ${speaker.name}`);
            }
        } else {
            console.error(`❌ Failed to get mute status for ${speaker.name}`);
        }
    } catch (error) {
        console.error(`❌ Error toggling mute for ${speaker.name}:`, error);
    }
}

/**
 * Handle power toggle for specific device
 */
async function handleDevicePowerToggle(deviceId) {
    const speaker = YAMAHA_CONFIG.speakers.find(s => s.id === deviceId);
    if (!speaker) {
        console.error(`Device not found: ${deviceId}`);
        return;
    }
    
    try {
        // Get current power status
        const statusResponse = await sendYamahaRequest(speaker.ip, YAMAHA_CONFIG.endpoints[speaker.zone].status, null, speaker.zone);
        
        if (statusResponse.success) {
            const statusData = JSON.parse(statusResponse.data.body);
            const isCurrentlyOn = statusData.power === 'on';
            
            // Toggle power status
            const newPowerState = isCurrentlyOn ? 'standby' : 'on';
            const response = await sendYamahaRequest(speaker.ip, YAMAHA_CONFIG.endpoints[speaker.zone].power, {
                power: newPowerState
            }, speaker.zone);
            
            if (response.success) {
                console.log(`✅ ${speaker.name} turned ${newPowerState === 'on' ? 'on' : 'off'}`);
            } else {
                console.error(`❌ Failed to toggle power for ${speaker.name}`);
            }
        } else {
            console.error(`❌ Failed to get power status for ${speaker.name}`);
        }
    } catch (error) {
        console.error(`❌ Error toggling power for ${speaker.name}:`, error);
    }
}

/**
 * Handle power on for specific device
 */
async function handleDevicePowerOn(deviceId) {
    const speaker = YAMAHA_CONFIG.speakers.find(s => s.id === deviceId);
    if (!speaker) {
        console.error(`Device not found: ${deviceId}`);
        return;
    }
    
    try {
        const response = await sendYamahaRequest(speaker.ip, YAMAHA_CONFIG.endpoints[speaker.zone].power, {
            power: 'on'
        }, speaker.zone);
        
        if (response.success) {
            console.log(`✅ ${speaker.name} turned on`);
        } else {
            console.error(`❌ Failed to turn on ${speaker.name}`);
        }
    } catch (error) {
        console.error(`❌ Error turning on ${speaker.name}:`, error);
    }
}

/**
 * Handle power off for specific device
 */
async function handleDevicePowerOff(deviceId) {
    const speaker = YAMAHA_CONFIG.speakers.find(s => s.id === deviceId);
    if (!speaker) {
        console.error(`Device not found: ${deviceId}`);
        return;
    }
    
    try {
        const response = await sendYamahaRequest(speaker.ip, YAMAHA_CONFIG.endpoints[speaker.zone].power, {
            power: 'standby'
        }, speaker.zone);
        
        if (response.success) {
            console.log(`✅ ${speaker.name} turned off`);
        } else {
            console.error(`❌ Failed to turn off ${speaker.name}`);
        }
    } catch (error) {
        console.error(`❌ Error turning off ${speaker.name}:`, error);
    }
}

/**
 * Get playback status from Yamaha device
 * @param {Object} speaker - Speaker configuration
 * @returns {Promise<string>} - Playback status ('play', 'pause', 'stop', or 'unknown')
 */
async function getPlaybackStatus(speaker) {
    try {
        const response = await sendYamahaRequest(speaker.ip, YAMAHA_CONFIG.endpoints[speaker.zone].status, null, speaker.zone);
        
        if (response.success) {
            const statusData = JSON.parse(response.data.body);
            // Check if device is powered on first
            if (statusData.power !== 'on') {
                return 'off';
            }
            
            // Try to get playback status from netusb info
            const netusbResponse = await sendYamahaRequest(speaker.ip, '/YamahaExtendedControl/v1/netusb/getPlayInfo', null, speaker.zone);
            if (netusbResponse.success) {
                const netusbData = JSON.parse(netusbResponse.data.body);
                return netusbData.playback || 'unknown';
            }
            
            return 'unknown';
        } else {
            console.error(`❌ Failed to get playback status for ${speaker.name}`);
            return 'unknown';
        }
    } catch (error) {
        console.error(`❌ Error getting playback status for ${speaker.name}:`, error);
        return 'unknown';
    }
}

/**
 * Pause playback on Yamaha device
 * @param {Object} speaker - Speaker configuration
 * Uses: /netusb/setPlayback?playback=pause
 */
async function pausePlayback(speaker) {
    try {
        const response = await sendYamahaRequest(speaker.ip, '/YamahaExtendedControl/v1/netusb/setPlayback', {
            playback: 'pause'
        }, speaker.zone);
        
        if (response.success) {
            console.log(`⏸️ ${speaker.name} playback paused`);
        } else {
            console.error(`❌ Failed to pause ${speaker.name}`);
        }
    } catch (error) {
        console.error(`❌ Error pausing ${speaker.name}:`, error);
    }
}

/**
 * Resume playback on Yamaha device
 * @param {Object} speaker - Speaker configuration
 * Uses: /netusb/setPlayback?playback=play
 */
async function resumePlayback(speaker) {
    try {
        const response = await sendYamahaRequest(speaker.ip, '/YamahaExtendedControl/v1/netusb/setPlayback', {
            playback: 'play'
        }, speaker.zone);
        
        if (response.success) {
            console.log(`▶️ ${speaker.name} playback resumed`);
        } else {
            console.error(`❌ Failed to resume ${speaker.name}`);
        }
    } catch (error) {
        console.error(`❌ Error resuming ${speaker.name}:`, error);
    }
}

/**
 * Skip to next track on Yamaha device
 * @param {Object} speaker - Speaker configuration
 * Uses: /netusb/setPlayback?playback=next
 */
async function skipToNextTrack(speaker) {
    try {
        const response = await sendYamahaRequest(speaker.ip, '/YamahaExtendedControl/v1/netusb/setPlayback', {
            playback: 'next'
        }, speaker.zone);
        
        if (response.success) {
            console.log(`⏭️ ${speaker.name} skipped to next track`);
        } else {
            console.error(`❌ Failed to skip track on ${speaker.name}`);
        }
    } catch (error) {
        console.error(`❌ Error skipping track on ${speaker.name}:`, error);
    }
}

/**
 * Handle skip device updates for playback control
 * @param {string} deviceId - Virtual device ID (should be 'skip')
 * @param {Object} values - Values from Flic Twist
 */
async function handleSkipDeviceUpdate(deviceId, values) {
    if (deviceId !== 'skip') {
        return;
    }
    
    const volumeChange = values.volume - 0.5; // 0.5 is the center position
    
    // Check if this is a playback command (not just volume change)
    const isPlaybackCommand = Math.abs(volumeChange) > 0.1; // Threshold to detect intentional movement
    
    if (isPlaybackCommand) {
        // Check playback command cooldown
        const currentTime = Date.now();
        const timeSinceLastCommand = currentTime - lastPlaybackCommandTime;
        
        if (timeSinceLastCommand < PLAYBACK_COOLDOWN_MS) {
            const remainingCooldown = Math.ceil((PLAYBACK_COOLDOWN_MS - timeSinceLastCommand) / 1000);
            console.log(`⏳ Playback command ignored - cooldown active (${remainingCooldown}s remaining)`);
            
            // Reset skip device to center position
            flicApp.virtualDeviceUpdateState('Speaker', 'skip', {
                volume: 0.5
            });
            return;
        }
        
        // Apply playback control to all configured devices
        for (const speaker of YAMAHA_CONFIG.speakers) {
            try {
                const playbackStatus = await getPlaybackStatus(speaker);
                
                if (volumeChange < 0) {
                    // Decreasing value = pause playback
                    if (playbackStatus === 'play') {
                        await pausePlayback(speaker);
                    }
                } else if (volumeChange > 0) {
                    // Increasing value = resume or skip
                    if (playbackStatus === 'pause') {
                        await resumePlayback(speaker);
                    } else if (playbackStatus === 'play') {
                        await skipToNextTrack(speaker);
                    }
                }
            } catch (error) {
                console.error(`❌ Error handling playback control for ${speaker.name}:`, error);
            }
        }
        
        // Update last command timestamp only for playback commands
        lastPlaybackCommandTime = currentTime;
    }
    
    // Reset skip device to center position
    flicApp.virtualDeviceUpdateState('Speaker', 'skip', {
        volume: 0.5
    });
}





async function handleYamahaSpeakerUpdate(deviceId, values) {
    if (values.volume !== undefined) {
        // Check playback command cooldown before allowing volume changes
        const currentTime = Date.now();
        const timeSinceLastCommand = currentTime - lastPlaybackCommandTime;
        
        if (timeSinceLastCommand < PLAYBACK_COOLDOWN_MS) {
            const remainingCooldown = Math.ceil((PLAYBACK_COOLDOWN_MS - timeSinceLastCommand) / 1000);
            console.log(`⏳ Volume change ignored - playback cooldown active (${remainingCooldown}s remaining)`);
            return;
        }
        
        const volumePercentage = Math.round(values.volume * 100);
        const speaker = YAMAHA_CONFIG.speakers.find(s => s.id === deviceId);
        
        try {
            await setYamahaVolume(deviceId, volumePercentage);
            currentVolume = volumePercentage;
        } catch (error) {
            console.error(`❌ Failed to update Yamaha speaker ${deviceId}:`, error);
        }
    }
}

// ============================================================================
// VIRTUAL DEVICE STATE MANAGEMENT
// ============================================================================

function updateVirtualDeviceStates(volume) {
    // Update all virtual devices to reflect the current state
    YAMAHA_CONFIG.speakers.forEach(speaker => {
        flicApp.virtualDeviceUpdateState('Speaker', speaker.id, {
            volume: volume
        });
    });
}

function updateZoneVirtualDeviceStates(zone, volume) {
    // Update virtual devices for a specific zone
    const zoneSpeakers = YAMAHA_CONFIG.speakers.filter(speaker => speaker.zone === zone);
    zoneSpeakers.forEach(speaker => {
        flicApp.virtualDeviceUpdateState('Speaker', speaker.id, {
            volume: volume
        });
    });
}

/**
 * Get current volume from Yamaha device and update virtual device state
 * @param {Object} speaker - Speaker configuration
 * @returns {Promise<number>} - Current volume percentage
 */
async function getCurrentVolumeAndUpdate(speaker) {
    try {
        const response = await sendYamahaRequest(speaker.ip, YAMAHA_CONFIG.endpoints[speaker.zone].status, null, speaker.zone);
        
        if (response.success) {
            const statusData = JSON.parse(response.data.body);
            const currentVolume = statusData.volume;
            
            // Update virtual device state
            flicApp.virtualDeviceUpdateState('Speaker', speaker.id, {
                volume: currentVolume / 100
            });
            
            return currentVolume;
        } else {
            console.error(`❌ Failed to get current volume for ${speaker.name}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error getting current volume for ${speaker.name}:`, error);
        return null;
    }
}

/**
 * Initialize virtual device states with current Yamaha volumes
 */
async function initializeVirtualDeviceStates() {
    for (const speaker of YAMAHA_CONFIG.speakers) {
        await getCurrentVolumeAndUpdate(speaker);
    }
    
    // Create virtual skip device for playback control
    flicApp.createVirtualDevice('skip', 'Speaker', {
        volume: 50
    });
}

// ============================================================================
// INITIALIZATION AND CONFIGURATION
// ============================================================================

// Load configuration from datastore
function loadYamahaConfig() {
    // You can store speaker IP addresses in the datastore
    // and load them here for easier configuration
    console.log('Loading Yamaha configuration...');
    console.log('Configured speakers:', YAMAHA_CONFIG.speakers.map(s => s.name));
}

// Initialize the integration
async function initializeYamahaIntegration() {
    loadYamahaConfig();
    
    console.log('Yamaha Speaker Integration Ready!');
    console.log('Available features:');
    console.log('- Volume control via Flic buttons');
    console.log('- Volume control via Flic Twist controllers');
    console.log('- Playback control via Flic Twist (skip device)');
    console.log('- Multi-speaker synchronization');
    console.log('');
    console.log('Action messages:');
    console.log('- "{device-id} volume up" - Increase volume by 10% (e.g., "livingroom volume up")');
    console.log('- "{device-id} volume down" - Decrease volume by 10% (e.g., "livingroom volume down")');
    console.log('- "{device-id} mute" - Toggle mute (e.g., "livingroom mute")');
    console.log('- "{device-id} power" - Toggle power on/off (e.g., "livingroom power")');
    console.log('- "{device-id} on" - Turn device on (e.g., "livingroom on")');
    console.log('- "{device-id} off" - Turn device off (e.g., "livingroom off")');
    
    // Discover volume ranges from device
    const testSpeaker = YAMAHA_CONFIG.speakers[0];
    const discoveredRanges = await discoverVolumeRanges(testSpeaker.ip);
    YAMAHA_CONFIG.volumeRanges = discoveredRanges;
    
    // Initialize virtual device states with current volumes
    await initializeVirtualDeviceStates();
}



// Start the integration
initializeYamahaIntegration(); 