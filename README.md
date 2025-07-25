# Yamaha Speaker Integration with Flic Hub Studio

This integration allows you to control Yamaha speakers using Flic buttons and Twist controllers through the Flic Hub Studio. It uses the Yamaha YXC (Yamaha Extended Control) API to provide precise volume control, playback control, and multi-speaker management.

## Features

- **Volume Control**: Precise volume control using Flic Twist controllers
- **Playback Control**: Pause, resume, and skip tracks using the virtual "skip" device
- **Multi-Speaker Support**: Control multiple Yamaha speakers simultaneously
- **Device-Specific Actions**: Use action messages to control specific devices
- **Smart Cooldown**: 2.5-second cooldown prevents rapid-fire commands
- **State Synchronization**: Virtual devices stay in sync with actual speaker states
- **Power Control**: Turn devices on/off and toggle power states
- **Mute Control**: Toggle mute states with smart detection

## Prerequisites

1. **Yamaha Speakers**: Compatible Yamaha receivers or speakers with network connectivity
2. **Network Access**: Speakers must be on the same network as your Flic Hub
3. **IP Addresses**: Know the IP addresses of your Yamaha speakers
4. **Flic Hub Studio**: Access to Flic Hub Studio for script deployment

## Setup Instructions

### 1. Find Your Yamaha Speaker IP Addresses

1. **Using Yamaha AV Controller App**:
   - Download the Yamaha AV Controller app
   - Connect to your speakers
   - Note the IP addresses shown in the app

2. **Using Network Scanner**:
   - Use a network scanner like `nmap` or `arp-scan`
   - Look for devices with Yamaha MAC addresses
   - Common Yamaha MAC prefixes: `00:05:CD`, `00:1A:4B`

3. **Using Router Admin Panel**:
   - Access your router's admin panel
   - Check the DHCP client list
   - Look for devices with Yamaha names

### 2. Configure the Script

Edit the `YAMAHA_CONFIG` section in `yamaha-flic-integration.js`:

```javascript
const YAMAHA_CONFIG = {
    speakers: [
        { 
            id: 'livingroom', 
            ip: '192.168.0.10', 
            name: 'Living Room',
            zone: 'main'
        },
        { 
            id: 'bedroom', 
            ip: '192.168.0.10', 
            name: 'Bedroom',
            zone: 'zone2'
        }
    ],
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
    volumeRanges: {
        main: { min: 0, max: 100 },
        zone2: { min: 0, max: 100 }
    }
};
```

**Replace the IP addresses** with your actual Yamaha speaker IP addresses. Each speaker can have multiple zones (main zone and zone2) controlled independently.

### 3. Upload to Flic Hub Studio

1. Open your Flic Hub Studio web interface
2. Navigate to the Scripts section
3. Upload `yamaha-flic-integration.js`
4. Save and run the script

### 4. Configure Virtual Devices in Flic App

1. Open the Flic app
2. Go to the Flic Hub Studio provider
3. Create virtual devices for each Yamaha speaker zone:
   - **Device ID**: Must match the `id` in your configuration (e.g., `livingroom`, `bedroom`)
   - **Type**: Select `Speaker`
   - **Name**: Give it a friendly name (e.g., "Living Room", "Bedroom")

4. **Create Skip Device for Playback Control**:
   - **Device ID**: `skip`
   - **Type**: Select `Speaker`
   - **Name**: "Playback Control"

**Note**: Each zone (main and zone2) is treated as a separate virtual device, allowing independent control.

### 5. Set Up Action Messages

Configure these action messages in the Flic app:

**Device-Specific Controls:**
- `{device-id} volume up` - Increase volume by 10% (e.g., "livingroom volume up")
- `{device-id} volume down` - Decrease volume by 10% (e.g., "livingroom volume down")
- `{device-id} mute` - Toggle mute (e.g., "livingroom mute")
- `{device-id} power` - Toggle power on/off (e.g., "livingroom power")
- `{device-id} on` - Turn device on (e.g., "livingroom on")
- `{device-id} off` - Turn device off (e.g., "livingroom off")

**Examples:**
- `livingroom volume up` - Increase Living Room volume
- `bedroom mute` - Toggle Bedroom mute
- `livingroom power` - Toggle Living Room power
- `bedroom on` - Turn Bedroom on

### 6. Configure Flic Twist Controllers

1. **Volume Control**: Set up Flic Twist controllers for your speaker devices
2. **Playback Control**: Set up a Flic Twist controller for the "skip" device
3. The script will automatically handle volume updates and playback control

## Usage

### Volume Control

