import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Stack,
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import {
    getActiveSubscriptionPlans,
    type SubscriptionPlanPublic,
} from '../../services/subscriptionPlanService';
import PlanPriceOffer from './PlanPriceOffer';
import {
    findPlanByNameMatch,
    formatPlanPrice,
    getPlanOfferLabels,
} from '../../utils/planPriceFormat';

type PricingRow = {
    module: string;
    features: string;
    offerLabel: string;
    originalLabel: string | null;
    isFreeText?: boolean;
};

const LANDING_PRICING_META: Array<{
    module: string;
    features: string;
    nameMatch: RegExp;
    freeText?: string;
}> = [
    {
        module: 'FREE',
        features: '1000+ Daily Word and 500+ Phrase of Day',
        nameMatch: /free foundation/i,
        freeText: 'FREE',
    },
    {
        module: 'Bronze',
        features: 'Daily One Minute read with key words and Essential Vocabulary',
        nameMatch: /bronze/i,
    },
    {
        module: 'SILVER',
        features: 'Practical life Conversations, Daily Grammar Puzzles',
        nameMatch: /silver/i,
    },
    {
        module: 'GOLD',
        features: 'Scene Explanations, Professional Dialogues, AI Prompts',
        nameMatch: /gold professional/i,
    },
    {
        module: 'FULL COURSE',
        features: 'Zero to Hero, 100 Videos, 08 Modules, 80 Quiz, 200 hours of video',
        nameMatch: /^full course$/i,
    },
    {
        module: 'AI Learning',
        features: 'Learn in English, Hindi, Hinglish. Speak or Type to learn.',
        nameMatch: /ai learning/i,
    },
    {
        module: 'BONUS',
        features: 'Famous Speeches, Song Lyrics, IG Learning Feeds',
        nameMatch: /bonus/i,
        freeText: 'FREE with bundle',
    },
];

function buildPricingRows(plans: SubscriptionPlanPublic[]): PricingRow[] {
    return LANDING_PRICING_META.map((meta) => {
        const plan = findPlanByNameMatch(plans, meta.nameMatch);
        if (meta.freeText) {
            const { original } = plan ? getPlanOfferLabels(plan) : { original: null };
            return {
                module: meta.module,
                features: meta.features,
                offerLabel: meta.freeText,
                originalLabel: original,
                isFreeText: true,
            };
        }
        if (!plan) {
            return {
                module: meta.module,
                features: meta.features,
                offerLabel: '—',
                originalLabel: null,
            };
        }
        const { offer, original } = getPlanOfferLabels(plan);
        return {
            module: meta.module,
            features: meta.features,
            offerLabel: plan.price <= 0 ? 'FREE' : offer,
            originalLabel: original,
        };
    });
}

function PricingValueCell({
    offerLabel,
    originalLabel,
    emphasize = false,
}: {
    offerLabel: string;
    originalLabel: string | null;
    emphasize?: boolean;
}) {
    if (offerLabel === '—') {
        return (
            <Typography variant="body2" color="text.secondary">
                —
            </Typography>
        );
    }
    return (
        <PlanPriceOffer
            offerLabel={offerLabel}
            originalLabel={originalLabel}
            size={emphasize ? 'lg' : 'sm'}
            align="right"
        />
    );
}

