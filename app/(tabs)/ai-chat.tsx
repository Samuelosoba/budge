import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useBudget } from '@/contexts/BudgetContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/contexts/ApiContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Send, Bot, User, Crown, TrendingUp, TrendingDown, DollarSign } from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  suggestions?: string[];
}

export default function AIChatScreen() {
  const { getTotalIncome, getTotalExpenses, getBalance } = useBudget();
  const { user, upgradeToPro, token } = useAuth();
  const { post } = useApi();
  const { theme, isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Initial greeting message
    const initialMessage: Message = {
      id: '1',
      text: `Hi ${user?.name || 'there'}! I'm your AI financial assistant. I can help you understand your spending patterns, create budgets, and provide personalized financial advice. What would you like to know about your finances?`,
      isBot: true,
      timestamp: new Date(),
      suggestions: [
        'How am I doing with my budget?',
        'What category do I spend most on?',
        'Give me savings tips',
        'Analyze my spending trends'
      ]
    };
    setMessages([initialMessage]);
  }, [user?.name]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      if (!token) {
        throw new Error('Please log in to use the AI assistant');
      }

      const response = await post('/ai-chat/chat', { message: textToSend }, token);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('AI Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const renderMessage = (message: Message) => {
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        message.isBot ? styles.botMessage : styles.userMessage
      ]}>
        <View style={styles.messageHeader}>
          {message.isBot ? (
            <Bot size={20} color={theme.primary} />
          ) : (
            <User size={20} color="white" />
          )}
          <Text style={[
            styles.messageSender,
            { color: message.isBot ? theme.primary : 'white' }
          ]}>
            {message.isBot ? 'AI Assistant' : 'You'}
          </Text>
        </View>
        
        <Text style={[
          styles.messageText,
          { color: message.isBot ? theme.text : 'white' }
        ]}>
          {message.text}
        </Text>
        
        <Text style={[
          styles.messageTime,
          { color: message.isBot ? theme.textTertiary : 'rgba(255, 255, 255, 0.7)' }
        ]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>

        {message.suggestions && (
          <View style={styles.suggestions}>
            {message.suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.suggestionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => sendSuggestion(suggestion)}
              >
                <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const styles = createStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Bot size={32} color={theme.primary} />
            <View>
              <Text style={styles.headerTitle}>AI Assistant</Text>
              <Text style={styles.headerSubtitle}>Your financial advisor</Text>
            </View>
          </View>
          {user?.isPro && (
            <View style={styles.proBadge}>
              <Crown size={16} color={theme.primary} />
              <Text style={[styles.proBadgeText, { color: theme.primary }]}>Pro</Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <TrendingUp size={16} color="#10B981" />
            <Text style={[styles.statText, { color: theme.text }]}>{formatCurrency(getTotalIncome())}</Text>
          </View>
          <View style={styles.statItem}>
            <TrendingDown size={16} color="#EF4444" />
            <Text style={[styles.statText, { color: theme.text }]}>{formatCurrency(getTotalExpenses())}</Text>
          </View>
          <View style={styles.statItem}>
            <DollarSign size={16} color={theme.textSecondary} />
            <Text style={[styles.statText, { color: theme.text }]}>{formatCurrency(getBalance())}</Text>
          </View>
        </View>

        {/* Messages */}
        <View style={styles.messagesContainer}>
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map(renderMessage)}
            
            {isTyping && (
              <View style={[styles.messageContainer, styles.botMessage]}>
                <View style={styles.messageHeader}>
                  <Bot size={20} color={theme.primary} />
                  <Text style={[styles.messageSender, { color: theme.primary }]}>
                    AI Assistant
                  </Text>
                </View>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, { backgroundColor: theme.primary }]} />
                  <View style={[styles.typingDot, { backgroundColor: theme.primary }]} />
                  <View style={[styles.typingDot, { backgroundColor: theme.primary }]} />
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Pro Upgrade Banner */}
        {!user?.isPro && (
          <TouchableOpacity style={styles.proUpgradeBanner} onPress={upgradeToPro}>
            <View style={[styles.proUpgradeGradient, { backgroundColor: theme.primary }]}>
              <Crown size={20} color={isDark ? '#1A1A1A' : 'white'} />
              <Text style={[styles.proUpgradeText, { color: isDark ? '#1A1A1A' : 'white' }]}>
                Upgrade to Pro for advanced AI insights
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <TextInput
              style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
              placeholder="Ask me about your finances..."
              placeholderTextColor={theme.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { 
                  backgroundColor: theme.primary,
                  opacity: inputText.trim() ? 1 : 0.5 
                }
              ]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim()}
            >
              <Send size={20} color={isDark ? '#1A1A1A' : 'white'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    paddingBottom: 120, // Extra padding for mobile navigation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60, // Safe area padding
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.text,
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.textSecondary,
    marginLeft: 12,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  proBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.card,
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 400,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.card,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.primary,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageSender: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  suggestions: {
    marginTop: 12,
    gap: 8,
  },
  suggestionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  proUpgradeBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  proUpgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderRadius: 12,
  },
  proUpgradeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});