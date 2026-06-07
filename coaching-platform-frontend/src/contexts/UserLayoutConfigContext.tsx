import {
    createContext,
    useContext,
    useState,
    useLayoutEffect,
    useMemo,
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

export function UserLayoutConfigProvider({ children }: { children: ReactNode }) {
    const [config, setConfigState] = useState<UserLayoutPageConfig>(DEFAULT_CONFIG);

    const setConfig = (next: UserLayoutPageConfig) => {
        setConfigState({ ...DEFAULT_CONFIG, ...next });
    };

    const value = useMemo(() => ({ config, setConfig }), [config]);

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
