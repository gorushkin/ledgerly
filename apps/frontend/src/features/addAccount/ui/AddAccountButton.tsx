import { observer } from "mobx-react-lite";
import { useState } from "react";
import { ModalState } from "src/shared/lib/modalState";
import { Button } from "src/shared/ui/Button";
import { Modal } from "src/shared/ui/Modal/Modal";

type AddAccountModalProps = {
  state: ModalState;
};

const modalState = new ModalState();

const AddAccountModal = observer((props: AddAccountModalProps) => {
  const [accountName, setAccountName] = useState("kkkkl");
  console.log("accountName: ", accountName);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Account Name:", accountName);
    // Here you would typically call an API to add the account
    props.state.close();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAccountName(event.target.value);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Добавить новый счет</h3>
        <form className="space-y-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Название счета</span>
            </label>
            <input
              type="text"
              placeholder="Например: Основная карта"
              className="input input-bordered w-full"
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Тип счета</span>
            </label>
            <select className="select select-bordered w-full" defaultValue="">
              <option value="" disabled>
                Выберите тип счета
              </option>
              <option value="cash">Наличные</option>
              <option value="debit">Дебетовая карта</option>
              <option value="credit">Кредитная карта</option>
              <option value="savings">Сберегательный счет</option>
              <option value="investment">Инвестиционный счет</option>
            </select>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Валюта</span>
            </label>
            <select
              className="select select-bordered w-full"
              defaultValue="RUB"
            >
              <option value="RUB">Российский рубль (₽)</option>
              <option value="USD">Доллар США ($)</option>
              <option value="EUR">Евро (€)</option>
              <option value="GBP">Фунт стерлингов (£)</option>
            </select>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Начальный баланс</span>
            </label>
            <input
              type="number"
              placeholder="0.00"
              className="input input-bordered w-full"
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Описание (опционально)</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Дополнительная информация о счете"
            ></textarea>
          </div>
        </form>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={() => modalState.close()}>
            Отмена
          </button>
          <button className="btn btn-primary">Сохранить</button>
        </div>
      </div>
      <label
        className="modal-backdrop"
        onClick={() => modalState.close()}
      ></label>
    </div>
  );
});

export const AddAccountButton = () => {
  const handleAddAccount = () => {
    console.log("Adding account...");
    modalState.open();
  };

  return (
    <>
      <AddAccountModal state={modalState} />
      <Button onClick={handleAddAccount} variant="primary">
        Add Account
      </Button>
    </>
  );
};
