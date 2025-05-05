import { ModalState } from "src/shared/lib/modalState";

type ModalProps = {
  children: React.ReactNode;
  state: ModalState;
};
export const Modal = (props: ModalProps) => {
  const { children, state } = props;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded">
        {children}
        <button
          onClick={state.close}
          className="mt-4 bg-red-500 text-white p-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};
