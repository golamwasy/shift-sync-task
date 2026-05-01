import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import { useSmartInput, Task } from '@shift-sync/shared';
import { useState } from 'react';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
  
  const {
    inputText,
    handleInputChange,
    submitCommand,
    isLoading,
    error,
    parsedTask,
    reset
  } = useSmartInput(baseUrl);

  const confirmTask = () => {
    if (parsedTask) {
      const newTask: Task = {
        id: Math.random().toString(36).substring(7),
        title: parsedTask.title || 'Untitled',
        category: parsedTask.category || 'General',
        scheduledAt: parsedTask.scheduledAt ? new Date(parsedTask.scheduledAt) : undefined,
        status: 'todo',
        userId: 'mobile-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setTasks([newTask, ...tasks]);
      reset();
    }
  };

  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('work') || lower.includes('api')) return 'folder';
    if (lower.includes('meet') || lower.includes('call')) return 'calendar';
    return 'check-circle';
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 1)', 'rgba(248, 250, 252, 0.9)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Feather name={getCategoryIcon(item.category) as any} size={12} color="#64748b" />
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Feather name="square" size={20} color="#cbd5e1" />
      </View>
      <Text style={styles.taskTitle}>{item.title}</Text>
      
      <View style={styles.cardFooter}>
        {item.scheduledAt ? (
          <View style={styles.dateRow}>
            <Feather name="clock" size={14} color="#3b82f6" />
            <Text style={styles.taskDate}>
              {item.scheduledAt.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {item.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ) : (
          <Text style={styles.noDateText}>No time set</Text>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9']}
        style={StyleSheet.absoluteFillObject}
      />
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <LinearGradient
            colors={['#3b82f6', '#10b981']}
            style={StyleSheet.absoluteFillObject}
          />
          <Feather name="zap" size={16} color="#fff" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Shift-Sync</Text>
          <Text style={styles.headerSubtitle}>
            {tasks.length} {tasks.length === 1 ? 'Upcoming Task' : 'Upcoming Tasks'}
          </Text>
        </View>
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="inbox" size={32} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>You're all caught up!</Text>
            <Text style={styles.emptyText}>Use the command bar below to organize your day.</Text>
          </View>
        }
      />

      {/* Confirmation Dialog Overlay */}
      {parsedTask && (
        <View style={styles.overlayContainer}>
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmHeaderRow}>
              <View style={styles.confirmIconWrap}>
                <Feather name="check" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.confirmTitle}>Confirm Task</Text>
                <Text style={styles.confirmSubtitle}>Parsed by AI</Text>
              </View>
            </View>
            
            <View style={styles.confirmDetailsBox}>
              <Text style={styles.confirmLabel}>TITLE</Text>
              <Text style={styles.confirmValue}>{parsedTask.title}</Text>
              
              <View style={styles.confirmRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.confirmLabel}>CATEGORY</Text>
                  <View style={styles.confirmCategoryRow}>
                    <Feather name={getCategoryIcon(parsedTask.category || '') as any} size={14} color="#64748b" />
                    <Text style={styles.confirmValue}>{parsedTask.category}</Text>
                  </View>
                </View>
                {parsedTask.scheduledAt && (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.confirmLabel}>SCHEDULED</Text>
                    <Text style={[styles.confirmValue, { color: '#3b82f6' }]}>
                      {new Date(parsedTask.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.confirmActions}>
              <TouchableOpacity onPress={reset} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmTask} style={styles.confirmBtn}>
                <LinearGradient
                  colors={['#2563eb', '#3b82f6']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.confirmBtnText}>Create Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Command Bar */}
      <View style={styles.commandBarWrapper}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 1)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.commandBarInner}>
          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Feather name="terminal" size={16} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E.g. Call Alice tomorrow at 10am"
                placeholderTextColor="#94a3b8"
                value={inputText}
                onChangeText={handleInputChange}
                onSubmitEditing={submitCommand}
                returnKeyType="send"
              />
            </View>
            <TouchableOpacity 
              style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]} 
              onPress={submitCommand}
              disabled={!inputText.trim() || isLoading}
            >
              <LinearGradient
                colors={['#2563eb', '#3b82f6']}
                style={StyleSheet.absoluteFillObject}
              />
              {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="arrow-up" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  listContainer: {
    padding: 24,
    paddingBottom: 120,
  },
  taskCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  taskTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 24,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskDate: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
  noDateText: {
    color: '#94a3b8',
    fontSize: 13,
    fontStyle: 'italic',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
    maxWidth: '80%',
    lineHeight: 20,
  },
  commandBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  commandBarInner: {
    padding: 24,
    paddingTop: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 54,
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '500',
  },
  sendBtn: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmOverlay: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  confirmIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
  },
  confirmSubtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  confirmDetailsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  confirmLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  confirmValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 16,
  },
  confirmCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '700',
  },
  confirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
});
