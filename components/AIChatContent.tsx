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
  Dimensions,
} from 'react-native';
import { useBudget } from '@/contexts/BudgetContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/contexts/ApiContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Send, Bot, User, Crown, TrendingUp, TrendingDown, DollarSign, ChartBar as BarChart3, ChartPie as PieChart, Activity } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  suggestions?: string[];
  chartData?: any;
}

export default function AIChatContent() {
  const { getTotalIncome, getTotalExpenses, getBalance } = useBudget();
  const { user, upgradeToPro, token } = useAuth();
  const { post, get } = useApi();
  const { theme, isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasOpenAI, setHasOpenAI] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Initial greeting message with enhanced capabilities
    const initialMessage: Message = {
      id: '1',
      text: `Hi ${user?.name || 'there'}! I'm your AI financial assistant powered by advanced analytics. I can help you understand your spending patterns, create budgets, provide personalized financial advice, and generate visual insights from your data. What would you like to explore about your finances?`,
      isBot: true,
      timestamp: new Date(),
      suggestions: [
        'Show me my spending breakdown',
        'How am I doing with my budget?',
        'Give me personalized savings tips',
        'Analyze my monthly trends',
        'What are my top expense categories?'
      ]
    };
    setMessages([initialMessage]);
    
    // Check if OpenAI is available
    checkOpenAIStatus();
  }, [user?.name]);

  const checkOpenAIStatus = async () => {
    try {
      if (token) {
        const response = await get('/ai-chat/insights', token);
        setHasOpenAI(true);
      }
    } catch (error) {
      console.log('OpenAI not available, using fallback responses');
      setHasOpenAI(false);
    }
  };

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

      // Enhanced API call with better error handling
      const response = await post('/ai-chat/chat', { message: textToSend }, token);
      
      // Get insights for chart data if available
      let chartData = null;
      try {
        const insightsResponse = await get('/ai-chat/insights', token);
        chartData = insightsResponse.chartData;
      } catch (error) {
        console.log('Chart data not available');
      }
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isBot: true,
        timestamp: new Date(),
        chartData: chartData,
      };

      // Update OpenAI status
      if (response.hasOpenAI !== undefined) {
        setHasOpenAI(response.hasOpenAI);
      }

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('AI Chat error:', error);
      
      // Enhanced fallback with better error messages
      let errorMessage = "I'm here to help with your finances! ";
      
      if (error instanceof Error) {
        if (error.message.includes('log in')) {
          errorMessage = 'Please log in to use the AI assistant.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Connection issue. Please check your internet and try again.';
        } else {
          errorMessage += 'I encountered a temporary issue, but I can still help you with basic financial insights.';
        }
      }

      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        isBot: true,
        timestamp: new Date(),
        suggestions: [
          'Show my current balance',
          'What\'s my spending this month?',
          'Give me savings tips',
          'Help with budgeting'
        ]
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const renderChartData = (chartData: any) => {
    if (!chartData || !chartData.pieChart) return null;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <PieChart size={16} color={theme.primary} />
          <Text style={[styles.chartTitle, { color: theme.text }]}>Spending Breakdown</Text>
        </View>
        <View style={styles.pieChart}>
          {chartData.pieChart.slice(0, 5).map((item: any, index: number) => (
            <View key={index} style={styles.chartItem}>
              <View style={[styles.chartColor, { backgroundColor: item.color }]} />
              <Text style={[styles.chartLabel, { color: theme.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.chartValue, { color: theme.textSecondary }]}>
                {item.percentage.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
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
          {message.isBot && hasOpenAI && (
            <View style={styles.aiPoweredBadge}>
              <Text style={[styles.aiPoweredText, { color: theme.primary }]}>GPT-4</Text>
            </View>
          )}
        </View>
        
        <Text style={[
          styles.messageText,
          { color: message.isBot ? theme.text : 'white' }
        ]}>
          {message.text}
        </Text>

        {/* Render chart data if available */}
        {message.chartData && renderChartData(message.chartData)}
        
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
              <Text style={styles.headerSubtitle}>
                {hasOpenAI ? 'Powered by GPT-4' : 'Smart Financial Advisor'}
              </Text>
            </View>
          </View>
          {user?.isPro && (
            <View style={styles.proBadge}>
              <Crown size={16} color={theme.primary} />
              <Text style={[styles.proBadgeText, { color: theme.primary }]}>Pro</Text>
            </View>
          )}
        </View>

        {/* Enhanced Quick Stats */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <TrendingUp size={16} color="#10B981" />
            <Text style={[styles.statText, { color: theme.text }]}>{formatCurrency(getTotalIncome())}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Income</Text>
          </View>
          <View style={styles.statItem}>
            <TrendingDown size={16} color="#EF4444" />
            <Text style={[styles.statText, { color: theme.text }]}>{formatCurrency(getTotalExpenses())}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Expenses</Text>
          </View>
          <View style={styles.statItem}>
            <DollarSign size={16} color={theme.textSecondary} />
            <Text style={[styles.statText, { color: theme.text }]}>{formatCurrency(getBalance())}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Balance</Text>
          </View>
        </View>

        {/* AI Capabilities Banner */}
        <View style={[styles.capabilitiesBanner, { backgroundColor: theme.card }]}>
          <View style={styles.capabilityItem}>
            <BarChart3 size={20} color={theme.primary} />
            <Text style={[styles.capabilityText, { color: theme.textSecondary }]}>Analytics</Text>
          </View>
          <View style={styles.capabilityItem}>
            <PieChart size={20} color={theme.primary} />
            <Text style={[styles.capabilityText, { color: theme.textSecondary }]}>Charts</Text>
          </View>
          <View style={styles.capabilityItem}>
            <Activity size={20} color={theme.primary} />
            <Text style={[styles.capabilityText, { color: theme.textSecondary }]}>Insights</Text>
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
    fontSize: Math.min(width * 0.06, 24),
    fontFamily: 'Inter-Bold',
    color: theme.text,
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: Math.min(width * 0.035, 14),
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
    fontSize: Math.min(width * 0.03, 12),
    fontFamily: 'Inter-Bold',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.card,
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-SemiBold',
  },
  statLabel: {
    fontSize: Math.min(width * 0.03, 12),
    fontFamily: 'Inter-Medium',
  },
  capabilitiesBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  capabilityItem: {
    alignItems: 'center',
    gap: 4,
  },
  capabilityText: {
    fontSize: Math.min(width * 0.03, 12),
    fontFamily: 'Inter-Medium',
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
    fontSize: Math.min(width * 0.03, 12),
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  aiPoweredBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  aiPoweredText: {
    fontSize: Math.min(width * 0.025, 10),
    fontFamily: 'Inter-Bold',
  },
  messageText: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
  },
  messageTime: {
    fontSize: Math.min(width * 0.028, 11),
    fontFamily: 'Inter-Regular',
  },
  chartContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: theme.surface,
    borderRadius: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: Math.min(width * 0.035, 14),
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  pieChart: {
    gap: 6,
  },
  chartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  chartColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  chartLabel: {
    flex: 1,
    fontSize: Math.min(width * 0.032, 13),
    fontFamily: 'Inter-Medium',
  },
  chartValue: {
    fontSize: Math.min(width * 0.032, 13),
    fontFamily: 'Inter-Bold',
    minWidth: 40,
    textAlign: 'right',
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
    fontSize: Math.min(width * 0.032, 13),
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
    fontSize: Math.min(width * 0.04, 16),
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