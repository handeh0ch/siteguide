import { autoPlacement, computePosition, Middleware, offset, Placement } from '@floating-ui/dom';
import { TourStep } from '../tour-step';
import { PopupType } from '../types/popup.type';
import { isDefined, isNullOrUndefined } from '../utils/base.util';
import { getPositionType } from '../utils/is-fixed.util';
import { IPopupContentRenderer } from './interfaces/popup-content-renderer.interface';
import { IRenderer } from './interfaces/renderer.interface';
import { CustomStepRenderer } from './strategies/custom-step.renderer';
import { TextStepRenderer } from './strategies/text-step.renderer';
import { updatePopupLayout } from './utils/update-popup-layout.util';

export class FloatingUiPopupRenderer implements IRenderer {
    private readonly _renderContentStrategy: Map<PopupType, IPopupContentRenderer> = new Map();

    constructor() {
        this.setUpStrategies();
    }

    public render(popup: HTMLElement, step: TourStep): void {
        if (!this._renderContentStrategy.has(step.popupData.type)) {
            throw new Error('Missing popup creator strategy');
        }

        popup.style.position = getPositionType(step.hostElement!);
        updatePopupLayout(popup, step.popupData, step.tour);
        this._renderContentStrategy.get(step.popupData.type)?.renderContent(popup, step.popupData, step.tour.config);

        this.updatePosition(popup, step);
        step.hostElement?.scrollIntoView(step.tour.config.scrollTo);
    }

    public updatePosition(popup: HTMLElement, step: TourStep): void {
        const scrollTop: number =
            popup.style.position === 'fixed' ? window.scrollY || document.documentElement.scrollTop : 0;

        const middleware: Middleware[] = [];
        const placement: Placement | undefined =
            isDefined(step.popupData.position) && step.popupData.position !== 'auto'
                ? (step.popupData.position as Placement)
                : undefined;

        if (step.popupData.position === 'auto' || isNullOrUndefined(placement)) {
            middleware.push(autoPlacement());
        }

        computePosition(step.hostElement!, popup, {
            placement: placement,
            middleware: [...middleware, offset(20)],
        }).then(({ x, y }) => {
            Object.assign(popup.style, {
                top: `${y - scrollTop}px`,
                left: `${x}px`,
            });
        });
    }

    private setUpStrategies(): void {
        this._renderContentStrategy.set('text', new TextStepRenderer());
        this._renderContentStrategy.set('custom', new CustomStepRenderer());
    }
}
