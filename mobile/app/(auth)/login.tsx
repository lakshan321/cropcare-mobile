import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { colors } from '../../src/theme/colors';

export default function LoginScreen() {
  const { login, registerFarmer } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration fields
  const [fullName, setFullName] = useState('');
  const [district, setDistrict] = useState('Kandy');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Login failed. Please check credentials.');
    }
  };

  const handleRegister = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password.trim() || !fullName.trim()) {
      setErrorMessage('Please fill in username, password, and full name.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const result = await registerFarmer({
      username: username.trim(),
      password,
      fullName: fullName.trim(),
      district: district.trim(),
      phone: phone.trim(),
    });
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Registration failed.');
    } else {
      setSuccessMessage('Farmer account registered successfully!');
    }
  };

  // Helper autofill for development/grading evaluation
  const setDemoAccount = (role: 'farmer' | 'officer') => {
    setIsRegistering(false);
    setErrorMessage('');
    if (role === 'farmer') {
      setUsername('farmer_kamal');
      setPassword('Farmer123!');
    } else {
      setUsername('officer_perera');
      setPassword('Officer123!');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header & Language Toggle */}
          <View style={styles.topRow}>
            <View style={styles.brandContainer}>
              <View style={styles.leafIcon}>
                <Text style={styles.leafSymbol}>❧</Text>
              </View>
              <Text style={styles.brandTitle}>{t.appName}</Text>
            </View>

            <View style={styles.langSelector}>
              {(['en', 'si', 'ta'] as const).map((langKey) => (
                <TouchableOpacity
                  key={langKey}
                  style={[styles.langChip, language === langKey && styles.langChipActive]}
                  onPress={() => setLanguage(langKey)}
                >
                  <Text style={[styles.langChipText, language === langKey && styles.langChipTextActive]}>
                    {langKey === 'en' ? 'EN' : langKey === 'si' ? 'සිං' : 'த'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {isRegistering ? t.registerTitle : t.loginTitle}
              </Text>
              <Text style={styles.cardSubtitle}>
                {isRegistering
                  ? 'Create a verified farmer account to receive expert crop health guidance'
                  : t.loginSubtitle}
              </Text>
            </View>

            {/* Error / Success Feedback */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>✓ {successMessage}</Text>
              </View>
            ) : null}

            {/* Registration Additional Fields */}
            {isRegistering && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.fullName} *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Kamal Gunaratne"
                    placeholderTextColor="#9ca3af"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.district}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Kandy, Gampaha, Galle"
                    placeholderTextColor="#9ca3af"
                    value={district}
                    onChangeText={setDistrict}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.phone}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 0771234567"
                    placeholderTextColor="#9ca3af"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            )}

            {/* Shared Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.username} *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Shared Password with Show/Hide toggle */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t.password} *</Text>
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.toggleText}>
                    {showPassword ? t.hidePassword : t.showPassword}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={isRegistering ? handleRegister : handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isRegistering ? t.registerButton : t.loginButton}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Login / Register */}
            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => {
                setIsRegistering(!isRegistering);
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              <Text style={styles.switchModeText}>
                {isRegistering ? t.loginLink : t.registerLink}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Demo Credentials Autofill Banner (Development / Marking Rubric) */}
          <View style={styles.devCard}>
            <Text style={styles.devHeader}>DEMO ACCOUNTS (MILESTONE 03)</Text>
            <Text style={styles.devSub}>Tap below to test shared authentication:</Text>
            <View style={styles.devButtonRow}>
              <TouchableOpacity
                style={styles.demoFarmerBtn}
                onPress={() => setDemoAccount('farmer')}
              >
                <Text style={styles.demoFarmerBtnText}>🌾 Fill Farmer Account</Text>
                <Text style={styles.demoBtnSub}>farmer_kamal / Farmer123!</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoOfficerBtn}
                onPress={() => setDemoAccount('officer')}
              >
                <Text style={styles.demoOfficerBtnText}>🏛 Fill Officer Account</Text>
                <Text style={styles.demoBtnSub}>officer_perera / Officer123!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leafIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafSymbol: {
    color: '#ffffff',
    fontSize: 22,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.5,
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: '#eaf0e7',
    borderRadius: 12,
    padding: 3,
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  langChipActive: {
    backgroundColor: colors.primary,
  },
  langChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  langChipTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#16372c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#ffc8be',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: '#bfe3be',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 6,
  },
  toggleText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f9fbf8',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchModeButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchModeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  devCard: {
    marginTop: 24,
    backgroundColor: '#f4f7f2',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  devHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textMuted,
    marginBottom: 4,
  },
  devSub: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 12,
  },
  devButtonRow: {
    flexDirection: 'column',
    gap: 8,
  },
  demoFarmerBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cce2d2',
    borderRadius: 10,
    padding: 10,
  },
  demoFarmerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  demoOfficerBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ded4b5',
    borderRadius: 10,
    padding: 10,
  },
  demoOfficerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8a5a10',
  },
  demoBtnSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
