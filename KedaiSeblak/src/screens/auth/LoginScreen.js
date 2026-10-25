import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  useWindowDimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useKasir } from '../../context/KasirContext';

export default function LoginScreen({ onLogin }) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { login } = useKasir();

  const [role, setRole] = useState('Kasir');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});

  // Memilih role dan mengosongkan form
  const handleSelectRole = (newRole) => {
    setRole(newRole);
    setUsername('');
    setPassword('');
    setErrors({});
    setFocusedField(null);
  };

  // Mengisi akun demo tanpa langsung login
  const fillDemoAccount = (demoRole) => {
    setRole(demoRole);
    setUsername(
      demoRole === 'Kasir' ? 'Siti Aisyah' : 'Dewi'
    );
    setPassword(
      demoRole === 'Kasir' ? 'kasir123' : 'owner123'
    );
    setErrors({});
  };

  // Validasi form login
  const handleLogin = () => {
    if (loading) return;

    const cleanUsername = username.trim();
    const newErrors = {};

    if (!cleanUsername) {
      newErrors.username = 'Username wajib diisi.';
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Akun demo lokal untuk pengujian UI
    const demoAccounts = {
      Kasir: {
        username: 'Siti Aisyah',
        password: 'kasir123',
      },
      Owner: {
        username: 'Dewi',
        password: 'owner123',
      },
    };

    const account = demoAccounts[role];

    if (
      !account ||
      cleanUsername !== account.username ||
      password !== account.password
    ) {
      setErrors({
        form: 'Username atau password tidak sesuai.',
      });
      return;
    }

    setErrors({});
    setLoading(true);

    setTimeout(() => {
      try {
        login(cleanUsername, role);

        if (onLogin) {
          onLogin(cleanUsername, role);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.mainLayout,
          isLargeScreen && styles.rowLayout,
        ]}
      >
        {/* Banner Seblak */}
        <View
          style={[
            styles.heroSection,
            isLargeScreen
              ? styles.heroLarge
              : styles.heroSmall,
          ]}
        >
          <Image
            source={require('../../../assets/images/hero-seblak.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />

          <View style={styles.heroOverlay}>
            <View style={styles.heroTopBrand}>
              <View style={styles.heroLogoRow}>
                <View style={styles.heroLogoCircle}>
                  <Text style={styles.heroLogoEmoji}>
                    🍲
                  </Text>
                </View>

                <View>
                  <Text style={styles.heroBrandName}>
                    Seblak Prasmanan
                  </Text>

                  <Text style={styles.heroBrandSub}>
                    Sistem Kasir & Owner
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.heroTaglineBox}>
              <Text style={styles.heroTagline}>
                Rasa pedas,{"\n"}
                selalu jadi cerita! ❤️
              </Text>
            </View>

            <View style={styles.heroFooter}>
              <Text style={styles.heroFooterText}>
                🍲 Seblak Prasmanan
              </Text>
            </View>
          </View>
        </View>

        {/* Form Login */}
        <View
          style={[
            styles.formSection,
            isLargeScreen
              ? styles.formLarge
              : styles.formSmall,
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.loginCard}>
              {/* Judul */}
              <View style={styles.cardHeader}>
                <Text style={styles.title}>
                  {role === 'Kasir'
                    ? 'Login Kasir'
                    : 'Login Owner'}
                </Text>

                <Text style={styles.subtitle}>
                  {role === 'Kasir'
                    ? 'Masuk untuk memulai sesi kerja kasir'
                    : 'Masuk untuk memantau omzet & laporan'}
                </Text>
              </View>

              {/* Pilihan Role */}
              <View style={styles.roleToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleTab,
                    role === 'Kasir' &&
                    styles.roleTabActive,
                  ]}
                  onPress={() => handleSelectRole('Kasir')}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="point-of-sale"
                    size={17}
                    color={
                      role === 'Kasir'
                        ? '#FFFFFF'
                        : '#8D7B70'
                    }
                  />

                  <Text
                    style={[
                      styles.roleTabText,
                      role === 'Kasir' &&
                      styles.roleTabTextActive,
                    ]}
                  >
                    Kasir
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleTab,
                    role === 'Owner' &&
                    styles.roleTabActive,
                  ]}
                  onPress={() => handleSelectRole('Owner')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={17}
                    color={
                      role === 'Owner'
                        ? '#FFFFFF'
                        : '#8D7B70'
                    }
                  />

                  <Text
                    style={[
                      styles.roleTabText,
                      role === 'Owner' &&
                      styles.roleTabTextActive,
                    ]}
                  >
                    Owner
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form Input */}
              <View style={styles.formGroup}>
                {/* Username */}
                <Text style={styles.inputLabel}>
                  {role === 'Kasir'
                    ? 'Username Kasir'
                    : 'Username Owner'}
                </Text>

                <View
                  style={[
                    styles.inputBox,
                    focusedField === 'username' &&
                    styles.inputBoxFocused,
                    errors.username &&
                    styles.inputBoxError,
                  ]}
                >
                  <Ionicons
                    name={
                      role === 'Kasir'
                        ? 'person-outline'
                        : 'shield-outline'
                    }
                    size={19}
                    color={
                      focusedField === 'username'
                        ? '#C62828'
                        : '#8D7B70'
                    }
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.textInput}
                    placeholder={
                      role === 'Kasir'
                        ? 'Masukkan username kasir'
                        : 'Masukkan username owner'
                    }
                    placeholderTextColor="#B0A097"
                    value={username}
                    onChangeText={(value) => {
                      setUsername(value);
                      setErrors((prev) => ({
                        ...prev,
                        username: '',
                        form: '',
                      }));
                    }}
                    onFocus={() =>
                      setFocusedField('username')
                    }
                    onBlur={() =>
                      setFocusedField(null)
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>

                {errors.username ? (
                  <Text style={styles.errorText}>
                    {errors.username}
                  </Text>
                ) : null}

                {/* Password */}
                <Text
                  style={[
                    styles.inputLabel,
                    { marginTop: 14 },
                  ]}
                >
                  Password
                </Text>

                <View
                  style={[
                    styles.inputBox,
                    focusedField === 'password' &&
                    styles.inputBoxFocused,
                    errors.password &&
                    styles.inputBoxError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color={
                      focusedField === 'password'
                        ? '#C62828'
                        : '#8D7B70'
                    }
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.textInput}
                    placeholder="Masukkan password"
                    placeholderTextColor="#B0A097"
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      setErrors((prev) => ({
                        ...prev,
                        password: '',
                        form: '',
                      }));
                    }}
                    onFocus={() =>
                      setFocusedField('password')
                    }
                    onBlur={() =>
                      setFocusedField(null)
                    }
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setShowPassword((prev) => !prev)
                    }
                    style={styles.eyeBtn}
                    accessibilityLabel={
                      showPassword
                        ? 'Sembunyikan password'
                        : 'Tampilkan password'
                    }
                  >
                    <Ionicons
                      name={
                        showPassword
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={19}
                      color="#8D7B70"
                    />
                  </TouchableOpacity>
                </View>

                {errors.password ? (
                  <Text style={styles.errorText}>
                    {errors.password}
                  </Text>
                ) : null}

                {errors.form ? (
                  <Text style={styles.errorText}>
                    {errors.form}
                  </Text>
                ) : null}

                {/* Tombol Masuk */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    loading &&
                    styles.submitButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading
                      ? 'Memproses...'
                      : role === 'Kasir'
                        ? 'Masuk'
                        : 'Masuk sebagai Owner'}
                  </Text>
                </TouchableOpacity>

                {/* Informasi Akses */}
                <View style={styles.noticeBox}>
                  <Ionicons
                    name={
                      role === 'Kasir'
                        ? 'lock-closed'
                        : 'shield-checkmark'
                    }
                    size={13}
                    color="#8D7B70"
                  />

                  <Text style={styles.noticeText}>
                    {role === 'Kasir'
                      ? 'Hanya untuk kasir'
                      : 'Akses Owner: Pemilik & Laporan'}
                  </Text>
                </View>

                {/* Akun Demo */}
                <View style={styles.quickAccessSection}>
                  <Text style={styles.quickAccessTitle}>
                    Pilih Cepat untuk Pengujian:
                  </Text>

                  <View style={styles.quickBtnRow}>
                    <TouchableOpacity
                      style={[
                        styles.quickBtn,
                        role === 'Kasir' &&
                        styles.quickBtnSelected,
                      ]}
                      onPress={() =>
                        fillDemoAccount('Kasir')
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.quickBtnText}>
                        🏪 Kasir: Siti Aisyah
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.quickBtn,
                        styles.quickBtnOwner,
                        role === 'Owner' &&
                        styles.quickBtnOwnerSelected,
                      ]}
                      onPress={() =>
                        fillDemoAccount('Owner')
                      }
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.quickBtnText,
                          styles.quickBtnTextOwner,
                        ]}
                      >
                        👑 Owner: Dewi
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E0F0A',
  },
  mainLayout: {
    flex: 1,
  },
  rowLayout: {
    flexDirection: 'row',
  },
  heroSection: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1E0F0A',
  },
  heroLarge: {
    flex: 1.1,
    height: '100%',
  },
  heroSmall: {
    height: 200,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 10, 8, 0.65)',
    padding: 28,
    justifyContent: 'space-between',
  },
  heroTopBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  heroLogoEmoji: {
    fontSize: 24,
  },
  heroBrandName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroBrandSub: {
    fontSize: 13,
    color: '#F4C2C6',
    fontWeight: '600',
  },
  heroTaglineBox: {
    maxWidth: 380,
  },
  heroTagline: {
    fontSize: 26,
    lineHeight: 36,
    color: '#FFFFFF',
    fontWeight: '800',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroFooterText: {
    color: '#ECC4C8',
    fontSize: 13,
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: '#F8F5F2',
    justifyContent: 'center',
  },
  formLarge: {
    flex: 1,
    minHeight: '100%',
    paddingHorizontal: 40,
  },
  formSmall: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
  },
  loginCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#EFE7E2',
    elevation: 4,
    shadowColor: '#4A2A22',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2C1810',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#8D7B70',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3ECE7',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  roleTabActive: {
    backgroundColor: '#C62828',
    elevation: 2,
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7E6E67',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
  },
  formGroup: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A3028',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D5CC',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputBoxFocused: {
    borderColor: '#C62828',
    borderWidth: 2,
    backgroundColor: '#FFFAF8',
  },
  inputBoxError: {
    borderColor: '#D32F2F',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
  },
  eyeBtn: {
    padding: 6,
  },
  submitButton: {
    backgroundColor: '#C62828',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  noticeText: {
    fontSize: 12,
    color: '#8D7B70',
    fontWeight: '600',
  },
  quickAccessSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0E5DF',
  },
  quickAccessTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8D7B70',
    marginBottom: 8,
    textAlign: 'center',
  },
  quickBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: '#FDECEC',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },
  quickBtnSelected: {
    borderColor: '#C62828',
    borderWidth: 1.5,
  },
  quickBtnOwner: {
    backgroundColor: '#FFF4E5',
    borderColor: '#FFD199',
  },
  quickBtnOwnerSelected: {
    borderColor: '#E65100',
    borderWidth: 1.5,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C62828',
  },
  quickBtnTextOwner: {
    color: '#E65100',
  },
});