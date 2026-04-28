import { Stack } from "expo-router";

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="home" />
            <Stack.Screen name="ejercicios" />
            <Stack.Screen name="detalle-ejercicio" />
            <Stack.Screen name="perfil" />
            <Stack.Screen name="estadisticas" />
            <Stack.Screen name="recordatorios" />
        </Stack>
    );
}
