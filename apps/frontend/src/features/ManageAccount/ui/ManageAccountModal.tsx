import { observer } from "mobx-react-lite";
import { ACCOUNT_TYPES } from "shared/constants/accountTypes";
import { CURRENCIES } from "shared/constants/currencies";
import { ModalState } from "src/shared/lib/modalState";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountsState } from "src/entities/accounts/model/accountsState";
import { accountSchema, AccountFormValues } from "shared/types/account";

type ManageAccountModalProps = {
  state: ModalState;
};

export const ManageAccountModal = observer((props: ManageAccountModalProps) => {
  const { state } = props;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
  });

  const onSubmit = (data: AccountFormValues) => {
    accountsState.create(data);
    state.close();
  };

  return (
    <div className="modal modal-open text-black">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Добавить новый счет</h3>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Название счета</span>
            </label>
            <input
              type="text"
              placeholder="Например: Основная карта"
              className="input input-bordered w-full"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Тип счета</span>
            </label>
            <select
              className="select select-bordered w-full"
              defaultValue=""
              {...register("type")}
            >
              <option value="" disabled>
                Выберите тип счета
              </option>
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm">{errors.type.message}</p>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Валюта</span>
            </label>
            <select
              className="select select-bordered w-full"
              defaultValue="RUB"
              {...register("currency_code")}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.name} ({currency.code})
                </option>
              ))}
            </select>
            {errors.currency_code && (
              <p className="text-red-500 text-sm">
                {errors.currency_code.message}
              </p>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Начальный баланс</span>
            </label>
            <input
              type="number"
              placeholder="0.00"
              className="input input-bordered w-full"
              {...register("balance", { valueAsNumber: true })}
            />
            {errors.balance && (
              <p className="text-red-500 text-sm">{errors.balance.message}</p>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Описание (опционально)</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Дополнительная информация о счете"
              {...register("description")}
            ></textarea>
          </div>

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => state.close()}
            >
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Сохранить
            </button>
          </div>
        </form>
      </div>
      <label className="modal-backdrop" onClick={() => state.close()} />
    </div>
  );
});
