import {
  EventItem,
  HighlightDates,
  MomentConfig,
  OnChangeProps,
  PackedEvent,
  RangeTime,
  TimelineCalendar,
  TimelineCalendarHandle,
  UnavailableItemProps,
  TimeRanges,
} from '@howljs/calendar-kit';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import moment from 'moment-timezone';
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Line, Svg } from 'react-native-svg';
import CustomUnavailableItem from './CustomUnavailableItem';

interface CalendarProps {
  route: RouteProp<any>;
  navigation: NavigationProp<any>;
}

const randLightColor = () => {
  return (
    'hsl(' +
    360 * Math.random() +
    ',' +
    (25 + 70 * Math.random()) +
    '%,' +
    (85 + 10 * Math.random()) +
    '%)'
  );
};

const randColor = () => {
  return (
    '#' +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase()
  );
};
const unavailableHours: TimeRanges = {
  '0': [{ start: 0, end: 24 }],
  '1': [
    { start: 0, end: 7 },
    { start: 18, end: 24 },
  ],
  '2': [
    { start: 0, end: 7 },
    { start: 7.5, end: 10 },
    { start: 18, end: 24 },
  ],
  '3': [
    { start: 0, end: 7 },
    { start: 18, end: 24 },
  ],
  '4': [
    { start: 0, end: 7 },
    { start: 18, end: 24 },
  ],
  '5': [
    { start: 0, end: 7 },
    { start: 18, end: 24 },
  ],
  '6': [{ start: 0, end: 24 }],
  '2023-02-16': [
    { start: 0, end: 24 },
    // { start: 12, end: 13.5 },
    // { start: 17, end: 24 },
  ],
  '2022-11-29': [
    { start: 0, end: 8.5 },
    { start: 16, end: 24 },
  ],
};

MomentConfig.updateLocale('vi', {
  weekdaysShort: 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
});

MomentConfig.updateLocale('ja', {
  weekdaysShort: '日_月_火_水_木_金_土'.split('_'),
});

