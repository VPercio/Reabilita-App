import { ThemedView } from "@/components/themed-view";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { useDevice } from "../../context/DeviceContext";

// ====================
// Componente Counter
// ====================
const Counter = ({
  label,
  value,
  setValue,
  min,
  max,
  color,
  disabled,
}: {
  label: string;
  value: number;
  setValue: (v: number) => void;
  min: number;
  max: number;
  color: string;
  disabled: boolean;
}) => {
  const colorScheme = useColorScheme();
  const cardBackground =
    colorScheme === "light" ? '#676d6dff' : '#676d6dff';

  const incrementar = () => {
    if (!disabled && value < max) setValue(value + 1);
  };

  const decrementar = () => {
    if (!disabled && value > min) setValue(value - 1);
  };

  return (
    <View style={styles.counterContainer}>
      <Text style={[styles.sliderLabel, { color }]}>{label}: {value}</Text>

      <View style={[styles.counterCard, { backgroundColor: cardBackground }]}>
        <TouchableOpacity
          onPress={decrementar}
          disabled={disabled || value === min}
          style={[
            styles.counterButton,
            { backgroundColor: disabled ? "#ccc" : color },
            (disabled || value === min) && styles.disabled
          ]}
        >
          <Text style={styles.counterButtonText}>−</Text>
        </TouchableOpacity>

        <Text style={[styles.counterValue, { color }]}>{value}</Text>

        <TouchableOpacity
          onPress={incrementar}
          disabled={disabled || value === max}
          style={[
            styles.counterButton,
            { backgroundColor: disabled ? "#ccc" : color },
            (disabled || value === max) && styles.disabled
          ]}
        >
          <Text style={styles.counterButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ====================
// Tela principal
// ====================
export default function ControlScreen() {
  const router = useRouter();
  const { connectedDevice, bluetoothState } = useDevice();

  const [velocidade, setVelocidade] = useState(1);
  const [intensidade, setIntensidade] = useState(1);
  const [repeticoes, setRepeticoes] = useState(1);
  const [ligado, setLigado] = useState(false);

  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'light' ? '#F0F0F0' : '#353636';
  const textColor = colorScheme === 'light' ? '#555555' : '#EEEEEE';
  const screenWidth = Dimensions.get('window').width;

  const slidersDisabled = !connectedDevice || bluetoothState !== "PoweredOn" || ligado;
  const buttonDisabled = !connectedDevice || bluetoothState !== "PoweredOn";

useEffect(() => {
  if (!connectedDevice || bluetoothState !== "PoweredOn") {
    setLigado(false);  
    router.push("/");
  }
}, [connectedDevice, bluetoothState]);


  function stringToBase64(str: string) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach((b) => binary += String.fromCharCode(b));
    return btoa(binary);
  }

  const sendToESP = async () => {
    if (!connectedDevice) return;

    const command = ligado
      ? `DESLIGAR,0,0,0`
      : `LIGAR,${velocidade},${intensidade},${repeticoes}`;

    try {
      const commandBase64 = stringToBase64(command);

      await connectedDevice.writeCharacteristicWithResponseForService(
        "12345678-1234-1234-1234-123456789abc",
        "abcd1234-5678-90ab-cdef-1234567890ab",
        commandBase64
      );

      console.log("✅ Comando enviado:", command);
    } catch (error) {
      console.error("❌ Erro ao enviar comando:", error);
    }
  };

  const handleButtonPress = async () => {
    await sendToESP();
    setLigado(!ligado);
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Counter
          label="Velocidade"
          value={velocidade}
          setValue={setVelocidade}
          min={1}
          max={5}
          color="#1E90FF"
          disabled={slidersDisabled}
        />

        <Counter
          label="Intensidade"
          value={intensidade}
          setValue={setIntensidade}
          min={1}
          max={5}
          color="#FF4500"
          disabled={slidersDisabled}
        />

        <Counter
          label="Número de Repetições"
          value={repeticoes}
          setValue={setRepeticoes}
          min={1}
          max={20}
          color="#32CD32"
          disabled={slidersDisabled}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleButtonPress}
            style={[
              styles.button,
              {
                backgroundColor: buttonDisabled ? "#A9A9A9" : ligado ? 'red' : 'green',
                width: screenWidth * 0.9
              }
            ]}
            disabled={buttonDisabled}
          >
            <Text style={styles.buttonText}>{ligado ? 'Desligar' : 'Ligar'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    paddingTop: 100,
  },

  counterContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },

  sliderLabel: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  counterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    marginTop: 10,
  },

  counterButton: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  counterButtonText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },

  counterValue: {
    fontSize: 28,
    fontWeight: '600',
    width: 50,
    textAlign: 'center',
  },

  disabled: {
    opacity: 0.5,
  },

  buttonContainer: {
    marginTop: 40,
    alignItems: 'center',
  },

  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
