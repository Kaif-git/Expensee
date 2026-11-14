import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AnimatedPressable } from '@/components/animated-pressable';
import { CATEGORIES, Category, Expense, formatMoney, useFinance } from '@/lib/finance';

const ink = '#111111';
const muted = '#414141';
const pale = '#FFF4D2';
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function HomeScreen() {
  const { expenses, budget, currency, addExpense, deleteExpense, ready, setBudget } = useFinance();
  const [modal, setModal] = useState<'expense' | 'budget' | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const [period, setPeriod] = useState(new Date());
  const [query, setQuery] = useState('');

  const monthKey = `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, '0')}`;
  const monthExpenses = useMemo(() => expenses.filter((item) => item.date.startsWith(monthKey)), [expenses, monthKey]);
  const monthTotal = monthExpenses.reduce((sum, item) => sum + item.amount, 0);
  const filtered = useMemo(() => monthExpenses.filter((item) => `${item.title} ${item.category} ${item.note ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => b.date.localeCompare(a.date)), [monthExpenses, query]);
  const monthName = period.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const progress = budget > 0 ? Math.min(monthTotal / budget, 1) : 0;
  const animatedProgress = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({ width: `${Math.max(1, animatedProgress.value * 100)}%` }));

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 650 });
  }, [animatedProgress, progress]);

  const startExpense = (expense?: Expense) => {
    setEditing(expense ?? null);
    setTitle(expense?.title ?? ''); setAmount(expense ? String(expense.amount) : '');
    setCategory(expense?.category ?? 'Food'); setDate(expense?.date ?? today()); setNote(expense?.note ?? '');
    setModal('expense');
  };
  const saveExpense = () => {
    const numeric = Number(amount.replace(',', '.'));
    if (!title.trim()) return Alert.alert('Add a description', 'Enter what you spent money on.');
    if (!Number.isFinite(numeric) || numeric <= 0) return Alert.alert('Check the amount', 'Enter an amount greater than zero.');
    const [year, month, day] = date.split('-').map(Number);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && new Date(year, month - 1, day).getFullYear() === year && new Date(year, month - 1, day).getMonth() === month - 1 && new Date(year, month - 1, day).getDate() === day;
    if (!validDate) return Alert.alert('Check the date', 'Enter a real date in YYYY-MM-DD format.');
    addExpense({ title: title.trim(), amount: numeric, category, date, note: note.trim() || undefined }, editing?.id);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setModal(null);
  };
  const removeExpense = (expense: Expense) => Alert.alert('Delete expense?', `Remove “${expense.title}” from your expenses?`, [
    { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { deleteExpense(expense.id); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined); } },
  ]);
  const shiftMonth = (delta: number) => {
    setPeriod((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(400)} style={styles.topline}>
          <View><Text style={styles.eyebrow}>YOUR MONEY, IN FOCUS</Text><Text style={styles.heading}>Overview</Text></View>
          <AnimatedPressable accessibilityRole="button" accessibilityLabel="Set monthly budget" onPress={() => { setBudgetInput(String(budget)); setModal('budget'); }} style={styles.avatar}><Text style={styles.avatarText}>✦</Text></AnimatedPressable>
        </Animated.View>

        <View style={styles.monthNav}>
          <AnimatedPressable onPress={() => shiftMonth(-1)} style={styles.arrow} haptic="selection"><Text style={styles.arrowText}>‹</Text></AnimatedPressable>
          <Text style={styles.monthLabel}>{monthName}</Text>
          <AnimatedPressable onPress={() => shiftMonth(1)} style={styles.arrow} haptic="selection"><Text style={styles.arrowText}>›</Text></AnimatedPressable>
        </View>

        <Animated.View entering={FadeInDown.delay(70).duration(500)} style={styles.balanceCard}>
          <View style={styles.balanceTop}><Text style={styles.cardLabel}>TOTAL SPENT</Text><View style={styles.monthPill}><Text style={styles.monthPillText}>↗  {monthExpenses.length} {monthExpenses.length === 1 ? 'expense' : 'expenses'}</Text></View></View>
          <Text style={styles.total}>{formatMoney(monthTotal, currency)}</Text>
          <View style={styles.divider} />
          <View style={styles.budgetRow}><View><Text style={styles.budgetCaption}>Monthly budget</Text><Text style={styles.budgetAmount}>{formatMoney(budget, currency)}</Text></View><Text style={styles.leftAmount}>{formatMoney(Math.max(0, budget - monthTotal), currency)} left</Text></View>
          <View style={styles.progressTrack}><Animated.View style={[styles.progressFill, progressStyle, { backgroundColor: monthTotal > budget ? '#FF4D79' : '#89D7FF' }]} /></View>
          <Text style={styles.progressHint}>{monthTotal > budget ? `You’re ${formatMoney(monthTotal - budget, currency)} over budget` : `${Math.round(progress * 100)}% of your monthly budget used`}</Text>
        </Animated.View>

        <View style={styles.quickRow}>
          <Animated.View entering={FadeInDown.delay(130).duration(450)} style={styles.quickCard}><View style={[styles.quickIcon, { backgroundColor: '#FFE45C' }]}><Text>🧾</Text></View><Text style={styles.quickLabel}>Transactions</Text><Text style={styles.quickValue}>{monthExpenses.length}</Text></Animated.View>
          <Animated.View entering={FadeInDown.delay(190).duration(450)} style={styles.quickCard}><View style={[styles.quickIcon, { backgroundColor: '#FF4D79' }]}><Text>📊</Text></View><Text style={styles.quickLabel}>Daily average</Text><Text style={styles.quickValue}>{formatMoney(monthTotal / Math.max(1, new Date().getMonth() === period.getMonth() && new Date().getFullYear() === period.getFullYear() ? new Date().getDate() : 30), currency)}</Text></Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(230).duration(450)} style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Recent expenses</Text><Text style={styles.sectionSub}>Your spending activity</Text></View><AnimatedPressable onPress={() => startExpense()} style={styles.addButton}><Text style={styles.addPlus}>＋</Text><Text style={styles.addText}>Add</Text></AnimatedPressable></Animated.View>
        {monthExpenses.length > 0 && <TextInput value={query} onChangeText={setQuery} placeholder="Search expenses" placeholderTextColor="#A0AAA5" style={styles.search} />}
        {!ready ? <View style={styles.empty}><Text style={styles.emptyTitle}>Loading your expenses…</Text></View> : filtered.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyEmoji}>{monthExpenses.length === 0 ? '🌱' : '🔎'}</Text><Text style={styles.emptyTitle}>{monthExpenses.length === 0 ? 'A fresh start' : 'No matches found'}</Text><Text style={styles.emptyBody}>{monthExpenses.length === 0 ? 'Add your first expense to start seeing where your money goes.' : 'Try a different search or check another month.'}</Text>{monthExpenses.length === 0 && <AnimatedPressable onPress={() => startExpense()} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Add your first expense</Text></AnimatedPressable>}</View>
        ) : filtered.slice(0, 30).map((expense, index) => {
          const meta = CATEGORIES.find((item) => item.name === expense.category) ?? CATEGORIES[CATEGORIES.length - 1];
          return <Animated.View entering={FadeInDown.delay(Math.min(300, 60 * index)).duration(400)} key={expense.id}>
            <AnimatedPressable onPress={() => startExpense(expense)} onLongPress={() => removeExpense(expense)} style={styles.expenseRow}>
            <View style={[styles.categoryIcon, { backgroundColor: `${meta.color}18` }]}><Text style={styles.categoryEmoji}>{meta.icon}</Text></View>
            <View style={styles.expenseInfo}><Text numberOfLines={1} style={styles.expenseTitle}>{expense.title}</Text><Text style={styles.expenseMeta}>{expense.category} · {new Date(`${expense.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text></View>
            <View style={styles.expenseRight}><Text style={styles.expenseAmount}>−{formatMoney(expense.amount, currency)}</Text><Pressable onPress={() => removeExpense(expense)} hitSlop={8}><Text style={styles.more}>•••</Text></Pressable></View>
            </AnimatedPressable>
          </Animated.View>;
        })}
        {filtered.length > 30 && <Text style={styles.limitHint}>Showing the 30 most recent matches.</Text>}
        <Text style={styles.privacy}>🔒  Your data stays on this device</Text>
      </ScrollView>

      <Modal visible={modal !== null} animationType="slide" transparent onRequestClose={() => setModal(null)}>
        <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.scrim} onPress={() => setModal(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            {modal === 'expense' ? <>
              <View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>{editing ? 'Edit expense' : 'New expense'}</Text><Text style={styles.sheetSubtitle}>Keep track of every little thing.</Text></View><Pressable onPress={() => setModal(null)} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>DESCRIPTION</Text><TextInput autoFocus value={title} onChangeText={setTitle} placeholder="e.g. Coffee with Alex" placeholderTextColor="#A3ADA7" style={styles.input} maxLength={60} />
                <Text style={styles.inputLabel}>AMOUNT ({currency})</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#A3ADA7" style={styles.input} />
                <Text style={styles.inputLabel}>CATEGORY</Text><View style={styles.categoryGrid}>{CATEGORIES.map((item) => <AnimatedPressable key={item.name} haptic="selection" onPress={() => setCategory(item.name)} style={[styles.categoryChip, category === item.name && styles.categoryChipActive]}><Text>{item.icon}</Text><Text style={[styles.categoryChipText, category === item.name && styles.categoryChipTextActive]}>{item.name}</Text></AnimatedPressable>)}</View>
                <Text style={styles.inputLabel}>DATE · YYYY-MM-DD</Text><TextInput value={date} onChangeText={setDate} placeholder="2026-01-30" placeholderTextColor="#A3ADA7" style={styles.input} maxLength={10} />
                <Text style={styles.inputLabel}>NOTE · OPTIONAL</Text><TextInput value={note} onChangeText={setNote} placeholder="Add a little detail" placeholderTextColor="#A3ADA7" style={styles.input} maxLength={120} />
              </ScrollView>
              <AnimatedPressable onPress={saveExpense} style={styles.submit}><Text style={styles.submitText}>{editing ? 'Save changes' : 'Save expense'}</Text></AnimatedPressable>
            </> : <>
              <View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>Monthly budget</Text><Text style={styles.sheetSubtitle}>Set a spending goal for each month.</Text></View><Pressable onPress={() => setModal(null)} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
              <Text style={styles.inputLabel}>BUDGET AMOUNT ({currency})</Text><TextInput autoFocus value={budgetInput} onChangeText={setBudgetInput} keyboardType="decimal-pad" placeholder="1500" placeholderTextColor="#A3ADA7" style={styles.input} />
              <AnimatedPressable onPress={() => { const value = Number(budgetInput.replace(',', '.')); if (!Number.isFinite(value) || value <= 0) return Alert.alert('Check your budget', 'Enter an amount greater than zero.'); setBudget(value); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); setModal(null); }} style={styles.submit}><Text style={styles.submitText}>Save budget</Text></AnimatedPressable>
            </>}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: pale }, page: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 15, paddingBottom: 36 },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 21 }, eyebrow: { fontSize: 10, color: ink, fontWeight: '900', letterSpacing: 1.6 }, heading: { color: ink, fontSize: 32, fontWeight: '900', letterSpacing: -0.7, marginTop: 4 }, avatar: { width: 44, height: 44, borderRadius: 4, borderWidth: 2, borderColor: ink, backgroundColor: '#FF4D79', alignItems: 'center', justifyContent: 'center', shadowColor: ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }, avatarText: { fontSize: 20, color: ink },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 14 }, arrow: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: ink }, arrowText: { color: ink, fontSize: 26, lineHeight: 28 }, monthLabel: { color: ink, fontSize: 14, fontWeight: '900', minWidth: 130, textAlign: 'center' },
  balanceCard: { backgroundColor: '#FFE45C', borderWidth: 2, borderColor: ink, borderRadius: 4, padding: 22, shadowColor: ink, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 }, balanceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cardLabel: { color: ink, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }, monthPill: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: ink, borderRadius: 2, paddingVertical: 6, paddingHorizontal: 9 }, monthPillText: { color: ink, fontSize: 10, fontWeight: '900' }, total: { color: ink, fontWeight: '900', fontSize: 38, letterSpacing: -1.2, marginTop: 12 }, divider: { height: 2, backgroundColor: ink, marginVertical: 17 }, budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }, budgetCaption: { color: ink, fontSize: 11, fontWeight: '700' }, budgetAmount: { color: ink, fontSize: 15, fontWeight: '900', marginTop: 4 }, leftAmount: { color: ink, fontSize: 11, fontWeight: '900' }, progressTrack: { height: 12, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: ink, borderRadius: 0, marginTop: 14, overflow: 'hidden' }, progressFill: { height: 8, borderRadius: 0 }, progressHint: { color: ink, fontSize: 10, fontWeight: '800', marginTop: 8 },
  quickRow: { flexDirection: 'row', gap: 12, marginTop: 17 }, quickCard: { flex: 1, minHeight: 105, borderWidth: 2, borderColor: ink, borderRadius: 3, padding: 14, backgroundColor: '#FFFFFF', shadowColor: ink, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 }, quickIcon: { width: 31, height: 31, borderRadius: 2, borderWidth: 1.5, borderColor: ink, backgroundColor: '#89D7FF', alignItems: 'center', justifyContent: 'center' }, quickLabel: { color: muted, fontSize: 10, fontWeight: '700', marginTop: 9 }, quickValue: { color: ink, fontSize: 16, fontWeight: '900', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 13 }, sectionTitle: { color: ink, fontSize: 20, fontWeight: '900' }, sectionSub: { color: muted, fontSize: 11, fontWeight: '600', marginTop: 4 }, addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#89D7FF', borderWidth: 2, borderColor: ink, borderRadius: 3, paddingHorizontal: 12, paddingVertical: 8, shadowColor: ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }, addPlus: { color: ink, fontSize: 17, fontWeight: '900' }, addText: { color: ink, fontWeight: '900', fontSize: 12 }, search: { height: 44, backgroundColor: '#FFF', borderWidth: 2, borderColor: ink, borderRadius: 3, paddingHorizontal: 14, color: ink, marginBottom: 11, fontSize: 13 },
  empty: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: ink, borderRadius: 3, paddingVertical: 29, paddingHorizontal: 22, alignItems: 'center', marginTop: 2, shadowColor: ink, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 }, emptyEmoji: { fontSize: 30, marginBottom: 10 }, emptyTitle: { color: ink, fontSize: 15, fontWeight: '900', textAlign: 'center' }, emptyBody: { color: muted, fontSize: 12, fontWeight: '600', lineHeight: 18, textAlign: 'center', marginTop: 7, maxWidth: 240 }, emptyButton: { backgroundColor: '#FF4D79', borderWidth: 2, borderColor: ink, borderRadius: 3, paddingVertical: 11, paddingHorizontal: 17, marginTop: 17 }, emptyButtonText: { color: ink, fontSize: 12, fontWeight: '900' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 2, borderColor: ink, paddingHorizontal: 13, paddingVertical: 12, borderRadius: 3, marginBottom: 10, shadowColor: ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }, categoryIcon: { width: 43, height: 43, borderWidth: 1.5, borderColor: ink, borderRadius: 3, backgroundColor: '#FFE45C', alignItems: 'center', justifyContent: 'center' }, categoryEmoji: { fontSize: 19 }, expenseInfo: { flex: 1, marginLeft: 11 }, expenseTitle: { color: ink, fontWeight: '900', fontSize: 13 }, expenseMeta: { color: muted, fontSize: 10, fontWeight: '600', marginTop: 4 }, expenseRight: { alignItems: 'flex-end', gap: 6 }, expenseAmount: { color: ink, fontWeight: '900', fontSize: 12 }, more: { color: ink, fontSize: 9, letterSpacing: 1 }, limitHint: { textAlign: 'center', color: muted, fontSize: 11, marginTop: 4 }, privacy: { color: muted, fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 25 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, scrim: { ...StyleSheet.absoluteFill, backgroundColor: '#111111AA' }, sheet: { backgroundColor: pale, borderTopWidth: 3, borderLeftWidth: 3, borderRightWidth: 3, borderColor: ink, borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingHorizontal: 22, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 20, maxHeight: '92%' }, sheetHandle: { alignSelf: 'center', height: 5, width: 42, backgroundColor: ink, marginBottom: 18 }, sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }, sheetTitle: { fontSize: 22, color: ink, fontWeight: '900' }, sheetSubtitle: { color: muted, fontSize: 11, fontWeight: '600', marginTop: 4 }, close: { width: 36, height: 36, borderWidth: 2, borderColor: ink, borderRadius: 2, backgroundColor: '#FF4D79', alignItems: 'center', justifyContent: 'center' }, closeText: { color: ink, fontSize: 22, lineHeight: 24, fontWeight: '900' }, inputLabel: { color: ink, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 7, marginTop: 4 }, input: { height: 48, borderWidth: 2, borderColor: ink, borderRadius: 2, paddingHorizontal: 13, backgroundColor: '#FFF', color: ink, fontSize: 13, marginBottom: 15 }, categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }, categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 2, borderColor: ink, borderRadius: 2, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#FFF' }, categoryChipActive: { borderColor: ink, backgroundColor: '#FF4D79' }, categoryChipText: { color: ink, fontSize: 10, fontWeight: '800' }, categoryChipTextActive: { color: ink }, submit: { height: 50, borderWidth: 2, borderColor: ink, borderRadius: 3, backgroundColor: '#FF4D79', alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: ink, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 }, submitText: { color: ink, fontSize: 14, fontWeight: '900' },
});