const Calendar = ({ route, navigation }: CalendarProps) => {
  const { bottom: safeBottom } = useSafeAreaInsets();
  const calendarRef = useRef<TimelineCalendarHandle>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PackedEvent>();

  const _renderHeaderRight = useCallback(() => {
    return (
      <TouchableOpacity
        style={styles.headerRight}
        onPress={() => {
          if (selectedEvent) {
            return;
          }
          calendarRef.current?.goToDate({
            hourScroll: true,
          });
        }}
      >
        <Text allowFontScaling={false}>Now</Text>
      </TouchableOpacity>
    );
  }, [selectedEvent]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: _renderHeaderRight,
    });
  }, [_renderHeaderRight, navigation]);

  const isTimeAvailable = (
    start: moment.Moment,
    end: moment.Moment
  ): boolean => {
    const dayEvent = start.format('YYYY-MM-DD');
    const unavailableRanges = unavailableHours[dayEvent] ?? [];
    const startHour = start.hours() + start.minutes() / 60;
    const endHour = end.hours() + end.minutes() / 60;

    for (const range of unavailableRanges) {
      if (startHour >= range.start && startHour < range.end) {
        return false;
      }
      if (endHour > range.start && endHour <= range.end) {
        return false;
      }
      if (startHour <= range.start && endHour >= range.end) {
        return false;
      }
    }

    return true;
  };

  const _onDragCreateEnd = (event: RangeTime) => {
    const randomId = Math.random().toString(36).slice(2, 10);
    const newEvent = {
      id: randomId,
      title: randomId,
      start: event.start,
      end: event.end,
      color: randLightColor(),
      containerStyle: { borderColor: randColor(), borderWidth: 1 },
    };
    // Condition check can not create event in unavaiableHours
    //TODO: Handle with holidays too
    const hourEnd = moment
      .tz(moment(event.end).add(1, 'second'), 'Asia/Ho_Chi_Minh')
      .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    const hourStart = moment
      .tz(moment(event.start).add(1, 'second'), 'Asia/Ho_Chi_Minh')
      .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    const dayEvent = moment(event.start).weekday();
    const isAvailable = unavailableHours[dayEvent]!.every(({ start, end }) => {
      const eventStart = moment(hourStart)
        .utc()
        .diff(moment(hourStart).utc().startOf('day'), 'hours', true);
      const eventEnd = moment(hourEnd)
        .utc()
        .diff(moment(hourEnd).utc().startOf('day'), 'hours', true);
      return eventEnd <= start || eventStart >= end;
    });
    // if (isTimeAvailable(hourStart, hourEnd)) {
    //   setEvents((prev) => [...prev, newEvent]);
    // } else {
    //   Alert.alert(
    //     'Warning',
    //     'New time slot is not Available, please try another time slot'
    //   );
    // }
    // let isTimeAvailable = true;
    // if (unavailableHours[dayEvent]) {
    //   for (let i = 0; i < unavailableHours[dayEvent].length; i++) {
    //     const range = unavailableHours[dayEvent]![i];
    //     if (
    //       hourEnd >=
    //         moment(hourStart)
    //           .hour(range!.start)
    //           .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') &&
    //       hourStart <=
    //         moment(hourStart)
    //           .hour(range!.end)
    //           .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
    //     ) {
    //       isTimeAvailable = false;
    //       break;
    //     }
    //   }
    // }
    // Check if time is not in unavailable schedule
    // const isAvailable = unavailableHours[dayEvent].every(({ start, end }) => {
    //   const unavailableStart = moment(hourStart)
    //     .startOf('day')
    //     .add(start, 'hours');
    //   const unavailableEnd = moment(hourStart).startOf('day').add(end, 'hours');
    //   return (
    //     hourEnd.isSameOrBefore(unavailableStart) ||
    //     hourStart.isSameOrAfter(unavailableEnd)
    //   );
    // });
    if (isAvailable) {
      setEvents((prev) => [...prev, newEvent]);
    } else {
      Alert.alert(
        'Warning',
        'New time slot is not Available, please try another time slot'
      );
    }
  };

  const _onLongPressEvent = (event: PackedEvent) => {
    setSelectedEvent(event);
  };

  const _onPressCancel = () => {
    setSelectedEvent(undefined);
  };

  const _onPressSubmit = () => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id === selectedEvent?.id) {
          return { ...ev, ...selectedEvent };
        }
        return ev;
      })
    );
    setSelectedEvent(undefined);
  };

  const _renderEditFooter = () => {
    return (
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={_onPressCancel}>
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={_onPressSubmit}>
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const _renderCustomUnavailableItem = useCallback(
    (props: UnavailableItemProps) => <CustomUnavailableItem {...props} />,
    []
  );

  const highlightDates: HighlightDates = useMemo(
    () => ({
      '2023-02-13': {
        dayNameColor: '#CF0A0A',
        dayNumberColor: '#CF0A0A',
        dayNumberBackgroundColor: '#FFF',
      },
      '2022-11-08': {
        dayNameColor: '#0008C1',
        dayNumberColor: '#0008C1',
        dayNumberBackgroundColor: '#FFF',
      },
      '2022-11-09': {
        dayNameColor: '#E14D2A',
        dayNumberColor: '#FFF',
        dayNumberBackgroundColor: '#E14D2A',
      },
    }),
    []
  );

  const _onChange = ({ date }: OnChangeProps) => {
    navigation.setOptions({
      title: moment(date).format('MMMM YYYY'),
    });
  };

  const _onPressDayNum = (date: string) => {
    if (route.params?.viewMode === 'day') {
      return;
    }
    navigation.navigate('Calendar', { viewMode: 'day' });
    setTimeout(() => {
      calendarRef.current?.goToDate({ date, animatedDate: true });
    }, 100);
  };

  const _renderHalfLineCustom = useCallback(
    (width) => (
      <Svg>
        <Line
          x1="0"
          y1="1"
          x2={width}
          y2="1"
          stroke="#ececec"
          strokeDasharray={5}
          strokeWidth={2}
        />
      </Svg>
    ),
    []
  );

  return (
    <View style={[styles.container, { paddingBottom: safeBottom }]}>
      <TimelineCalendar
        ref={calendarRef}
        viewMode={route.params?.viewMode ?? 'week'}
        allowPinchToZoom
        allowDragToCreate
        events={events}
        unavailableHours={unavailableHours}
        // holidays={['2023-02-16', '2022-11-02']}
        onDragCreateEnd={_onDragCreateEnd}
        onLongPressEvent={_onLongPressEvent}
        selectedEvent={selectedEvent}
        onEndDragSelectedEvent={setSelectedEvent}
        renderCustomUnavailableItem={_renderCustomUnavailableItem}
        highlightDates={highlightDates}
        onPressDayNum={_onPressDayNum}
        onChange={_onChange}
        dragStep={15}
        reverseDayNumber={true}
        theme={{
          unavailableBackgroundColor: 'transparent',
          //Saturday style
          saturdayName: { color: '#94A3B8', paddingBottom: 5 },
          saturdayNumber: { color: 'black' },
          saturdayNumberContainer: { backgroundColor: 'white' },

          //Sunday style
          sundayName: { color: '#94A3B8', paddingBottom: 5 },
          sundayNumber: { color: 'black' },
          sundayNumberContainer: { backgroundColor: 'white' },

          //Today style
          todayStyle: {
            backgroundColor: 'rgba(195, 0, 82, 0.1)',
            borderRadius: 8,
          },
          todayName: { color: 'rgb(195, 0, 82)', paddingBottom: 5 },
          todayNumber: { color: 'rgb(195, 0, 82)' },
          todayNumberContainer: { backgroundColor: 'transparent' },

          //Normal style
          dayName: { color: '#94A3B8', paddingBottom: 5 },
          dayNumber: { color: 'black' },
          dayNumberContainer: { backgroundColor: 'white' },
          allowFontScaling: false,
          nowIndicatorApplyAll: true,
        }}
        locale="en"
        useHaptic
        renderHalfLineCustom={_renderHalfLineCustom}
        halfLineContainerStyle={styles.halfLineContainer}
      />
      {!!selectedEvent && _renderEditFooter()}
    </View>
  );
};

export default Calendar;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerRight: { marginRight: 16 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    height: 85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    height: 45,
    paddingHorizontal: 24,
    backgroundColor: '#1973E7',
    justifyContent: 'center',
    borderRadius: 24,
    marginHorizontal: 8,
    marginVertical: 8,
  },
  btnText: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  halfLineContainer: { backgroundColor: 'transparent' },
});
