import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useKasir } from '../context/KasirContext';

const MENU_KASIR = [
  { id: 'Kasir', label: 'Kasir', icon: 'point-of-sale' },
  { id: 'Pesanan Aktif', label: 'Pesanan Aktif', icon: 'pending-actions' },
  { id: 'Riwayat Transaksi', label: 'Riwayat Transaksi', icon: 'receipt-long' },
  { id: 'Laporan', label: 'Laporan', icon: 'bar-chart' },
];

const MENU_OWNER = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'penjualan', label: 'Penjualan', icon: 'trending-up' },
  { id: 'stok', label: 'Stok Bahan', icon: 'inventory-2' },
  { id: 'pengeluaran', label: 'Pengeluaran', icon: 'receipt-long' },
];

export default function Sidebar({
  onClose,
  isMobile = false,
  role = 'kasir',
  activeTab: activeTabProp,
  setActiveTab: setActiveTabProp,
  onLogout,
}) {
  const kasirContext = useKasir();

  const activeTab =
    activeTabProp !== undefined
      ? activeTabProp
      : kasirContext.activeTab;

  const setActiveTab =
    setActiveTabProp || kasirContext.setActiveTab;

  const navigation = useNavigation();

  const logout =
    onLogout ||
    (() => {
      kasirContext.logout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    });

  const menuItems = role === 'owner' ? MENU_OWNER : MENU_KASIR;

  const handleSelectTab = (tabId) => {
    if (setActiveTab) {
      setActiveTab(tabId);
    }

    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <View style={[styles.container, isMobile && styles.mobileContainer]}>
      <View style={styles.brandContainer}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="flame" size={22} color="#FFFFFF" />
          </View>

          <View style={styles.brandTextGroup}>
            <Text style={styles.brandTitle}>Seblak Prasmanan</Text>
            <Text style={styles.brandSubtitle}>
              {role === 'owner' ? 'Owner' : 'Kasir'}
            </Text>
          </View>
        </View>

        {isMobile && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.menuScroll}
        contentContainerStyle={styles.menuContent}
      >
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const iconColor = isActive ? '#FFFFFF' : '#DFB8BC';

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                isActive && styles.menuItemActive,
              ]}
              onPress={() => handleSelectTab(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <MaterialIcons
                  name={item.icon}
                  size={20}
                  color={iconColor}
                />

                <Text
                  style={[
                    styles.menuLabel,
                    isActive && styles.menuLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
          activeOpacity={0.7}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#F2A5A5"
          />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 230,
    backgroundColor: '#52141D',
    borderRightWidth: 1,
    borderRightColor: '#6B1B26',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  mobileContainer: {
    width: 270,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 15,
  },
  brandContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoEmoji: {
    fontSize: 20,
  },
  brandTextGroup: {
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    color: '#DFB8BC',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingHorizontal: 12,
    paddingVertical: 18,
    gap: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: '#C62828',
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    color: '#DFB8BC',
    fontSize: 14,
    fontWeight: '600',
  },
  menuLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: '#F2A5A5',
    fontSize: 14,
    fontWeight: '600',
  },
});


