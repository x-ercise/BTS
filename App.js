/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */
import React from 'react';
import { Platform, StyleSheet } from 'react-native'
import { Router, Scene, Actions, TabIcon } from 'react-native-router-flux';
import LoginPage from './src/LoginPage';
import RegisterPage from './src/RegisterPage.android';
import LoginPageIOS from './src/LoginPage.ios';
import RegisterPageIOS from './src/RegisterPage.ios';


type Props = {};
export default class App extends React.Component<Props> {
  render() {
    let isIOS = (Platform.OS === 'ios');
    

    const sceneIOS = (
      
        <Scene key="root" tabs={false} 
               tabBarStyle={styles.tabBar }
               navigationBarStyle={styles.navBar} 
               titleStyle={styles.navBarTitle} 
               barButtonTextStyle={styles.barButtonText} 
               barButtonIconStyle={styles.barButtonIcon}
               >
          <Scene key="login" 
                component={LoginPageIOS} 
                title="LOGIN" 
                hideNavBar
                initial
                />
          <Scene key="register" 
                  component={RegisterPageIOS}
                  hideNavBar
                  title="REGISTER"
                  />
        </Scene>
      
    )
    const sceneAndroid = (
        <Scene key="root" tabs={false} 
               tabBarStyle={styles.tabBar }
               navigationBarStyle={styles.navBar} 
               titleStyle={styles.navBarTitle} 
               barButtonTextStyle={styles.barButtonText} 
               barButtonIconStyle={styles.barButtonIcon}
               >
          <Scene key="login" 
                component={LoginPage} 
                title="LOGIN" 
                hideNavBar
                initial
                />
          <Scene key="register" 
                  component={RegisterPage}
                  hideNavBar={true}
                  title="REGISTER"
                  />
        </Scene>
      
    )
    return ( 
        <Router>
          { isIOS? sceneIOS : sceneAndroid }
        </Router>
    )
  }
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor:'#0D47A1',
  },
  navBar: {
    backgroundColor:'#0984e3',
  },
  navBarTitle:{
    color:'#FFFFFF'
  },
  barButtonText:{
    color:'#FFFFFF'
  },
  barButtonIcon :{
    tintColor:'rgb(255,255,255)'
  },
})
