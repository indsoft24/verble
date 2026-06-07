import {
    createContext,
    useContext,
    useState,
    useLayoutEffect,
    useMemo,
    useCallback,
    type ReactNode,
} from 'react';

export type UserLayoutVariant = 'default' | 'learning' | 'conversations' | 'activity';

export interface UserLayoutPageConfig {
    title?: string;
    fullWidth?: boolean;
    variant?: UserLayoutVariant;
}

const DEFAULT_CONFIG: Required<Pick<UserLayoutPageConfig, 'title'>> & UserLayoutPageConfig = {
    title: 'My Dashboard',
    fullWidth: false,
    variant: 'default',
};

interface UserLayoutConfigContextValue {
    config: UserLayoutPageConfig;
    setConfig: (config: UserLayoutPageConfig) => void;
}

const UserLayoutConfigContext = createContext<UserLayoutConfigContextValue | undefined>(undefined);

function userLayoutConfigsEqual(a: UserLayoutPageConfig, b: UserLayoutPageConfig): boolean {
    return a.title === b.title && a.fullWidth === b.fullWidth && a.variant === b.variant;
}

export function UserLayoutConfigProvider({ children }: { children: ReactNode }) {
    const [config, setConfigState] = useState<UserLayoutPageConfig>(DEFAULT_CONFIG);

    const setConfig = useCallback((next: UserLayoutPageConfig) => {
        setConfigState((prev) => {
            const merged = { ...DEFAULT_CONFIG, ...next };
            if (userLayoutConfigsEqual(prev, merged)) return prev;
            return merged;
        });
    }, []);

    const value = useMemo(() => ({ config, setConfig }), [config, setConfig]);

    return (
        <UserLayoutConfigContext.Provider value={value}>{children}</UserLayoutConfigContext.Provider>
    );
}

export function useUserLayoutConfig(): UserLayoutPageConfig {
    const ctx = useContext(UserLayoutConfigContext);
    return ctx?.config ?? DEFAULT_CONFIG;
}

export function useUserLayoutConfigSetter() {
    const ctx = useContext(UserLayoutConfigContext);
    return ctx?.setConfig;
}

/** Call at the top of a page inside UserAppShell to set chrome (title, variant, fullWidth). */
export function useUserLayoutPage(pageConfig: UserLayoutPageConfig) {
    const setConfig = useUserLayoutConfigSetter();

    useLayoutEffect(() => {
        if (!setConfig) return;
        setConfig(pageConfig);
        return () => setConfig(DEFAULT_CONFIG);
    }, [
        setConfig,
        pageConfig.title,
        pageConfig.fullWidth,
        pageConfig.variant,
    ]);
}
