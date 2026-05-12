import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Language } from '../../types';
import { t } from '../../i18n';
import { TOUR_STEPS } from './tourSteps';

interface TourProps {
    lang: Language;
    onComplete: () => void;
}

interface TourLayout {
    highlight: { top: number; left: number; width: number; height: number };
    tooltip: { top: number; left: number; arrowLeft: number; arrowDir: 'up' | 'down' };
}

const PAD = 6;
const GAP = 10;
const ARROW = 8;
const TIP_W = 280;

const Tour: React.FC<TourProps> = ({ lang, onComplete }) => {
    const [step, setStep] = useState(0);
    const [entering, setEntering] = useState(true);
    const [sliding, setSliding] = useState<'next' | 'prev' | null>(null);
    const [layout, setLayout] = useState<TourLayout | null>(null);
    const tipRef = useRef<HTMLDivElement>(null);

    const current = TOUR_STEPS[step];
    const total = TOUR_STEPS.length;

    // Calculate both highlight and tooltip positions in a single state update
    const recalc = useCallback(() => {
        const el = document.querySelector(TOUR_STEPS[step].target) as HTMLElement | null;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const tipH = tipRef.current?.offsetHeight || 140;
        const vpH = window.innerHeight;
        const vpW = window.innerWidth;

        // Auto-detect: place tooltip where there's more space
        let top: number;
        let arrowDir: 'up' | 'down';

        if (rect.top > vpH - rect.bottom) {
            top = rect.top - tipH - GAP - PAD;
            arrowDir = 'down';
        } else {
            top = rect.bottom + GAP + PAD;
            arrowDir = 'up';
        }

        top = Math.max(4, Math.min(top, vpH - tipH - 4));

        let left = rect.left + (rect.width - TIP_W) / 2;
        left = Math.max(8, Math.min(left, vpW - TIP_W - 8));

        const arrowLeft = Math.max(
            20,
            Math.min(rect.left + rect.width / 2 - left - ARROW, TIP_W - 40)
        );

        setLayout({
            highlight: {
                top: rect.top - PAD,
                left: rect.left - PAD,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
            },
            tooltip: { top, left, arrowLeft, arrowDir },
        });
    }, [step]);

    // When step changes: scroll target into view, then recalculate
    useEffect(() => {
        const el = document.querySelector(TOUR_STEPS[step].target) as HTMLElement | null;
        if (!el) return;

        el.scrollIntoView({ behavior: 'instant', block: 'nearest' });
        recalc();

        const raf = requestAnimationFrame(recalc);
        return () => cancelAnimationFrame(raf);
    }, [step, recalc]);

    // Keep positions synced during scroll and resize
    useEffect(() => {
        let scrollRaf = 0;
        const onScroll = () => {
            cancelAnimationFrame(scrollRaf);
            scrollRaf = requestAnimationFrame(recalc);
        };

        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);

        return () => {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onScroll);
            cancelAnimationFrame(scrollRaf);
        };
    }, [recalc]);

    // Entrance fade
    useEffect(() => {
        const id = requestAnimationFrame(() => setEntering(false));
        return () => cancelAnimationFrame(id);
    }, []);

    const goTo = useCallback((next: number, dir: 'next' | 'prev') => {
        setSliding(dir);
        setTimeout(() => {
            setStep(next);
            setSliding(null);
        }, 180);
    }, []);

    const next = useCallback(() => {
        if (step < total - 1) goTo(step + 1, 'next');
        else onComplete();
    }, [step, total, goTo, onComplete]);

    const prev = useCallback(() => {
        if (step > 0) goTo(step - 1, 'prev');
    }, [step, goTo]);

    const skip = useCallback(() => onComplete(), [onComplete]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') next();
            else if (e.key === 'ArrowLeft') prev();
            else if (e.key === 'Escape') skip();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [next, prev, skip]);

    const slideClass = sliding ? `tour-tip-slide-${sliding}` : '';
    const hl = layout?.highlight;
    const tip = layout?.tooltip;

    return (
        <div className={`tour-root ${entering ? '' : 'tour-active'}`}>
            {hl && (
                <div
                    className="tour-cutout"
                    style={{ top: hl.top, left: hl.left, width: hl.width, height: hl.height }}
                    onClick={skip}
                />
            )}

            {tip && (
                <div
                    ref={tipRef}
                    className={`tour-tip ${slideClass}`}
                    style={{ top: tip.top, left: tip.left }}
                >
                    <div
                        className={`tour-arrow tour-arrow-${tip.arrowDir}`}
                        style={{
                            left: tip.arrowLeft,
                            ...(tip.arrowDir === 'up' ? { top: -ARROW } : { bottom: -ARROW }),
                        }}
                    />

                    <div className="tour-counter">
                        {step + 1} / {total}
                    </div>

                    <h3 className="tour-title">{t(current.titleKey, lang)}</h3>
                    <p className="tour-desc">{t(current.descriptionKey, lang)}</p>

                    <div className="tour-bar">
                        <div
                            className="tour-bar-fill"
                            style={{ width: `${((step + 1) / total) * 100}%` }}
                        />
                    </div>

                    <div className="tour-nav">
                        <button className="tour-btn tour-btn-skip" onClick={skip}>
                            {t('tourSkip', lang)}
                        </button>
                        <div className="tour-nav-right">
                            {step > 0 && (
                                <button className="tour-btn tour-btn-prev" onClick={prev}>
                                    {t('tourPrev', lang)}
                                </button>
                            )}
                            <button className="tour-btn tour-btn-next" onClick={next}>
                                {step === total - 1 ? t('tourFinish', lang) : t('tourNext', lang)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tour;
