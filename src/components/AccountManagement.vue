<script setup lang="ts">
import { ref } from 'vue';
import { useAccountsStore, type Account } from '@/stores/accounts';

const accountsStore = useAccountsStore();

interface FormAccount extends Omit<Account, 'labels'> {
  labelsInput: string;
  errors: {
    labels: string[];
    login: string[];
    password: string[];
  };
}

const accounts = ref<FormAccount[]>(accountsStore.accounts.map((acc: any) => ({
  id: acc.id,
  labelsInput: acc.labels.map((label: { text: string }) => label.text).join(';'),
  type: acc.type,
  login: acc.login,
  password: acc.password,
  errors: { labels: [], login: [], password: [] },
})));

const typeOptions = [
  { title: 'LDAP', value: 'ldap' },
  { title: 'Локальная', value: 'local' },
];

const rules = {
  login: [
    (v: string) => !!v || 'Логин обязателен',
    (v: string) => (v.length <= 100 || 'Максимум 100 символов'),
  ],
  password: [
    (v: string) => !!v || 'Пароль обязателен',
    (v: string) => (v.length <= 100 || 'Максимум 100 символов'),
  ],
  labels: [
    (v: string) => (v.length <= 50 || 'Максимум 50 символов'),
  ],
};

const validateField = (account: FormAccount, field: 'labels' | 'login' | 'password' | 'type') => {
  if (field === 'labels') {
    account.errors.labels = rules.labels
        .map(rule => rule(account.labelsInput))
        .filter(error => typeof error === 'string') as string[];
  } else if (field === 'login') {
    account.errors.login = rules.login
        .map(rule => rule(account.login))
        .filter(error => typeof error === 'string') as string[];
  } else if (field === 'password' && account.type === 'local') {
    account.errors.password = rules.password
        .map(rule => rule(account.password))
        .filter(error => typeof error === 'string') as string[];
  } else if (field === 'password' && account.type === 'ldap') {
    account.errors.password = [];
  } else if (field === 'type') {
    account.errors.password = [];
    if (account.type === 'ldap') {
      account.password = '';
    }
  }
};

const validateAccount = (account: FormAccount): boolean => {
  validateField(account, 'labels');
  validateField(account, 'login');
  validateField(account, 'password');
  return (
      account.errors.labels.length === 0 &&
      account.errors.login.length === 0 &&
      (account.type === 'ldap' || account.errors.password.length === 0)
  );
};

const saveAccounts = () => {
  const validAccounts: Account[] = accounts.value
      .filter(acc => acc.login && (acc.type === 'ldap' || acc.password))
      .map(acc => ({
        id: acc.id,
        labels: acc.labelsInput
            .split(';')
            .filter(label => label.trim())
            .map(label => ({ text: label.trim() })),
        type: acc.type,
        login: acc.login,
        password: acc.type === 'ldap' ? null : acc.password,
      }));
  accountsStore.setAccounts(validAccounts);
};

const handleFieldChange = (account: FormAccount, field: 'labels' | 'login' | 'password' | 'type') => {
  if (field === 'type') {
    account.errors.password = [];
    if (account.type === 'ldap') {
      account.password = '';
    }
  }
  validateField(account, field);
  if (validateAccount(account)) {
    saveAccounts();
  }
};

const addAccount = () => {
  accounts.value.push({
    id: Date.now().toString(),
    labelsInput: '',
    type: 'local',
    login: '',
    password: '',
    errors: { labels: [], login: [], password: [] },
  });
};

const deleteAccount = (index: number) => {
  accounts.value.splice(index, 1);
  saveAccounts();
};

const getFieldClass = (errors: string[]) => ({
  'form-field__input--error': errors.length > 0,
});
</script>

