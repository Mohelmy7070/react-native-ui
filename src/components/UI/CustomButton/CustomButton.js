import React from 'react';
import { 
    View,
    Text,
    TouchableOpacity, 
    StyleSheet } from 'react-native';

const customButton = (props) => {
    
    const content =  (
            <View style={[styles.button, 
                {backgroundColor: props.bgColor, 
                borderRadius: props.raduis},
                props.disabled ? styles.disabled : null ]}
            >
                <Text style={[props.disabled ? styles.disabledText : null , {fontSize: props.size,  color: props.color}]}>
                    {props.children}
                </Text>
            </View>       
    );
    if(props.disabled){
        return content;
    }
    return (
        <TouchableOpacity onPress={props.onPress}>
            {content}
        </TouchableOpacity>
    );
} 

const styles = StyleSheet.create({
    button: {
        padding: 10,
        width: 250, 
        height: 45, 
        marginBottom: 20,
        alignItems: 'center'
    },
    disbled: {
        backgroundColor: "#eee",
        borderColor: '#aaa',
    },
    disabledText: {
        color: '#aaa'
    }
});

export default customButton;