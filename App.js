/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */
import React from 'react';
import { StyleSheet } from 'react-native'
import { Router, Scene, Actions, TabIcon } from 'react-native-router-flux';
import LoginPage from './src/LoginPage';
import RegisterPage from './src/RegisterPage';


type Props = {};
export default class App extends React.Component<Props> {
  render() {
    return (
      <Router>
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
                 title="REGISTER"
                 />
        </Scene>
      </Router>
    );
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
