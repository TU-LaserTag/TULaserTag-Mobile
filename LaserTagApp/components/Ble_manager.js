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

const window = Dimensions.get('window');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
var Buffer = require('buffer/').Buffer

export default class BluetoothManager extends Component {
  constructor(){
    super()

    this.state = {
      scanning:false,
      peripherals: new Map(),
      appState: '',
      connectedGun: {}
    }

    this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
    this.handleStopScan = this.handleStopScan.bind(this);
    this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
    this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);

    BleManager.start({showAlert: false})
    .then(() =>{
      console.log("initialized Bluetooth")
    });

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

  handleAppStateChange(nextAppState) {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!')
      BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
        console.log('Connected peripherals: ' + peripheralsArray.length);
      });
    }
    this.setState({appState: nextAppState});
  }

  componentWillUnmount() {
    console.log("unmouting")
    this.handlerDiscover.remove();
    this.handlerStop.remove();
    this.handlerDisconnect.remove();
    this.handlerUpdate.remove();
  }

  handleDisconnectedPeripheral(data) {
    let peripherals = this.state.peripherals;
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      this.setState({peripherals});
    }
    console.log('Disconnected from ' + data.peripheral);
  }

  handleUpdateValueForCharacteristic(data) {
    console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
  }

  handleStopScan() {
    console.log('Scan is stopped');
    this.setState({ scanning: false });
  }

  startScan() {
    var serviceArray = ["206ac814-ed0b-4204-bd82-e3a0b3bbecc2"]
    if (!this.state.scanning) {
      //this.setState({peripherals: new Map()});
      BleManager.scan([], 3, true).then((results) => {
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
      console.log(results);
      var peripherals = this.state.peripherals;
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        this.setState({ peripherals });
      }
    });
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
  desiredPeriferal(peripheral){
    //console.log("Checking",peripheral);
    return false;
  }
  readData(peripheral){
    BleManager.retrieveServices(peripheral.id).then((peripheralInfo) => {
      console.log("Got info",peripheralInfo);
      var service = '206ac814-ed0b-4204-bd82-e3a0b3bbecc2';
      var readCharacteristic = '206AC814-ED0B-4204-BD82-E3A0B3BBECC2';
      //var crustCharacteristic = '13333333-3333-3333-3333-333333330001';
      BleManager.read(peripheral.id, service, readCharacteristic).then((data) => {
      console.log('Reading From: ' + peripheral.id);
      console.log('read:',data);
      const buffer = Buffer.Buffer.from(data);    //https://github.com/feross/buffer#convert-arraybuffer-to-buffer
      const newData = buffer.readUInt8(1, true);
      console.log("BufferData",newData)
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
          }
          console.log('Connected to ' + peripheral.id);
        }).catch((error) => {
          console.log('Connection failed',error)
        })
        if (this.readData(peripheral) == false){
          this.readData(peripheral);
        }      
      }
    }
  }

  renderItem(item) {
    const color = item.connected ? 'green' : '#fff'; //Remind me to turn these to LinearGradient + scale feedback
    return (
      <ListItem onPress={() => this.attemptGunConnection(item) }
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
