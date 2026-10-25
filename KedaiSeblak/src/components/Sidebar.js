import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useKasir } from '../context/KasirContext';

export default function Sidebar({
  onClose,
  isMobile = false,
  role = 'kasir',
  activeTab: activeTabProp,
  setActiveTab: setActiveTabProp,
  onLogout,
}) {
  const { user, activeTab: contextActiveTab, setActiveTab: contextSetActiveTab, logout: contextLogout, orders } = useKasir();
  const isOwner = role === 'owner' || role === 'Owner' || user?.role === 'Owner';
  const activeTab = activeTabProp !== undefined ? activeTabProp : contextActiveTab;
  const setActiveTab = setActiveTabProp || contextSetActiveTab;
  const logout = onLogout || contextLogout;

  const activeOrdersCount = orders ? orders.filter(
    (o) => o.status === 'Diproses' || o.status === 'Siap Bayar'
  ).length : 0;

  const kasirMenuItems = [
    {
      id: 'Kasir',
      label: 'Kasir',
      icon: (color) => <MaterialIcons name="storefront" size={20} color={color} />,
    },
    {
      id: 'Pesanan Aktif',
      label: 'Pesanan Aktif',
      icon: (color) => <MaterialIcons name="receipt-long" size={20} color={color} />,
      badge: activeOrdersCount > 0 ? activeOrdersCount : null,
    },
    {
      id: 'Riwayat Transaksi',
      label: 'Riwayat Transaksi',
      icon: (color) => <Ionicons name="time-outline" size={20} color={color} />,
    },
    {
      id: 'Laporan',
      label: 'Laporan',
      icon: (color) => <MaterialIcons name="bar-chart" size={20} color={color} />,
    },
  ];

  const ownerMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (color) => <MaterialIcons name="dashboard" size={20} color={color} />,
    },
    {
      id: 'penjualan',
      label: 'Penjualan',
      icon: (color) => <MaterialIcons name="trending-up" size={20} color={color} />,
    },
    {
      id: 'stok',
      label: 'Stok Bahan',
      icon: (color) => <MaterialIcons name="inventory-2" size={20} color={color} />,
    },
    {
      id: 'menu_harga',
      label: 'Menu & Harga',
      icon: (color) => <MaterialIcons name="restaurant-menu" size={20} color={color} />,
    },
    {
      id: 'pengeluaran',
      label: 'Pengeluaran',
      icon: (color) => <MaterialIcons name="receipt-long" size={20} color={color} />,
    },
    {
      id: 'laporan_keuangan',
      label: 'Laporan Keuangan',
      icon: (color) => <MaterialIcons name="assessment" size={20} color={color} />,
    },
  ];

  const menuItems = isOwner ? ownerMenuItems : kasirMenuItems;

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <View style={[styles.container, isMobile && styles.mobileContainer]}>
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🍲</Text>
          </View>
          <View style={styles.brandTextGroup}>
            <Text style={styles.brandTitle}>Seblak Prasmanan</Text>
            <Text style={styles.brandSubtitle}>
              {isOwner ? 'Owner Dashboard' : 'Kasir'}
            </Text>
          </View>
        </View>

        {isMobile && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Role Pill Badge */}
      <View style={styles.roleBanner}>
        <View style={[styles.rolePill, isOwner && styles.rolePillOwner]}>
          <Text style={styles.rolePillText}>
            {isOwner ? '👑 Mode Pemilik (Owner)' : '🏪 Mode Kasir (POS)'}
          </Text>
        </View>
      </View>

      {/* Menu List */}
      <ScrollView style={styles.menuScroll} contentContainerStyle={styles.menuContent}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const iconColor = isActive ? '#FFFFFF' : '#DFB8BC';

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => handleSelectTab(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                {typeof item.icon === 'function' ? (
                  item.icon(iconColor)
                ) : (
                  <MaterialIcons name={item.icon} size={20} color={iconColor} />
                )}
                <Text
                  style={[
                    styles.menuLabel,
                    isActive && styles.menuLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </View>

              {item.badge != null && (
                <View
                  style={[
                    styles.badge,
                    isActive ? styles.badgeWhite : styles.badgeRed,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isActive ? styles.badgeTextRed : styles.badgeTextWhite,
                    ]}
                  >
                    {item.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Logout button at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#F2A5A5" />
          <Text style={styles.logoutText}>
            Logout ({isOwner ? 'Owner' : 'Kasir'})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 225,
    backgroundColor: '#52141D',
    borderRightWidth: 1,
    borderRightColor: '#6B1B26',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  mobileContainer: {
    width: 260,
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
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
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  brandSubtitle: {
    color: '#DFB8BC',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  roleBanner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rolePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  rolePillOwner: {
    backgroundColor: '#9A3412',
    borderWidth: 1,
    borderColor: '#EA580C',
  },
  rolePillText: {
    color: '#F4D4D8',
    fontSize: 10,
    fontWeight: '700',
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 4,
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
    fontSize: 13,
    fontWeight: '600',
  },
  menuLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeWhite: {
    backgroundColor: '#FFFFFF',
  },
  badgeRed: {
    backgroundColor: '#C62828',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeTextRed: {
    color: '#52141D',
  },
  badgeTextWhite: {
    color: '#FFFFFF',
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: '#F2A5A5',
    fontSize: 12,
    fontWeight: '600',
  },
});
