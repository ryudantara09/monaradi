import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.aradimon.app',
    appName: 'Aradimon',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        // SQLite plugin configuration will go here
    }
};

export default config;
