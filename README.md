# TULaserTag-Mobile
Laser tag Mobile application for Taylor University

Documentation:

# How To get started:
1. Download and install globally Expo cli
'npm install -g expo cli'

2. Clone this repository to wherever you like
'git clone {{Repo URL}} '

3. Run NPM install inside the Main Directory
'npm install'

4. If you are running the project on IOS, Go into the ios/ directory and run Pod install
'pod install'
(If you are running with pods locally, find the directory where Pods is installed and use that as a prefix)

5. Go back into the main director (cd ..) and run expo start
'Expo start'

6. If you are on Ios, connect a device via usb to the mac and open up the workspace in the ios/ directory with xCode

7. Once xCode is started, Press the play button on the top left corner (make sure it recognizes device).
   Lots of warnings will appear, ignore them. If errors appear that prevent installation, Google them or contact me.
 
8. Once the app is installed properly, it will open automatically (make sure expo is still running in background or else it will freeze)

9. Play around! App code documentation is incoming

Shared and useful information:

Bluetooth Gun Service UUID: 
206AC814-ED0B-4204-BD82-E3A0B3BBECC2
06AC814-ED0B-4204-BD82-246F28A83FCE
Characteristic UUID
9C3EEE6d-48FD-4080-97A8-240C02ADA5F5

Characteristic RX UUID:
BB950764-A597-4E20-8613-E43BF9D1330C

Testing arduino MAC:
24:6f:28:a8:3f:cc

Arduino BT ID:
24:6f:28:a8:3f:ce

ID UUID?:
89C52326-593D-3FD3-AFEC-FF05041B68CF

Expected UUID:
206AC814-ED0B-4204-BD82-246F28A83FCE

useful link: REquest fgails:
https://stackoverflow.com/questions/29901315/react-native-fetch-request-fails

HTTP_PROXY=http://10.120.160.77:3128
HTTPS_PROXY=http://10.120.160.77:3128
https.proxy http://squidproxy:3128
