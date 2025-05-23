import { zodResolver } from '@hookform/resolvers/zod';
import { ACCOUNT_TYPES, CURRENCY_TYPES } from '@ledgerly/shared/constants';
import { AccountType, Currency } from '@ledgerly/shared/types';
import { AccountCreateDTO } from '@ledgerly/shared/types';
import { accountCreateSchema } from '@ledgerly/shared/validation';
import { observer } from 'mobx-react-lite';
import { useForm } from 'react-hook-form';
import { accountsState } from 'src/entities/accounts/model/accountsState';

type ManageAccountFormProps = {
  formId: string;
};

// TODO: Move to constants
const optionMapping: Record<AccountType, string> = {
  cash: 'Наличные',
  credit: 'Кредитная карта',
  debit: 'Дебетовая карта',
  investment: 'Инвестиционный счет',
  savings: 'Сберегательный счет',
};

// TODO: Move to constants
const currencyMapping: Record<Currency, string> = {
  AUD: 'Австралийский доллар',
  CAD: 'Канадский доллар',
  CHF: 'Швейцарский франк',
  CNY: 'Китайский юань',
  EUR: 'Евро',
  GBP: 'Британский фунт стерлингов',
  INR: 'Индийская рупия',
  JPY: 'Японская иена',
  RUB: 'Российский рубль',
  USD: 'Доллар США',
};

const options = Object.entries(optionMapping).map(([value, label]) => ({
  label,
  value,
}));

const CURRENCIES = Object.entries(currencyMapping).map(([code, name]) => ({
  code,
  name,
}));

export const ManageAccountForm = observer((props: ManageAccountFormProps) => {
  const { formId } = props;
  const { currentAccount, modalState } = accountsState;

  const isEditMode = Boolean(currentAccount);

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<AccountCreateDTO>({
    resolver: zodResolver(accountCreateSchema),
    values: {
      currency_code: currentAccount?.currency_code ?? CURRENCY_TYPES[0],
      description: currentAccount?.description ?? '',
      initialBalance: 0,
      name: currentAccount?.name ?? '',
      type: currentAccount?.type ?? ACCOUNT_TYPES[0],
    },
  });

  const handleClose = () => {
    accountsState.resetCurrentAccount();
    modalState.close();
  };

  const handleFormSubmit = (data: AccountCreateDTO) => {
    try {
      if (currentAccount) {
        void accountsState.update(currentAccount.id, data);
      } else {
        void accountsState.create(data);
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save account:', error);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSubmit(handleFormSubmit)(e);
  };

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-4">
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Название</span>
        </label>
        <input type="text" className="input input-bordered w-full" {...register('name')} />
        {errors.name && <span className="text-error text-sm mt-1">{errors.name.message}</span>}
      </div>

      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Описание</span>
        </label>
        <input type="text" className="input input-bordered w-full" {...register('description')} />
        {errors.description && <span className="text-error text-sm mt-1">{errors.description.message}</span>}
      </div>

      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Тип счета</span>
        </label>
        <select className="select select-bordered w-full" {...register('type')}>
          <option value="">Выберите тип счета</option>
          {options.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.type && <span className="text-error text-sm mt-1">{errors.type.message}</span>}
      </div>

      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Валюта</span>
        </label>
        <select className="select select-bordered w-full" {...register('currency_code')}>
          <option value="">Выберите валюту</option>
          {CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.name} ({currency.code})
            </option>
          ))}
        </select>
        {errors.currency_code && <span className="text-error text-sm mt-1">{errors.currency_code.message}</span>}
      </div>

      {!isEditMode && (
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Начальный баланс</span>
          </label>
          <input
            type="number"
            className="input input-bordered w-full"
            {...register('initialBalance', { valueAsNumber: true })}
          />
          {errors.initialBalance && <span className="text-error text-sm mt-1">{errors.initialBalance.message}</span>}
        </div>
      )}
    </form>
  );
});
