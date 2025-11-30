"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Info,
  FileText,
  Shield,
  Users,
  Heart,
  Star,
} from "@phosphor-icons/react";
import Link from "next/link";

export default function AboutPage() {
  const router = useRouter();

  const infoPages = [
    {
      title: "Gizlilik Politikası",
      description: "Kişisel verilerinizin nasıl korunduğunu öğrenin",
      icon: Shield,
      href: "/privacy",
      color: "bg-blue-500",
    },
    {
      title: "Geri Bildirim",
      description: "Görüş ve önerilerinizi bizimle paylaşın",
      icon: Heart,
      href: "/feedback",
      color: "bg-pink-500",
    },
  ];

  return (
    <div
      className="min-h-screen pb-20"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Main Content */}
      <div className="px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 mb-6"
        >
          <ArrowLeft size={20} weight="regular" />
          <span className="font-medium">Geri</span>
        </button>

        {/* About Content */}
        <div className="bg-white dark:bg-[var(--card-background)] rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
              <Info size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-[var(--foreground)]">Hakkımızda</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Board Games Companion</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* App Description */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-[var(--foreground)] mb-3 flex items-center space-x-2">
                <Star size={20} className="text-blue-600 dark:text-blue-400" />
                <span>Uygulama Hakkında</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Board Games Companion, masa oyunları severler için özel olarak
                tasarlanmış bir uygulamadır. Oyunlarınızı kaydetmenize,
                istatistiklerinizi takip etmenize ve arkadaşlarınızla oyun
                deneyimlerinizi paylaşmanıza olanak tanır.
              </p>
            </section>

            {/* Features */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-[var(--foreground)] mb-3 flex items-center space-x-2">
                <Users size={20} className="text-blue-600 dark:text-blue-400" />
                <span>Özellikler</span>
              </h2>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Oyun Kayıtları
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Oyunlarınızı detaylı olarak kaydedin ve geçmiş oyunlarınızı
                    inceleyin.
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                    İstatistikler
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Oyun performansınızı analiz edin ve gelişiminizi takip edin.
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Grup Yönetimi
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Arkadaşlarınızla gruplar oluşturun ve oyun deneyimlerinizi
                    paylaşın.
                  </p>
                </div>
              </div>
            </section>

            {/* Developer Info */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-[var(--foreground)] mb-3 flex items-center space-x-2">
                <Heart size={20} className="text-blue-600 dark:text-blue-400" />
                <span>Geliştirici</span>
              </h2>
              <div className="bg-blue-50 dark:bg-blue-500/20 p-4 rounded-lg">
                <p className="text-blue-800 dark:text-blue-300 font-medium">
                  Bu uygulama, masa oyunları tutkunları için özel olarak
                  geliştirilmiştir.
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">
                  İletişim: selimdilsadercan@gmail.com
                </p>
              </div>
            </section>

            {/* Information Pages */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-[var(--foreground)] mb-4 flex items-center space-x-2">
                <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                <span>Yasal ve Bilgilendirme Sayfaları</span>
              </h2>
              <div className="space-y-3">
                {infoPages.map((page, index) => (
                  <Link
                    key={index}
                    href={page.href}
                    className="block bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 ${page.color} rounded-lg flex items-center justify-center`}
                      >
                        <page.icon size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                          {page.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {page.description}
                        </p>
                      </div>
                      <div className="text-gray-400 dark:text-gray-500">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Version Info */}
            <section>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Uygulama Versiyonu
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">v1.0.0</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                  Son güncelleme: {new Date().toLocaleDateString("tr-TR")}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
