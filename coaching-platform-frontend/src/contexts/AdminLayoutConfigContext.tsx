import {
    createContext,
    useContext,
    useState,
    useLayoutEffect,
    useMemo,
    useCallback,
    type ReactNode,
} from 'react';

export interface AdminLayoutPageConfig {
    title?: string;
}

const DEFAULT_CONFIG: Required<AdminLayoutPageConfig> = {
    title: 'Admin Panel',
};

interface AdminLayoutConfigContextValue {
    config: AdminLayoutPageConfig;
    setConfig: (config: AdminLayoutPageConfig) => void;
}

const AdminLayoutConfigContext = createContext<AdminLayoutConfigContextValue | undefined>(undefined);

export function AdminLayoutConfigProvider({ children }: { children: ReactNode }) {
    const [config, setConfigState] = useState<AdminLayoutPageConfig>(DEFAULT_CONFIG);

    const setConfig = useCallback((next: AdminLayoutPageConfig) => {
        setConfigState((prev) => {
            const merged = { ...DEFAULT_CONFIG, ...next };
            if (prev.title === merged.title) return prev;
            return merged;
        });
    }, []);

    const value = useMemo(() => ({ config, setConfig }), [config, setConfig]);

    return (
        <AdminLayoutConfigContext.Provider value={value}>{children}</AdminLayoutConfigContext.Provider>
    );
}

export function useAdminLayoutConfig(): AdminLayoutPageConfig {
    const ctx = useContext(AdminLayoutConfigContext);
    return ctx?.config ?? DEFAULT_CONFIG;
}

function useAdminLayoutConfigSetter() {
    const ctx = useContext(AdminLayoutConfigContext);
    return ctx?.setConfig;
}

/** Call at the top of a page inside AdminAppShell to set chrome (title). */
export function useAdminLayoutPage(pageConfig: AdminLayoutPageConfig) {
    const setConfig = useAdminLayoutConfigSetter();

    useLayoutEffect(() => {
        if (!setConfig) return;
        setConfig(pageConfig);
        return () => setConfig(DEFAULT_CONFIG);
    }, [setConfig, pageConfig.title]);
}
