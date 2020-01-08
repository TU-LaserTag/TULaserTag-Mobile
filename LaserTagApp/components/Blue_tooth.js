import { useEffect, useCallback } from 'react';
import BluetoothSerial from 'react-native-bluetooth-serial';

const BLUETOOTH_ENABLED = 'bluetoothEnabled';
const BLUETOOTH_DISABLED = 'bluetoothDisabled';
const BLUETOOTH_ERROR = 'error';
const BLUETOOTH_CONNECTION_LOST = 'connectionLost';

export const useBluetooth = () => {
  const list = useCallback(async () => {
    const devices = await BluetoothSerial.list();
    console.log({ list: devices });
    return devices;
  }, []);

  const connect = useCallback(async deviceId => {
    const device = await BluetoothSerial.connect(deviceId);
    console.log({ connect: device });
    return device;
  }, []);

  const pairDevice = useCallback(async deviceId => {
    const isEnabled = await BluetoothSerial.enable();
    console.log({ isEnabled });
    const device = isEnabled
      ? await BluetoothSerial.pairDevice(deviceId)
      : null;
    console.log({ pairDevice: device });
    return device;
  }, []);

  const unpairDevice = useCallback(async id => {
    const isDisconnected = await BluetoothSerial.unpairDevice(id);
    console.log({ isDisconnected });
    return true;
  }, []);

  return { list, connect, unpairDevice, pairDevice };
};

export const useBluetoothEnabled = (callback, deps) => {
  useEffect(() => {
    BluetoothSerial.on(BLUETOOTH_ENABLED, callback);

    return () => {
      BluetoothSerial.removeListener(BLUETOOTH_ENABLED, callback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export const useBluetoothDisabled = (callback, deps) => {
  useEffect(() => {
    BluetoothSerial.on(BLUETOOTH_DISABLED, callback);

    return () => {
      BluetoothSerial.removeListener(BLUETOOTH_DISABLED, callback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export const useBluetoothError = (callback, deps) => {
  useEffect(() => {
    BluetoothSerial.on(BLUETOOTH_ERROR, callback);

    return () => {
      BluetoothSerial.removeListener(BLUETOOTH_ERROR, callback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export const useBluetoothConnectionLost = (callback, deps) => {
  useEffect(() => {
    BluetoothSerial.on(BLUETOOTH_CONNECTION_LOST, callback);

    return () => {
      BluetoothSerial.removeListener(BLUETOOTH_CONNECTION_LOST, callback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};