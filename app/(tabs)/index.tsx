// src/screens/BluetoothScreen.tsx
import { ThemedView } from '@/components/themed-view';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { useDevice } from "../../context/DeviceContext";

// 🔹 Singleton do manager
const manager = new BleManager();

// Flag para evitar múltiplos popups de desconexão
let disconnectHandled = false;

// Timeout global do scan
let scanTimeout: number | null = null;

export default function BluetoothScreen() {
  const { connectedDevice, setConnectedDevice, bluetoothState, setBluetoothState } = useDevice();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const colorScheme = useColorScheme();

  // --- Monitorar estado do Bluetooth ---
useEffect(() => {
  const subscription = manager.onStateChange((state) => {
    setBluetoothState(state);
    if (state === "PoweredOff") {
      Alert.alert("Bluetooth desligado", "Ligue o Bluetooth para continuar.");
      setConnectedDevice(null);
      setDevices([]);
      setHasScanned(false);
      setIsScanning(false);
    }
  }, true);

  return () => subscription.remove();
}, []);

  // --- Permissões ---
  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        const allGranted = Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED
        );
        if (!allGranted) {
          Alert.alert("Permissões", "Permissões BLE não concedidas.");
          return false;
        }
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permissões", "Permissão de localização não concedida.");
          return false;
        }
      }
    }
    return true;
  };

  // --- Scan de dispositivos ---
 const scanDevices = async () => {
  if (isScanning) return; // bloqueia múltiplos scans

  const currentState = await manager.state();
  if (currentState !== "PoweredOn") {
    Alert.alert("Bluetooth desligado", "Ligue o Bluetooth para escanear.");
    return;
  }

  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  // Limpa scan anterior
  manager.stopDeviceScan();
  if (scanTimeout) {
    clearTimeout(scanTimeout);
    scanTimeout = null;
  }

  setDevices([]);
  setIsScanning(true);
  setHasScanned(false);

  // Aguarda 500ms para garantir que o BLE stack liberou recursos
  await new Promise(res => setTimeout(res, 500));

  try {
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log("Erro no scan:", error);
        Alert.alert("Erro", `Erro no scan: ${error.message || error}`);
        setIsScanning(false);
        setHasScanned(true);
        return;
      }

      if (device && device.name === "Reabilita") {
        setDevices(prev => {
          if (prev.find(d => d.id === device.id)) return prev;
          return [...prev, device];
        });
      }
    });
  } catch (e) {
    console.log("Erro ao iniciar scan:", e);
    Alert.alert("Erro", "Não foi possível iniciar o scan. Tente novamente.");
    setIsScanning(false);
    setHasScanned(true);
    return;
  }

  // Timeout seguro para parar o scan após 1,5s
  scanTimeout = setTimeout(() => {
    manager.stopDeviceScan();
    setIsScanning(false);
    setHasScanned(true);
    scanTimeout = null;
  }, 5000);
};


  // --- Conexão ---
  const connectToDevice = async (device: Device) => {
    if (connectedDevice) return;
    try {
      const connected = await manager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();

      setConnectedDevice(connected);
      setBluetoothState("PoweredOn");

      if (!disconnectHandled) {
        disconnectHandled = true;
       manager.onDeviceDisconnected(device.id, (error, disconnectedDevice) => {
  if (error) console.log("Erro na desconexão:", error);

  Alert.alert(
    "Desconectado",
    `O dispositivo ${disconnectedDevice?.name || disconnectedDevice?.id} foi desconectado.`
  );

  // 🔹 Limpa estado e volta para tela padrão
  setConnectedDevice(null);
  setBluetoothState("Unknown");
  setDevices([]);
  setHasScanned(false);
  setIsScanning(false);

  disconnectHandled = false;
});
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível conectar. Tente novamente.");
    }
  };

  // --- Estilos dinâmicos ---
  const backgroundColor = colorScheme === 'light' ? '#F0F0F0' : '#353636';
  const buttonBg = connectedDevice || isScanning
    ? "#A9A9A9"
    : colorScheme === 'light'
      ? '#007AFF'
      : '#1E90FF';
  const buttonText = "#FFF";
  const listColor = colorScheme === 'light' ? "#A9A9A9" : '#E0E0E0';
  const text = colorScheme === 'light' ? "#525252ff" : '#ffffffff';

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: buttonBg }]}
        onPress={!connectedDevice && !isScanning ? scanDevices : undefined}
        activeOpacity={connectedDevice || isScanning ? 1 : 0.8}
        disabled={isScanning || !!connectedDevice}
      >
        <Text style={[styles.buttonText, { color: buttonText }]}>
          Buscar dispositivos
        </Text>
      </TouchableOpacity>

      {isScanning && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={buttonBg} />
          <Text style={[styles.loadingText, { color: text }]}>
            Buscando dispositivo...
          </Text>
        </View>
      )}

      {connectedDevice ? (
        <Text style={[styles.connectedText, { color: text }]}>
          Conectado a: {connectedDevice.name || "Reabilita"}
        </Text>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => connectToDevice(item)}
              style={[styles.deviceItem, { backgroundColor: listColor }]}
            >
              <Text style={styles.deviceName}>{item.name || "Reabilita"}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            hasScanned && !isScanning ? (
              <Text style={[styles.emptyText, { color: text }]}>
                Nenhum dispositivo "Reabilita" encontrado
              </Text>
            ) : null
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 100 },
  button: { paddingVertical: 14, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 20, height: 100 },
  buttonText: { fontSize: 24, fontWeight: "bold" },
  loadingContainer: { marginTop: 20, alignItems: "center" },
  loadingText: { marginTop: 10 },
  connectedText: { marginTop: 20, fontSize: 24, fontWeight: "500" },
  deviceItem: { padding: 15, marginVertical: 6, borderRadius: 8, alignItems: "center" },
  deviceName: { fontSize: 24, fontWeight: "bold" },
  emptyText: { marginTop: 20, textAlign: "center", color: "#666" },
});
