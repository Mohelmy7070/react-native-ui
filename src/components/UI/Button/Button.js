import React from 'react';
import { Text, TouchableOpacity} from 'react-native';

const Button = (props) => {
       
    return (
        <TouchableOpacity onPress={props.onPress}>
            <Text 
                style={{
                    fontSize: props.size,  
                    color: props.color, 
                    marginLeft: props.marginL, 
                    borderBottomColor: props.bBColor, 
                    borderBottomWidth: props.bBWidth,
                    borderStyle: props.bStyle,
                    fontWeight: props.fWeight,
                }}
            >{props.children}</Text>
        </TouchableOpacity>
    );
} 

export default Button;