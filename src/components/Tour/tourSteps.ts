import { TranslationKey } from '../../i18n';

export interface TourStep {
    target: string;
    titleKey: TranslationKey;
    descriptionKey: TranslationKey;
}

export const TOUR_STEPS: TourStep[] = [
    {
        target: '[data-tour="image-overlay"]',
        titleKey: 'tourStep1Title',
        descriptionKey: 'tourStep1Desc',
    },
    {
        target: '[data-tour="video-overlay"]',
        titleKey: 'tourStep2Title',
        descriptionKey: 'tourStep2Desc',
    },
    {
        target: '[data-tour="grid-type"]',
        titleKey: 'tourStep3Title',
        descriptionKey: 'tourStep3Desc',
    },
    {
        target: '[data-tour="line-color"]',
        titleKey: 'tourStep4Title',
        descriptionKey: 'tourStep4Desc',
    },
    {
        target: '[data-tour="line-size"]',
        titleKey: 'tourStep5Title',
        descriptionKey: 'tourStep5Desc',
    },
    {
        target: '[data-tour="opacity"]',
        titleKey: 'tourStep6Title',
        descriptionKey: 'tourStep6Desc',
    },
    {
        target: '[data-tour="quick-color"]',
        titleKey: 'tourStep7Title',
        descriptionKey: 'tourStep7Desc',
    },
    {
        target: '[data-tour="site-rules"]',
        titleKey: 'tourStep8Title',
        descriptionKey: 'tourStep8Desc',
    },
];
