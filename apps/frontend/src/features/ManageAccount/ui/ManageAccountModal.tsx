import { zodResolver } from '@hookform/resolvers/zod';
import { observer } from 'mobx-react-lite';
import { useForm } from 'react-hook-form';
import { ACCOUNT_TYPES, AccountDTO, accountSchema, CURRENCIES } from 'shared/dist';
import { accountsState } from 'src/entities/accounts/model/accountsState';
import { Button } from 'src/shared/ui/Button';

export const ManageAccountModal = observer(() => {
  const { currentAccount, modalState } = accountsState;

  const isEditMode = Boolean(currentAccount);

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<AccountDTO>({
    resolver: zodResolver(accountSchema),
    values: {
      balance: 0,
      currency_code: currentAccount?.currency_code ?? 'RUB',
      description: currentAccount?.description ?? '',
      name: currentAccount?.name ?? '',
      type: currentAccount?.type ?? '',
    },
  });

  const handleClose = () => {
    accountsState.resetCurrentAccount();
    modalState.close();
  };

  const onSubmit = (data: AccountDTO) => {
    void accountsState.create(data);
    handleClose();
  };

  const onDeleteClick = () => {
    if (!currentAccount) {
      return;
    }

    void accountsState.delete(currentAccount.id);
    handleClose();
  };

  const title = currentAccount ? 'Редактировать счет' : 'Добавить новый счет';

  return (
    <div className="modal modal-open text-black">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Название счета</span>
            </label>
            <input
              type="text"
              placeholder="Например: Основная карта"
              className="input input-bordered w-full"
              {...register('name')}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Тип счета</span>
            </label>
            <select className="select select-bordered w-full" defaultValue="" {...register('type')}>
              <option value="" disabled>
                Выберите тип счета
              </option>
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Валюта</span>
            </label>
            <select className="select select-bordered w-full" defaultValue="RUB" {...register('currency_code')}>
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.name} ({currency.code})
                </option>
              ))}
            </select>
            {errors.currency_code && <p className="text-red-500 text-sm">{errors.currency_code.message}</p>}
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Начальный баланс</span>
            </label>
            <input
              type="number"
              placeholder="0.00"
              className="input input-bordered w-full"
              {...register('balance', { valueAsNumber: true })}
            />
            {errors.balance && <p className="text-red-500 text-sm">{errors.balance.message}</p>}
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Описание (опционально)</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Дополнительная информация о счете"
              {...register('description')}
            ></textarea>
          </div>

          <div className="modal-action flex justify-between items-center ">
            {isEditMode && (
              <Button variant="error" outline onClick={onDeleteClick}>
                Удалить
              </Button>
            )}
            <Button ghost onClick={handleClose} className="ml-auto">
              Отмена
            </Button>
            <Button type="submit" variant="primary">
              Сохранить
            </Button>
          </div>
        </form>
      </div>
      <label className="modal-backdrop" onClick={handleClose} />
    </div>
  );
});