<template>
  <div class="account-management">
    <div class="account-management__header">
      <h2 class="account-management__title">Управление учетными записями</h2>
      <button class="account-management__add-btn" @click="addAccount">+</button>
    </div>
    <form class="account-management__form">
      <div class="account-list">
        <div class="account-item" v-for="(account, index) in accounts" :key="account.id">
          <div class="account-item__row">
            <div class="account-item__field account-item__field--labels">
              <label class="form-field__label" for="labels">Метка</label>
              <input
                  class="form-field__input"
                  :class="getFieldClass(account.errors.labels)"
                  v-model="account.labelsInput"
                  id="labels"
                  placeholder="Введите метки, разделенные ;"
                  @blur="handleFieldChange(account, 'labels')"
              />
              <div class="form-field__hint">Введите текстовые метки, разделенные ;</div>
              <div class="account-item__labels" v-if="account.labelsInput">
                <span
                    class="account-item__label-chip"
                    v-for="(label, i) in account.labelsInput.split(';').filter(l => l.trim())"
                    :key="i"
                >
                  {{ label.trim() }}
                </span>
              </div>
              <div class="form-field__error" v-if="account.errors.labels.length">
                {{ account.errors.labels.join(', ') }}
              </div>
            </div>
            <div class="account-item__field account-item__field--type">
              <label class="form-field__label" for="type">Тип записи</label>
              <select
                  class="form-field__select"
                  v-model="account.type"
                  id="type"
                  @change="handleFieldChange(account, 'type')"
              >
                <option v-for="option in typeOptions" :key="option.value" :value="option.value">
                  {{ option.title }}
                </option>
              </select>
            </div>
            <div class="account-item__field account-item__field--login">
              <label class="form-field__label" for="login">Логин</label>
              <input
                  class="form-field__input"
                  :class="getFieldClass(account.errors.login)"
                  v-model="account.login"
                  id="login"
                  placeholder="Введите логин"
                  @blur="handleFieldChange(account, 'login')"
              />
              <div class="form-field__error" v-if="account.errors.login.length">
                {{ account.errors.login.join(', ') }}
              </div>
            </div>
            <div class="account-item__field account-item__field--password" v-if="account.type === 'local'">
              <label class="form-field__label" for="password">Пароль</label>
              <input
                  class="form-field__input"
                  :class="getFieldClass(account.errors.password)"
                  v-model="account.password"
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  @blur="handleFieldChange(account, 'password')"
              />
              <div class="form-field__error" v-if="account.errors.password.length">
                {{ account.errors.password.join(', ') }}
              </div>
            </div>
            <div class="account-item__field account-item__field--actions">
              <button
                  class="account-item__delete-btn"
                  type="button"
                  @click="deleteAccount(index)"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.account-management {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  &__title {
    font-size: 24px;
    font-weight: bold;
  }

  &__add-btn {
    width: 40px;
    height: 40px;
    font-size: 24px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background-color: #0056b3;
    }
  }

  &__form {
    .account-list {
      display: flex;
      flex-direction: column;
      gap: 20px;

      .account-item {
        &__row {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        &__field {
          flex: 1;
          min-width: 150px;

          &--labels {
            flex: 2;
          }

          &--password {
            flex: 1;
          }

          &--actions {
            flex: 0 0 auto;
            display: flex;
            align-items: flex-end;
          }
        }

        &__labels {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 10px;
        }

        &__label-chip {
          background-color: #007bff;
          color: white;
          padding: 5px 10px;
          border-radius: 12px;
          font-size: 12px;
        }

        &__delete-btn {
          padding: 8px 16px;
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;

          &:hover {
            background-color: #b02a37;
          }
        }
      }
    }
  }
}

.form-field {
  &__label {
    display: block;
    font-size: 14px;
    margin-bottom: 5px;
  }

  &__input,
  &__select {
    width: 100%;
    padding: 8px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;

    &--error {
      border-color: red;
    }
  }

  &__hint {
    font-size: 12px;
    color: #666;
    margin-top: 5px;
  }

  &__error {
    font-size: 12px;
    color: red;
    margin-top: 5px;
  }
}
</style>
