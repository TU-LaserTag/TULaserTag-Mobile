import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  NativeAppEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  ScrollView,
  AppState,
  FlatList,
  Dimensions,
} from 'react-native';
import {ListItem,Divider} from 'react-native-elements'
import {Button, ThemeProvider, Input, Icon} from 'react-native-elements'
import BleManager, { connect } from 'react-native-ble-manager';
import { LaserTheme } from './Custom_theme';
import { stringToBytes, bytesToString } from 'convert-string';
const window = Dimensions.get('window');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export default class BluetoothManager extends Component {
  constructor(){
    super()
    this.state = {
      scanning:false,
      peripherals: new Map(),
      appState: '',
      connectedGun: null,
      emitterStarted: false,
      discoveredP: false,
      connectionError: '',
      searchID: null,
      foundMatch: false,
    }
    //console.log("construct");
    this.checkBLE();
    this.loadStorage()  // Checks storage and then builds upon startBLEManager
    
    this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
    this.handleStopScan = this.handleStopScan.bind(this);
    this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
    this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
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
                   emitterStarted: ret.emitStart
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

  startScan() {
    console.log("StarScan called");
    if (!this.state.scanning) {
      //var serviceArray = ["206AC814-ED0B-4204-BD82-246F28A83FCE"] // GEt Clip ID and populate here
      return BleManager.scan([], 2, false).then(() => {
        console.log('Scanning...');
        this.setState({scanning:true});
      });
    }
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
    console.log("BLe mount");
    AppState.addEventListener('change', this.handleAppStateChange);
    this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
    this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );
    this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral );
    this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );
  

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
    console.log("unmouting")
    if (this.state.emitterStarted){
      this.handlerDiscover.remove();
      this.handlerStop.remove();
      this.handlerDisconnect.remove();
      this.handlerUpdate.remove();
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

  handleDisconnectedPeripheral(data) {
    let peripherals = this.state.peripherals;
    let peripheral = peripherals.get(data.peripheral);
    let connectedGun = this.state.connectedGun;
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      this.setState({peripherals});
      connectedGun.connected = false;
      this.setState({connectedGun})
      this.saveGunConnection(this.state);
    }
    console.log('Disconnected from ' + data.peripheral);
  }

  handleUpdateValueForCharacteristic(data) {
    //console.log("gotupdat",data)
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
    var peripherals = this.state.peripherals;
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
    peripherals.set(peripheral.id, peripheral);
    this.setState({ peripherals });
  }
  editSearchGun = searchID => {
    this.setState({ searchID });
  };
  searchForGun = () => {
    console.log(this.state.searchID)
    console.log("Searching FOr gun");
    this.startScan();
    
  }
  retrieveConnected(){
    BleManager.getConnectedPeripherals([]).then((results) => {
      if (results.length == 0) {
        console.log('No connected peripherals')
      }
      var peripherals = this.state.peripherals;
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        this.setState({ peripherals });
      }
    });
  }

  checkGunConnection(){
    gunID = this.state.connectedGun.id;
    console.log("Checking if connected gun",gunID);
    BleManager.isPeripheralConnected(gunID, []) // Possibly add gunService uuid in to array
      .then((isConnected) => {
        if (isConnected) {
          console.log('Peripheral is connected!');
          
        } else {
          console.log('Peripheral is NOT connected!');
          let peripherals = this.state.peripherals;
          let peripheral = peripherals.get(gunID);
          console.log("Got here")
          if (peripheral) {
            console.log("After Peripheral")
            peripheral.connected = false;
            console.log("No peripherals");
            peripherals.set(peripheral.id, peripheral);
            peripheral.connected = false;
            peripherals.set(peripheral.id, peripheral);
            this.setState({peripherals});

            this.setState({connectedGun: null})
            console.log("Before save");
            this.saveGunConnection(this.state);
          }
        }
        }) ;
  }

  
  desiredPeriferal(peripheral){
    //console.log("Checking",peripheral);
    return false;
  }
  
getFilterUUID(){
  console.log("Getting filterUUID");
  const filterHeader = ""
}