- **Flic Twist**: Rotate to adjust volume (0-100%)
- **Action Messages**: Use "livingroom volume up" or "bedroom volume down"
- **Automatic Sync**: Virtual devices stay in sync with actual speaker states

### Playback Control (Skip Device)

- **Flic Twist Down**: Pause playback on all devices
- **Flic Twist Up**: 
  - If paused → Resume playback
  - If playing → Skip to next track
- **Cooldown**: 2.5-second cooldown prevents rapid commands

### Power Control

- **Toggle**: `{device-id} power` - Smart toggle (checks current state)
- **Direct On**: `{device-id} on` - Turn device on immediately
- **Direct Off**: `{device-id} off` - Turn device off immediately

### Mute Control

- **Smart Toggle**: `{device-id} mute` - Checks current mute state and toggles

## API Reference

### Yamaha YXC API Endpoints

The integration uses these YXC API endpoints:

**Volume Control:**
- `GET /YamahaExtendedControl/v1/{zone}/setVolume?volume={value}`

**Status Query:**
- `GET /YamahaExtendedControl/v1/{zone}/getStatus`

**Power Control:**
- `GET /YamahaExtendedControl/v1/{zone}/setPower?power={on|standby}`

**Mute Control:**
- `GET /YamahaExtendedControl/v1/{zone}/setMute?enable={true|false}`

**Playback Control:**
- `GET /YamahaExtendedControl/v1/netusb/setPlayback?playback={play|pause|next|previous|stop}`

**Features Discovery:**
- `GET /YamahaExtendedControl/v1/system/getFeatures`

### Volume Format

- **Input**: 0-100% (integer)
- **Output**: Direct percentage value sent to Yamaha device
- **Auto-Sync**: Actual volume fetched and virtual device updated

## Cooldown System

### 2.5-Second Cooldown

All playback commands and volume changes are protected by a 2.5-second cooldown:

- **Playback Commands**: Pause, resume, skip
- **Volume Changes**: All volume adjustments (Twist controllers and action messages)
- **Global Protection**: Applies to all devices simultaneously
- **Smart Detection**: Only intentional movements trigger cooldown

### Cooldown Behavior

```
Playback Command → 2.5s Cooldown → All volume/playback commands blocked
Volume Change → Blocked during cooldown (doesn't trigger cooldown)
Small Movement → Ignored (doesn't trigger cooldown)
```

## Troubleshooting

### Common Issues

1. **Connection Failed**:
   - Verify IP addresses are correct
   - Check network connectivity
   - Ensure speakers are powered on

2. **Volume Not Changing**:
   - Check speaker is not muted
   - Verify speaker is in correct input mode
   - Check YXC API is enabled on speaker

3. **Playback Control Not Working**:
   - Ensure device is on a netusb input (AirPlay, Spotify, etc.)
   - Check device is powered on
   - Verify skip device is configured correctly

4. **Twist Controller Not Syncing**:
   - Verify virtual device IDs match configuration
   - Check script is running without errors
   - Restart the script if needed

### Debug Information

The script provides clean, minimal logging:

```
⏸️ Living Room playback paused
▶️ Living Room playback resumed
⏭️ Living Room skipped to next track
⏳ Playback command ignored - cooldown active (2s remaining)
```

### Testing Connectivity

You can test basic connectivity using curl:

```bash
curl "http://YOUR_SPEAKER_IP/YamahaExtendedControl/v1/main/getStatus"
```

## Advanced Features

### Dynamic Volume Range Discovery

The script automatically discovers volume ranges from your Yamaha device:

```javascript
// Automatically discovered from /system/getFeatures
volumeRanges: {
    main: { min: 0, max: 97 },
    zone2: { min: 0, max: 90.5 }
}
```

### State Synchronization

Virtual devices automatically sync with actual speaker states:

- **Volume Changes**: Actual volume fetched after each change
- **Power States**: Current power status checked before toggling
- **Mute States**: Current mute status checked before toggling

### Error Handling

Comprehensive error handling with detailed logging:

```javascript
try {
    await setYamahaVolume(deviceId, volume);
} catch (error) {
    console.error(`❌ Error setting volume for ${speaker.name}:`, error);
}
```

## Supported Yamaha Models

This integration should work with most Yamaha receivers and speakers that support the YXC API, including:

- RX-V series receivers
- Aventage series receivers
- MusicCast speakers
- Other YXC-compatible devices

## Contributing

To extend this integration:

1. Add new action handlers for additional features
2. Implement status polling for real-time updates
3. Add support for other YXC API features (input switching, etc.)
4. Create custom volume presets

## License

This integration is provided as-is for educational and personal use. Modify and extend as needed for your specific requirements. 