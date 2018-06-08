import { AppRegistry, YellowBox, Platform } from 'react-native';
import App from './App';

if (Platform.OS === 'ios') {
    YellowBox.ignoreWarnings([
        'Warning: isMounted(...) is deprecated', 
        'Module RCTImageLoader']
    );
} else {
    YellowBox.ignoreWarnings([
        'Warning: isMounted(...) is deprecated', 
        'Module RCTImageLoader']
    );
}

AppRegistry.registerComponent('BTS', () => App);
