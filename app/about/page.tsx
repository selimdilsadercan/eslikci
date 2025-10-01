'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Info, FileText, Shield, Users, Heart, Star, Envelope } from '@phosphor-icons/react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function AboutPage() {
  const router = useRouter();

  const infoPages = [
    {
      title: 'Gizlilik Politikası', 
      description: 'Kişisel verilerinizin nasıl korunduğunu öğrenin',
      icon: Shield,
      href: '/privacy',
      color: 'bg-blue-500'
    },
    {
      title: 'Geri Bildirim',
      description: 'Görüş ve önerilerinizi bizimle paylaşın',
      icon: Heart,
      href: '/feedback',
      color: 'bg-pink-500'
    }
  ];

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

        {/* About Content */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Info size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Hakkımızda</h1>
              <p className="text-gray-500 text-sm">Board Games Companion</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* App Description */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Star size={20} className="text-blue-600" />
                <span>Uygulama Hakkında</span>
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Board Games Companion, masa oyunları severler için özel olarak tasarlanmış bir uygulamadır. 
                Oyunlarınızı kaydetmenize, istatistiklerinizi takip etmenize ve arkadaşlarınızla oyun deneyimlerinizi paylaşmanıza olanak tanır.
              </p>
            </section>

            {/* Features */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Users size={20} className="text-blue-600" />
                <span>Özellikler</span>
              </h2>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Oyun Kayıtları</h3>
                  <p className="text-gray-600 text-sm">
                    Oyunlarınızı detaylı olarak kaydedin ve geçmiş oyunlarınızı inceleyin.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">İstatistikler</h3>
                  <p className="text-gray-600 text-sm">
                    Oyun performansınızı analiz edin ve gelişiminizi takip edin.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Grup Yönetimi</h3>
                  <p className="text-gray-600 text-sm">
                    Arkadaşlarınızla gruplar oluşturun ve oyun deneyimlerinizi paylaşın.
                  </p>
                </div>
              </div>
            </section>

            {/* Developer Info */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Heart size={20} className="text-blue-600" />
                <span>Geliştirici</span>
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 font-medium">
                  Bu uygulama, masa oyunları tutkunları için özel olarak geliştirilmiştir.
                </p>
                <p className="text-blue-600 text-sm mt-2">
                  İletişim: selimdilsadercan@gmail.com
                </p>
              </div>
            </section>

            {/* Information Pages */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <FileText size={20} className="text-blue-600" />
                <span>Yasal ve Bilgilendirme Sayfaları</span>
              </h2>
              <div className="space-y-3">
                {infoPages.map((page, index) => (
                  <Link
                    key={index}
                    href={page.href}
                    className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${page.color} rounded-lg flex items-center justify-center`}>
                        <page.icon size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{page.title}</h3>
                        <p className="text-sm text-gray-600">{page.description}</p>
                      </div>
                      <div className="text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Version Info */}
            <section>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Uygulama Versiyonu</h3>
                <p className="text-gray-600 text-sm">v1.0.0</p>
                <p className="text-gray-500 text-xs mt-1">
                  Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
