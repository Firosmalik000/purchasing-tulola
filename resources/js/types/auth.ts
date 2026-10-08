export type UserRole =
    | 'SUPER_ADMIN'
    | 'CENTRAL_ADMIN'
    | 'PURCHASING'
    | 'MANAGEMENT'
    | 'STORE_PIC';

export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    role: UserRole;
    is_active: boolean;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    permissions: {
        accessCentral?: boolean;
        accessStore?: boolean;
        manageStores?: boolean;
        manageUsers?: boolean;
        manageMasterData?: boolean;
        manageInventory?: boolean;
        manageRequests?: boolean;
        manageOrders?: boolean;
        viewManagementReports?: boolean;
    };
};

export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
