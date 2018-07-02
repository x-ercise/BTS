import React, { Component } from 'react';
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
  ViewPropTypes
} from 'react-native';
import PropTypes          from 'prop-types';
import FingerprintScanner from 'react-native-fingerprint-scanner';
import finger_print       from './../assets/finger_print.png'
import ShakingText        from './ShakingText';
import styles             from './FingerprintPopup.styles';

class FingerprintPopup extends Component {

  constructor(props) {
    super(props);
    this.state = {
      Loading : false,
      errorMessage: undefined
    }

    this.handleAuthenticationAttempted = this.handleAuthenticationAttempted.bind(this)
  }

  componentDidMount() {

    FingerprintScanner
      .authenticate({ onAttempt: this.handleAuthenticationAttempted })
      .then((ret) => {
        if (ret === true)
          this.props.handlePopupDismissed(true)
        else
          this.props.handlePopupDismissed(false)
      })
      .catch((error) => {
        this.setState({ errorMessage: error.message })
        this.description.shake()
      })
  }

  componentWillUnmount() {
    FingerprintScanner.release();
  }
  handleAuthenticationAttempted = (error) => {
    this.description.shake();
    this.setState({ errorMessage: error.message });
  }

  render() {
    const { errorMessage } = this.state;
    const { style, handlePopupDismissed } = this.props;

    return (
      <View style={styles.container}>
        <View style={[styles.contentContainer, style]}>

          <Image
            style={styles.logo}
            source={finger_print}
          />

          <Text style={styles.heading}>
            Fingerprint Authentication
          </Text>
          <ShakingText
            ref={(instance) => { this.description = instance; }}
            style={styles.description(!!errorMessage)}>
            {errorMessage || 'Scan your fingerprint on\nthe device scanner to continue'}
          </ShakingText>

          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={handlePopupDismissed}>
            <Text style={styles.buttonText}>
              Dismiss
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    );
  }
}

FingerprintPopup.propTypes = {
  style: ViewPropTypes.style,
  handlePopupDismissed: PropTypes.func.isRequired,
};

export default FingerprintPopup;
