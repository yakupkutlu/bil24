import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { usersApi } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Profile, UserRole } from '../../types';
import { cn } from '../../lib/utils';

interface UserWithActivity extends Profile {
  ticket_count?: number;
}

const ROLES = [
  { value: 'super_admin', label: 'Admin' },
  { value: 'operator', label: 'Operatör' },
  { value: 'customer', label: 'Kullanıcı' },
];

export default function UserManagement() {
  const { signUp } = useAuth();
  const [users, setUsers] = useState<UserWithActivity[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithActivity | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', role: 'customer' as UserRole, password: '',
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let filtered = [...users];
    if (searchTerm) filtered = filtered.filter(u =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm)
    );
    if (roleFilter !== 'all') filtered = filtered.filter(u => u.role === roleFilter);
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, roleFilter]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await usersApi.list();
      setUsers(data as UserWithActivity[]);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser() {
    if (!formData.full_name || !formData.email || !formData.password) {
      alert('Lütfen gerekli alanları doldurunuz');
      return;
    }
    try {
      await signUp(formData.email, formData.password, formData.full_name, formData.phone, formData.role);
      setFormData({ full_name: '', email: '', phone: '', role: 'customer', password: '' });
      setShowAddModal(false);
      fetchUsers();
      alert('Kullanıcı başarıyla eklendi');
    } catch (error) {
      console.error('Kullanıcı eklenirken hata:', error);
      alert('Kullanıcı eklenirken hata oluştu');
    }
  }

  async function handleUpdateUser(updates: Partial<Profile>) {
    if (!selectedUser) return;
    try {
      await usersApi.update(selectedUser.id, updates);
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
      alert('Kullanıcı başarıyla güncellendi');
    } catch (error) {
      console.error('Kullanıcı güncellenirken hata:', error);
      alert('Kullanıcı güncellenirken hata oluştu');
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
    try {
      await usersApi.delete(userId);
      fetchUsers();
      alert('Kullanıcı başarıyla silindi');
    } catch (error) {
      console.error('Kullanıcı silinirken hata:', error);
      alert('Kullanıcı silinirken hata oluştu');
    }
  }

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kullanıcı Yönetimi</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Toplam {filteredUsers.length} kullanıcı</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} /> <span>Yeni Kullanıcı</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm space-y-4 sm:space-y-0 sm:flex gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Ad, email veya telefon ile ara..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Tüm Roller</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : isMobile ? (
        <div className="space-y-4">
          {paginatedUsers.map(user => (
            <div key={user.id} className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">{user.full_name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              {user.phone && <p className="text-sm text-gray-600 dark:text-gray-400">📱 {user.phone}</p>}
              <div className="flex items-center gap-3 mt-2">
                <span className={cn('px-2 py-1 rounded text-xs font-medium',
                  user.role === 'super_admin' ? 'bg-red-100 text-red-800' : user.role === 'operator' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800')}>
                  {ROLES.find(r => r.value === user.role)?.label}
                </span>
                <span className={cn('px-2 py-1 rounded text-xs font-medium', user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                  {user.is_active ? 'Aktif' : 'İnaktif'}
                </span>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                  <Edit2 size={16} /> <span className="text-sm">Düzenle</span>
                </button>
                <button onClick={() => handleDeleteUser(user.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors">
                  <Trash2 size={16} /> <span className="text-sm">Sil</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Ad', 'Email', 'Telefon', 'Rol', 'Durum', 'Biletler', 'İşlemler'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(user => (
                <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={cn('px-2 py-1 rounded text-xs font-medium',
                      user.role === 'super_admin' ? 'bg-red-100 text-red-800' : user.role === 'operator' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800')}>
                      {ROLES.find(r => r.value === user.role)?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={cn('px-2 py-1 rounded text-xs font-medium', user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                      {user.is_active ? 'Aktif' : 'İnaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.ticket_count || 0}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 rounded transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">Sayfa {currentPage} / {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Yeni Kullanıcı Ekle</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {[
                { placeholder: 'Ad Soyad', field: 'full_name', type: 'text' },
                { placeholder: 'Email', field: 'email', type: 'email' },
                { placeholder: 'Telefon (opsiyonel)', field: 'phone', type: 'tel' },
              ].map(({ placeholder, field, type }) => (
                <input key={field} type={type} placeholder={placeholder}
                  value={formData[field as keyof typeof formData]}
                  onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ))}
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <input type="password" placeholder="Şifre" value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
              <button onClick={handleAddUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Ekle</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kullanıcıyı Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Rol</label>
                <select value={selectedUser.role}
                  onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value as UserRole })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={selectedUser.is_active}
                  onChange={e => setSelectedUser({ ...selectedUser, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Aktif</span>
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">İptal</button>
              <button onClick={() => handleUpdateUser({ role: selectedUser.role, is_active: selectedUser.is_active })}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
