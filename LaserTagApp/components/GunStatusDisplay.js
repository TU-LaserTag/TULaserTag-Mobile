import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  NativeAppEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  AppState,
  Dimensions,
} from 'react-native';
import {ListItem,Divider} from 'react-native-elements'
import {Button, ThemeProvider, Input, Icon} from 'react-native-elements'
import BleManager, { connect } from 'react-native-ble-manager';
import { LaserTheme } from './Custom_theme';
import { stringToBytes, bytesToString } from 'convert-string';
import { TapGestureHandler } from 'react-native-gesture-handler';
const window = Dimensions.get('window');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export default class GunStatusDesplay extends Component {
  constructor(){
    super()
    this.state = {
      scanning:false,
      appState: '',
      connectedGun: null,
      emitterStarted: false,
      discoveredP: false,
      connectionError: '',
      searchID: null,
      foundMatch: false,
      gunConnected: false
    }
    //console.log("construct");
    this.checkBLE();
    this.loadStorage()  // Checks storage and then builds upon startBLEManager
    
    this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
    //this.handleStopScan = this.handleStopScan.bind(this);
    //this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
    this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
    //this.handleAppStateChange = this.handleAppStateChange.bind(this);
  }
  checkBLE = () => { // Does a quick scan and checks if any devices were discovered
    console.log("checking ble");
    if (!this.state.scanning) {
      //var serviceArray = ["206AC814-ED0B-4204-BD82-246F28A83FCE"] // GEt Clip ID and populate here
      return BleManager.scan([], 1, false).then((results) => {
        console.log('Scanning...');
        this.setState({scanning:true});
        setTimeout(() => {console.log("ScanTimeout, stopping scan");
                          BleManager.stopScan().then(() => {
                            console.log("Scan stopped");
                            if (this.state.discoveredP == false){
                              console.log("BLE may not be initialized");
                              this.setState({emitterStarted: false,
                                             scanning: false}); 
                              this.startBLEmanager(false);
                            }
                          });              
        },1300);
      });
    }
    
  }
  loadStorage = () => {
    console.log("loading storage");
    global.storage.load ({
    key: 'gunData',
    autoSync: true,
    syncInBackground: true,
    syncParams: {
      extraFetchOptions: {
        // blahblah
      },
      someFlag: true
    }
  })
  .then(ret => {
    this.setState({connectedGun: ret.conGun,
                  })
    if (ret.conGun){
      this.checkGunConnection();
    } else{
    }
    return true;
  })
  .catch(err => {
    // any exception including data not found
    // goes to catch()
    console.log(err.message);
    switch (err.name) {
      case 'NotFoundError':
        return false;
      case 'ExpiredError': // Gun only lasts for so long
        return false;
    }
  });
  }

  gotoGunScreen = () =>{
      console.log("Going to gunScreen");
  }
  saveGunConnection(data) {
    //console.log("saving gun connection",data)
    global.storage.save({
      key: 'gunData',
      data: {
        conGun: data.connectedGun,
        emitStart: data.emitterStarted
      }
    })
  }

  saveEmitterState(data) {
    //console.log("emiter state",data)
    global.storage.save({
      key: 'gunData',
      data: {
        conGun: data.connectedGun,
        emitStart: data.emitterStarted
      }
    })
  }

  removeSavedGun() { // TODO: change to only rmeove emitter.
    global.storage.remove({
      key: 'gunData'
    });
  }
  
  startBLEmanager() {
    BleManager.start({showAlert: false}) // DOnt init if started already?
    .then(() =>{
      console.log("Started Bluetooth Manager");
      this.setState({emitterStarted: true});
      this.saveEmitterState(this.state);
      
    }).catch((error) => {
      console.log("blemanager start error",error);
    });     
  }
  componentDidMount() {
    console.log("status display");
    AppState.addEventListener('change', this.handleAppStateChange);
    this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
    //this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );
    this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral );
    //this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );
  

    if (Platform.OS === 'android' && Platform.Version >= 23) {
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
            if (result) {
              console.log("Permission is OK");
            } else {
              PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
                if (result) {
                  console.log("User accept");
                } else {
                  console.log("User refuse");
                }
              });
            }
      });
    }

  }
  componentWillUnmount() { // cancel all async tasks herere?
    console.log("unmouting gun status")
    this.handlerDiscover.remove();
    //this.handlerStop.remove();
    this.handlerDisconnect.remove();
    //this.handlerUpdate.remove();
    if (this.state.emitterStarted){
      console.log("keep emiteer rolling")
    }
  }

  handleAppStateChange(nextAppState) {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!')
      BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
        console.log('Connected peripherals: ' + peripheralsArray.length);
      });
    }
    this.setState({appState: nextAppState});
  }

  handleDisconnectedPeripheral(gun) {
      this.setState({connectedGun,
                    gunConnected: false})
      this.saveGunConnection(this.state);
    console.log('Disconnected from ' + gun.peripheral);
    this.props.updateConStatus(this.state.gunConnected);
  }

  handleUpdateValueForCharacteristic(data) {
    const command = bytesToString(data.value);
    this.handleGunCommand(command);
    //console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
  }

  handleStopScan() {
    console.log('Scan is stopped');
    this.setState({ scanning: false });
    if (this.state.searchID != null && this.state.foundMatch == false){
      console.log("No matching gun found")
      this.setState({connectionError: 'Gun Not Found'})
    }
  }

  handleGunCommand (command) {
    console.log("handling command",command)
  }

  handleDiscoverPeripheral(peripheral){
    //var peripherals = this.state.peripherals;
    //console.log('Got ble peripheral', peripheral);
    this.setState({discoveredP: true});
    if (!peripheral.name) {
      peripheral.name = 'NO NAME';
      return;
    }
    if (this.state.searchID != null){ // Searching For specific gun
      let pService = peripheral.advertising.serviceUUIDs[0]
      let serviceTag = pService.slice(-6);
      console.log(serviceTag);
      if (serviceTag == this.state.searchID){
        this.setState({foundMatch: true})
        this.attemptGunConnection(peripheral)
      }
    }
    //peripherals.set(peripheral.id, peripheral);
    //this.setState({ peripherals });
  }
  editGamePin = gamePin => {
    this.setState({ gamePin });
  };
  searchForGame = () => {
    console.log(this.state.gamePin)
    console.log("Searching for game");
    //this.startScan();
    
  }
  retrieveConnected(){
    BleManager.getConnectedPeripherals([]).then((results) => {
      if (results.length == 0) {
        console.log('No connected peripherals')
      } else{
          // Set status to true
      }
    });
  }

  checkGunConnection(){
    gunID = this.state.connectedGun.id;
    console.log("Checking if connected gun");
    BleManager.isPeripheralConnected(gunID, []) // Possibly add gunService uuid in to array
      .then((isConnected) => {
        if (isConnected) {
          console.log('Peripheral IS connected!');
          this.setState({gunConnected: true})
        } else {
          console.log('Gun is NOT connected!');
          this.setState({gunConnected: false});
        }
        this.props.updateConStatus(this.state.gunConnected);

      }) ;
  }

  sendData(/*data*/){
    var peripheral;
    if (this.state.gunConnected == true){
        peripheral = this.getConnectedPeripheral();
        console.log("Periph",peripheral);
        if (!peripheral){
            console.warn("No gun connected");
            return;
        }
    }
    BleManager.retrieveServices(peripheral.id).then((peripheralInfo) => {
        //console.log("Got info",peripheralInfo);
        var service = '206ac814-ed0b-4204-bd82-e3a0b3bbecc2';
        var writeCharacteristic = 'BB950764-A597-4E20-8613-E43BF9D1330C';
        const data = stringToBytes("startGame"); // data
        BleManager.write(peripheral.id, service, writeCharacteristic,data).then(() => {
            console.log('wrote:',data);
        }).catch((error) => {
            // Failure code
            console.warn(error);
        });
    }).catch((error) => {
        console.warn('Connection error', error); // Put a toast or something here
    });
  }
 

    renderGunStatus() {
        //var myGun = this.state.connectedGun;   
        //if (myGun != null){
        //const color = myGun.connected ? '#99ff99' : '#fff'; //Remind me to turn these to LinearGradient + scale feedback
        //const iconName = myGun.connected ? 'link' : 'disconnect';
        //let pService = myGun.advertising.serviceUUIDs[0]
        //let serviceTag = pService.slice(-6);
        //const gunName = myGun.name + ': ' + serviceTag;
        const statusColor = this.state.gunConnected? '#99ff99' : 'red'; 
        return(
            <Text style={{
                fontSize: 22,
                margin: 10,
                backgroundColor: statusColor,
                textAlign: 'center'
            }} onPress={() => this.gotoGunScreen() }>
                {this.state.gunConnected ? 'Gun Connected' : 'Gun Disconnected'}
            </Text>
        );
    }
    
  render() {
    //const list = Array.from(this.state.peripherals.values());
    //var connectedGun = this.state.connectedGun;
    //var color = '#fff'
    return (
     <ThemeProvider theme={LaserTheme}>
        {this.renderGunStatus()}   
        <Divider style={{ backgroundColor: 'blue' }} />           

        </ThemeProvider>
    );
  }
}
