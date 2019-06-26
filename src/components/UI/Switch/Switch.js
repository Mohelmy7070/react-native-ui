import React from 'react';
import { Switch, Platform } from 'react-native';

import * as  theme  from '../../../constants/Theme/Theme';

const GRAY_COLOR = 'rgba(168, 182, 200, 0.30)';

export default class SwitchInput extends React.PureComponent {
  render() {
    const { value, ...props } = this.props;
    let thumbColor = null;

    if (Platform.OS === 'android') {
      thumbColor = GRAY_COLOR;
      if (props.value) thumbColor = theme.colors.tintColor;
    }

    return (
      <Switch
        thumbColor={thumbColor}
        ios_backgroundColor={GRAY_COLOR}
        trackColor={{ true: theme.colors.tintColor }}
        value={value}
        {...props}
      />
    );
  }
}