'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Eye, Lock, Database, Users, FileText } from '@phosphor-icons/react';
import Header from '@/components/Header';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 mb-6"
        >
          <ArrowLeft size={20} weight="regular" />
          <span className="font-medium">Geri</span>
        </button>

        {/* Privacy Policy Content */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gizlilik Politikası</h1>
              <p className="text-gray-500 text-sm">Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Introduction */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <FileText size={20} className="text-blue-600" />
                <span>Giriş</span>
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Eşlikçi uygulaması olarak, kullanıcılarımızın gizliliğini korumak bizim için çok önemlidir. 
                Bu gizlilik politikası, kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklar.
              </p>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Database size={20} className="text-blue-600" />
                <span>Toplanan Bilgiler</span>
              </h2>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Kişisel Bilgiler</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Ad ve soyad</li>
                    <li>• E-posta adresi</li>
                    <li>• Profil fotoğrafı (isteğe bağlı)</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Oyun Verileri</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Oyun kayıtları ve istatistikleri</li>
                    <li>• Oyun tercihleri</li>
                    <li>• Grup üyelikleri</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Usage */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Eye size={20} className="text-blue-600" />
                <span>Bilgilerin Kullanımı</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Topladığımız bilgileri aşağıdaki amaçlarla kullanırız:
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Uygulama hizmetlerini sağlamak ve geliştirmek</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Kullanıcı hesaplarını yönetmek</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Oyun istatistiklerini takip etmek</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Teknik destek sağlamak</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Güvenlik ve dolandırıcılık önleme</span>
                </li>
              </ul>
            </section>

            {/* Data Protection */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Lock size={20} className="text-blue-600" />
                <span>Veri Güvenliği</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Kişisel bilgilerinizi korumak için aşağıdaki güvenlik önlemlerini alırız:
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>SSL şifreleme ile veri iletimi</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Güvenli sunucu altyapısı</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Düzenli güvenlik güncellemeleri</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Erişim kontrolü ve yetkilendirme</span>
                </li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Users size={20} className="text-blue-600" />
                <span>Bilgi Paylaşımı</span>
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Kişisel bilgilerinizi üçüncü taraflarla paylaşmayız, ancak aşağıdaki durumlar hariç:
              </p>
              <ul className="text-gray-600 space-y-2 mt-3">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Yasal zorunluluklar</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Kullanıcının açık rızası</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Hizmet sağlayıcıları (sınırlı erişim ile)</span>
                </li>
              </ul>
            </section>

            {/* User Rights */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Kullanıcı Hakları</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                KVKK ve GDPR kapsamında aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Kişisel verilerinize erişim hakkı</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Verilerinizi düzeltme hakkı</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Verilerinizi silme hakkı</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Veri işlemeye itiraz etme hakkı</span>
                </li>
              </ul>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">İletişim</h2>
              <p className="text-gray-600 leading-relaxed">
                Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mt-3">
                <p className="text-blue-800 font-medium">E-posta: privacy@eslikci.com</p>
                <p className="text-blue-600 text-sm mt-1">
                  Gizlilik politikamız değişiklik gösterebilir. Önemli değişiklikler kullanıcılara bildirilir.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