readData(){
  peripheral = this.getConnectedPeripheral();
  if (!peripheral){
    console.warn("No gun connected");
    return;
  }
  this.test(peripheral)
}

  sendData(/*data*/){
    peripheral = this.getConnectedPeripheral();
    if (!peripheral){
      console.warn("No gun connected");
      return;
    }
    BleManager.retrieveServices(peripheral.id).then((peripheralInfo) => {
      //console.log("Got info",peripheralInfo);
      var service = '206ac814-ed0b-4204-bd82-e3a0b3bbecc2';
      var writeCharacteristic = 'BB950764-A597-4E20-8613-E43BF9D1330C';
      const data = stringToBytes("startGame");
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
 
  attemptGunConnection(peripheral) {
    console.log("Attempting to connect to gun")
    if (peripheral){
      if (peripheral.connected){
        console.log("Already Connected")
      }else{
        BleManager.stopScan()
        .then(() => {
          console.log("Stopeed scan and attemptijng connection");
        BleManager.connect(peripheral.id).then(() => {
          let peripherals = this.state.peripherals;
          let p = peripherals.get(peripheral.id);
          if (p) {
            p.connected = true;
            peripherals.set(peripheral.id, p);
            this.setState({peripherals});
            this.setState({connectedGun: peripheral})
          }
          // Subscribe to notification and declare command handler
          console.log('Connected to ' + peripheral.id);
          console.log("State",this.state);
          this.saveGunConnection(this.state);
          BleManager.retrieveServices(peripheral.id).then((peripheralInfo) => {
            console.log("Subscribing to notifications");
            var RXCharacteristic = '9C3EEE6d-48FD-4080-97A8-240C02ADA5F5';
            var service = peripheralInfo.advertising.serviceUUIDs[0];
            BleManager.startNotification(peripheral.id, service, RXCharacteristic).then((info) => {
              this.setState({dataListener: bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic',({ value, peripheral, characteristic, service }) => {
              const data = bytesToString(value);
                  //console.log(`Recieved ${data} for characteristic ${characteristic}`); // Call data event handler
                  this.handleGunCommand(data);
              })});
            }).catch((error) => {
              console.log("Notification error",error);
              this.setState({connectionError: "Could not retrieve commands"});
            });
          }).catch((error) => {
            this.setState({connectionError: "Could not retrieve connected Gun"});
            console.log("Retrieve service error",error);
          });
        }).catch((error) => {
          this.setState({connectionError: "Could not connect to gun"})
          console.log('Connection failed',error)
        }) 
      });
        
      }
    }
  }

toggleGunConnection(peripheral) {

    if (peripheral){
      if (peripheral.connected){
        //console.log("Disconnecting",peripheral)
        var service = peripheral.advertising.serviceUUIDs[0];
        var RXCharacteristic = '9C3EEE6d-48FD-4080-97A8-240C02ADA5F5';
        BleManager.stopNotification(peripheral.id, service, RXCharacteristic).then((info) => {
          console.log(this.state.dataListener)
          if (this.state.dataListener != undefined){
            this.state.dataListener.remove();
          } else{
            console.log("DataListener is undefined")
          }
          BleManager.disconnect(peripheral.id);
        }).catch((error) => {
          console.warn("Stopping error",error);
      });
      }else{
        BleManager.connect(peripheral.id).then(() => {
          let peripherals = this.state.peripherals;
          let p = peripherals.get(peripheral.id);
          if (p) {
            p.connected = true;
            peripherals.set(peripheral.id, p);
            this.setState({peripherals});
            this.setState({connectedGun: peripheral})
          }
          console.log('Connected to ' + peripheral.id);
          //console.log("State",this.state);
          this.saveGunConnection(this.state);
          BleManager.retrieveServices(peripheral.id).then((peripheralInfo) => {
            console.log("Subscribing to notifications");
            var RXCharacteristic = '9C3EEE6d-48FD-4080-97A8-240C02ADA5F5';
            var service = peripheralInfo.advertising.serviceUUIDs[0];
            BleManager.startNotification(peripheral.id, service, RXCharacteristic).then((info) => {
            this.setState({dataListener: bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic',({ value, peripheral, characteristic, service }) => {
              // Get handler for the battery characteristic as well    
              const data = bytesToString(value);
                  console.log(`Recieved ${data} for characteristic ${characteristic}`); // Call data event handler
                  this.handleGunCommand(data);
              })});
            }).catch((error) => {
              console.warn("Notification error",error);
            });
          }).catch((error) => {
            console.warn("Retrieve service error",error);
          });
        }).catch((error) => {
        console.log('Connection error', error);
      });
    }
  }
}
    
  test(peripheral) {
            // Test using bleno's pizza example
            // https://github.com/sandeepmistry/bleno/tree/master/examples/pizza
            BleManager.retrieveServices(peripheral.id).then((peripheralInfo) => {
              //console.log(peripheralInfo);
              var service = peripheralInfo.advertising.serviceUUIDs[0];
              //console.log(service);
              var notifyCharacteristic = 'BB950764-A597-4E20-8613-E43BF9D1330C';
              var RXCharacteristic = '9C3EEE6d-48FD-4080-97A8-240C02ADA5F5';  
                BleManager.read(peripheral.id, service, RXCharacteristic)
                .then((readData) => {
                  // Success code
                  console.log('Read: ' + readData);
                  var sensorData = bytesToString(readData)
                  console.log("dta",sensorData);
                })
                .catch((error) => {
                  // Failure code
                  console.log(error);
                });
              
            });
    }
    




  renderConnectedGun() {
    var myGun = this.state.connectedGun;        
    if (myGun != null){
      color = myGun.connected ? '#99ff99' : '#fff'; //Remind me to turn these to LinearGradient + scale feedback
      let pService = myGun.advertising.serviceUUIDs[0]
      let serviceTag = pService.slice(-6);
      const gunName = myGun.name + ': ' + serviceTag;
      return (
        <ListItem 
              onPress={() => this.toggleGunConnection(myGun) }
                containerStyle = {{
                  backgroundColor: color,
                  margin: 10
                }}
                subtitleStyle = {{
                  fontSize: 8,
                }}
                title={gunName}
                subtitle = {myGun.connected ? 'Connected' : 'Not Connected'}
                rightIcon = {{type: 'antdesign', name: 'disconnect'}}
        />
        
      );
  } else{
    return (
      <View/>
    )
  }
  }


  render() {
    //const list = Array.from(this.state.peripherals.values());
    //var connectedGun = this.state.connectedGun;
    //var color = '#fff'
    return (
     <ThemeProvider theme={LaserTheme}>
        <Text style={{
          fontSize: 22,
            margin: 5,
            backgroundColor: 'gray',
            textAlign: 'center'
        }} onPress={() => this.startScan() }>
          {this.state.scanning ? 'Scanning...' : 'Not Scaning'}
        </Text>
        <Input
          placeholder='Enter Gun ID Manually'
          leftIcon={{ type: 'font-awesome', name: 'qrcode' }}
          errorMessage={this.state.connectionError}
          autoCompleteType = 'off'
          onChangeText={this.editSearchGun}
          onEndEditing = {this.searchForGun}
          returnKeyLabel = 'Connect'
          returnKeyType = 'go'
          autoCapitalize = 'characters'
          autoCorrect = {false}
        />
        <Text style= {{fontSize: 24, textAlign: 'center'}}> OR </Text>
        <Button title= "Scan QR"  onPress={() => this.readData() }>
        </Button>
        <Divider style={{ backgroundColor: 'blue' }} />
          {(this.state.connectedGun == null) &&
            <View style={{flex:1, margin: 20}}>
              <Text style={{textAlign: 'center'}}>Gun Not Connected</Text>
            </View>
          }
          {this.renderConnectedGun()}         

        
        </ThemeProvider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    width: window.width,
    height: window.height
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    margin: 10,
  },
  row: {
    margin: 10
  },
});
