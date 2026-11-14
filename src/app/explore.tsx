import React, { useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedPressable } from '@/components/animated-pressable';
import { CATEGORIES, CURRENCIES, currencySymbol, formatMoney, useFinance } from '@/lib/finance';

const ink = '#111111';
const muted = '#414141';
const pale = '#FFF4D2';

export default function InsightsScreen() {
  const { expenses, currency, setCurrency } = useFinance();
  const [period, setPeriod] = useState(new Date());
  const monthKey = `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, '0')}`;
  const monthExpenses = useMemo(() => expenses.filter((expense) => expense.date.startsWith(monthKey)), [expenses, monthKey]);
  const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categories = CATEGORIES.map((category) => ({
    ...category,
    amount: monthExpenses.filter((expense) => expense.category === category.name).reduce((sum, expense) => sum + expense.amount, 0),
  })).filter((category) => category.amount > 0).sort((a, b) => b.amount - a.amount);
  const average = total / Math.max(1, new Date().getMonth() === period.getMonth() && new Date().getFullYear() === period.getFullYear() ? new Date().getDate() : 30);
  const monthName = period.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <StatusBar barStyle="dark-content" />
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>SPENDING SNAPSHOT</Text><Text style={styles.heading}>Insights</Text>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.monthNav}>
        <AnimatedPressable haptic="selection" onPress={() => setPeriod((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} style={styles.arrow}><Text style={styles.arrowText}>‹</Text></AnimatedPressable>
        <Text style={styles.monthLabel}>{monthName}</Text>
        <AnimatedPressable haptic="selection" onPress={() => setPeriod((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} style={styles.arrow}><Text style={styles.arrowText}>›</Text></AnimatedPressable>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>TOTAL THIS MONTH</Text><Text style={styles.total}>{formatMoney(total, currency)}</Text>
        <View style={styles.summaryFoot}><Text style={styles.summaryFootText}>{monthExpenses.length} transactions</Text><Text style={styles.summaryFootText}>Avg. {formatMoney(average, currency)} / day</Text></View>
      </Animated.View>
      <View style={styles.sectionTop}><View><Text style={styles.sectionTitle}>By category</Text><Text style={styles.sectionSub}>Where your money went</Text></View><Text style={styles.count}>{categories.length} {categories.length === 1 ? 'category' : 'categories'}</Text></View>
      {categories.length === 0 ? <View style={styles.empty}><Text style={styles.emptyEmoji}>📈</Text><Text style={styles.emptyTitle}>Your insights are on the way</Text><Text style={styles.emptyBody}>Add expenses to see a breakdown of your spending here.</Text></View> : <View style={styles.breakdown}>
        {categories.map((category, index) => {
          const percentage = total > 0 ? category.amount / total : 0;
          return <Animated.View entering={FadeInDown.delay(Math.min(300, 60 * index)).duration(400)} key={category.name} style={styles.categoryItem}>
            <View style={styles.categoryTop}><View style={styles.categoryName}><View style={[styles.icon, { backgroundColor: `${category.color}1A` }]}><Text>{category.icon}</Text></View><View><Text style={styles.name}>{category.name}</Text><Text style={styles.percent}>{Math.round(percentage * 100)}% of spending</Text></View></View><Text style={styles.amount}>{formatMoney(category.amount, currency)}</Text></View>
            <View style={styles.track}><View style={[styles.fill, { width: `${percentage * 100}%`, backgroundColor: category.color }]} /></View>
          </Animated.View>;
        })}
      </View>}
      <Animated.View entering={FadeInDown.delay(200).duration(450)} style={styles.currencySection}><Text style={styles.sectionTitle}>Display currency</Text><Text style={styles.sectionSub}>Amounts are saved as entered; changing currency only changes the symbol.</Text><View style={styles.currencyGrid}>{CURRENCIES.map((code) => <AnimatedPressable key={code} haptic="selection" onPress={() => setCurrency(code)} style={[styles.currencyChip, currency === code && styles.currencyChipSelected]}><Text style={[styles.currencySymbol, currency === code && styles.selectedText]}>{currencySymbol(code)}</Text><Text style={[styles.currencyCode, currency === code && styles.selectedText]}>{code}</Text></AnimatedPressable>)}</View></Animated.View>
      <View style={styles.tip}><Text style={styles.tipEmoji}>💡</Text><View style={{ flex: 1 }}><Text style={styles.tipTitle}>A little goes a long way</Text><Text style={styles.tipText}>Check in regularly to spot patterns and make your budget work for you.</Text></View></View>
      <Text style={styles.privacy}>🔒  Your data stays on this device</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: pale }, page: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 20, paddingBottom: 36 },
  eyebrow: { color: ink, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, heading: { color: ink, fontSize: 32, fontWeight: '900', letterSpacing: -0.7, marginTop: 4 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 13, marginBottom: 14 }, arrow: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderWidth: 2, borderColor: ink }, arrowText: { color: ink, fontSize: 26, lineHeight: 28 }, monthLabel: { color: ink, fontSize: 14, fontWeight: '900', minWidth: 130, textAlign: 'center' },
  summaryCard: { backgroundColor: '#FFE45C', borderWidth: 2, borderColor: ink, borderRadius: 3, padding: 21, shadowColor: ink, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 }, summaryLabel: { color: ink, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, total: { color: ink, fontSize: 36, fontWeight: '900', letterSpacing: -1, marginTop: 10 }, summaryFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, borderTopWidth: 2, borderTopColor: ink, paddingTop: 12 }, summaryFootText: { color: ink, fontSize: 11, fontWeight: '800' },
  sectionTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 28, marginBottom: 13 }, sectionTitle: { color: ink, fontSize: 19, fontWeight: '900' }, sectionSub: { color: muted, fontSize: 11, fontWeight: '600', lineHeight: 17, marginTop: 4 }, count: { color: ink, fontSize: 10, fontWeight: '800', paddingBottom: 2 }, breakdown: { backgroundColor: '#FFF', borderWidth: 2, borderColor: ink, borderRadius: 3, paddingHorizontal: 15, shadowColor: ink, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 }, categoryItem: { paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: ink }, categoryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, categoryName: { flexDirection: 'row', alignItems: 'center', gap: 10 }, icon: { width: 39, height: 39, borderWidth: 1.5, borderColor: ink, borderRadius: 3, backgroundColor: '#89D7FF', alignItems: 'center', justifyContent: 'center' }, name: { color: ink, fontSize: 12, fontWeight: '900' }, percent: { color: muted, fontSize: 10, fontWeight: '600', marginTop: 3 }, amount: { color: ink, fontSize: 12, fontWeight: '900' }, track: { height: 10, backgroundColor: '#FFF4D2', borderWidth: 1.5, borderColor: ink, borderRadius: 0, overflow: 'hidden' }, fill: { height: 7, borderRadius: 0 },
  empty: { backgroundColor: '#FFF', borderWidth: 2, borderColor: ink, borderRadius: 3, paddingVertical: 27, paddingHorizontal: 20, alignItems: 'center', shadowColor: ink, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 }, emptyEmoji: { fontSize: 28, marginBottom: 10 }, emptyTitle: { color: ink, fontSize: 14, fontWeight: '900', textAlign: 'center' }, emptyBody: { color: muted, fontSize: 11, fontWeight: '600', lineHeight: 17, textAlign: 'center', marginTop: 6, maxWidth: 240 },
  currencySection: { marginTop: 28 }, currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }, currencyChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 2, backgroundColor: '#FFF', borderWidth: 2, borderColor: ink }, currencyChipSelected: { backgroundColor: '#FF4D79', borderColor: ink }, currencySymbol: { color: ink, fontWeight: '900', fontSize: 13 }, currencyCode: { color: ink, fontWeight: '800', fontSize: 10 }, selectedText: { color: ink }, tip: { flexDirection: 'row', gap: 11, backgroundColor: '#89D7FF', borderWidth: 2, borderColor: ink, borderRadius: 3, padding: 15, marginTop: 25, shadowColor: ink, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 }, tipEmoji: { fontSize: 21 }, tipTitle: { color: ink, fontSize: 12, fontWeight: '900' }, tipText: { color: ink, fontSize: 10, fontWeight: '600', lineHeight: 16, marginTop: 4 }, privacy: { color: muted, fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 25 },
});
