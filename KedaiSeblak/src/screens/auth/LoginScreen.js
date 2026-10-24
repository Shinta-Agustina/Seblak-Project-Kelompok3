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
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useKasir } from '../../context/KasirContext';

export default function LoginScreen({ onLogin }) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { login } = useKasir();

  // 2 Roles: 'Kasir' atau 'Owner'
  const [role, setRole] = useState('Kasir');
  const [username, setUsername] = useState('Siti Aisyah');
  const [password, setPassword] = useState('kasir123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Switch role handler
  const handleSelectRole = (newRole) => {
    setRole(newRole);
    if (newRole === 'Kasir') {
      setUsername('Siti Aisyah');
      setPassword('kasir123');
    } else {
      setUsername('Dewi');
      setPassword('owner123');
    }
  };

  const handleLogin = (customUser = null, customRole = null) => {
    const userToLogin = customUser || username.trim();
    const roleToLogin = customRole || role;

    if (!userToLogin) {
      Alert.alert(
        'Perhatian',
        `Silakan masukkan username ${roleToLogin.toLowerCase()}.`
      );
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      login(userToLogin, roleToLogin);
      if (onLogin) {
        onLogin(userToLogin, roleToLogin);
      }
    }, 300);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.mainLayout, isLargeScreen && styles.rowLayout]}>
        {/* Left Side (or Top Banner on Mobile): Hero Seblak Image */}
        <View
          style={[
            styles.heroSection,
            isLargeScreen ? styles.heroLarge : styles.heroSmall,
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
                  <Text style={styles.heroLogoEmoji}>🍲</Text>
                </View>
                <View>
                  <Text style={styles.heroBrandName}>Seblak Prasmanan</Text>
                  <Text style={styles.heroBrandSub}>Sistem Kasir & Owner</Text>
                </View>
              </View>
            </View>

            <View style={styles.heroTaglineBox}>
              <Text style={styles.heroTagline}>
                Rasa pedas,{"\n"}selalu jadi cerita! ❤️
              </Text>
            </View>

            <View style={styles.heroFooter}>
              <Text style={styles.heroFooterText}>🍲 Seblak Prasmanan</Text>
            </View>
          </View>
        </View>

        {/* Right Side: Login Card */}
        <View
          style={[
            styles.formSection,
            isLargeScreen ? styles.formLarge : styles.formSmall,
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.loginCard}>
              {/* Header Card */}
              <View style={styles.cardHeader}>
                <Text style={styles.title}>
                  {role === 'Kasir' ? 'Login Kasir' : 'Login Owner'}
                </Text>
                <Text style={styles.subtitle}>
                  {role === 'Kasir'
                    ? 'Masuk untuk memulai sesi kerja kasir'
                    : 'Masuk untuk memantau omzet & laporan'}
                </Text>
              </View>

              {/* 2-Role Tab Selector: Kasir & Owner */}
              <View style={styles.roleToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleTab,
                    role === 'Kasir' && styles.roleTabActive,
                  ]}
                  onPress={() => handleSelectRole('Kasir')}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="point-of-sale"
                    size={17}
                    color={role === 'Kasir' ? '#FFFFFF' : '#8D7B70'}
                  />
                  <Text
                    style={[
                      styles.roleTabText,
                      role === 'Kasir' && styles.roleTabTextActive,
                    ]}
                  >
                    Kasir
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleTab,
                    role === 'Owner' && styles.roleTabActive,
                  ]}
                  onPress={() => handleSelectRole('Owner')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={17}
                    color={role === 'Owner' ? '#FFFFFF' : '#8D7B70'}
                  />
                  <Text
                    style={[
                      styles.roleTabText,
                      role === 'Owner' && styles.roleTabTextActive,
                    ]}
                  >
                    Owner
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form Input Group */}
              <View style={styles.formGroup}>
                {/* Username Input */}
                <Text style={styles.inputLabel}>
                  {role === 'Kasir' ? 'Username Kasir' : 'Username Owner'}
                </Text>
                <View style={styles.inputBox}>
                  <Ionicons
                    name={role === 'Kasir' ? 'person-outline' : 'shield-outline'}
                    size={19}
                    color="#8D7B70"
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
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>

                {/* Password Input */}
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                  Password
                </Text>
                <View style={styles.inputBox}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color="#8D7B70"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masukkan password"
                    placeholderTextColor="#B0A097"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={19}
                      color="#8D7B70"
                    />
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    loading && styles.submitButtonDisabled,
                  ]}
                  onPress={() => handleLogin()}
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

                {/* Bottom Notice: Hanya untuk kasir / Akses Owner */}
                <View style={styles.noticeBox}>
                  <Ionicons
                    name={role === 'Kasir' ? 'lock-closed' : 'shield-checkmark'}
                    size={13}
                    color="#8D7B70"
                  />
                  <Text style={styles.noticeText}>
                    {role === 'Kasir'
                      ? 'Hanya untuk kasir'
                      : 'Akses Owner: Pemilik & Laporan'}
                  </Text>
                </View>

                {/* Quick 1-Click Access for Presentation Testing */}
                <View style={styles.quickAccessSection}>
                  <Text style={styles.quickAccessTitle}>
                    Pilih Cepat untuk Pengujian:
                  </Text>
                  <View style={styles.quickBtnRow}>
                    <TouchableOpacity
                      style={[
                        styles.quickBtn,
                        role === 'Kasir' && styles.quickBtnSelected,
                      ]}
                      onPress={() => {
                        setRole('Kasir');
                        setUsername('Siti Aisyah');
                        setPassword('kasir123');
                        handleLogin('Siti Aisyah', 'Kasir');
                      }}
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
                        role === 'Owner' && styles.quickBtnOwnerSelected,
                      ]}
                      onPress={() => {
                        setRole('Owner');
                        setUsername('Dewi');
                        setPassword('owner123');
                        handleLogin('Dewi', 'Owner');
                      }}
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
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
    outlineStyle: 'none',
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
