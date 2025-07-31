# Quick Setup Guide - Yamaha Flic Integration

## Step 1: Find Your Yamaha Receiver IP Address

1. **Using Yamaha AV Controller App**:
   - Download the Yamaha AV Controller app
   - Connect to your receiver
   - Note the IP address shown in the app

2. **Using Network Scanner**:
   ```bash
   # On macOS/Linux
   arp-scan --localnet | grep -i yamaha
   
   # Or use nmap
   nmap -sn 192.168.1.0/24
   ```

3. **Using Router Admin**:
   - Access your router's admin panel
   - Check DHCP client list
   - Look for devices with Yamaha names

## Step 2: Update Configuration

Edit the `YAMAHA_CONFIG` section in `yamaha-flic-integration.js` and replace `RECEIVER1_IP_ADDRESS` with your actual receiver IP address:

```javascript
speakers: [
    { 
        id: 'livingroom', 
        ip: 'YOUR_ACTUAL_IP_HERE',  // ← Replace this
        name: 'Living Room Main Zone',
        zone: 'main'
    },
    { 
        id: 'bedroom', 
        ip: 'YOUR_ACTUAL_IP_HERE',  // ← Replace this
        name: 'Bedroom Zone 2',
        zone: 'zone2'
    },
    { 
        id: 'playback', 
        ip: 'YOUR_ACTUAL_IP_HERE',  // ← Replace this
        name: 'Playback Control',
        zone: 'playback'
    }
]
```

**Note**: Copy the entire script to Flic Hub Studio and update the IP addresses in the configuration section.

## Step 3: Test Connectivity

Test if your receiver responds to the YXC API:

```bash
curl "http://YOUR_IP/YamahaExtendedControl/v1/main/getStatus"
```

You should get a JSON response with speaker status.

## Step 4: Upload to Flic Hub Studio

1. Open your Flic Hub Studio web interface
2. Go to Scripts section
3. Upload `yamaha-flic-integration.js`
4. Save and run the script

## Step 5: Configure Virtual Devices in Flic App

Create these virtual devices in the Flic app:

1. **Living Room Speaker**:
   - Device ID: `livingroom`
   - Type: `Speaker`
   - Name: "Living Room"

2. **Bedroom Speaker**:
   - Device ID: `bedroom`
   - Type: `Speaker`
   - Name: "Bedroom"

3. **Playback Control**:
   - Device ID: `playback`
   - Type: `Speaker`
   - Name: "Playback Control"

## Step 6: Test the Integration

### Volume Control
- Use Flic Twist controllers for volume control
- Or send action messages: `livingroom volume up`, `bedroom volume down`

### Playback Control
- Use the playback device with Flic Twist:
  - Twist down = Pause
  - Twist up = Resume/Skip

### Power Control
- Action messages: `livingroom power`, `bedroom on`, `bedroom off`

## Troubleshooting

### Common Issues:

1. **"Connection Failed"**:
   - Verify IP address is correct
   - Check receiver is powered on
   - Ensure receiver is on same network as Flic Hub

2. **"Volume Not Changing"**:
   - Check receiver is not muted
   - Verify receiver is on correct input
   - Test with curl command above

3. **"Playback Control Not Working"**:
   - Ensure receiver is on netusb input (AirPlay, Spotify, etc.)
   - Check playback device is configured correctly

### Debug Commands:

```bash
# Test basic connectivity
curl "http://YOUR_IP/YamahaExtendedControl/v1/main/getStatus"

# Test volume control
curl "http://YOUR_IP/YamahaExtendedControl/v1/main/setVolume?volume=50"

# Test power control
curl "http://YOUR_IP/YamahaExtendedControl/v1/main/setPower?power=on"
```

## Features Available

✅ **Volume Control**: Precise 0-100% volume control via Flic Twist
✅ **Playback Control**: Pause, resume, skip tracks
✅ **Power Control**: Turn devices on/off
✅ **Mute Control**: Toggle mute states
✅ **Multi-Zone**: Control main zone and zone2 independently
✅ **Smart Cooldown**: 2.5-second cooldown prevents rapid commands
✅ **State Sync**: Virtual devices stay in sync with actual states

## Action Message Examples

- `livingroom volume up` - Increase Living Room volume
- `bedroom volume down` - Decrease Bedroom volume
- `livingroom mute` - Toggle Living Room mute
- `bedroom power` - Toggle Bedroom power
- `livingroom on` - Turn Living Room on
- `bedroom off` - Turn Bedroom off 