import React from 'react';
import { AppRegistry } from 'react-native';
import BabyVaccinationApp from './App'; // Updated import
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => BabyVaccinationApp);