const LandingPricingSection: React.FC = () => {
    const [plans, setPlans] = useState<SubscriptionPlanPublic[]>([]);

    useEffect(() => {
        getActiveSubscriptionPlans({ includeAll: true })
            .then(setPlans)
            .catch(() => setPlans([]));
    }, []);

    const rows = useMemo(() => buildPricingRows(plans), [plans]);

    const fullCoursePlan = useMemo(() => findPlanByNameMatch(plans, /^full course$/i), [plans]);

    const summary = useMemo(() => {
        const totalOriginal = LANDING_PRICING_META.reduce((sum, meta) => {
            const plan = findPlanByNameMatch(plans, meta.nameMatch);
            if (!plan || meta.freeText) return sum;
            const value = plan.marketValue != null && plan.marketValue > 0 ? plan.marketValue : plan.price;
            return sum + value;
        }, 0);

        const fullLabels = fullCoursePlan ? getPlanOfferLabels(fullCoursePlan) : null;

        return {
            totalCombined: totalOriginal > 0 ? formatPlanPrice(totalOriginal) : '—',
            standardBundle: fullLabels?.original ?? fullLabels?.offer ?? '—',
            limitedOffer: fullLabels?.offer ?? '—',
        };
    }, [plans, fullCoursePlan]);

    return (
        <TableContainer
            component={Paper}
            elevation={0}
            sx={{
                borderRadius: { xs: '16px', md: '24px' },
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
        >
            {/* Mobile: unified pricing list */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Box
                    sx={{
                        px: { xs: 2, sm: 2.5 },
                        py: 1.75,
                        bgcolor: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: '#64748b',
                            fontSize: '0.7rem',
                        }}
                    >
                        Learning modules & pricing
                    </Typography>
                </Box>

                {rows.map((row, index) => (
                    <Box
                        key={row.module}
                        sx={{
                            px: { xs: 2, sm: 2.5 },
                            py: { xs: 2, sm: 2.25 },
                            borderBottom: index < rows.length - 1 ? '1px solid #f1f5f9' : 'none',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 2,
                                mb: 1,
                            }}
                        >
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    fontSize: { xs: '0.9rem', sm: '0.95rem' },
                                    lineHeight: 1.3,
                                    flex: 1,
                                    minWidth: 0,
                                }}
                            >
                                {row.module}
                            </Typography>
                            <Box sx={{ flexShrink: 0 }}>
                                <PricingValueCell
                                    offerLabel={row.offerLabel}
                                    originalLabel={row.originalLabel}
                                />
                            </Box>
                        </Box>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#64748b',
                                lineHeight: 1.6,
                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                pr: { xs: 0, sm: 6 },
                            }}
                        >
                            {row.features}
                        </Typography>
                    </Box>
                ))}

                <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2.25, bgcolor: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', flex: 1 }}>
                            Total Combined Value
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>
                            {summary.totalCombined}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2.25, bgcolor: '#ecfdf5', borderTop: '1px solid #d1fae5' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669', flex: 1, lineHeight: 1.4 }}>
                            Standard Bundle Price
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669', flexShrink: 0 }}>
                            {summary.standardBundle}
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        px: { xs: 2, sm: 2.5 },
                        py: 2.25,
                        bgcolor: '#fef2f2',
                        borderTop: '1px solid #fecaca',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                            <LocalFireDepartmentIcon sx={{ color: '#ef4444', fontSize: 20, flexShrink: 0 }} />
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 900, color: '#ef4444', lineHeight: 1.35, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}
                            >
                                Limited Time Special Offer
                            </Typography>
                        </Stack>
                        <Box sx={{ color: '#ef4444', flexShrink: 0 }}>
                            <PricingValueCell
                                offerLabel={summary.limitedOffer}
                                originalLabel={
                                    fullCoursePlan && fullCoursePlan.marketValue != null && fullCoursePlan.marketValue > fullCoursePlan.price
                                        ? formatPlanPrice(fullCoursePlan.marketValue)
                                        : null
                                }
                                emphasize
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Desktop: table */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell sx={{ color: '#0f172a', fontWeight: 800, py: 3 }}>
                                Learning Module
                            </TableCell>
                            <TableCell sx={{ color: '#0f172a', fontWeight: 800, py: 3 }}>
                                Key Features Included
                            </TableCell>
                            <TableCell sx={{ color: '#0f172a', fontWeight: 800, py: 3 }} align="right">
                                Price
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.module} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#1e293b', verticalAlign: 'top' }}>
                                    {row.module}
                                </TableCell>
                                <TableCell sx={{ py: 2.5, color: '#64748b', verticalAlign: 'top' }}>
                                    {row.features}
                                </TableCell>
                                <TableCell align="right" sx={{ py: 2.5, verticalAlign: 'top' }}>
                                    <PricingValueCell offerLabel={row.offerLabel} originalLabel={row.originalLabel} />
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                            <TableCell colSpan={2} sx={{ fontWeight: 800, py: 3, fontSize: '1.1rem', color: '#0f172a' }}>
                                Total Combined Value
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, py: 3, fontSize: '1.1rem', color: '#0f172a' }}>
                                {summary.totalCombined}
                            </TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: '#ecfdf5' }}>
                            <TableCell colSpan={2} sx={{ fontWeight: 800, py: 3, fontSize: '1.2rem', color: '#059669' }}>
                                Standard Bundle Price (78% Off)
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, py: 3, fontSize: '1.2rem', color: '#059669' }}>
                                {summary.standardBundle}
                            </TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: '#fef2f2' }}>
                            <TableCell colSpan={2}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LocalFireDepartmentIcon sx={{ color: '#ef4444', mr: 1 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#ef4444' }}>
                                        Limited Time Special Offer
                                    </Typography>
                                </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 3 }}>
                                <Box sx={{ color: '#ef4444' }}>
                                    <PricingValueCell
                                        offerLabel={summary.limitedOffer}
                                        originalLabel={
                                            fullCoursePlan && fullCoursePlan.marketValue != null && fullCoursePlan.marketValue > fullCoursePlan.price
                                                ? formatPlanPrice(fullCoursePlan.marketValue)
                                                : null
                                        }
                                        emphasize
                                    />
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Box>
        </TableContainer>
    );
};

export default LandingPricingSection;

export { findPlanByNameMatch, getPlanOfferLabels };
export type { SubscriptionPlanPublic };
