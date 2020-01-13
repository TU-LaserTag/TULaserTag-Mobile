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
import {Button, ThemeProvider} from 'react-native-elements'
import BleManager from 'react-native-ble-manager';
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
      connectedGun: null
    }
    console.log("construct");
    if (this.loadStorage() == false){ // If there is no connected gun in storage
     console.log("No devices connected")
    }

    this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
    this.handleStopScan = this.handleStopScan.bind(this);
    this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
    this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
  }

  loadStorage = () => {
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
    console.log(ret);
    this.setState({connectedGun: ret.conGun})
    this.startBLEmanager(true);
    return true;
  })
  .catch(err => {
    // any exception including data not found
    // goes to catch()
    this.startBLEmanager(false);

    console.log(err.message);
    switch (err.name) {
      case 'NotFoundError':
        console.log((" NO gun"))
        return false;
      case 'ExpiredError': // Gun only lasts for so long
        break;
    }
  });
  }

  saveGunConnection(data) {
    //console.log("saving gun connection",data)
    global.storage.save({
      key: 'gunData',
      data: {
        conGun: data.connectedGun,
      }
    })
  }

  removeSavedGun() {
    global.storage.remove({
      key: 'gunData'
    });
  }

  startBLEmanager(gunSaved) {
    console.log("StartingManager",gunSaved)
    if (gunSaved){
      console.log("Loading saved gun");
    }else{
        
    }

    
  }
  componentDidMount() {
    console.log("Mounting");
    BleManager.start({showAlert: false}) // DOnt init if started already?
    .then(() =>{
        console.log("initialized Bluetooth")
    });
    AppState.addEventListener('change', this.handleAppStateChange);
    
    this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
    this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );
    this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral );
   // this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );

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

  handleAppStateChange(nextAppState) {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!')
      BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
        console.log('Connected peripherals: ' + peripheralsArray.length);
      });
    }
    this.setState({appState: nextAppState});
  }

  componentWillUnmount() { // cancel all async tasks herere?
    console.log("unmouting")
    this.handlerDiscover.remove();
    this.handlerStop.remove();
    //this.handlerDisconnect.remove();
    //this.handlerUpdate.remove();
  }

  handleDisconnectedPeripheral(data) {
    let peripherals = this.state.peripherals;
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      this.setState({peripherals});
      this.setState({connectedGun: null})
      this.removeSavedGun(this.state);
    }
    console.log('Disconnected from ' + data.peripheral);
  }

  handleUpdateValueForCharacteristic(data) {
    //console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
  }

  handleStopScan() {
    console.log('Scan is stopped');
    this.setState({ scanning: false });
  }
  handleDiscoverPeripheral(peripheral){
    var peripherals = this.state.peripherals;
    //console.log('Got ble peripheral', peripheral);
    if (!peripheral.name) {
      peripheral.name = 'NO NAME';
      return;
    }
    peripherals.set(peripheral.id, peripheral);
    this.setState({ peripherals });
    if (this.desiredPeriferal(peripheral)){
      attemptGunConnection(peripheral);
    }
  }
  startScan() {
    var serviceArray = ["206AC814-ED0B-4204-BD82-246F28A83FCE"] // GEt Clip ID and populate here
    if (!this.state.scanning) {
      //this.setState({peripherals: new Map()});
      BleManager.scan(serviceArray , 1, false).then((results) => {
        console.log('Scanning...');
        this.setState({scanning:true});
      });
    }
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

  getConnectedPeripheral(){
    if (this.state.connectedGun == null) {
      return false;
    }
    return this.state.connectedGun;
  }

  
  desiredPeriferal(peripheral){
    //console.log("Checking",peripheral);
    return false;
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
    if (peripheral){
      if (peripheral.connected){
        BleManager.disconnect(peripheral.id);
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
          
        }).catch((error) => {
          console.log('Connection failed',error)
        })
        
      }
    }
  }

toggleConnection(peripheral) {
    if (peripheral){
      if (peripheral.connected){
        //console.log(peripheral)
        var service = peripheral.advertising.serviceUUIDs[0];
        var RXCharacteristic = '9C3EEE6d-48FD-4080-97A8-240C02ADA5F5';
        BleManager.stopNotification(peripheral.id, service, RXCharacteristic).then((info) => {
          this.state.dataListener.remove();
          BleManager.disconnect(peripheral.id);
      }).catch((error) => {
        console.warn("Stoppiong error",error);
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
          console.log("State",this.state);
          this.saveGunConnection(this.state);
          BleManager.retrieveServices(peripheral.id).then((peripheralInfo) => {
            console.log("Subscribing to notifications");
            var RXCharacteristic = '9C3EEE6d-48FD-4080-97A8-240C02ADA5F5';
            var service = peripheralInfo.advertising.serviceUUIDs[0];
            BleManager.startNotification(peripheral.id, service, RXCharacteristic).then((info) => {
            this.setState({dataListener: bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic',({ value, peripheral, characteristic, service }) => {
                  const data = bytesToString(value);
                  console.log(`Recieved ${data} for characteristic ${characteristic}`); // Call data event handler
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
    




  renderItem(item) {
    const color = item.connected ? 'green' : '#fff'; //Remind me to turn these to LinearGradient + scale feedback
    return (
      <ListItem onPress={() => this.toggleConnection(item) }
        contentContainerStyle = {{
          backgroundColor: color,
        }}
        subtitleStyle = {{
          fontSize: 8,
        }}
        title={item.name}
        subtitle = {item.id}
        bottomDivider
        chevron
      />
      
    );
  }


  render() {
    const list = Array.from(this.state.peripherals.values());
    
    return (
     <ThemeProvider theme={LaserTheme}>
        <Button title= {this.state.scanning ? 'Scanning...' : 'Start Scanning'} style={{marginTop: 5,margin: 5, padding:10, backgroundColor:'#ccc'}} onPress={() => this.startScan() }>
        </Button>
        <Button title= "Check Connected Blasters" style={{marginTop: 5,margin: 5, padding:10, backgroundColor:'#ccc'}} onPress={() => this.retrieveConnected() }>
        </Button>
        <Button title= "SZend Data" style={{marginTop: 5,margin: 5, padding:10, backgroundColor:'#ccc'}} onPress={() => this.readData() }>
        </Button>
        <Divider style={{ backgroundColor: 'blue' }} />
        
          {(list.length == 0) &&
            <View style={{flex:1, margin: 20}}>
              <Text style={{textAlign: 'center'}}>No peripherals</Text>
            </View>
          }
          <FlatList
            data={list}
            renderItem={({ item }) => this.renderItem(item) }
            keyExtractor={item => item.id}
          />

        
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
