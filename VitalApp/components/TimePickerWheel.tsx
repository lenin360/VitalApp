import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';

interface TimePickerWheelProps {
    value: string; // HH:MM in 24h format
    onChange: (value: string) => void;
}

const ITEM_HEIGHT = 44;

export default function TimePickerWheel({ value, onChange }: TimePickerWheelProps) {
    const hours12 = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i).toString());
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    const periods = ['a.m.', 'p.m.'];

    // Convert incoming 24h 'value' to 12h components
    const parseValue = (val: string) => {
        if (!val) return { h: '12', m: '00', p: 'a.m.' };
        let [h24, m] = val.split(':');
        let h = parseInt(h24, 10);
        let p = h >= 12 ? 'p.m.' : 'a.m.';
        h = h % 12;
        if (h === 0) h = 12;
        return { h: h.toString(), m, p };
    };

    const initial = parseValue(value);

    const [selectedHour, setSelectedHour] = useState(initial.h);
    const [selectedMinute, setSelectedMinute] = useState(initial.m);
    const [selectedPeriod, setSelectedPeriod] = useState(initial.p);

    const hourRef = useRef<ScrollView>(null);
    const minRef = useRef<ScrollView>(null);
    const perRef = useRef<ScrollView>(null);

    // Update parent when any value changes
    useEffect(() => {
        let h24 = parseInt(selectedHour, 10);
        if (selectedPeriod === 'p.m.' && h24 !== 12) h24 += 12;
        if (selectedPeriod === 'a.m.' && h24 === 12) h24 = 0;
        
        const hStr = h24.toString().padStart(2, '0');
        onChange(`${hStr}:${selectedMinute}`);
    }, [selectedHour, selectedMinute, selectedPeriod]);

    // Scroll to initial values on mount
    useEffect(() => {
        setTimeout(() => {
            const hIndex = hours12.indexOf(initial.h);
            const mIndex = minutes.indexOf(initial.m);
            const pIndex = periods.indexOf(initial.p);
            
            if (hIndex >= 0) hourRef.current?.scrollTo({ y: hIndex * ITEM_HEIGHT, animated: false });
            if (mIndex >= 0) minRef.current?.scrollTo({ y: mIndex * ITEM_HEIGHT, animated: false });
            if (pIndex >= 0) perRef.current?.scrollTo({ y: pIndex * ITEM_HEIGHT, animated: false });
        }, 100);
    }, []);

    const handleScroll = (event: any, data: string[], setter: (val: string) => void) => {
        const y = event.nativeEvent.contentOffset.y;
        let index = Math.round(y / ITEM_HEIGHT);
        if (index < 0) index = 0;
        if (index >= data.length) index = data.length - 1;
        setter(data[index]);
    };

    const handlePress = (item: string, index: number, setter: (val: string) => void, ref: any) => {
        setter(item);
        ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    };

    const renderColumn = (data: string[], selected: string, setter: (val: string) => void, ref: any) => {
        return (
            <View style={styles.columnContainer}>
                <ScrollView
                    ref={ref}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    onMomentumScrollEnd={(e) => handleScroll(e, data, setter)}
                    onScrollEndDrag={(e) => {
                        // Web might not always fire momentum end if scrolled slowly
                        if (Platform.OS === 'web') handleScroll(e, data, setter);
                    }}
                    scrollEventThrottle={16}
                    contentContainerStyle={{
                        paddingVertical: ITEM_HEIGHT * 2, // Space to center first/last items
                    }}
                >
                    {data.map((item, index) => {
                        const isSelected = item === selected;
                        return (
                            <TouchableOpacity 
                                key={index} 
                                style={styles.item}
                                onPress={() => handlePress(item, index, setter, ref)}
                                activeOpacity={0.5}
                            >
                                <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.selectionHighlight} pointerEvents="none" />
            <View style={styles.row}>
                {renderColumn(hours12, selectedHour, setSelectedHour, hourRef)}
                {renderColumn(minutes, selectedMinute, setSelectedMinute, minRef)}
                {renderColumn(periods, selectedPeriod, setSelectedPeriod, perRef)}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: ITEM_HEIGHT * 5, // Shows 5 items at a time
        backgroundColor: '#F8FAFC', // Light theme background
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        height: '100%',
    },
    columnContainer: {
        flex: 1,
        height: '100%',
    },
    selectionHighlight: {
        position: 'absolute',
        top: ITEM_HEIGHT * 2,
        height: ITEM_HEIGHT,
        left: 10,
        right: 10,
        backgroundColor: '#EFF6FF', // Light blue highlight
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    item: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemText: {
        fontSize: 20,
        color: '#94A3B8', // Unselected text
        fontWeight: '500',
    },
    itemTextSelected: {
        color: '#2563EB', // Selected text
        fontSize: 24,
        fontWeight: '800',
    }
});
