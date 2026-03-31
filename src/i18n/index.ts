import { Language } from '../types';

const translations = {
    appName: {
        en: 'Composition Grid',
        vi: 'Lưới Bố Cục',
    },
    appTagline: {
        en: 'Composition Guides for Every Shot',
        vi: 'Hướng Dẫn Bố Cục Cho Mọi Bức Ảnh',
    },
    enableGrid: {
        en: 'Image Overlay',
        vi: 'Lưới Phủ Ảnh',
    },
    videoEnabled: {
        en: 'Video Overlay',
        vi: 'Lưới Phủ Video',
    },
    gridType: {
        en: 'Grid Type',
        vi: 'Loại Lưới',
    },
    showDots: {
        en: 'Show Dots',
        vi: 'Hiện Chấm',
    },
    thirds: {
        en: 'Rule of Thirds',
        vi: 'Quy Tắc 1/3',
    },
    golden: {
        en: 'Golden Ratio',
        vi: 'Tỷ Lệ Vàng',
    },
    fibonacci: {
        en: 'Fibonacci Spiral',
        vi: 'Xoắn Ốc Fibonacci',
    },
    triangle: {
        en: 'Triangle',
        vi: 'Tam Giác',
    },
    fifths: {
        en: 'Fifths',
        vi: 'Quy Tắc 1/5',
    },
    center: {
        en: 'Center',
        vi: 'Tâm Đối Xứng',
    },
    spiralOrientation: {
        en: 'Spiral Direction',
        vi: 'Hướng Xoắn Ốc',
    },
    toggleGrid: {
        en: 'Toggle Composition Grid',
        vi: 'Bật/Tắt Lưới Bố Cục',
    },
    lineColor: {
        en: 'Line Color',
        vi: 'Màu Đường Kẻ',
    },
    dotColor: {
        en: 'Dot Color',
        vi: 'Màu Chấm',
    },
    dotSize: {
        en: 'Dot Size',
        vi: 'Kích Thước Chấm',
    },
    lineSize: {
        en: 'Line Width',
        vi: 'Độ Dày Đường Kẻ',
    },
    lineStyle: {
        en: 'Line Style',
        vi: 'Kiểu Nét',
    },
    opacity: {
        en: 'Opacity',
        vi: 'Độ Mờ',
    },
    solid: {
        en: 'Solid',
        vi: 'Nét Liền',
    },
    dashed: {
        en: 'Dashed',
        vi: 'Nét Đứt',
    },
    minImageSize: {
        en: 'Skip Small Images',
        vi: 'Bỏ Qua Ảnh Dưới',
    },
    resetSettings: {
        en: 'Reset to Defaults',
        vi: 'Khôi Phục Mặc Định',
    },
    resetGridType: {
        en: 'Reset grid type',
        vi: 'Đặt lại lưới mặc định',
    },
    tabSiteRules: {
        en: 'Allowed Sites',
        vi: 'Phạm Vi Hiển Thị',
    },
    siteMode: {
        en: 'Mode',
        vi: 'Chế Độ',
    },
    siteModeAll: {
        en: 'All Sites',
        vi: 'Tất Cả',
    },
    siteModeBlock: {
        en: 'Block List',
        vi: 'Chặn',
    },
    siteModeAllow: {
        en: 'Allow List',
        vi: 'Cho Phép',
    },
    siteModeAllDesc: {
        en: 'Grid appears on all websites',
        vi: 'Lưới hiện trên tất cả trang',
    },
    siteModeBlockDesc: {
        en: 'Grid appears everywhere except these sites',
        vi: 'Lưới hiện mọi nơi trừ các trang này',
    },
    siteModeAllowDesc: {
        en: 'Grid only appears on these sites',
        vi: 'Lưới chỉ hiện trên các trang này',
    },
    addSite: {
        en: 'Add',
        vi: 'Thêm',
    },
    siteInputPlaceholder: {
        en: 'e.g. facebook.com',
        vi: 'VD: facebook.com',
    },
    siteBlockedAlert: {
        en: 'Composition Grid is disabled on this website.',
        vi: 'Lưới bố cục đã bị tắt trên trang này.',
    },
    noSites: {
        en: 'No sites added yet',
        vi: 'Chưa có trang nào',
    },
    language: {
        en: 'Language',
        vi: 'Ngôn Ngữ',
    },
    enabled: {
        en: 'On',
        vi: 'Bật',
    },
    disabled: {
        en: 'Off',
        vi: 'Tắt',
    },
    version: {
        en: 'Version',
        vi: 'Phiên Bản',
    },
    authorName: {
        en: 'Quy Nguyen',
        vi: 'Quy Nguyen',
    },
    authorWebsite: {
        en: 'https://ngocquy.dev',
        vi: 'https://ngocquy.dev',
    },
    theme: {
        en: 'Theme',
        vi: 'Giao Diện',
    },
    dark: {
        en: 'Dark',
        vi: 'Tối',
    },
    light: {
        en: 'Light',
        vi: 'Sáng',
    },
    quickColor: {
        en: 'Quick Color',
        vi: 'Đổi Màu Nhanh',
    },
    quickColorHint: {
        en: 'Applied to lines & dots',
        vi: 'Áp dụng cho cả đường kẻ và chấm',
    },
    fileAccessNotice: {
        en: 'Enable "Allow access to file URLs" in extension settings to use on local files.',
        vi: 'Bật "Cho phép truy cập URL tệp" trong cài đặt extension để dùng trên file cục bộ.',
    },
    fileAccessAction: {
        en: 'Open Settings',
        vi: 'Mở Cài Đặt',
    },
    buyMeCoffee: {
        en: 'Buy Me a Coffee',
        vi: 'Mời Tác Giả Cà Phê',
    },
    donateMessage: {
        en: 'Enjoying this extension? Support its development!',
        vi: 'Thích extension này? Hãy ủng hộ tác giả!',
    },
} as const satisfies Record<string, Record<Language, string>>;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language): string {
    return translations[key][lang];
}

