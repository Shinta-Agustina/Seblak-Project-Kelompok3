import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useKasir } from '../context/KasirContext';

export default function TopHeader({ onToggleSidebar, isSidebarOpen }) {
  const { user, activeTab } = useKasir();
  const isOwner = user?.role === 'Owner';

  const getPageTitle = () => {
    switch (activeTab) {
      case 'Kasir':
        return isOwner ? 'Simulasi Kasir - POS' : 'Kasir - Point of Sale';
      case 'Pesanan Aktif':
        return isOwner ? 'Monitoring Pesanan Aktif' : 'Pesanan Aktif';
      case 'Riwayat Transaksi':
        return 'Riwayat Transaksi';
      case 'Laporan':
        return isOwner ? 'Dashboard Owner - Laporan Penjualan' : 'Laporan Penjualan';
      default:
        return 'Kasir - Point of Sale';
    }
  };

  const avatarSource =
    typeof user?.avatar === 'string'
      ? { uri: user.avatar }
      : user?.avatar || (isOwner
          ? { uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80' }
          : require('../../assets/images/avatar-kasir.png'));

  return (
    <View style={styles.container}>
      {/* Left Section: Hamburger & Title */}
      <View style={styles.leftGroup}>
        <TouchableOpacity
          onPress={onToggleSidebar}
          style={[styles.burgerBtn, isSidebarOpen && styles.burgerBtnActive]}
          activeOpacity={0.7}
          accessibilityLabel="Toggle Menu Navigasi"
        >
          <View style={styles.burgerIcon}>
            <View style={styles.burgerLine} />
            <View style={styles.burgerLine} />
            <View style={styles.burgerLine} />
          </View>
        </TouchableOpacity>

        <Text style={styles.pageTitle} numberOfLines={1}>
          {getPageTitle()}
        </Text>
      </View>

      {/* Right Section: Profil Pengguna (Kasir / Owner) */}
      <View style={[styles.profileChip, isOwner && styles.profileChipOwner]}>
        <View style={[styles.avatarContainer, isOwner && styles.avatarOwner]}>
          <Image
            source={avatarSource}
            style={styles.avatarImg}
            resizeMode="cover"
          />
        </View>
        <View style={styles.profileText}>
          <Text style={styles.userName}>{user?.name || (isOwner ? 'Dewi' : 'Siti Aisyah')}</Text>
          <View style={styles.roleBadgeRow}>
            {isOwner && <Text style={styles.roleIcon}>👑</Text>}
            <Text style={[styles.userRole, isOwner && styles.userRoleOwner]}>
              {user?.role || 'Kasir'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  burgerBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F4F0',
    borderWidth: 1,
    borderColor: '#ECE3DE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  burgerBtnActive: {
    backgroundColor: '#FDECEC',
    borderColor: '#F8B4B4',
  },
  burgerIcon: {
    width: 18,
    height: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  burgerLine: {
    width: 18,
    height: 2.2,
    backgroundColor: '#3D2922',
    borderRadius: 2,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C1810',
    letterSpacing: 0.2,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#FAF5F1',
    borderWidth: 1,
    borderColor: '#EFE7E2',
  },
  profileChipOwner: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FFDEC2',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFE0B2',
  },
  avatarOwner: {
    borderWidth: 1.5,
    borderColor: '#E65100',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  profileText: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  roleIcon: {
    fontSize: 10,
  },
  userRole: {
    fontSize: 10,
    color: '#8D7B70',
    fontWeight: '600',
  },
  userRoleOwner: {
    color: '#E65100',
    fontWeight: '800',
  },
});
