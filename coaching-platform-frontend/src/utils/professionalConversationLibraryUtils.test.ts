import { describe, expect, it } from 'vitest';
import { collectProfessionalConversationTagOptions } from './professionalConversationLibraryUtils';
import type { DailyContent } from '../services/dailyContentService';

const makeConv = (tags: string[], opts?: Partial<DailyContent>): DailyContent =>
    ({
        _id: '1',
        type: 'CONVERSATION',
        level: 'GOLD',
        title: 'Test',
        date: '2026-01-01',
        metadata: { isProfessionalLibrary: true, tags },
        ...opts,
    }) as DailyContent;

describe('collectProfessionalConversationTagOptions', () => {
    it('aggregates unique tags from professional conversations', () => {
        const result = collectProfessionalConversationTagOptions([
            makeConv(['interview', 'workplace']),
            makeConv(['workplace', 'formal'], { _id: '2' }),
        ]);
        expect(result).toEqual(['formal', 'interview', 'workplace']);
    });

    it('skips non-professional entries', () => {
        const result = collectProfessionalConversationTagOptions([
            makeConv(['silver-only'], { level: 'SILVER', metadata: { tags: ['silver-only'] } }),
            makeConv(['gold-tag']),
        ]);
        expect(result).toEqual(['gold-tag']);
    });

    it('dedupes case-insensitively keeping first casing', () => {
        const result = collectProfessionalConversationTagOptions([
            makeConv(['Interview', 'INTERVIEW']),
        ]);
        expect(result).toEqual(['Interview']);
    });
});
