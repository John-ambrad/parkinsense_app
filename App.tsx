import { StatusBar } from 'expo-status-bar';

import { useEffect, useState,Dispatch } from 'react';

import { Button, Platform, Text, View } from 'react-native';

import { BleManager, Device } from 'react-native-ble-plx';

import { useAndroidPermissions } from './useAndroidPermissions';

import {  atob } from "react-native-quick-base64";


const bleManager = new BleManager();


const DEVICE_NAME = "parkinsense module";
const SERVICE_UUID = "59520b55-ed9c-4cf2-a8ce-2f51504d5736";
const CHARACTERISTIC_UUID_X = "92484112-5e52-4dbb-b1a6-26dd8313960d";
const CHARACTERISTIC_UUID_Y = "7c8cf479-74e4-4ae2-97b5-e0ea3492decc";
const CHARACTERISTIC_UUID_Z = "5ec522c3-514e-4c8b-ac8c-b128a509f629";


export default function App() {

  const [hasPermissions, setHasPermissions] = useState<boolean>(Platform.OS == 'ios');

  const [waitingPerm, grantedPerm] = useAndroidPermissions();


  const [connectionStatus, setConnectionStatus] = useState("Searching...");

  const [isConnected, setIsConnected] = useState<boolean>(false);


  const [device, setDevice] = useState<Device | null>(null);


  const [acceleration_x, setAccelerationxCount] = useState(0.00);
  const [acceleration_y, setAccelerationyCount] = useState(0.00);
  const [acceleration_z, setAccelerationzCount] = useState(0.00);


  const readData = (characteristic_uuid:string,setCount:Dispatch<number> ) => {
    
    if(!device || !device.isConnected) {
      return
    }
    const sub = device.monitorCharacteristicForService(
      SERVICE_UUID,
      characteristic_uuid,
      (error, char) => {
        if (error || !char) {
          return;
        }
        const rawValue = parseFloat(atob(char?.value ?? ""));
        setCount(rawValue);
      }
    )


    return () => sub.remove()

  


  };


  useEffect(() => {

    if (!(Platform.OS == 'ios')){

      setHasPermissions(grantedPerm);

    }

  }, [grantedPerm])


  useEffect(() => {

    if(hasPermissions){

      searchAndConnectToDevice();

    }

  }, [hasPermissions]);


  const searchAndConnectToDevice = () =>

    bleManager.startDeviceScan(null, null, (error, device) => {

      if (error) {

        console.error(error);

        setIsConnected(false);

        setConnectionStatus("Error searching for devices");

        return;

      }

      if (device?.name === DEVICE_NAME) {

        bleManager.stopDeviceScan();

        setConnectionStatus("Connecting...");

        connectToDevice(device);

      }

    });


    const connectToDevice = async (device: Device) => {

      try {

      const _device = await device.connect(); 

       // require to make all services and Characteristics accessable

      await _device.discoverAllServicesAndCharacteristics();

      setConnectionStatus("Connected");

      setIsConnected(true);

      setDevice(_device);

      } catch (error){

          setConnectionStatus("Error in Connection");

          setIsConnected(false);

      }

    };


    useEffect(() => {

      if (!device) {

        return;

      }


      const subscription = bleManager.onDeviceDisconnected(

        device.id,

        (error, device) => {

          if (error) {

            console.log("Disconnected with error:", error);

          }

          setConnectionStatus("Disconnected");

          setIsConnected(false);

          console.log("Disconnected device");

          if (device) {

            setConnectionStatus("Reconnecting...");

            connectToDevice(device)

              .then(() => {

                setConnectionStatus("Connected");

                setIsConnected(true);

              })

              .catch((error) => {

                console.log("Reconnection failed: ", error);

                setConnectionStatus("Reconnection failed");

                setIsConnected(false);

                setDevice(null);

              });

          }

        }

      );


      return () => subscription.remove();

    }, [device]);


    useEffect(() => readData(CHARACTERISTIC_UUID_X,setAccelerationxCount),[device]);
    useEffect(() => readData(CHARACTERISTIC_UUID_Y,setAccelerationyCount),[device]);
    useEffect(() => readData(CHARACTERISTIC_UUID_Z,setAccelerationzCount),[device]);








  return (

    <View

    style={{flex: 1, alignItems: 'center', justifyContent:'center'}}

    >

    {

      !hasPermissions && (

        <View> 

          <Text>Looks like you have not enabled Permission for BLE</Text>

        </View>

      )

    }

    {hasPermissions &&(

      <View>

      <Text>BLE Premissions enabled!</Text>

      <Text>The connection status is: {connectionStatus}</Text>

      <Button 

      disabled={!isConnected} 

      onPress={() => {}}

      title={`The button is ${isConnected ? "enabled" : "disabled"}`}

      />

      <Text>The x acceleration is: {acceleration_x}</Text>
      <Text>The y acceleration is: {acceleration_y}</Text>
      <Text>The z acceleration is: {acceleration_z}</Text>


      </View>

    )

    }

      <StatusBar style="auto" />

    </View>

  );

}