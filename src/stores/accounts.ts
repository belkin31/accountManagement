import { defineStore } from 'pinia';

export interface Account {
    id: string;
    labels: { text: string }[];
    type: 'ldap' | 'local';
    login: string;
    password: string | null;
}

export const useAccountsStore = defineStore('accounts', {
    state: () => ({
        accounts: [] as Account[],
    }),
    actions: {
        setAccounts(accounts: Account[]) {
            this.accounts = accounts;
        },
    },
    persist: true,
});
