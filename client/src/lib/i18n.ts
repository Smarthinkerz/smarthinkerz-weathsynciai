import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Define translations
const resources = {
  en: {
    translation: {
      welcome: 'Welcome, {{name}}',
      opportunitiesSection: 'Opportunities',
      available: 'Available ({{count}})',
      pursued: 'Pursued ({{count}})',
      skills: 'Your Skills',
      assets: 'Your Assets',
      editProfile: 'Edit Profile',
      availableEarnings: 'Available Earnings',
      pursuedEarnings: 'Pursued Earnings',
      activePursuits: 'Active Pursuits',
      potential: 'potential',
      inProgress: 'in progress',
      opportunityCount: 'opportunities',
      aiRecommendedOpportunities: 'AI Recommended Opportunities',
      noRecommendations: 'No AI Recommendations Yet',
      updateSkills: 'Update your skills and keep pursuing opportunities to get personalized recommendations.',
      globalMap: 'Global Opportunities Map',
      pursue: 'Pursue',
      alreadyPursued: 'Already Pursued',
      regionalSettings: 'Regional Settings',
      language: 'Language',
      currency: 'Currency',
      region: 'Region',
      selectLanguage: 'Select Language',
      selectCurrency: 'Select Currency',
      selectRegion: 'Select Region',
      updateSettings: 'Update Settings',
      updating: 'Updating...',
      settingsUpdated: 'Settings Updated',
      settingsUpdatedDescription: 'Your regional preferences have been saved.',
      settingsUpdateFailed: 'Update Failed',
      logout: 'Logout',
      userDashboardDescription: 'Manage your opportunities and preferences',
      aiAgentFeedback: 'AI Agent Feedback',
      // Landing & nav
      navFeatures: 'Features',
      navPricing: 'Pricing',
      navAbout: 'About',
      navSignIn: 'Sign In',
      navGetStarted: 'Get Started',
      heroTagline: 'AI-powered business intelligence for growth teams',
      heroCtaPrimary: 'Start Free',
      heroCtaSecondary: 'See Pricing',
      // Auth
      authLogin: 'Sign In',
      authRegister: 'Create Account',
      authEmail: 'Email',
      authPassword: 'Password',
      authForgot: 'Forgot password?',
      // Dashboard generic
      dashboardOverview: 'Overview',
      dashboardSettings: 'Settings',
      dashboardBilling: 'Billing',
      dashboardAdmin: 'Admin',
      save: 'Save',
      cancel: 'Cancel',
      loading: 'Loading...'
    }
  },
  es: {
    translation: {
      welcome: 'Bienvenido, {{name}}',
      opportunities: 'Oportunidades',
      available: 'Disponible',
      pursued: 'Seguido',
      skills: 'Tus Habilidades',
      assets: 'Tus Recursos',
      editProfile: 'Editar Perfil',
      availableEarnings: 'Ganancias Disponibles',
      pursuedEarnings: 'Ganancias Seguidas',
      activePursuits: 'Actividades Activas',
      potential: 'potencial',
      inProgress: 'en progreso',
      opportunityCount: 'oportunidades',
      aiRecommended: 'Oportunidades Recomendadas por IA',
      noRecommendations: 'Aún No Hay Recomendaciones de IA',
      updateSkills: 'Actualiza tus habilidades y sigue buscando oportunidades para obtener recomendaciones personalizadas.',
      globalMap: 'Mapa Global de Oportunidades',
      pursue: 'Seguir',
      alreadyPursued: 'Ya Seguido',
      regionalSettings: 'Configuración Regional',
      language: 'Idioma',
      currency: 'Moneda',
      region: 'Región',
      selectLanguage: 'Seleccionar Idioma',
      selectCurrency: 'Seleccionar Moneda',
      selectRegion: 'Seleccionar Región',
      updateSettings: 'Actualizar Configuración',
      updating: 'Actualizando...',
      settingsUpdated: 'Configuración Actualizada',
      settingsUpdatedDescription: 'Tus preferencias regionales han sido guardadas.',
      settingsUpdateFailed: 'Actualización Fallida',
      logout: 'Cerrar sesión',
      // Landing & nav
      navFeatures: 'Características',
      navPricing: 'Precios',
      navAbout: 'Acerca de',
      navSignIn: 'Iniciar sesión',
      navGetStarted: 'Comenzar',
      heroTagline: 'Inteligencia empresarial impulsada por IA para equipos de crecimiento',
      heroCtaPrimary: 'Empezar gratis',
      heroCtaSecondary: 'Ver precios',
      // Auth
      authLogin: 'Iniciar sesión',
      authRegister: 'Crear cuenta',
      authEmail: 'Correo electrónico',
      authPassword: 'Contraseña',
      authForgot: '¿Olvidaste tu contraseña?',
      // Dashboard generic
      dashboardOverview: 'Resumen',
      dashboardSettings: 'Configuración',
      dashboardBilling: 'Facturación',
      dashboardAdmin: 'Administrador',
      save: 'Guardar',
      cancel: 'Cancelar',
      loading: 'Cargando...'
    }
  },
  ja: {
    translation: {
      welcome: 'ようこそ、{{name}}さん',
      opportunities: '機会',
      available: '利用可能',
      pursued: '追求中',
      skills: 'スキル',
      assets: 'アセット',
      editProfile: 'プロフィール編集',
      availableEarnings: '利用可能な収益',
      pursuedEarnings: '追求中の収益',
      activePursuits: 'アクティブな追求',
      potential: '潜在的',
      inProgress: '進行中',
      opportunityCount: '機会',
      aiRecommended: 'AI推奨機会',
      noRecommendations: 'まだAI推奨はありません',
      updateSkills: 'スキルを更新し、機会を追求し続けてパーソナライズされた推奨を受け取りましょう。',
      globalMap: 'グローバル機会マップ',
      pursue: '追求',
      alreadyPursued: '既に追求中',
      regionalSettings: '地域設定',
      language: '言語',
      currency: '通貨',
      region: '地域',
      selectLanguage: '言語を選択',
      selectCurrency: '通貨を選択',
      selectRegion: '地域を選択',
      updateSettings: '設定を更新',
      updating: '更新中...',
      settingsUpdated: '設定が更新されました',
      settingsUpdatedDescription: '地域設定が保存されました。',
      settingsUpdateFailed: '更新に失敗しました'
    }
  },
  zh: {
    translation: {
      welcome: '欢迎，{{name}}',
      opportunities: '机会',
      available: '可用',
      pursued: '已追求',
      skills: '你的技能',
      assets: '你的资产',
      editProfile: '编辑档案',
      availableEarnings: '可用收益',
      pursuedEarnings: '追求中的收益',
      activePursuits: '活跃追求',
      potential: '潜在',
      inProgress: '进行中',
      opportunityCount: '机会',
      aiRecommended: 'AI推荐机会',
      noRecommendations: '暂无AI推荐',
      updateSkills: '更新你的技能并继续追求机会以获取个性化推荐。',
      globalMap: '全球机会地图',
      pursue: '追求',
      alreadyPursued: '已在追求',
      regionalSettings: '区域设置',
      language: '语言',
      currency: '货币',
      region: '地区',
      selectLanguage: '选择语言',
      selectCurrency: '选择货币',
      selectRegion: '选择地区',
      updateSettings: '更新设置',
      updating: '更新中...',
      settingsUpdated: '设置已更新',
      settingsUpdatedDescription: '你的区域偏好已保存。',
      settingsUpdateFailed: '更新失败'
    }
  },
  ar: {
    translation: {
      welcome: 'مرحباً، {{name}}',
      opportunities: 'الفرص',
      available: 'متاح',
      pursued: 'قيد المتابعة',
      skills: 'مهاراتك',
      assets: 'أصولك',
      editProfile: 'تعديل الملف الشخصي',
      availableEarnings: 'الأرباح المتاحة',
      pursuedEarnings: 'الأرباح قيد المتابعة',
      activePursuits: 'المتابعات النشطة',
      potential: 'محتمل',
      inProgress: 'قيد التنفيذ',
      opportunityCount: 'فرص',
      aiRecommended: 'فرص موصى بها من الذكاء الاصطناعي',
      noRecommendations: 'لا توجد توصيات من الذكاء الاصطناعي بعد',
      updateSkills: 'قم بتحديث مهاراتك واستمر في متابعة الفرص للحصول على توصيات مخصصة.',
      globalMap: 'خريطة الفرص العالمية',
      pursue: 'متابعة',
      alreadyPursued: 'تمت المتابعة بالفعل',
      regionalSettings: 'الإعدادات الإقليمية',
      language: 'اللغة',
      currency: 'العملة',
      region: 'المنطقة',
      selectLanguage: 'اختر اللغة',
      selectCurrency: 'اختر العملة',
      selectRegion: 'اختر المنطقة',
      updateSettings: 'تحديث الإعدادات',
      updating: 'جاري التحديث...',
      settingsUpdated: 'تم تحديث الإعدادات',
      settingsUpdatedDescription: 'تم حفظ تفضيلاتك الإقليمية.',
      settingsUpdateFailed: 'فشل التحديث'
    }
  }
};

// Initialize i18n with a promise-based initialization
export const initializeI18n = async () => {
  if (i18n.isInitialized) {
    console.log('i18n is already initialized');
    return i18n;
  }

  try {
    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false
        },
        debug: process.env.NODE_ENV === 'development',
        react: {
          useSuspense: false,
          bindI18n: 'languageChanged loaded',
          bindI18nStore: 'added removed',
          transEmptyNodeValue: '',
          transSupportBasicHtmlNodes: true,
          transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p']
        }
      });

    // Add a language change listener
    i18n.on('languageChanged', (lng) => {
      console.log('Language changed event fired with language:', lng);
      document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    });

    console.log('i18n initialized with language:', i18n.language);
    return i18n;
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    throw error;
  }
};

export default i18n;