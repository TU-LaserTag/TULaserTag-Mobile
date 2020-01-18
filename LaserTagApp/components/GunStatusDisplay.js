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
import { Container } from 'native-base';
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
    
    this.gunStatusHandleDiscoverPeripheral = this.gunStatusHandleDiscoverPeripheral.bind(this);
    this.gunStatusHandleStopScan = this.gunStatusHandleStopScan.bind(this);
    this.gunStatusHandleDisconnectedPeripheral = this.gunStatusHandleDisconnectedPeripheral.bind(this);
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
  }
  checkBLE = () => { // Does a quick scan and checks if any devices were discovered
    console.log("checking ble");
    if (!this.state.scanning) {
      //var serviceArray = ["206AC814-ED0B-4204-BD82-246F28A83FCE"] // GEt Clip ID and populate here
      return BleManager.scan([], 0.2, false).then((results) => {
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
        },500);
      });
    }
    
  }
  loadStorage = () => {
    console.log("loading Gun display stoorage");
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
    //updateListeners = bleManagerEmitter.listeners('BleManagerDidUpdateValueForCharacteristic');
    //result = updateListeners[1]()
    //console.log(result)
    const disconnectListeners = bleManagerEmitter.listeners('BleManagerDisconnectPeripheral');
    const discoverListeners = bleManagerEmitter.listeners('BleManagerDiscoverPeripheral');
    const stopListeners = bleManagerEmitter.listeners('BleManagerStopScan');

    if (discoverListeners.length <= 1) {
        console.log("GunStatus discover listener");
        this.gunStatusHandlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.gunStatusHandleDiscoverPeripheral );
    }
    if (stopListeners.length <= 1) {
      console.log("GunStatus stop listener");
      this.gunStatusHandlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.gunStatusHandleStopScan );
    }
    if (disconnectListeners.length <= 1) {
      console.log("GunStatus disconnect listener");
      this.gunStatusHandlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.gunStatusHandleDisconnectedPeripheral );
    }

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
    const disconnectListeners = bleManagerEmitter.listeners('BleManagerDisconnectPeripheral');
    const discoverListeners = bleManagerEmitter.listeners('BleManagerDiscoverPeripheral');
    const stopListeners = bleManagerEmitter.listeners('BleManagerStopScan');
    console.log(disconnectListeners,discoverListeners,stopListeners);

    if (discoverListeners.length > 0){
        this.gunStatusHandlerDiscover.remove('BleManagerDiscoverPeripheral');
    }
    if (stopListeners.length >0){
      this.gunStatusHandlerStop.remove('BleManagerStopScan');
    }
    if (disconnectListeners.length > 0){
      this.gunStatusHandlerDisconnect.remove('BleManagerDisconnectPeripheral');
    }
    
  }

  handleAppStateChange(nextAppState) {
    console.log("Appstate",nextAppState);
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('GunStatus App has come to the foreground!')
      console.log(this.state.connectedGun);
      this.checkGunConnection();
      
    }
    this.setState({appState: nextAppState});
  }

  gunStatusHandleDisconnectedPeripheral(gun) {
      this.setState({connectedGun,
                    gunConnected: false})
      this.saveGunConnection(this.state);
    console.log('Disconnected from ' + gun.peripheral);
    this.props.updateConStatus(this.state.gunConnected);
  }

  gunStatusHandleStopScan() {
    console.log('Scan is stopped');
    this.setState({ scanning: false });
    if (this.state.searchID != null && this.state.foundMatch == false){
      console.log("No matching gun found")
      this.setState({connectionError: 'Gun Not Found'})
    }
  }


  gunStatusHandleDiscoverPeripheral(peripheral){
    //console.log('Got ble peripheral', peripheral);
    if (!this.state.discoveredP){
        this.setState({discoveredP: true});
      }
    if (!peripheral.name || peripheral.name != "TULGN") {
    //console.log("Not gun");
    return;
    }
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
    if (this.state.connectedGun == null){
    console.log("Gun connection bad");
    this.setState({gunConnected: false});
    return false;
    }
    gunID = this.state.connectedGun.id;
    console.log("Checking if connected gun");
    const updateListeners = bleManagerEmitter.listeners('BleManagerDiscoverPeripheral');
    BleManager.isPeripheralConnected(gunID, []) // Possibly add gunService uuid in to array
      .then((isConnected) => {
        if (isConnected) {
          console.log('Peripheral IS connected!');
          this.setState({gunConnected: true})
            if (updateListeners.length == 0 ){
                console.log("Connected and have no Listeneres",updateListeners)
            } else{
                console.log("connecgted and has listners'",updateListeners)
            }
        } else {
          console.log('Gun is NOT connected!');
          if (updateListeners.length == 0 ){
            console.log("Not connected and have no Listeneres",updateListeners)
            } else{
                console.log("Not con and has listeners'",updateListeners)
            }
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
        const statusColor = this.state.gunConnected? '#99ff99' : '#ffc1cc'; 
        return(
            <View style= {{backgroundColor: '#ae936c'}}>
            <Text style={{
                fontSize: 22,
                margin: 1,
                backgroundColor: statusColor,
                textAlign: 'center'
            }} onPress={() => this.gotoGunScreen() }>
                {this.state.gunConnected ? 'Gun Connected' : 'Gun Disconnected'}
            </Text>
            </View>
        );
    }
    
  render() {
    //const list = Array.from(this.state.peripherals.values());
    //var connectedGun = this.state.connectedGun;
    //var color = '#fff'
    return (
     <ThemeProvider theme={LaserTheme}>
        {this.renderGunStatus()}   
        <Divider style={{ backgroundColor: '#ae936c' }} />           

        </ThemeProvider>
    );
  }
}
