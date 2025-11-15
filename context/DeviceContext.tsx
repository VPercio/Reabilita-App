import React, { createContext, ReactNode, useContext, useState } from "react";
import { Device } from "react-native-ble-plx";

type DeviceContextType = {
  connectedDevice: Device | null;
  setConnectedDevice: (device: Device | null) => void;
  bluetoothState: string;
  setBluetoothState: (state: string) => void;
};

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider = ({ children }: { children: ReactNode }) => {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [bluetoothState, setBluetoothState] = useState<string>("Unknown");

  return (
    <DeviceContext.Provider value={{ connectedDevice, setConnectedDevice, bluetoothState, setBluetoothState }}>
      {children}
    </DeviceContext.Provider>
  );
};

// Hook para usar o contexto facilmente
export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return context;
};
